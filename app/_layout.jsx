import { useEffect, useRef, useState } from "react";
import { Stack } from "expo-router";
import { StripeProvider } from "@stripe/stripe-react-native";
import * as Notifications from "expo-notifications";
import { Platform, AppState } from "react-native";
import { supabase, getCurrentUser } from "../services/supabase";
import { NotificationService } from "../services/NotificationService";
import StepsSyncService from "../services/StepsSyncService";
import SplashScreenVideo from "../components/SplashScreen";
import TrialExpiredModal from "../src/components/TrialExpiredModal";

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Show notification banner even when app is open
    shouldPlaySound: true, // Play notification sound
    shouldSetBadge: true,  // Update app badge count
  }),
});

export default function Layout() {
  const notificationListener = useRef();
  const responseListener = useRef();
  const realtimeSubscription = useRef();
  const [userId, setUserId] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const hasCheckedTrial = useRef(false);

  // Check if user's trial has expired
  const checkTrialExpiration = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('status, package_slug')
        .eq('user_id', userId)
        .eq('status', 'pending_downgrade')
        .single();

      if (!error && data) {
        // User has an expired trial waiting for decision
        setShowTrialExpiredModal(true);
      }
    } catch (error) {
      // Silent fail - don't interrupt app flow
      console.log('Trial check error:', error.message);
    }
  };

  // Handle when user dismisses modal (continue with free)
  const handleTrialModalDismiss = async () => {
    setShowTrialExpiredModal(false);
    
    if (!userId) return;

    try {
      // Get base-free package ID
      const { data: basePkg, error: pkgError } = await supabase
        .from('subscription_packages')
        .select('id')
        .eq('slug', 'base-free')
        .single();

      if (pkgError) throw pkgError;

      // Update expired trial to 'expired' status
      await supabase
        .from('user_subscriptions')
        .update({ status: 'expired' })
        .eq('user_id', userId)
        .eq('status', 'pending_downgrade');

      // Create new base-free subscription
      await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          package_id: basePkg.id,
          package_slug: 'base-free',
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 100 years
        });

      console.log('User downgraded to base-free');
    } catch (error) {
      console.error('Error downgrading user:', error);
    }
  };

  useEffect(() => {
    // Get current user and set up real-time subscription
    async function initializeUser() {
      try {
        const user = await getCurrentUser();
        
        if (user) {
          setUserId(user.id);
          
          // Check if user has expired trial (only once per app session)
          if (!hasCheckedTrial.current) {
            hasCheckedTrial.current = true;
            await checkTrialExpiration(user.id);
          }
          
          // Trigger background steps sync (non-blocking)
          // This will sync steps from HealthKit/Google Fit if permission is granted
          // and last sync was more than 1 hour ago
          StepsSyncService.syncStepsInBackground(user.id).catch(err => {
            // Silent fail - don't block app initialization
          });
        } else {
        }
      } catch (error) {
        console.error('Exception initializing user:', error.message);
      }
    }
    
    initializeUser();
    
    // Request permissions on app start
    async function requestPermissions() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return;
      }
      // Set up Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
      }
    }
    
    requestPermissions();

    // Listener for when notification is received while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Notification will display automatically based on handler above
    });

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Handle notification tap - you can navigate to specific screens here if needed
      const data = response.notification.request.content.data;
      if (data?.type) {
        // TODO: Add navigation logic here if needed
        // e.g., if (data.type === 'workout') router.push('/workouts');
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Set up real-time Supabase subscription when user is available
  useEffect(() => {
    if (!userId) return;
    // Subscribe to real-time notifications
    realtimeSubscription.current = NotificationService.subscribeToNotifications(
      userId,
      (newNotif) => {
        // Send a local notification to show it outside the app
        Notifications.scheduleNotificationAsync({
          content: {
            title: newNotif.title,
            body: newNotif.message,
            data: newNotif,
            sound: true,
            badge: 1,
          },
          trigger: null, // Show immediately
        });
      }
    );

    return () => {
      if (realtimeSubscription.current) {
        realtimeSubscription.current.unsubscribe();
      }
    };
  }, [userId]);

  // Keep subscription alive even when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // Subscription stays active in background
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_API_KEY}>
      {showSplash ? (
        <SplashScreenVideo onFinish={() => setShowSplash(false)} />
      ) : (
        <>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "none",
              gestureEnabled: false,
            }}
          />
          <TrialExpiredModal 
            visible={showTrialExpiredModal} 
            onDismiss={handleTrialModalDismiss}
          />
        </>
      )}
    </StripeProvider>
  );
}

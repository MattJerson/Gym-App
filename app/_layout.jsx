import { useEffect, useRef, useState } from "react";
import { Stack } from "expo-router";
import { StripeProvider } from "@stripe/stripe-react-native";
import * as Notifications from "expo-notifications";
import { Platform, AppState } from "react-native";
import { supabase } from "../services/supabase";
import { NotificationService } from "../services/NotificationService";

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

  useEffect(() => {
    // Get current user and set up real-time subscription
    async function initializeUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting user:', error.message);
          return;
        }
        if (user) {
          console.log('✅ User authenticated:', user.id);
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Exception getting user:', error.message);
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
        console.log('❌ Notification permissions not granted');
        return;
      }
      
      console.log('✅ Notification permissions granted');
      
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
        console.log('✅ Android notification channel configured');
      }
    }
    
    requestPermissions();

    // Listener for when notification is received while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📩 Notification received:', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data
      });
      // Notification will display automatically based on handler above
    });

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', {
        title: response.notification.request.content.title,
        data: response.notification.request.content.data
      });
      
      // Handle notification tap - you can navigate to specific screens here if needed
      const data = response.notification.request.content.data;
      if (data?.type) {
        console.log(`Notification type: ${data.type}`);
        // TODO: Add navigation logic here if needed
        // e.g., if (data.type === 'workout') router.push('/workouts');
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Set up real-time Supabase subscription when user is available
  useEffect(() => {
    if (!userId) return;

    console.log('🔄 Setting up real-time subscription for user:', userId);

    // Subscribe to real-time notifications
    realtimeSubscription.current = NotificationService.subscribeToNotifications(
      userId,
      (newNotif) => {
        console.log('🔔 Real-time notification received:', {
          id: newNotif.id,
          title: newNotif.title,
          source: newNotif.source
        });

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
        console.log('🔌 Unsubscribing from real-time notifications');
        realtimeSubscription.current.unsubscribe();
      }
    };
  }, [userId]);

  // Keep subscription alive even when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log('📱 App state changed to:', nextAppState);
      // Subscription stays active in background
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_API_KEY}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
        }}
      />
    </StripeProvider>
  );
}

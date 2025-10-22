import { useEffect } from "react";
import { Stack } from "expo-router";
import { StripeProvider } from "@stripe/stripe-react-native";
import * as Notifications from "expo-notifications";

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function Layout() {
  useEffect(() => {
    // Set up notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📩 Notification received:', notification.request.content.title);
      // Notification will display automatically based on handler above
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response.notification.request.content.title);
      // Handle notification tap - you can navigate to specific screens here if needed
      const data = response.notification.request.content.data;
      if (data?.automated) {
        console.log('This was an automated notification');
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
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

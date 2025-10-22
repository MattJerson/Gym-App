// TEST: Local Notification on iOS Simulator
// This file shows you how to test local notifications on iOS simulator
// Run this code in your app to trigger a test notification

import * as Notifications from 'expo-notifications';

export async function sendTestLocalNotification() {
  // Request permissions first
  const { status } = await Notifications.requestPermissionsAsync();
  
  if (status !== 'granted') {
    console.log('❌ Permission not granted');
    alert('Please grant notification permissions in Settings');
    return;
  }

  console.log('✅ Sending test local notification...');

  // Schedule a local notification (will appear immediately)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🧪 Test Notification",
      body: "This is a local notification - it works on simulator!",
      data: { test: true },
      sound: true,
      badge: 1,
    },
    trigger: null, // null means send immediately
  });

  console.log('✅ Test notification sent!');
  alert('Local notification sent! Check notification center (swipe down from top)');
}

// HOW TO USE:
// 1. Import this in any component:
//    import { sendTestLocalNotification } from './path/to/this/file';
//
// 2. Add a button:
//    <Button title="Test Notification" onPress={sendTestLocalNotification} />
//
// 3. Press the button
// 4. Swipe down from top of simulator to see notification

// OR run directly in console:
// Just call: sendTestLocalNotification()

// Test Real-Time Connection
// Run this in your app to verify real-time is working

import { supabase } from './services/supabase';

export const testRealtimeConnection = () => {
  console.log('🧪 Testing Supabase Real-Time Connection...');
  
  const channel = supabase
    .channel('test-channel')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications'
    }, payload => {
      console.log('✅ Real-time event received:', payload);
    })
    .subscribe((status) => {
      console.log('📡 Subscription status:', status);
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Real-time is WORKING! You should see events when notifications are created/updated.');
        console.log('👉 Now go to Admin Panel and send a notification to test.');
      } else if (status === 'CHANNEL_ERROR') {
        console.log('❌ Real-time connection FAILED!');
        console.log('🔧 Make sure real-time is enabled in Supabase Dashboard:');
        console.log('   Database → Replication → notifications → Enable INSERT & UPDATE');
      } else if (status === 'TIMED_OUT') {
        console.log('⏱️ Connection timed out. Check your internet connection.');
      }
    });

  // Return cleanup function
  return () => {
    console.log('🧹 Cleaning up test subscription...');
    supabase.removeChannel(channel);
  };
};

// Usage:
// import { testRealtimeConnection } from './testRealtime';
// const cleanup = testRealtimeConnection();
// ... do your testing ...
// cleanup(); // when done

// services/notifications.js
// Mobile notifications utilities: push token registration and realtime subscription

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const LAST_TOKEN_KEY = 'device:last_expo_token';

export async function ensurePushPermissions() {
  // In Expo Go (dev client not installed) remote push may be limited; avoid blocking
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    return true;
  } catch {
    // Non-fatal in Expo Go/web
    return null;
  }
}

export async function getExpoPushToken() {
  const ok = await ensurePushPermissions();
  if (!ok) return null;
  try {
    // Try to use projectId for EAS managed projects
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
    
    // Add timeout to prevent hanging in Expo Go
    const tokenPromise = Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Push token timeout')), 5000)
    );
    
    const token = await Promise.race([tokenPromise, timeoutPromise]);
    return token?.data || null;
  } catch {
    // Likely Expo Go without dev client; don't block login
    return null;
  }
}

export async function registerDeviceToken(supabase, userId) {
  const token = await getExpoPushToken();
  if (!token || !userId) return null;
  try {
    await supabase.from('device_tokens').upsert({
      user_id: userId,
      expo_token: token,
      platform: Platform.OS,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'expo_token' });
    await AsyncStorage.setItem(LAST_TOKEN_KEY, token);
    return token;
  } catch (e) {
    return null;
  }
}

export async function unregisterDeviceToken(supabase) {
  const token = await AsyncStorage.getItem(LAST_TOKEN_KEY);
  if (!token) return;
  try {
    await supabase.from('device_tokens').delete().eq('expo_token', token);
  } finally {
    await AsyncStorage.removeItem(LAST_TOKEN_KEY);
  }
}

export function subscribeToNotifications(supabase, userId, onInsert) {
  if (!userId) return { unsubscribe: () => {} };
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, payload => {
      onInsert?.(payload.new);
    })
    .subscribe();
  return {
    unsubscribe: () => {
      try { supabase.removeChannel(channel); } catch {}
    }
  };
}

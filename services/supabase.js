import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerDeviceToken, unregisterDeviceToken } from "./notifications";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    detectSessionInUrl: false,
    autoRefreshToken: true,
    debug: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
  },
});

// Dev visibility: confirm envs are wired
if (__DEV__) {
  try {
    const masked = SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.slice(0, 8)}…` : 'undefined';
  } catch {}
}

// Lightweight connectivity probe
export async function pingSupabase(timeoutMs = 5000) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      method: 'GET',
      headers: { apikey: SUPABASE_ANON_KEY },
      signal: controller.signal,
    });
    return res.ok;
  } catch (e) {
    return false;
  } finally {
    clearTimeout(to);
  }
}

// Suppress invalid refresh token errors globally
const originalConsoleError = console.error;
console.error = (...args) => {
  // Suppress Supabase refresh token errors
  const errorString = args.join(' ');
  if (
    errorString.includes('Invalid Refresh Token') ||
    errorString.includes('Refresh Token Not Found') ||
    errorString.includes('AuthApiError')
  ) {
    // Silently ignore - this is expected when token expires or user logs out
    return;
  }
  originalConsoleError(...args);
};

// Handle auth errors globally
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
  }
  if (event === 'SIGNED_OUT') {
  }
  if (event === 'USER_UPDATED') {
  }
});

// Handle auth state for push token lifecycle
supabase.auth.onAuthStateChange(async (event, session) => {
  try {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      const userId = session?.user?.id;
      // Non-blocking: run in background without awaiting
      if (userId) {
        registerDeviceToken(supabase, userId).catch(err => {
          if (__DEV__) console.log('[Auth] Device token registration failed (non-fatal):', err.message);
        });
      }
    }
    if (event === 'SIGNED_OUT') {
      // Non-blocking: run in background without awaiting
      unregisterDeviceToken(supabase).catch(err => {
        if (__DEV__) console.log('[Auth] Device token unregister failed (non-fatal):', err.message);
      });
    }
  } catch (err) {
    if (__DEV__) console.log('[Auth] onAuthStateChange error (non-fatal):', err.message);
  }
});

// Helper function to ensure valid session
export const ensureValidSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      await supabase.auth.signOut();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Session check error:', error);
    return null;
  }
};

/**
 * Safely get the current authenticated user
 * Returns null if no session exists (user not logged in)
 * This prevents "Auth session missing!" errors on app startup
 */
export const getCurrentUser = async () => {
  try {
    // First check if there's a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      // No session means user not logged in - this is normal, not an error
      return null;
    }
    
    // Only try to get user if session exists
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error.message);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Exception in getCurrentUser:', error.message);
    return null;
  }
};

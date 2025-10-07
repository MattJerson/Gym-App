import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    detectSessionInUrl: false,
    autoRefreshToken: true,
    debug: false,
  },
});

// Handle auth errors globally
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Auth token refreshed successfully');
  }
  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
  if (event === 'USER_UPDATED') {
    console.log('User data updated');
  }
});

// Helper function to ensure valid session
export const ensureValidSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.log('No valid session found, signing out...');
      await supabase.auth.signOut();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Session check error:', error);
    return null;
  }
};

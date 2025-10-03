import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL_LOCAL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hjytowwfhgngbilousri.supabase.co';
const SUPABASE_ANON_KEY_LOCAL = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqeXRvd3dmaGduZ2JpbG91c3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MTYxMzcsImV4cCI6MjA3MjQ5MjEzN30.CEMCt-1IEWGXhangoE-4qIAbf6yzPh2kVDeFuEvxCxk';

export const supabase = createClient(SUPABASE_URL_LOCAL, SUPABASE_ANON_KEY_LOCAL, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

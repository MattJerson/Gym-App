import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

const SUPABASE_URL_LOCAL = SUPABASE_URL || 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY_LOCAL = SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL_LOCAL, SUPABASE_ANON_KEY_LOCAL, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

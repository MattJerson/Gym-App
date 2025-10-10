import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Security: Admin panel uses ANON KEY with authenticated user and RLS
// Never expose elevated permissions in client-side code
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: window.localStorage
  }
})

// Helper function to check if user is admin via RLS-safe query
export const checkAdminRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data: profile } = await supabase
    .from('registration_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();

  return profile?.is_admin === true;
};

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

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

// Admin client with service role key for elevated operations (use with caution!)
// Only use this client for admin-specific operations like fetching auth.users
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Helper function to check if user is admin via RLS-safe query
export const checkAdminRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data: profiles } = await supabase
    .from('registration_profiles')
    .select('is_admin, role')
    .eq('user_id', user.id);

  if (!profiles || profiles.length === 0) return false;
  const profile = profiles[0];
  return profile?.is_admin === true || profile?.role === 'admin';
};

// Helper function to check if user is community manager
export const checkCommunityManagerRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data: profiles } = await supabase
    .from('registration_profiles')
    .select('role, is_admin')
    .eq('user_id', user.id);

  if (!profiles || profiles.length === 0) return false;
  const profile = profiles[0];
  return profile?.role === 'community_manager' || profile?.role === 'admin' || profile?.is_admin === true;
};

// Helper function to get user role
export const getUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profiles } = await supabase
    .from('registration_profiles')
    .select('role, is_admin')
    .eq('user_id', user.id);

  if (!profiles || profiles.length === 0) return null;
  const profile = profiles[0];

  // Backwards compatibility: if is_admin is true but role is not set, return 'admin'
  if (profile?.is_admin && !profile?.role) {
    return 'admin';
  }

  return profile?.role || 'user';
};

// Helper function to check if user has specific permission
export const hasPermission = async (permission) => {
  const role = await getUserRole();
  
  const permissions = {
    admin: ['all'],
    community_manager: [
      'view_all',
      'create_workouts',
      'edit_own_workouts',
      'assign_workouts',
      'create_meals',
      'edit_own_meals',
      'assign_meals',
      'create_featured_content',
      'edit_own_featured_content',
      'view_chat',
      'moderate_chat'
    ],
    user: ['view_own']
  };

  const userPermissions = permissions[role] || [];
  return userPermissions.includes('all') || userPermissions.includes(permission);
};

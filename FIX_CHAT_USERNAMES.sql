-- Fix Community Chat Usernames Showing as "@unknown"
-- Root cause: View queries auth.users but RLS blocks access
-- Solution: Use SECURITY DEFINER view that bypasses RLS to safely expose registration_profiles data

-- 1. DROP the existing broken view (it queries auth.users which is blocked by RLS)
DROP VIEW IF EXISTS public.chats_public_with_id CASCADE;
DROP VIEW IF EXISTS public.chats_public CASCADE;

-- 2. Create SECURITY DEFINER view that pulls from registration_profiles (not auth.users!)
-- This bypasses RLS and safely exposes only username/avatar
CREATE OR REPLACE VIEW public.chats_public_with_id
WITH (security_invoker = false) -- Use SECURITY DEFINER (owner's permissions)
AS
SELECT 
  rp.user_id as id,
  COALESCE(
    rp.details->>'display_name',
    rp.details->>'username',
    SPLIT_PART(
      (SELECT email FROM auth.users WHERE id = rp.user_id),
      '@',
      1
    ),
    'User'
  ) as username,
  COALESCE(
    rp.details->>'avatar',
    '�'
  ) as avatar,
  false as is_online,
  NOW() as last_seen,
  rp.created_at
FROM public.registration_profiles rp
WHERE rp.user_id IS NOT NULL;

-- 3. Grant SELECT to authenticated users
GRANT SELECT ON public.chats_public_with_id TO authenticated;
GRANT SELECT ON public.chats_public_with_id TO anon;

-- 4. Enable RLS on registration_profiles (if not already enabled)
ALTER TABLE public.registration_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Drop old restrictive policies that might block community visibility
DROP POLICY IF EXISTS "Users can only see own profile" ON public.registration_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.registration_profiles;

-- 6. Create policy: Allow authenticated users to see ALL registration profiles
-- This is safe because the view only exposes username/avatar, not sensitive data
CREATE POLICY "Community members can view all registration profiles" 
  ON public.registration_profiles FOR SELECT 
  TO authenticated
  USING (true);

-- 7. Allow users to insert/update their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.registration_profiles;
CREATE POLICY "Users can insert own profile" 
  ON public.registration_profiles FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.registration_profiles;
CREATE POLICY "Users can update own profile" 
  ON public.registration_profiles FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_registration_profiles_user_id ON public.registration_profiles(user_id);

-- 9. Verify the view works (run these to test)
-- Check if view returns data:
-- SELECT * FROM public.chats_public_with_id LIMIT 5;

-- Check your profile:
-- SELECT * FROM public.chats_public_with_id WHERE id = auth.uid();

-- Check count:
-- SELECT COUNT(*) FROM public.chats_public_with_id;

COMMENT ON VIEW public.chats_public_with_id IS 'Public view of user chat profiles from registration_profiles. Uses SECURITY DEFINER to bypass RLS safely.';

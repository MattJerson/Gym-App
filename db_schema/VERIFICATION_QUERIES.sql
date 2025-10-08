-- =============================================
-- QUICK VERIFICATION QUERIES
-- Run these in Supabase SQL Editor after setup
-- =============================================

-- 1. Check if safe_weekly_leaderboard view exists
SELECT 
  schemaname, 
  viewname, 
  viewowner 
FROM pg_views 
WHERE viewname = 'safe_weekly_leaderboard';

-- 2. Check if weekly_leaderboard view exists
SELECT 
  schemaname, 
  viewname, 
  viewowner 
FROM pg_views 
WHERE viewname = 'weekly_leaderboard';

-- 3. View the safe leaderboard (should show 5 placeholder users minimum)
SELECT 
  position,
  anon_id,
  display_name,
  total_points,
  current_streak,
  total_workouts,
  badges_earned
FROM public.safe_weekly_leaderboard
ORDER BY position
LIMIT 10;

-- 4. Check user_stats table columns
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_stats'
ORDER BY ordinal_position;

-- 5. Count active users (last 7 days)
SELECT COUNT(*) as active_users
FROM public.user_stats
WHERE last_workout_date >= (CURRENT_DATE - INTERVAL '7 days');

-- 6. Check permissions on safe_weekly_leaderboard
SELECT 
  grantee, 
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'safe_weekly_leaderboard';

-- 7. Test adding a dummy user to leaderboard
-- Replace 'YOUR_USER_ID' with a real UUID from auth.users
/*
INSERT INTO public.user_stats (
  user_id,
  total_points,
  current_streak,
  total_workouts,
  badges_earned,
  last_workout_date
) VALUES (
  'YOUR_USER_ID',  -- Get from: SELECT id FROM auth.users LIMIT 1;
  150,
  7,
  15,
  3,
  CURRENT_DATE
) ON CONFLICT (user_id) DO UPDATE SET
  total_points = 150,
  current_streak = 7,
  total_workouts = 15,
  badges_earned = 3,
  last_workout_date = CURRENT_DATE;
*/

-- 8. View admin leaderboard (full PII - should only work with service role)
-- This will fail if you're using anon/authenticated role (which is correct for security)
/*
SELECT 
  position,
  user_id,
  email,
  user_name,
  total_points,
  total_workouts
FROM public.weekly_leaderboard
ORDER BY position
LIMIT 10;
*/

-- 9. Check if indexes were created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'user_stats';

-- 10. Check admin_access_audit table
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admin_access_audit'
ORDER BY ordinal_position;

-- =============================================
-- EXPECTED RESULTS
-- =============================================

-- Query 3 should return something like:
-- position | anon_id  | display_name | total_points | current_streak | total_workouts | badges_earned
-- ---------|----------|--------------|--------------|----------------|----------------|---------------
--    1     | fake001  | Athlete A    |      50      |       3        |       5        |       1
--    2     | fake002  | Athlete B    |      45      |       2        |       4        |       0
--    3     | fake003  | Athlete C    |      40      |       4        |       6        |       2
--    4     | fake004  | Athlete D    |      35      |       1        |       3        |       0
--    5     | fake005  | Athlete E    |      30      |       2        |       4        |       1

-- If you see this, the setup is complete! ✅

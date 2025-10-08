-- =============================================
-- COMPLETE LEADERBOARD SETUP FOR SUPABASE
-- Run this entire file in Supabase SQL Editor
-- =============================================

-- 0) Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Ensure user_stats table has all required columns
-- This will add columns if they don't exist, or do nothing if they already exist
DO $$
BEGIN
  -- Check if user_stats table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_stats') THEN
    -- Add columns if they don't exist
    ALTER TABLE public.user_stats 
      ADD COLUMN IF NOT EXISTS total_points integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_workouts integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_calories_burned integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_exercises_completed integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_steps integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS badges_earned integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS challenges_completed integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS rank_position integer,
      ADD COLUMN IF NOT EXISTS last_workout_date date,
      ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
      ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
  ELSE
    -- Create user_stats table if it doesn't exist
    CREATE TABLE public.user_stats (
      user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      total_points integer DEFAULT 0,
      current_streak integer DEFAULT 0,
      longest_streak integer DEFAULT 0,
      total_workouts integer DEFAULT 0,
      total_calories_burned integer DEFAULT 0,
      total_exercises_completed integer DEFAULT 0,
      total_steps integer DEFAULT 0,
      badges_earned integer DEFAULT 0,
      challenges_completed integer DEFAULT 0,
      rank_position integer,
      last_workout_date date,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- 2) Drop existing views if they exist (to avoid conflicts)
DROP VIEW IF EXISTS public.safe_weekly_leaderboard;
DROP VIEW IF EXISTS public.weekly_leaderboard;

-- 3) Create PRIVACY-SAFE weekly leaderboard view
-- This view includes:
-- - Anonymized user IDs (md5 hash)
-- - Privacy-safe display names (nicknames ONLY, no fallback to names)
-- - 5 generic placeholder athletes to ensure minimum population
-- This view is SAFE for client access
CREATE OR REPLACE VIEW public.safe_weekly_leaderboard AS
SELECT
  anon_id,
  display_name,
  total_points,
  current_streak,
  total_workouts,
  badges_earned,
  last_workout_date,
  ROW_NUMBER() OVER (
    ORDER BY total_points DESC, current_streak DESC, total_workouts DESC
  ) AS position
FROM (
  -- Real users who have been active in the last 7 days
  SELECT
    substring(md5(u.id::text) from 1 for 8) AS anon_id,
    COALESCE(NULLIF(p.nickname, ''), 'User' || substring(md5(u.id::text) from 1 for 4)) AS display_name,
    COALESCE(us.total_points, 0) AS total_points,
    COALESCE(us.current_streak, 0) AS current_streak,
    COALESCE(us.total_workouts, 0) AS total_workouts,
    COALESCE(us.badges_earned, 0) AS badges_earned,
    COALESCE(us.last_workout_date, CURRENT_DATE) AS last_workout_date
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.user_stats us ON us.user_id = u.id
  WHERE us.last_workout_date IS NOT NULL
    AND us.last_workout_date >= (CURRENT_DATE - INTERVAL '7 days')

  UNION ALL

  -- 5 generic placeholder athletes (no PII, always visible)
  SELECT 'fake001'::text, 'Athlete A'::text, 50, 3, 5, 1, CURRENT_DATE
  UNION ALL SELECT 'fake002', 'Athlete B', 45, 2, 4, 0, CURRENT_DATE
  UNION ALL SELECT 'fake003', 'Athlete C', 40, 4, 6, 2, CURRENT_DATE
  UNION ALL SELECT 'fake004', 'Athlete D', 35, 1, 3, 0, CURRENT_DATE
  UNION ALL SELECT 'fake005', 'Athlete E', 30, 2, 4, 1, CURRENT_DATE
) combined
ORDER BY total_points DESC, current_streak DESC, total_workouts DESC
LIMIT 100;

-- 4) Create FULL PII weekly_leaderboard view (ADMIN/SERVER ONLY)
-- This view contains:
-- - Real user IDs
-- - Email addresses
-- - Full names
-- This view should ONLY be accessible via server-side code with service role key
CREATE OR REPLACE VIEW public.weekly_leaderboard AS
SELECT
  u.id AS user_id,
  u.email AS email,
  COALESCE(
    p.full_name,
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    u.email
  ) AS user_name,
  COALESCE(us.total_points, 0) AS total_points,
  COALESCE(us.current_streak, 0) AS current_streak,
  COALESCE(us.total_workouts, 0) AS total_workouts,
  COALESCE(us.badges_earned, 0) AS badges_earned,
  ROW_NUMBER() OVER (
    ORDER BY COALESCE(us.total_points, 0) DESC, 
             COALESCE(us.current_streak, 0) DESC,
             COALESCE(us.total_workouts, 0) DESC
  ) AS position
FROM auth.users u
LEFT JOIN public.user_stats us ON u.id = us.user_id
LEFT JOIN public.profiles p ON p.id = u.id
WHERE us.last_workout_date IS NOT NULL
  AND us.last_workout_date >= (CURRENT_DATE - INTERVAL '7 days')
ORDER BY total_points DESC, current_streak DESC, total_workouts DESC
LIMIT 100;

-- 5) Create admin access audit table for logging admin endpoint usage
CREATE TABLE IF NOT EXISTS public.admin_access_audit (
  id bigserial PRIMARY KEY,
  accessed_at timestamptz DEFAULT now() NOT NULL,
  admin_user_id uuid,
  admin_email text,
  ip inet,
  action text,
  details jsonb
);

-- 6) Set up Row Level Security (RLS) and Permissions
-- This is CRITICAL for privacy and security

-- Enable RLS on admin_access_audit
ALTER TABLE public.admin_access_audit ENABLE ROW LEVEL SECURITY;

-- Revoke all default permissions
REVOKE ALL ON public.weekly_leaderboard FROM PUBLIC;
REVOKE ALL ON public.safe_weekly_leaderboard FROM PUBLIC;
REVOKE ALL ON public.admin_access_audit FROM PUBLIC;

-- Grant permissions:
-- - Only service_role (server-side) can access the PII leaderboard
GRANT SELECT ON public.weekly_leaderboard TO service_role;

-- - Authenticated users can access the privacy-safe leaderboard
GRANT SELECT ON public.safe_weekly_leaderboard TO authenticated;

-- - Optional: Allow anonymous users to see the safe leaderboard (uncomment if needed)
-- GRANT SELECT ON public.safe_weekly_leaderboard TO anon;

-- - Only service_role can write to audit logs
GRANT INSERT, SELECT ON public.admin_access_audit TO service_role;

-- 7) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_stats_last_workout_date 
  ON public.user_stats(last_workout_date) 
  WHERE last_workout_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_stats_points_desc 
  ON public.user_stats(total_points DESC);

CREATE INDEX IF NOT EXISTS idx_user_stats_streak 
  ON public.user_stats(current_streak DESC);

-- 8) Create a function to update last_workout_date when workouts are completed
-- This ensures the leaderboard stays current
CREATE OR REPLACE FUNCTION public.update_last_workout_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_stats when a workout is completed
  UPDATE public.user_stats
  SET last_workout_date = CURRENT_DATE,
      updated_at = now()
  WHERE user_id = NEW.user_id;
  
  -- If no row exists, create one
  INSERT INTO public.user_stats (user_id, last_workout_date, total_workouts)
  VALUES (NEW.user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9) Create trigger on workout_logs table (if it exists)
-- This auto-updates user_stats when workouts are logged
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workout_logs') THEN
    -- Drop trigger if exists
    DROP TRIGGER IF EXISTS trigger_update_last_workout_date ON public.workout_logs;
    
    -- Create new trigger
    CREATE TRIGGER trigger_update_last_workout_date
    AFTER INSERT ON public.workout_logs
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION public.update_last_workout_date();
  END IF;
END $$;

-- =============================================
-- VERIFICATION QUERIES
-- Run these after the setup to verify everything works
-- =============================================

-- Check if safe_weekly_leaderboard works and shows 5 placeholder users
SELECT 'Safe Leaderboard Count' as check_name, COUNT(*) as result 
FROM public.safe_weekly_leaderboard;

-- Check if weekly_leaderboard works (admin view)
SELECT 'Admin Leaderboard Count' as check_name, COUNT(*) as result 
FROM public.weekly_leaderboard;

-- Check user_stats table structure
SELECT 'User Stats Columns' as check_name, 
       column_name, 
       data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_stats'
ORDER BY ordinal_position;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
SELECT '✅ LEADERBOARD SETUP COMPLETE' as status,
       'Run the verification queries above to confirm everything works' as next_step;

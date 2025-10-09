-- ============================================================================
-- FIX: Enable CASCADE DELETE for auth.users foreign keys
-- ============================================================================
-- This script modifies all foreign key constraints that reference auth.users
-- to use ON DELETE CASCADE, so deleting a user automatically removes all 
-- their dependent data.
--
-- IMPORTANT: Back up your database before running this!
-- ============================================================================

-- Step 1: Drop and recreate all foreign keys with ON DELETE CASCADE

-- profiles table
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- registration_profiles table
ALTER TABLE public.registration_profiles DROP CONSTRAINT IF EXISTS registration_profiles_user_id_fkey;
ALTER TABLE public.registration_profiles 
  ADD CONSTRAINT registration_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- bodyfat_profiles table
ALTER TABLE public.bodyfat_profiles DROP CONSTRAINT IF EXISTS bodyfat_profiles_user_id_fkey;
ALTER TABLE public.bodyfat_profiles 
  ADD CONSTRAINT bodyfat_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- active_workout_sessions table
ALTER TABLE public.active_workout_sessions DROP CONSTRAINT IF EXISTS active_workout_sessions_user_id_fkey;
ALTER TABLE public.active_workout_sessions 
  ADD CONSTRAINT active_workout_sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- challenge_progress table
ALTER TABLE public.challenge_progress DROP CONSTRAINT IF EXISTS challenge_progress_user_id_fkey;
ALTER TABLE public.challenge_progress 
  ADD CONSTRAINT challenge_progress_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- challenges table (created_by)
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_created_by_fkey;
ALTER TABLE public.challenges 
  ADD CONSTRAINT challenges_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- daily_activity_tracking table
ALTER TABLE public.daily_activity_tracking DROP CONSTRAINT IF EXISTS daily_activity_tracking_user_id_fkey;
ALTER TABLE public.daily_activity_tracking 
  ADD CONSTRAINT daily_activity_tracking_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- daily_meal_tracking table
ALTER TABLE public.daily_meal_tracking DROP CONSTRAINT IF EXISTS daily_meal_tracking_user_id_fkey;
ALTER TABLE public.daily_meal_tracking 
  ADD CONSTRAINT daily_meal_tracking_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- exercise_sets table
ALTER TABLE public.exercise_sets DROP CONSTRAINT IF EXISTS exercise_sets_user_id_fkey;
ALTER TABLE public.exercise_sets 
  ADD CONSTRAINT exercise_sets_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- featured_content table (created_by)
ALTER TABLE public.featured_content DROP CONSTRAINT IF EXISTS featured_content_created_by_fkey;
ALTER TABLE public.featured_content 
  ADD CONSTRAINT featured_content_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- food_database table (created_by)
ALTER TABLE public.food_database DROP CONSTRAINT IF EXISTS food_database_created_by_fkey;
ALTER TABLE public.food_database 
  ADD CONSTRAINT food_database_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- meal_plan_analytics table
ALTER TABLE public.meal_plan_analytics DROP CONSTRAINT IF EXISTS meal_plan_analytics_user_id_fkey;
ALTER TABLE public.meal_plan_analytics 
  ADD CONSTRAINT meal_plan_analytics_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- meal_plan_templates table (created_by)
ALTER TABLE public.meal_plan_templates DROP CONSTRAINT IF EXISTS meal_plan_templates_created_by_fkey;
ALTER TABLE public.meal_plan_templates 
  ADD CONSTRAINT meal_plan_templates_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- steps_tracking table
ALTER TABLE public.steps_tracking DROP CONSTRAINT IF EXISTS steps_tracking_user_id_fkey;
ALTER TABLE public.steps_tracking 
  ADD CONSTRAINT steps_tracking_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_badges table
ALTER TABLE public.user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;
ALTER TABLE public.user_badges 
  ADD CONSTRAINT user_badges_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_daily_goals table
ALTER TABLE public.user_daily_goals DROP CONSTRAINT IF EXISTS user_daily_goals_user_id_fkey;
ALTER TABLE public.user_daily_goals 
  ADD CONSTRAINT user_daily_goals_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_food_history table
ALTER TABLE public.user_food_history DROP CONSTRAINT IF EXISTS user_food_history_user_id_fkey;
ALTER TABLE public.user_food_history 
  ADD CONSTRAINT user_food_history_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_goals table
ALTER TABLE public.user_goals DROP CONSTRAINT IF EXISTS user_goals_user_id_fkey;
ALTER TABLE public.user_goals 
  ADD CONSTRAINT user_goals_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_meal_filters table
ALTER TABLE public.user_meal_filters DROP CONSTRAINT IF EXISTS user_meal_filters_user_id_fkey;
ALTER TABLE public.user_meal_filters 
  ADD CONSTRAINT user_meal_filters_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_meal_logs table
ALTER TABLE public.user_meal_logs DROP CONSTRAINT IF EXISTS user_meal_logs_user_id_fkey;
ALTER TABLE public.user_meal_logs 
  ADD CONSTRAINT user_meal_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_meal_plans table
ALTER TABLE public.user_meal_plans DROP CONSTRAINT IF EXISTS user_meal_plans_user_id_fkey;
ALTER TABLE public.user_meal_plans 
  ADD CONSTRAINT user_meal_plans_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_meals table
ALTER TABLE public.user_meals DROP CONSTRAINT IF EXISTS user_meals_user_id_fkey;
ALTER TABLE public.user_meals 
  ADD CONSTRAINT user_meals_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_saved_workouts table
ALTER TABLE public.user_saved_workouts DROP CONSTRAINT IF EXISTS user_saved_workouts_user_id_fkey;
ALTER TABLE public.user_saved_workouts 
  ADD CONSTRAINT user_saved_workouts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_stats table
ALTER TABLE public.user_stats DROP CONSTRAINT IF EXISTS user_stats_user_id_fkey;
ALTER TABLE public.user_stats 
  ADD CONSTRAINT user_stats_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_subscriptions table
ALTER TABLE public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;
ALTER TABLE public.user_subscriptions 
  ADD CONSTRAINT user_subscriptions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_workout_preferences table
ALTER TABLE public.user_workout_preferences DROP CONSTRAINT IF EXISTS user_workout_preferences_user_id_fkey;
ALTER TABLE public.user_workout_preferences 
  ADD CONSTRAINT user_workout_preferences_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_workout_schedule table
ALTER TABLE public.user_workout_schedule DROP CONSTRAINT IF EXISTS user_workout_schedule_user_id_fkey;
ALTER TABLE public.user_workout_schedule 
  ADD CONSTRAINT user_workout_schedule_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- weight_tracking table
ALTER TABLE public.weight_tracking DROP CONSTRAINT IF EXISTS weight_tracking_user_id_fkey;
ALTER TABLE public.weight_tracking 
  ADD CONSTRAINT weight_tracking_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- workout_logs table
ALTER TABLE public.workout_logs DROP CONSTRAINT IF EXISTS workout_logs_user_id_fkey;
ALTER TABLE public.workout_logs 
  ADD CONSTRAINT workout_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- workout_personal_records table
ALTER TABLE public.workout_personal_records DROP CONSTRAINT IF EXISTS workout_personal_records_user_id_fkey;
ALTER TABLE public.workout_personal_records 
  ADD CONSTRAINT workout_personal_records_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- workout_session_exercises table
ALTER TABLE public.workout_session_exercises DROP CONSTRAINT IF EXISTS workout_session_exercises_user_id_fkey;
ALTER TABLE public.workout_session_exercises 
  ADD CONSTRAINT workout_session_exercises_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- workout_sessions table
ALTER TABLE public.workout_sessions DROP CONSTRAINT IF EXISTS workout_sessions_user_id_fkey;
ALTER TABLE public.workout_sessions 
  ADD CONSTRAINT workout_sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- workout_templates table (created_by_user_id)
ALTER TABLE public.workout_templates DROP CONSTRAINT IF EXISTS workout_templates_created_by_user_id_fkey;
ALTER TABLE public.workout_templates 
  ADD CONSTRAINT workout_templates_created_by_user_id_fkey 
  FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================================
-- VERIFICATION: Check that all constraints are now CASCADE
-- ============================================================================
SELECT 
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
  AND tc.table_schema = rc.constraint_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_schema = 'auth'
  AND ccu.table_name = 'users'
ORDER BY tc.table_schema, tc.table_name;

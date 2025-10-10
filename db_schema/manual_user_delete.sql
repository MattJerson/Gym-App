-- ============================================================================
-- MANUAL USER DELETION SCRIPT
-- ============================================================================
-- Use this script BEFORE applying the CASCADE fix if you need to delete
-- a user immediately. Replace USER_ID_HERE with the actual UUID.
--
-- Example user IDs from your error logs:
-- - ffd4c73c-0316-4aeb-8cf7-47011b1c5e5d
-- - 0b000406-c947-4749-8dc5-26513e46d5c1
-- ============================================================================

BEGIN;

-- Replace USER_ID_HERE with the actual user UUID (no angle brackets!)
-- Example: '0b000406-c947-4749-8dc5-26513e46d5c1'

DO $$
DECLARE
  target_user_id UUID := 'USER_ID_HERE'; -- REPLACE THIS!
BEGIN
  RAISE NOTICE 'Deleting all data for user: %', target_user_id;

  -- Delete from all dependent tables in proper order
  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM public.registration_profiles WHERE user_id = target_user_id;
  DELETE FROM public.bodyfat_profiles WHERE user_id = target_user_id;
  DELETE FROM public.active_workout_sessions WHERE user_id = target_user_id;
  DELETE FROM public.challenge_progress WHERE user_id = target_user_id;
  DELETE FROM public.daily_activity_tracking WHERE user_id = target_user_id;
  DELETE FROM public.daily_meal_tracking WHERE user_id = target_user_id;
  DELETE FROM public.exercise_sets WHERE user_id = target_user_id;
  DELETE FROM public.meal_plan_analytics WHERE user_id = target_user_id;
  DELETE FROM public.steps_tracking WHERE user_id = target_user_id;
  DELETE FROM public.user_badges WHERE user_id = target_user_id;
  DELETE FROM public.user_daily_goals WHERE user_id = target_user_id;
  DELETE FROM public.user_food_history WHERE user_id = target_user_id;
  DELETE FROM public.user_goals WHERE user_id = target_user_id;
  DELETE FROM public.user_meal_filters WHERE user_id = target_user_id;
  DELETE FROM public.user_meal_logs WHERE user_id = target_user_id;
  DELETE FROM public.user_meal_plans WHERE user_id = target_user_id;
  DELETE FROM public.user_meals WHERE user_id = target_user_id;
  DELETE FROM public.user_saved_workouts WHERE user_id = target_user_id;
  DELETE FROM public.user_stats WHERE user_id = target_user_id;
  DELETE FROM public.user_subscriptions WHERE user_id = target_user_id;
  DELETE FROM public.user_workout_preferences WHERE user_id = target_user_id;
  DELETE FROM public.user_workout_schedule WHERE user_id = target_user_id;
  DELETE FROM public.weight_tracking WHERE user_id = target_user_id;
  DELETE FROM public.workout_logs WHERE user_id = target_user_id;
  DELETE FROM public.workout_personal_records WHERE user_id = target_user_id;
  DELETE FROM public.workout_session_exercises WHERE user_id = target_user_id;
  DELETE FROM public.workout_sessions WHERE user_id = target_user_id;
  
  -- Set created_by to NULL for content created by this user (preserve content)
  UPDATE public.challenges SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE public.featured_content SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE public.food_database SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE public.meal_plan_templates SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE public.workout_templates SET created_by_user_id = NULL WHERE created_by_user_id = target_user_id;
  
  RAISE NOTICE 'All dependent data deleted successfully';
END $$;

-- Now delete the auth user (this should work now)
-- Note: Replace USER_ID_HERE with the same UUID as above
SELECT auth.admin.delete_user('USER_ID_HERE');

COMMIT;

-- Verify deletion
-- SELECT * FROM auth.users WHERE id = 'USER_ID_HERE'; -- Should return nothing

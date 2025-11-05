-- EMERGENCY FIX: Disable specific problematic triggers
-- This will allow workouts to complete while we fix the underlying issue

-- Drop the specific triggers that are causing issues (not system triggers)
DROP TRIGGER IF EXISTS trigger_update_session_metrics_on_set_complete ON exercise_sets;
DROP TRIGGER IF EXISTS trigger_update_workout_calories ON exercise_sets;
DROP TRIGGER IF EXISTS trigger_calculate_calories ON workout_sessions;
DROP TRIGGER IF EXISTS trigger_update_calories ON workout_sessions;

-- Also drop the broken functions to prevent any calls to them
DROP FUNCTION IF EXISTS public.update_session_metrics_on_set_complete() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_dynamic_workout_calories(UUID) CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Problematic triggers and functions REMOVED';
  RAISE NOTICE 'Workouts should now complete without errors';
  RAISE NOTICE '';
  RAISE NOTICE 'Stats will be calculated in JavaScript instead';
END $$;

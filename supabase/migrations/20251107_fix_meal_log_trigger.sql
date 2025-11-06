-- =====================================================
-- Fix broken trigger on user_meal_logs table
-- =====================================================
-- The update_weight_tracking_auto function doesn't exist and is causing errors
-- when inserting meal logs. This migration removes all broken triggers.

-- First, let's see what triggers exist (for debugging)
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  RAISE NOTICE 'Checking for triggers on user_meal_logs...';
  
  FOR trigger_rec IN 
    SELECT tgname, pg_get_triggerdef(oid) as definition
    FROM pg_trigger
    WHERE tgrelid = 'public.user_meal_logs'::regclass
      AND tgisinternal = false
  LOOP
    RAISE NOTICE 'Found trigger: % - %', trigger_rec.tgname, trigger_rec.definition;
  END LOOP;
END $$;

-- Drop any triggers that might reference the non-existent function
DROP TRIGGER IF EXISTS trigger_update_weight_tracking ON public.user_meal_logs;
DROP TRIGGER IF EXISTS trigger_update_weight_auto ON public.user_meal_logs;
DROP TRIGGER IF EXISTS update_weight_tracking_trigger ON public.user_meal_logs;
DROP TRIGGER IF EXISTS trigger_meal_log_weight_update ON public.user_meal_logs;
DROP TRIGGER IF EXISTS auto_weight_tracking_trigger ON public.user_meal_logs;

-- Drop the function if it exists (with all possible signatures)
DROP FUNCTION IF EXISTS public.update_weight_tracking_auto() CASCADE;
DROP FUNCTION IF EXISTS public.update_weight_tracking_auto(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_weight_tracking_auto(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS public.update_weight_tracking_auto(uuid, numeric) CASCADE;

-- Verify triggers are gone
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgrelid = 'public.user_meal_logs'::regclass
    AND tgisinternal = false;
    
  RAISE NOTICE 'Remaining triggers on user_meal_logs: %', trigger_count;
END $$;

-- =====================================================
-- Note: Weight tracking is now handled by the automatic 
-- weight tracking system via daily_calorie_summary and 
-- calculate_projected_weight function.
-- No trigger on user_meal_logs is needed.
-- =====================================================

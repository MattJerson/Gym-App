-- =====================================================
-- NUCLEAR OPTION: Remove ALL triggers from user_meal_logs
-- =====================================================
-- This will find and drop every single trigger on the table

DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  RAISE NOTICE '🔍 Finding ALL triggers on user_meal_logs...';
  
  -- Loop through every trigger and drop it
  FOR trigger_rec IN 
    SELECT tgname
    FROM pg_trigger
    WHERE tgrelid = 'public.user_meal_logs'::regclass
      AND tgisinternal = false
  LOOP
    RAISE NOTICE '💥 Dropping trigger: %', trigger_rec.tgname;
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.user_meal_logs', trigger_rec.tgname);
  END LOOP;
  
  RAISE NOTICE '✅ All triggers removed';
END $$;

-- Now drop all possible function signatures
DROP FUNCTION IF EXISTS public.update_weight_tracking_auto() CASCADE;
DROP FUNCTION IF EXISTS public.update_weight_tracking_auto(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_weight_tracking_auto(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS public.update_weight_tracking_auto(uuid, numeric) CASCADE;
DROP FUNCTION IF EXISTS public.update_weight_tracking_auto(uuid, integer, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_weight_tracking_auto(uuid, integer, timestamp) CASCADE;

-- Final verification
DO $$
DECLARE
  trigger_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Count remaining triggers
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgrelid = 'public.user_meal_logs'::regclass
    AND tgisinternal = false;
  
  -- Count remaining functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname = 'update_weight_tracking_auto';
  
  RAISE NOTICE '📊 Final Status:';
  RAISE NOTICE '   - Triggers on user_meal_logs: %', trigger_count;
  RAISE NOTICE '   - update_weight_tracking_auto functions: %', function_count;
  
  IF trigger_count = 0 AND function_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All triggers and functions removed!';
  ELSE
    RAISE WARNING '⚠️  Still have % triggers and % functions remaining', trigger_count, function_count;
  END IF;
END $$;

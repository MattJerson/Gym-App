-- Final cleanup: Drop workout_template_exercises table
-- Only run this after confirming it's empty and all code uses workout_exercises

-- First, let's be extra safe and check one more time
DO $$
DECLARE
  old_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_count FROM workout_template_exercises;
  
  IF old_count > 0 THEN
    RAISE EXCEPTION 'STOP! workout_template_exercises has % records. Cannot safely drop.', old_count;
  ELSE
    RAISE NOTICE 'Confirmed safe: workout_template_exercises is empty. Proceeding with drop.';
  END IF;
END $$;

-- Drop the legacy table
DROP TABLE IF EXISTS workout_template_exercises CASCADE;

-- Verify it's gone
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%workout%exercise%'
ORDER BY table_name;

-- Expected result: Only workout_exercises and workout_exercises_backup should remain

COMMENT ON TABLE workout_exercises IS 'Primary table for workout template exercises. Stores exercise details including name, sets, reps, and order.';

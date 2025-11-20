-- Schema consolidation check and fix
-- Identifies the duplicate exercise tables issue and provides migration path

-- 1. Check which table has data
SELECT 'workout_exercises' as table_name, COUNT(*) as record_count, 
       MIN(created_at) as oldest_record, MAX(created_at) as newest_record
FROM workout_exercises
UNION ALL
SELECT 'workout_template_exercises' as table_name, COUNT(*) as record_count,
       MIN(created_at) as oldest_record, MAX(created_at) as newest_record
FROM workout_template_exercises;

-- 2. Check for any code/queries still referencing workout_template_exercises
-- (This would be done manually in codebase)

-- 3. Migration strategy: Drop workout_template_exercises if empty
-- If workout_template_exercises has data, we need to migrate it first
-- Let's check:

DO $$
DECLARE
  old_table_count INTEGER;
  new_table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_table_count FROM workout_template_exercises;
  SELECT COUNT(*) INTO new_table_count FROM workout_exercises;
  
  RAISE NOTICE 'workout_template_exercises has % records', old_table_count;
  RAISE NOTICE 'workout_exercises has % records', new_table_count;
  
  IF old_table_count > 0 THEN
    RAISE NOTICE 'WARNING: workout_template_exercises has data! Need to migrate before dropping.';
  ELSE
    RAISE NOTICE 'Safe to drop workout_template_exercises - it is empty.';
  END IF;
END $$;

-- 4. If safe, drop the old table (only run if it's empty!)
-- DROP TABLE IF EXISTS workout_template_exercises CASCADE;

-- 5. Verify workout_exercises schema is correct
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'workout_exercises'
ORDER BY ordinal_position;

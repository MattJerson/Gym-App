-- NUCLEAR OPTION: Find and drop ALL custom triggers and functions with weight_kg

-- Step 1: Drop ALL triggers on workout-related tables (except system triggers)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tgname, tgrelid::regclass AS table_name
    FROM pg_trigger
    WHERE tgrelid IN (
      'exercise_sets'::regclass,
      'workout_sessions'::regclass,
      'workout_session_exercises'::regclass
    )
    AND tgisinternal = false
  LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s CASCADE', r.tgname, r.table_name);
      RAISE NOTICE 'Dropped trigger: % on %', r.tgname, r.table_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not drop %: %', r.tgname, SQLERRM;
    END;
  END LOOP;
END $$;

-- Step 2: Drop ALL functions that mention weight_kg (exclude aggregate functions)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT p.proname, p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND pg_get_functiondef(p.oid) ILIKE '%weight_kg%'
      AND p.prokind != 'a'  -- Exclude aggregate functions
  LOOP
    BEGIN
      EXECUTE format('DROP FUNCTION IF EXISTS %I CASCADE', r.proname);
      RAISE NOTICE 'Dropped function: %', r.proname;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not drop %: %', r.proname, SQLERRM;
    END;
  END LOOP;
END $$;

-- Success
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ ALL TRIGGERS AND FUNCTIONS REMOVED!';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Try completing a workout now!';
END $$;

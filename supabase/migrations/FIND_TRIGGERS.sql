-- Find ALL triggers on workout_sessions table
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgfoid::regproc AS function_name,
  tgenabled AS enabled,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'workout_sessions'::regclass
  AND tgisinternal = false
ORDER BY tgname;

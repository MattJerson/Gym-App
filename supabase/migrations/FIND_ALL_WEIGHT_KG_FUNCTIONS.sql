-- Find ALL functions that contain "weight_kg" in their definition
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%weight_kg%'
ORDER BY p.proname;

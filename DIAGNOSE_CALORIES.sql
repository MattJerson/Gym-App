-- Diagnostic Query: Check Calorie Values Across the Stack
-- Run this in Supabase SQL Editor to see what's stored where

-- 1. Check the session with ID 6a2ea62c-4b9e-40da-bf2a-1dfee79c08b5
SELECT 
  'Session Data' as source,
  id,
  workout_name,
  template_id,
  estimated_calories_burned as calories,
  status,
  completed_at,
  total_duration_seconds
FROM workout_sessions
WHERE id = '6a2ea62c-4b9e-40da-bf2a-1dfee79c08b5';

-- 2. Check the template that was used
SELECT 
  'Template Data' as source,
  wt.id,
  wt.name,
  wt.estimated_calories as calories,
  wt.duration_minutes,
  wt.average_met_value
FROM workout_sessions ws
JOIN workout_templates wt ON ws.template_id = wt.id
WHERE ws.id = '6a2ea62c-4b9e-40da-bf2a-1dfee79c08b5';

-- 3. Check recent completed sessions with their template calories
SELECT 
  ws.id,
  ws.workout_name,
  ws.estimated_calories_burned as session_calories,
  wt.estimated_calories as template_calories,
  wt.duration_minutes,
  ws.total_duration_seconds,
  ws.completed_at,
  CASE 
    WHEN ws.estimated_calories_burned = wt.estimated_calories THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as status
FROM workout_sessions ws
LEFT JOIN workout_templates wt ON ws.template_id = wt.id
WHERE ws.user_id = '630b464a-eef3-4b5d-a91f-74c82e75fa21'
  AND ws.status = 'completed'
ORDER BY ws.completed_at DESC
LIMIT 10;

-- 4. Check if there are any triggers or functions that modify estimated_calories_burned
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition ILIKE '%estimated_calories%'
ORDER BY routine_name;

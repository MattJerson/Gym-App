-- =====================================================
-- COMPLETE CLEANUP: Remove ALL Invalid Calorie Data
-- =====================================================

-- Step 1: Check ALL workouts with unrealistic calories (not just > 10,000)
SELECT 
  COUNT(*) as invalid_workouts,
  SUM(estimated_calories_burned) as total_bad_calories
FROM workout_sessions
WHERE user_id = '630b464a-eef3-4b5d-a91f-74c82e75fa21'
  AND estimated_calories_burned > 2000;  -- Anything over 2000 cal is suspicious

-- Expected: Should show many invalid workouts


-- Step 2: DELETE ALL workouts with > 2000 calories (unrealistic for most workouts)
DELETE FROM workout_sessions
WHERE user_id = '630b464a-eef3-4b5d-a91f-74c82e75fa21'
  AND estimated_calories_burned > 2000;


-- Step 3: Verify what's left
SELECT 
  id,
  completed_at::date as workout_date,
  estimated_calories_burned,
  workout_type,
  created_at
FROM workout_sessions
WHERE user_id = '630b464a-eef3-4b5d-a91f-74c82e75fa21'
ORDER BY completed_at DESC
LIMIT 20;

-- Expected: All remaining workouts should have < 2000 calories


-- Step 4: Clear daily_calorie_summary again
DELETE FROM daily_calorie_summary
WHERE user_id = '630b464a-eef3-4b5d-a91f-74c82e75fa21';


-- Step 5: Test weight chart again
SELECT 
  measurement_date,
  weight_kg,
  is_actual,
  calories_burned,
  calories_consumed
FROM get_weight_progress_chart(
  '630b464a-eef3-4b5d-a91f-74c82e75fa21'::uuid,
  7
)
ORDER BY measurement_date DESC;

-- Expected: Should now show POSITIVE weight_kg values (around 100 kg)

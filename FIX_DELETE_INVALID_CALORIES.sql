-- =====================================================
-- FIX: Delete Invalid High Calorie Workout Data
-- =====================================================
-- This removes workout sessions with unrealistic calorie burns
-- (> 10,000 calories per workout is physically impossible)
-- =====================================================

-- Step 1: Check how many invalid workouts exist
SELECT 
  COUNT(*) as invalid_workout_count,
  SUM(estimated_calories_burned) as total_invalid_calories
FROM workout_sessions
WHERE user_id = auth.uid()
  AND estimated_calories_burned > 10000;

-- Expected: Should show you how many bad records will be deleted


-- Step 2: See the actual invalid workouts (for verification)
SELECT 
  id,
  completed_at::date as workout_date,
  estimated_calories_burned,
  workout_type,
  total_duration_seconds,
  created_at
FROM workout_sessions
WHERE user_id = auth.uid()
  AND estimated_calories_burned > 10000
ORDER BY estimated_calories_burned DESC;


-- Step 3: DELETE the invalid workout sessions
DELETE FROM workout_sessions
WHERE user_id = auth.uid()
  AND estimated_calories_burned > 10000;

-- This will remove all workout sessions with > 10,000 calories burned


-- Step 4: Verify they're gone
SELECT 
  COUNT(*) as remaining_workouts,
  MAX(estimated_calories_burned) as max_calories,
  AVG(estimated_calories_burned) as avg_calories
FROM workout_sessions
WHERE user_id = auth.uid();

-- Expected: max_calories should be < 10,000


-- Step 5: Clear the daily_calorie_summary cache (will be regenerated)
DELETE FROM daily_calorie_summary
WHERE user_id = auth.uid();

-- This forces the system to recalculate calorie summaries from scratch


-- Step 6: Skip this step - the triggers will regenerate summaries automatically
-- when you log new meals/workouts

-- The daily_calorie_summary will be rebuilt automatically by triggers when:
-- 1. You log a new meal
-- 2. You complete a new workout
-- 3. The weight chart function runs

-- For now, just proceed to Step 7 to check if existing data is correct


-- Step 7: Verify the new daily_calorie_summary looks correct
SELECT 
  summary_date,
  calories_consumed,
  calories_burned,
  net_calories
FROM daily_calorie_summary
WHERE user_id = auth.uid()
ORDER BY summary_date DESC
LIMIT 10;

-- Expected: calories_burned should be 0-2000 per day (realistic)


-- Step 8: Check weight tracking now shows correct data
SELECT * FROM get_weight_progress_chart(auth.uid(), 7);

-- Expected: Should return POSITIVE weight values (e.g. 75 kg, not -130 kg)

-- =====================================================
-- DEBUG: Check Why Calories Are So High
-- =====================================================

-- 1. Check your daily_calorie_summary
SELECT 
  summary_date,
  calories_consumed,
  calories_burned,
  net_calories,
  created_at
FROM daily_calorie_summary
WHERE user_id = auth.uid()
ORDER BY summary_date DESC
LIMIT 10;

-- Expected: Should have reasonable values (0-5000 calories)
-- If calories_burned is 242,684 - that's the bug!


-- 2. Check your workout_sessions (where calories might be wrong)
SELECT 
  id,
  completed_at::date as workout_date,
  estimated_calories_burned,
  workout_type,
  duration_minutes,
  created_at
FROM workout_sessions
WHERE user_id = auth.uid()
ORDER BY completed_at DESC
LIMIT 10;

-- Expected: Should be 100-1000 calories per workout
-- If you see 242,684 - that's the source!


-- 3. Check your meal logs
SELECT 
  id,
  meal_date,
  calories,
  meal_type,
  created_at
FROM user_meal_logs
WHERE user_id = auth.uid()
ORDER BY meal_date DESC
LIMIT 10;

-- Expected: 200-1000 calories per meal


-- 4. Check weight_tracking initial weight
SELECT 
  id,
  measurement_date,
  weight_kg,
  notes,
  created_at
FROM weight_tracking
WHERE user_id = auth.uid()
ORDER BY measurement_date;

-- Expected: Should have at least 1 row with POSITIVE weight (e.g. 75 kg)

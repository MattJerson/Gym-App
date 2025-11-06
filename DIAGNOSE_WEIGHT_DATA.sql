-- =====================================================
-- COMPREHENSIVE WEIGHT TRACKING DIAGNOSTIC
-- =====================================================
-- Run these queries in order to find the issue
-- =====================================================

-- 1. Check your registration_profiles data (THIS IS THE CORRECT TABLE!)
SELECT 
  user_id,
  weight_kg,
  calorie_goal,
  age,
  height_cm,
  fitness_goal,
  created_at,
  updated_at
FROM registration_profiles
WHERE user_id = auth.uid();

-- Expected: Should return 1 row with your weight_kg value


-- 2. Check if weight_tracking has any entries
SELECT 
  id,
  user_id,
  measurement_date,
  weight_kg,
  notes,
  created_at
FROM weight_tracking
WHERE user_id = auth.uid()
ORDER BY measurement_date DESC;

-- Expected: Should have at least 1 row (initial weight)
-- If empty, the trigger didn't fire


-- 3. Check if daily_calorie_summary has data
SELECT 
  summary_date,
  calories_consumed,
  calories_burned,
  net_calories,
  created_at
FROM daily_calorie_summary
WHERE user_id = auth.uid()
ORDER BY summary_date DESC
LIMIT 5;

-- Expected: Should have rows for days you logged meals/workouts


-- 4. Test the calculate_projected_weight function directly
SELECT calculate_projected_weight(auth.uid(), CURRENT_DATE);

-- Expected: Should return a weight value (your current projected weight)


-- 5. Test the get_weight_progress_chart function
SELECT * FROM get_weight_progress_chart(auth.uid(), 30);

-- Expected: Should return rows with dates and weights
-- This is what the app calls to display the chart


-- 6. Check if you have any meal logs
SELECT 
  id,
  meal_date,
  calories,
  created_at
FROM user_meal_logs
WHERE user_id = auth.uid()
ORDER BY meal_date DESC
LIMIT 5;

-- Expected: Should show your recent meals


-- 7. Check if you have any workout sessions
SELECT 
  id,
  completed_at,
  estimated_calories_burned,
  created_at
FROM workout_sessions
WHERE user_id = auth.uid()
ORDER BY completed_at DESC
LIMIT 5;

-- Expected: Should show your recent workouts


-- 8. Check if the weight_tracking trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_insert_initial_weight';

-- Expected: Should show the trigger on registration_profiles table

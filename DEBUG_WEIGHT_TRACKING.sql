-- =====================================================
-- DEBUG: Weight Tracking System
-- =====================================================
-- Run these queries to diagnose weight tracking issues
-- =====================================================

-- 1. Check if user has registration weight
SELECT 
  u.email,
  rp.weight_kg as registration_weight,
  rp.calorie_goal,
  rp.created_at as registered_at
FROM auth.users u
LEFT JOIN registration_profiles rp ON rp.user_id = u.id
WHERE u.id = auth.uid()
LIMIT 1;

-- 2. Check if initial weight entry was created
SELECT 
  wt.measurement_date,
  wt.weight_kg,
  wt.notes,
  wt.created_at
FROM weight_tracking wt
WHERE wt.user_id = auth.uid()
ORDER BY wt.measurement_date DESC;

-- 3. Check daily calorie summary data
SELECT 
  summary_date,
  calories_consumed,
  calories_burned,
  net_calories,
  meals_logged,
  workouts_completed
FROM daily_calorie_summary
WHERE user_id = auth.uid()
ORDER BY summary_date DESC
LIMIT 7;

-- 4. Check meal logs
SELECT 
  meal_date,
  COUNT(*) as meals_count,
  SUM(calories) as total_calories
FROM user_meal_logs
WHERE user_id = auth.uid()
GROUP BY meal_date
ORDER BY meal_date DESC
LIMIT 7;

-- 5. Check workout sessions
SELECT 
  DATE(completed_at) as workout_date,
  COUNT(*) as workouts,
  SUM(estimated_calories_burned) as total_burned
FROM workout_sessions
WHERE user_id = auth.uid()
  AND status = 'completed'
GROUP BY DATE(completed_at)
ORDER BY DATE(completed_at) DESC
LIMIT 7;

-- 6. Test weight projection function
SELECT * FROM calculate_projected_weight(auth.uid(), CURRENT_DATE);

-- 7. Test weight progress chart function
SELECT * FROM get_weight_progress_chart(auth.uid(), 7);

-- 8. Check unlock status
SELECT * FROM check_weight_progress_unlock(auth.uid());

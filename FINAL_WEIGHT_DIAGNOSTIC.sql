-- =====================================================
-- FINAL DIAGNOSTIC: Check ALL Weight Tracking Components
-- =====================================================

-- 1. Check if backfill ran (should have inserted initial weights)
SELECT COUNT(*) as total_users_with_weight_tracking
FROM weight_tracking;

-- 2. Check YOUR weight_tracking entry
SELECT 
  id,
  user_id,
  measurement_date,
  weight_kg,
  notes,
  created_at
FROM weight_tracking
WHERE user_id = auth.uid();

-- 3. Check YOUR registration_profiles entry
SELECT 
  user_id,
  weight_kg,
  calorie_goal,
  created_at
FROM registration_profiles
WHERE user_id = auth.uid();

-- 4. Test the get_weight_progress_chart function DIRECTLY
SELECT * FROM get_weight_progress_chart(auth.uid(), 7);

-- 5. If step 4 returns no rows, test with raw SQL to see what's happening
SELECT 
  wt.measurement_date,
  wt.weight_kg,
  true as is_actual,
  false as is_projected,
  0 as calorie_balance,
  0 as calories_consumed,
  0 as calories_burned
FROM weight_tracking wt
WHERE wt.user_id = auth.uid()
  AND wt.measurement_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY wt.measurement_date;

-- 6. Check if daily_calorie_summary has ANY data
SELECT COUNT(*) as summary_rows
FROM daily_calorie_summary
WHERE user_id = auth.uid();

-- 7. Check function exists and is accessible
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_weight_progress_chart';

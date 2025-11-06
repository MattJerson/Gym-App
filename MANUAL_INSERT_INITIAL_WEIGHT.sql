-- =====================================================
-- MANUAL FIX: Insert Initial Weight from Registration
-- =====================================================
-- This manually inserts your initial weight if the 
-- automatic trigger didn't fire for some reason
-- =====================================================

-- Step 1: Verify your registration data exists
SELECT 
  user_id,
  weight_kg,
  calorie_goal,
  age,
  height_cm,
  created_at
FROM registration_profiles
WHERE user_id = auth.uid();

-- You should see your weight_kg value here
-- If weight_kg is NULL, contact support


-- Step 2: Manually insert initial weight
-- This will only insert if you don't already have a weight_tracking entry
INSERT INTO weight_tracking (
  user_id,
  measurement_date,
  weight_kg,
  notes,
  created_at
)
SELECT 
  rp.user_id,
  CURRENT_DATE,
  rp.weight_kg,
  'Initial weight (manual insert)',
  NOW()
FROM registration_profiles rp
WHERE rp.user_id = auth.uid()
  AND rp.weight_kg IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM weight_tracking wt 
    WHERE wt.user_id = rp.user_id
  );

-- Step 3: Verify it was created
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

-- You should now see at least 1 row with your initial weight


-- Step 4: Test the weight progress chart
SELECT * FROM get_weight_progress_chart(auth.uid(), 7);

-- You should see data points now!

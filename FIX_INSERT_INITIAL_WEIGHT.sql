-- =====================================================
-- MANUAL FIX: Insert Initial Weight for Current User
-- =====================================================
-- Run this if automatic trigger didn't create initial weight
-- =====================================================

-- First, let's check what we have
SELECT 
  u.id as user_id,
  u.email,
  rp.weight_kg,
  rp.calorie_goal,
  rp.created_at
FROM auth.users u
LEFT JOIN registration_profiles rp ON rp.user_id = u.id
WHERE u.id = auth.uid();

-- If weight_kg is NULL, you need to update registration_profiles first:
-- UPDATE registration_profiles 
-- SET weight_kg = 75  -- Replace with your actual weight in kg
-- WHERE user_id = auth.uid();

-- Then manually insert initial weight entry
-- (This will trigger if weight_kg exists but weight_tracking entry doesn't)
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

-- Verify it was created
SELECT * FROM weight_tracking WHERE user_id = auth.uid();

-- Now test the chart function
SELECT * FROM get_weight_progress_chart(auth.uid(), 7);

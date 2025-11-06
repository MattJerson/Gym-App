-- =====================================================
-- FINAL CHECK: Weight Tracking Data
-- =====================================================

-- 1. Check if you have ANY weight_tracking entries
SELECT 
  id,
  user_id,
  measurement_date,
  weight_kg,
  notes,
  created_at
FROM weight_tracking
WHERE user_id = auth.uid()
ORDER BY measurement_date;

-- Expected: Should have at least 1 row with your initial weight


-- 2. If Step 1 returns NO ROWS, manually insert your initial weight now
-- REPLACE 75 with your actual weight in kg
INSERT INTO weight_tracking (
  user_id,
  measurement_date,
  weight_kg,
  notes
)
VALUES (
  auth.uid(),
  CURRENT_DATE,
  75,  -- 👈 CHANGE THIS TO YOUR ACTUAL WEIGHT IN KG
  'Initial weight (manual entry after cleanup)'
);


-- 3. Verify it was inserted
SELECT 
  id,
  user_id,
  measurement_date,
  weight_kg,
  notes,
  created_at
FROM weight_tracking
WHERE user_id = auth.uid()
ORDER BY measurement_date;


-- 4. Now test the weight chart function again
SELECT * FROM get_weight_progress_chart(auth.uid(), 7);

-- Expected: Should now return rows with POSITIVE weight values

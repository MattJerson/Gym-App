-- =====================================================
-- BACKFILL: Insert Initial Weight for ALL Users
-- =====================================================
-- This applies to EVERYONE, not just one user
-- =====================================================

-- Step 1: Check how many users need initial weight entries
SELECT 
  COUNT(*) as users_missing_weight,
  SUM(rp.weight_kg) as total_weight_to_insert
FROM registration_profiles rp
WHERE rp.weight_kg IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM weight_tracking wt 
    WHERE wt.user_id = rp.user_id
  );

-- Expected: Shows how many users will get initial weight entries


-- Step 2: Insert initial weights for ALL users who don't have them
INSERT INTO weight_tracking (
  user_id,
  measurement_date,
  weight_kg,
  notes
)
SELECT 
  rp.user_id,
  COALESCE(rp.created_at::date, CURRENT_DATE) as measurement_date,
  rp.weight_kg,
  'Initial weight from registration'
FROM registration_profiles rp
WHERE rp.weight_kg IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM weight_tracking wt 
    WHERE wt.user_id = rp.user_id
  );

-- This inserts initial weight for ALL users


-- Step 3: Verify how many were inserted
SELECT 
  COUNT(*) as total_weight_entries,
  COUNT(DISTINCT user_id) as unique_users
FROM weight_tracking;

-- Expected: Should show all users now have weight entries


-- Step 4: Check YOUR specific weight entry
SELECT 
  id,
  user_id,
  measurement_date,
  weight_kg,
  notes,
  created_at
FROM weight_tracking
WHERE user_id = '630b464a-eef3-4b5d-a91f-74c82e75fa21'  -- Your user ID
ORDER BY measurement_date;

-- Expected: Should show at least 1 row with your weight

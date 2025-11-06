-- =====================================================
-- FINAL TEST: Check Weight Chart Data
-- =====================================================

-- Test the weight chart function for YOUR user
SELECT * FROM get_weight_progress_chart(
  '630b464a-eef3-4b5d-a91f-74c82e75fa21'::uuid,
  30
);

-- Expected: Should return rows with:
-- - measurement_date: dates from the last 30 days
-- - weight_kg: POSITIVE values (100 kg +/- changes)
-- - is_actual: true for Oct 2
-- - is_projected: true for other dates
-- - calories_consumed, calories_burned: realistic values (0-3000)

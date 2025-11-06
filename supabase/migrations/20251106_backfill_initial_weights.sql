-- =====================================================
-- BACKFILL: Migrate All Registration Weights to Weight Tracking
-- =====================================================
-- This migration copies initial weights from registration_profiles 
-- to weight_tracking for ALL users who don't have weight entries yet
-- =====================================================

-- Insert initial weights for all users who:
-- 1. Have a weight_kg in registration_profiles
-- 2. Don't have any weight_tracking entries yet
INSERT INTO public.weight_tracking (
  user_id,
  measurement_date,
  weight_kg,
  notes,
  created_at
)
SELECT 
  rp.user_id,
  COALESCE(rp.created_at::date, CURRENT_DATE) as measurement_date,
  rp.weight_kg,
  'Initial weight from registration',
  NOW()
FROM public.registration_profiles rp
WHERE rp.weight_kg IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.weight_tracking wt 
    WHERE wt.user_id = rp.user_id
  );

-- Log how many records were inserted
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % initial weight entries', inserted_count;
END $$;

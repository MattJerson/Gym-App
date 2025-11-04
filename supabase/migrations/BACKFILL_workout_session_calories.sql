-- Backfill Script: Fix Existing Workout Sessions with 0 Calories
-- Date: November 5, 2025
-- Purpose: Update completed workout sessions that have 0 calories with their template's estimated_calories

-- First, let's see how many sessions need updating
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM workout_sessions ws
  JOIN workout_templates wt ON ws.template_id = wt.id
  WHERE ws.status = 'completed'
    AND ws.estimated_calories_burned = 0
    AND wt.estimated_calories > 0;
  
  RAISE NOTICE '📊 Found % completed sessions with 0 calories that need updating', v_count;
END $$;

-- Update completed sessions with their template's calories
UPDATE workout_sessions ws
SET 
  estimated_calories_burned = wt.estimated_calories,
  updated_at = NOW()
FROM workout_templates wt
WHERE ws.template_id = wt.id
  AND ws.status = 'completed'
  AND ws.estimated_calories_burned = 0
  AND wt.estimated_calories > 0;

-- Show results
DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '✅ Updated % workout sessions with template calories', v_updated;
END $$;

-- Verify the update
DO $$
DECLARE
  v_remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_remaining
  FROM workout_sessions ws
  WHERE ws.status = 'completed'
    AND ws.estimated_calories_burned = 0;
  
  IF v_remaining > 0 THEN
    RAISE NOTICE '⚠️  Warning: % completed sessions still have 0 calories (template may not have calories)', v_remaining;
  ELSE
    RAISE NOTICE '🎉 All completed sessions now have calorie data!';
  END IF;
END $$;

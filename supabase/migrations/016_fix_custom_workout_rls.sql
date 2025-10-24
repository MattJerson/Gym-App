-- ============================================
-- FIX: Custom Workouts Visibility in Browse Workouts
-- Ensure RLS policies properly filter custom workouts
-- ============================================

-- The issue: Custom workouts were appearing in Browse Workouts section
-- Root cause: RLS policy allows reading all active templates including custom ones
-- Solution: Update policy to explicitly exclude custom workouts from public browse

-- Step 1: Drop existing read policy
DROP POLICY IF EXISTS "Allow read access to active templates and own custom workouts" ON public.workout_templates;

-- Step 2: Create refined read policy
-- Users can see:
-- 1. ALL active pre-made templates (is_custom = false OR is_custom IS NULL)
-- 2. Only THEIR OWN custom templates (is_custom = true AND created_by_user_id = auth.uid())
CREATE POLICY "Allow read access to active pre-made templates and own custom workouts"
  ON public.workout_templates FOR SELECT
  USING (
    -- Pre-made templates: active and NOT custom
    (is_active = true AND (is_custom = false OR is_custom IS NULL))
    OR 
    -- Custom templates: only user's own
    (is_custom = true AND created_by_user_id = auth.uid())
  );

-- Step 3: Add comment for clarity
COMMENT ON POLICY "Allow read access to active pre-made templates and own custom workouts" 
  ON public.workout_templates IS 
  'Users can view all active pre-made templates and only their own custom workouts. Custom workouts are private to the creator.';

-- Step 4: Fix the workout_count trigger to exclude custom workouts
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_update_workout_count ON public.workout_templates;
DROP FUNCTION IF EXISTS update_category_workout_count();

-- Create new function that only counts pre-made templates
CREATE OR REPLACE FUNCTION update_category_workout_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update count for pre-made templates (not custom workouts)
  IF TG_OP = 'INSERT' THEN
    -- Only increment if it's a pre-made template
    IF NEW.is_custom = false OR NEW.is_custom IS NULL THEN
      UPDATE public.workout_categories
      SET workout_count = workout_count + 1
      WHERE id = NEW.category_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Only decrement if it was a pre-made template
    IF OLD.is_custom = false OR OLD.is_custom IS NULL THEN
      UPDATE public.workout_categories
      SET workout_count = workout_count - 1
      WHERE id = OLD.category_id;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle category change for pre-made templates only
    IF NEW.category_id <> OLD.category_id THEN
      -- Decrement old category if it was a pre-made template
      IF OLD.is_custom = false OR OLD.is_custom IS NULL THEN
        UPDATE public.workout_categories
        SET workout_count = workout_count - 1
        WHERE id = OLD.category_id;
      END IF;
      
      -- Increment new category if it's a pre-made template
      IF NEW.is_custom = false OR NEW.is_custom IS NULL THEN
        UPDATE public.workout_categories
        SET workout_count = workout_count + 1
        WHERE id = NEW.category_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER trigger_update_workout_count
AFTER INSERT OR UPDATE OR DELETE ON public.workout_templates
FOR EACH ROW EXECUTE FUNCTION update_category_workout_count();

COMMENT ON FUNCTION update_category_workout_count() IS 
  'Auto-update workout_count in workout_categories. Only counts pre-made templates, excludes custom workouts.';

-- Step 5: Recalculate workout_count for all categories (cleanup existing counts)
UPDATE public.workout_categories wc
SET workout_count = (
  SELECT COUNT(*)::INTEGER
  FROM public.workout_templates wt
  WHERE wt.category_id = wc.id
    AND wt.is_active = true
    AND (wt.is_custom = false OR wt.is_custom IS NULL) -- Only pre-made templates
);

-- Step 6: Verify the counts are correct
-- This comment query shows what the counts should be:
-- SELECT 
--   wc.name AS category,
--   wc.workout_count AS stored_count,
--   (
--     SELECT COUNT(*)
--     FROM workout_templates wt
--     WHERE wt.category_id = wc.id
--       AND wt.is_active = true
--       AND (wt.is_custom = false OR wt.is_custom IS NULL)
--   ) AS actual_count
-- FROM workout_categories wc
-- ORDER BY wc.display_order;

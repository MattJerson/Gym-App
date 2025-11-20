-- Make category optional for workout_templates by relaxing the constraint
ALTER TABLE public.workout_templates
DROP CONSTRAINT IF EXISTS check_single_category;

ALTER TABLE public.workout_templates
ADD CONSTRAINT check_single_category 
CHECK (
  -- Allow no category at all
  (category_id IS NULL AND custom_category_id IS NULL) OR
  -- Or exactly one category
  (category_id IS NOT NULL AND custom_category_id IS NULL) OR 
  (category_id IS NULL AND custom_category_id IS NOT NULL)
);

-- Add missing custom_notes column to workout_exercises table
ALTER TABLE public.workout_exercises
ADD COLUMN IF NOT EXISTS custom_notes text;

-- Add description field as an alias if needed
COMMENT ON COLUMN public.workout_exercises.custom_notes IS 'Custom notes for the exercise within this specific workout template';

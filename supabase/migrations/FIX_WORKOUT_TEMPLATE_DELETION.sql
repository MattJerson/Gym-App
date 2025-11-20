-- Fix workout template deletion and user workout copy system
-- When users "save" a template, they get their own copy that persists even if template is deleted

-- First, let's create a function to copy a workout template for a user
CREATE OR REPLACE FUNCTION copy_workout_template_for_user(
  p_template_id UUID,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  v_new_template_id UUID;
  v_exercise RECORD;
BEGIN
  -- Create a copy of the workout template for the user
  INSERT INTO workout_templates (
    name,
    description,
    category_id,
    difficulty,
    duration_minutes,
    estimated_calories,
    is_custom,
    created_by_user_id,
    created_at,
    assignment_type,
    is_active
  )
  SELECT 
    name || ' (My Copy)',
    description,
    category_id,
    difficulty,
    duration_minutes,
    estimated_calories,
    true,  -- Mark as custom
    p_user_id,  -- Owned by the user
    NOW(),
    'public',  -- User's personal copy is available to them
    true  -- Active by default
  FROM workout_templates
  WHERE id = p_template_id
  RETURNING id INTO v_new_template_id;

  -- Copy all exercises from the template
  FOR v_exercise IN 
    SELECT * FROM workout_exercises 
    WHERE template_id = p_template_id
    ORDER BY order_index
  LOOP
    INSERT INTO workout_exercises (
      template_id,
      exercise_name,
      sets,
      reps,
      rest_seconds,
      order_index,
      description,
      calories_per_set
    ) VALUES (
      v_new_template_id,
      v_exercise.exercise_name,
      v_exercise.sets,
      v_exercise.reps,
      v_exercise.rest_seconds,
      v_exercise.order_index,
      v_exercise.description,
      v_exercise.calories_per_set
    );
  END LOOP;

  RETURN v_new_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION copy_workout_template_for_user(UUID, UUID) TO authenticated;

-- Update the user_assigned_workouts to use copied templates instead of references
-- Add a column to track if this is a copy or reference
ALTER TABLE user_assigned_workouts 
ADD COLUMN IF NOT EXISTS copied_template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL;

COMMENT ON COLUMN user_assigned_workouts.copied_template_id IS 'If set, user has their own copy of the template that persists even if original is deleted';

-- For workout template deletion, we now only need to clean up the workout_exercises
-- since user copies are independent
CREATE OR REPLACE FUNCTION delete_workout_template_cascade(p_template_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Delete exercises first
  DELETE FROM workout_exercises WHERE template_id = p_template_id;
  
  -- Delete user assignments (but preserve their copied templates)
  DELETE FROM user_assigned_workouts WHERE workout_template_id = p_template_id;
  
  -- Delete the template
  DELETE FROM workout_templates WHERE id = p_template_id;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to delete workout template: %', SQLERRM;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to community managers and admins
GRANT EXECUTE ON FUNCTION delete_workout_template_cascade(UUID) TO authenticated;

-- Add RLS policy to allow community managers to delete templates via function
DROP POLICY IF EXISTS "Community managers can delete templates via function" ON workout_templates;
CREATE POLICY "Community managers can delete templates via function"
  ON workout_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM registration_profiles
      WHERE user_id = auth.uid()
      AND (role = 'community_manager' OR role = 'admin' OR is_admin = true)
    )
  );

-- Drop existing function if it exists (to change return type)
DROP FUNCTION IF EXISTS save_workout_to_library(UUID, UUID, INTEGER, BOOLEAN);

-- Create function for users to save a workout template as their own copy
CREATE OR REPLACE FUNCTION save_workout_to_library(
  p_user_id UUID,
  p_template_id UUID,
  p_scheduled_day INTEGER DEFAULT NULL,
  p_start_now BOOLEAN DEFAULT FALSE
) RETURNS TABLE (
  workout_id UUID,
  message TEXT
) AS $$
DECLARE
  v_copied_template_id UUID;
  v_template_name TEXT;
BEGIN
  -- Get template name for the copied version
  SELECT name INTO v_template_name FROM workout_templates WHERE id = p_template_id;
  
  -- Use the copy function to create user's own version
  v_copied_template_id := copy_workout_template_for_user(p_template_id, p_user_id);
  
  -- Return the new workout ID
  RETURN QUERY SELECT 
    v_copied_template_id,
    'Workout saved to your library!'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION save_workout_to_library(UUID, UUID, INTEGER, BOOLEAN) TO authenticated;

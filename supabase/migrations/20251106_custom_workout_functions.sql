-- =====================================================
-- Database Functions for User Custom Categories System
-- =====================================================

-- Function: create_custom_workout_v2
-- Description: Creates a custom workout with user_custom_categories
CREATE OR REPLACE FUNCTION public.create_custom_workout_v2(
  p_user_id uuid,
  p_name varchar,
  p_description text,
  p_custom_category_id uuid,
  p_difficulty varchar,
  p_duration_minutes integer,
  p_estimated_calories integer,
  p_exercises jsonb,
  p_custom_color varchar DEFAULT NULL,
  p_custom_emoji varchar DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_template_id uuid;
  v_exercise jsonb;
  v_order_index integer := 0;
BEGIN
  -- Verify the custom category belongs to this user
  IF NOT EXISTS (
    SELECT 1 FROM public.user_custom_categories 
    WHERE id = p_custom_category_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Invalid custom category or unauthorized access';
  END IF;

  -- Create workout template with custom_category_id
  INSERT INTO public.workout_templates (
    custom_category_id,  -- Use custom_category_id instead of category_id
    category_id,         -- Set to NULL
    name,
    description,
    difficulty,
    duration_minutes,
    estimated_calories,
    is_custom,
    created_by_user_id,
    custom_color,
    custom_emoji,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    p_custom_category_id,
    NULL,  -- category_id is NULL for custom workouts
    p_name,
    p_description,
    p_difficulty,
    p_duration_minutes,
    p_estimated_calories,
    true,
    p_user_id,
    p_custom_color,
    p_custom_emoji,
    true,
    now(),
    now()
  )
  RETURNING id INTO v_template_id;

  -- Insert exercises for this template
  FOR v_exercise IN SELECT * FROM jsonb_array_elements(p_exercises)
  LOOP
    INSERT INTO public.workout_template_exercises (
      template_id,
      exercise_id,
      sets,
      reps,
      duration_seconds,
      rest_seconds,
      order_index,
      custom_notes,
      created_at,
      updated_at
    ) VALUES (
      v_template_id,
      (v_exercise->>'exercise_id')::uuid,
      (v_exercise->>'sets')::integer,
      v_exercise->>'reps',
      (v_exercise->>'duration_seconds')::integer,
      (v_exercise->>'rest_seconds')::integer,
      v_order_index,
      v_exercise->>'notes',
      now(),
      now()
    );
    
    v_order_index := v_order_index + 1;
  END LOOP;

  -- Add to user_saved_workouts
  INSERT INTO public.user_saved_workouts (
    user_id,
    template_id,
    workout_name,
    workout_type,
    is_scheduled,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_template_id,
    p_name,
    'Custom',
    false,
    now(),
    now()
  );

  RETURN v_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================

-- Function: update_custom_workout_v2
-- Description: Updates a custom workout with user_custom_categories
CREATE OR REPLACE FUNCTION public.update_custom_workout_v2(
  p_user_id uuid,
  p_template_id uuid,
  p_name varchar,
  p_description text,
  p_custom_category_id uuid,
  p_difficulty varchar,
  p_duration_minutes integer,
  p_estimated_calories integer,
  p_exercises jsonb,
  p_custom_color varchar DEFAULT NULL,
  p_custom_emoji varchar DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_exercise jsonb;
  v_order_index integer := 0;
BEGIN
  -- Verify this is a custom workout owned by the user
  IF NOT EXISTS (
    SELECT 1 FROM public.workout_templates 
    WHERE id = p_template_id 
      AND created_by_user_id = p_user_id
      AND is_custom = true
  ) THEN
    RAISE EXCEPTION 'Workout not found or unauthorized';
  END IF;

  -- Verify the custom category belongs to this user
  IF NOT EXISTS (
    SELECT 1 FROM public.user_custom_categories 
    WHERE id = p_custom_category_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Invalid custom category or unauthorized access';
  END IF;

  -- Update workout template
  UPDATE public.workout_templates
  SET
    custom_category_id = p_custom_category_id,
    category_id = NULL,
    name = p_name,
    description = p_description,
    difficulty = p_difficulty,
    duration_minutes = p_duration_minutes,
    estimated_calories = p_estimated_calories,
    custom_color = p_custom_color,
    custom_emoji = p_custom_emoji,
    updated_at = now()
  WHERE id = p_template_id;

  -- Delete existing exercises
  DELETE FROM public.workout_template_exercises
  WHERE template_id = p_template_id;

  -- Insert updated exercises
  FOR v_exercise IN SELECT * FROM jsonb_array_elements(p_exercises)
  LOOP
    INSERT INTO public.workout_template_exercises (
      template_id,
      exercise_id,
      sets,
      reps,
      duration_seconds,
      rest_seconds,
      order_index,
      custom_notes,
      created_at,
      updated_at
    ) VALUES (
      p_template_id,
      (v_exercise->>'exercise_id')::uuid,
      (v_exercise->>'sets')::integer,
      v_exercise->>'reps',
      (v_exercise->>'duration_seconds')::integer,
      (v_exercise->>'rest_seconds')::integer,
      v_order_index,
      v_exercise->>'notes',
      now(),
      now()
    );
    
    v_order_index := v_order_index + 1;
  END LOOP;

  -- Update user_saved_workouts
  UPDATE public.user_saved_workouts
  SET
    workout_name = p_name,
    updated_at = now()
  WHERE template_id = p_template_id
    AND user_id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_custom_workout_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_custom_workout_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_custom_category TO authenticated;

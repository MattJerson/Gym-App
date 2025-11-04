-- Migration: Fix Calories Integrity Issue
-- Date: November 5, 2025
-- Issue: Calories should always be based on template's estimated duration (MET-based calculation)
--        not on actual time spent to maintain data integrity
-- 
-- PROBLEM SCENARIO:
-- 1. User starts workout (estimated 45 min, 300 calories)
-- 2. User abandons after 1 hour
-- 3. User returns 2 days later and checks off remaining exercises in 2 minutes
-- 4. If calories were based on actual duration (1hr + 2min), calculation would be wrong
--
-- SOLUTION:
-- - Always use template's estimated_calories (MET × weight × estimated_duration)
-- - This is calculated when template is created and remains constant
-- - Actual duration is still tracked for personal records, but doesn't affect calories

-- ============================================
-- UPDATE: create_workout_session_from_template
-- ============================================

CREATE OR REPLACE FUNCTION public.create_workout_session_from_template(
  p_user_id UUID,
  p_template_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_template RECORD;
  v_exercise RECORD;
  v_exercise_index INTEGER := 0;
BEGIN
  -- Get template details INCLUDING estimated_calories
  SELECT 
    wt.id,
    wt.name,
    wt.category_id,
    wt.duration_minutes,
    wt.estimated_calories,
    wc.name as workout_type
  INTO v_template
  FROM workout_templates wt
  LEFT JOIN workout_categories wc ON wt.category_id = wc.id
  WHERE wt.id = p_template_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found: %', p_template_id;
  END IF;

  -- Create workout session with template's estimated calories
  -- ✅ IMPORTANT: Use template's estimated_calories for data integrity
  -- This ensures calories are always based on MET calculation, not actual duration
  INSERT INTO public.workout_sessions (
    user_id,
    template_id,
    workout_template_id,
    workout_name,
    workout_type,
    category_id,
    status,
    started_at,
    current_exercise_index,
    total_exercises,
    completed_exercises,
    total_sets_completed,
    total_reps_completed,
    total_volume_kg,
    estimated_calories_burned,
    total_duration_seconds,
    total_pause_duration
  ) VALUES (
    p_user_id,
    p_template_id,
    p_template_id,
    v_template.name,
    COALESCE(v_template.workout_type, 'Custom'),
    v_template.category_id,
    'in_progress',
    NOW(),
    0,
    0, -- Will be updated below
    0,
    0,
    0,
    0,
    COALESCE(v_template.estimated_calories, 0), -- ✅ Use template's MET-based calorie estimate
    0,
    0
  )
  RETURNING id INTO v_session_id;

  -- Insert exercises from template
  FOR v_exercise IN
    SELECT 
      wte.exercise_id,
      wte.sets,
      wte.reps,
      wte.rest_seconds,
      wte.order_index,
      e.name as exercise_name
    FROM workout_template_exercises wte
    JOIN exercises e ON wte.exercise_id = e.id
    WHERE wte.template_id = p_template_id
    ORDER BY wte.order_index
  LOOP
    BEGIN
      INSERT INTO public.workout_session_exercises (
        session_id,
        user_id,
        exercise_name,
        exercise_index,
        target_sets,
        target_reps,
        completed_sets,
        is_completed,
        total_reps,
        total_volume_kg,
        avg_weight_kg,
        max_weight_kg
      ) VALUES (
        v_session_id,
        p_user_id,
        v_exercise.exercise_name,
        v_exercise_index,
        v_exercise.sets,
        v_exercise.reps,
        0,
        false,
        0,
        0,
        0,
        0
      );
      
      v_exercise_index := v_exercise_index + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Error inserting exercise %: % - %', v_exercise_index, v_exercise.exercise_name, SQLERRM;
    END;
  END LOOP;

  -- Update total exercises count
  UPDATE public.workout_sessions
  SET total_exercises = v_exercise_index
  WHERE id = v_session_id;

  RETURN v_session_id;
END;
$$;

-- Add comment explaining the design decision
COMMENT ON FUNCTION public.create_workout_session_from_template IS 
'Creates a workout session from a template and populates all exercises. 
Uses template estimated_calories (MET-based) for data integrity - this ensures 
calories remain accurate regardless of actual time taken to complete workout.';

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Updated create_workout_session_from_template with calorie integrity fix';
  RAISE NOTICE '📊 Calories now based on template MET calculation, not actual duration';
  RAISE NOTICE '⏱️  Actual duration still tracked for personal records';
END $$;

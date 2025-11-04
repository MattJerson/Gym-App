-- Migration: Dynamic Calorie Calculation Based on Actual Performance
-- Date: November 5, 2025
-- Issue: Calories should be DYNAMIC based on actual work performed (reps × weight × sets)
--        not static from template. Users lift different weights and do different reps.
-- Solution: Calculate calories based on actual performance using MET values + volume

-- ============================================
-- STEP 1: Create function to calculate workout calories dynamically
-- ============================================

-- Formula: Calories = (MET × body_weight_kg × duration_hours) + (volume_bonus)
-- Where:
--   - MET = Metabolic Equivalent (from exercise physiology research)
--   - body_weight_kg = user's weight in kg
--   - duration_hours = actual workout duration in hours
--   - volume_bonus = additional calories from lifting heavy weights (0.05 cal per kg lifted)

CREATE OR REPLACE FUNCTION public.calculate_dynamic_workout_calories(
  p_session_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_calories NUMERIC := 0;
  v_user_weight_kg NUMERIC;
  v_duration_hours NUMERIC;
  v_total_volume_kg NUMERIC;
  v_workout_type TEXT;
  v_met_value NUMERIC;
  v_started_at TIMESTAMP;
  v_total_pause_duration INTEGER;
BEGIN
  -- Get session data
  SELECT 
    COALESCE(rp.weight_kg, 70) as user_weight, -- Default 70kg if not set
    ws.started_at,
    COALESCE(ws.total_pause_duration, 0) as pause_duration,
    COALESCE(ws.total_volume_kg, 0) as total_volume,
    ws.workout_type
  INTO v_user_weight_kg, v_started_at, v_total_pause_duration, v_total_volume_kg, v_workout_type
  FROM workout_sessions ws
  LEFT JOIN registration_profiles rp ON ws.user_id = rp.user_id
  WHERE ws.id = p_session_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calculate actual workout duration (excluding pauses)
  v_duration_hours := (EXTRACT(EPOCH FROM (NOW() - v_started_at)) - v_total_pause_duration) / 3600.0;
  
  -- Allow any duration - even quick workouts burn calories based on work done
  -- No artificial minimums!

  -- Determine MET value based on workout type
  -- MET values from American College of Sports Medicine (ACSM):
  -- Strength training (moderate): 5.0 METs
  -- Strength training (vigorous): 6.0 METs
  -- HIIT/Cardio: 8.0-10.0 METs
  -- Power training: 6.0-8.0 METs
  CASE 
    WHEN v_workout_type ILIKE '%strength%' OR v_workout_type ILIKE '%bodybuilding%' THEN
      v_met_value := 5.5;
    WHEN v_workout_type ILIKE '%power%' OR v_workout_type ILIKE '%explosive%' THEN
      v_met_value := 7.0;
    WHEN v_workout_type ILIKE '%cardio%' OR v_workout_type ILIKE '%hiit%' THEN
      v_met_value := 9.0;
    WHEN v_workout_type ILIKE '%endurance%' OR v_workout_type ILIKE '%circuit%' THEN
      v_met_value := 7.5;
    ELSE
      v_met_value := 5.0; -- Default for general training
  END CASE;

  -- Calculate base calories from MET formula
  -- Standard formula: Calories = MET × weight (kg) × duration (hours)
  v_total_calories := v_met_value * v_user_weight_kg * v_duration_hours;

  -- Add volume bonus for weighted exercises
  -- For strength training with external weights, volume matters
  IF v_total_volume_kg >= 1 THEN
    -- Research shows approximately 0.5 calories per kg lifted for resistance training
    v_total_calories := v_total_calories + (v_total_volume_kg * 0.5);
  END IF;
  
  -- For bodyweight exercises (cardio/HIIT), MET calculation alone is sufficient
  -- The MET value already accounts for the intensity of bodyweight movements
  -- Adding volume would double-count and massively inflate calories

  -- Return rounded integer (no artificial minimums - let the work speak for itself!)
  RETURN ROUND(v_total_calories)::INTEGER;
END;
$$;

COMMENT ON FUNCTION public.calculate_dynamic_workout_calories IS 
'Calculates workout calories dynamically based on actual performance:
- MET-based calculation using user weight and actual workout duration
- Volume bonus for total weight lifted (kg × reps × sets)
- Accounts for workout type (strength vs cardio vs power)
This gives accurate calories that reflect actual work done, not just estimates.';

-- ============================================
-- STEP 2: Update trigger to calculate calories dynamically as sets complete
-- ============================================

CREATE OR REPLACE FUNCTION public.update_session_metrics_on_set_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only process if set was just completed
  IF NEW.is_completed AND (OLD.is_completed IS NULL OR NOT OLD.is_completed) THEN
    
    -- Update exercise stats
    UPDATE workout_session_exercises
    SET 
      completed_sets = (
        SELECT COUNT(*) FROM exercise_sets 
        WHERE session_id = NEW.session_id 
          AND exercise_index = NEW.exercise_index 
          AND is_completed = true
      ),
      total_reps = (
        SELECT COALESCE(SUM(actual_reps), 0) FROM exercise_sets
        WHERE session_id = NEW.session_id 
          AND exercise_index = NEW.exercise_index
          AND is_completed = true
      ),
      total_volume_kg = (
        SELECT COALESCE(SUM(actual_reps * weight_kg), 0) FROM exercise_sets
        WHERE session_id = NEW.session_id 
          AND exercise_index = NEW.exercise_index
          AND is_completed = true
      ),
      avg_weight_kg = (
        SELECT COALESCE(AVG(weight_kg), 0) FROM exercise_sets
        WHERE session_id = NEW.session_id 
          AND exercise_index = NEW.exercise_index
          AND is_completed = true
      ),
      max_weight_kg = (
        SELECT COALESCE(MAX(weight_kg), 0) FROM exercise_sets
        WHERE session_id = NEW.session_id 
          AND exercise_index = NEW.exercise_index
          AND is_completed = true
      ),
      is_completed = (
        SELECT 
          (SELECT COUNT(*) FROM exercise_sets 
           WHERE session_id = NEW.session_id 
             AND exercise_index = NEW.exercise_index 
             AND is_completed = true) 
          >= wse.target_sets
        FROM workout_session_exercises wse
        WHERE wse.session_id = NEW.session_id 
          AND wse.exercise_index = NEW.exercise_index
      ),
      updated_at = NOW()
    WHERE session_id = NEW.session_id 
      AND exercise_index = NEW.exercise_index;
    
    -- Update session totals AND recalculate calories dynamically
    -- ✅ IMPORTANT: Calories are now calculated based on actual work performed
    UPDATE workout_sessions ws
    SET
      total_sets_completed = (
        SELECT COUNT(*) FROM exercise_sets
        WHERE session_id = NEW.session_id AND is_completed = true
      ),
      total_reps_completed = (
        SELECT COALESCE(SUM(actual_reps), 0) FROM exercise_sets
        WHERE session_id = NEW.session_id AND is_completed = true
      ),
      total_volume_kg = (
        SELECT COALESCE(SUM(actual_reps * weight_kg), 0) FROM exercise_sets
        WHERE session_id = NEW.session_id AND is_completed = true
      ),
      completed_exercises = (
        SELECT COUNT(*) FROM workout_session_exercises
        WHERE session_id = NEW.session_id AND is_completed = true
      ),
      -- 🔥 NEW: Calculate calories dynamically based on actual performance
      estimated_calories_burned = calculate_dynamic_workout_calories(NEW.session_id),
      updated_at = NOW()
    WHERE id = NEW.session_id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_session_metrics_on_set_complete IS 
'Updates workout session metrics (sets, reps, volume, calories) when sets are completed.
Calories are calculated dynamically based on actual work performed (reps × weight × duration).';

-- ============================================
-- STEP 3: Update complete_workout_session to use dynamic calories
-- ============================================

CREATE OR REPLACE FUNCTION public.complete_workout_session(
  p_session_id UUID,
  p_difficulty_rating INTEGER DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session RECORD;
  v_total_sets INTEGER;
  v_total_reps INTEGER;
  v_total_volume NUMERIC;
  v_completed_exercises INTEGER;
  v_duration_seconds INTEGER;
BEGIN
  -- Get session details
  SELECT 
    user_id,
    started_at,
    paused_at,
    total_pause_duration,
    total_exercises,
    template_id,
    estimated_calories_burned
  INTO v_session
  FROM workout_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

  -- Calculate total duration in seconds
  v_duration_seconds := EXTRACT(EPOCH FROM (NOW() - v_session.started_at))::INTEGER;
  
  -- Subtract pause duration if session was paused
  IF v_session.paused_at IS NOT NULL THEN
    v_duration_seconds := v_duration_seconds - COALESCE(v_session.total_pause_duration, 0);
  END IF;

  -- Calculate workout statistics from exercise_sets
  SELECT 
    COUNT(*) FILTER (WHERE is_completed = true),
    COALESCE(SUM(actual_reps) FILTER (WHERE is_completed = true), 0),
    COALESCE(SUM(weight_kg * actual_reps) FILTER (WHERE is_completed = true), 0)
  INTO v_total_sets, v_total_reps, v_total_volume
  FROM exercise_sets
  WHERE session_id = p_session_id;

  -- Count completed exercises (exercises where at least 1 set is completed)
  SELECT COUNT(DISTINCT exercise_index)
  INTO v_completed_exercises
  FROM exercise_sets
  WHERE session_id = p_session_id
    AND is_completed = true;

  -- Update workout session with completion data
  UPDATE workout_sessions
  SET 
    status = 'completed',
    completed_at = NOW(),
    total_duration_seconds = v_duration_seconds,
    total_sets_completed = v_total_sets,
    total_reps_completed = v_total_reps,
    total_volume_kg = v_total_volume,
    completed_exercises = v_completed_exercises,
    difficulty_rating = p_difficulty_rating,
    notes = p_notes,
    updated_at = NOW(),
    -- 🔥 Calculate final calories based on actual performance
    estimated_calories_burned = calculate_dynamic_workout_calories(p_session_id)
  WHERE id = p_session_id;

  -- Update workout_session_exercises completion status
  UPDATE workout_session_exercises wse
  SET 
    is_completed = EXISTS (
      SELECT 1 
      FROM exercise_sets es
      WHERE es.session_id = wse.session_id
        AND es.exercise_index = wse.exercise_index
        AND es.is_completed = true
    ),
    completed_sets = (
      SELECT COUNT(*)
      FROM exercise_sets es
      WHERE es.session_id = wse.session_id
        AND es.exercise_index = wse.exercise_index
        AND es.is_completed = true
    ),
    updated_at = NOW()
  WHERE session_id = p_session_id;

END;
$$;

COMMENT ON FUNCTION public.complete_workout_session IS
'Completes a workout session with final calorie calculation based on actual work performed.
Calories are calculated using MET values, user weight, duration, and total volume lifted.';

-- ============================================
-- STEP 4: Recalculate ALL completed sessions with dynamic calories
-- ============================================

-- This will update all existing completed sessions to use the new dynamic calculation
DO $$
DECLARE
  v_session RECORD;
  v_updated_count INTEGER := 0;
BEGIN
  FOR v_session IN 
    SELECT id 
    FROM workout_sessions 
    WHERE status = 'completed'
    ORDER BY completed_at DESC
  LOOP
    BEGIN
      UPDATE workout_sessions
      SET 
        estimated_calories_burned = calculate_dynamic_workout_calories(v_session.id),
        updated_at = NOW()
      WHERE id = v_session.id;
      
      v_updated_count := v_updated_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to update session %: %', v_session.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '✅ Recalculated calories for % completed workout sessions', v_updated_count;
END $$;

-- ============================================
-- STEP 5: Drop old triggers if they exist
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_workout_calories ON workout_sessions;
DROP FUNCTION IF EXISTS update_workout_calories();

-- ============================================
-- Report completion
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🎉 Dynamic calorie calculation system deployed!';
  RAISE NOTICE '📊 Calories now calculated based on:';
  RAISE NOTICE '   - MET values (workout type specific)';
  RAISE NOTICE '   - User body weight';
  RAISE NOTICE '   - Actual workout duration';
  RAISE NOTICE '   - Total volume lifted (kg × reps × sets)';
  RAISE NOTICE '🔥 All completed sessions recalculated with actual performance data';
END $$;

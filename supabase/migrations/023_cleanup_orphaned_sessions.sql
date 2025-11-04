-- Migration: Cleanup Orphaned Workout Sessions
-- Date: November 5, 2025
-- Purpose: Fix stuck "in_progress" sessions that were never completed or abandoned

-- ============================================
-- 1. IDENTIFY AND FIX ORPHANED SESSIONS
-- ============================================

-- Mark sessions older than 24 hours that are still "in_progress" or "paused" as abandoned
-- These are likely sessions where the app crashed or user never properly completed/quit

UPDATE workout_sessions
SET 
  status = 'abandoned',
  updated_at = NOW()
WHERE 
  status IN ('in_progress', 'paused')
  AND started_at < NOW() - INTERVAL '24 hours'
  AND completed_at IS NULL;

-- Log how many were cleaned up
DO $$
DECLARE
  v_cleaned_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
  RAISE NOTICE '🧹 Cleaned up % orphaned workout sessions', v_cleaned_count;
END $$;

-- ============================================
-- 2. CREATE FUNCTION TO AUTO-CLEANUP OLD SESSIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.cleanup_orphaned_workout_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cleaned_count INTEGER;
BEGIN
  -- Abandon sessions that are still in_progress/paused after 24 hours
  UPDATE workout_sessions
  SET 
    status = 'abandoned',
    updated_at = NOW()
  WHERE 
    status IN ('in_progress', 'paused')
    AND started_at < NOW() - INTERVAL '24 hours'
    AND completed_at IS NULL;
  
  GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
  
  RETURN v_cleaned_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_workout_sessions TO authenticated;

COMMENT ON FUNCTION public.cleanup_orphaned_workout_sessions IS 
'Automatically abandons workout sessions that have been in_progress or paused for more than 24 hours. 
Returns the number of sessions cleaned up.';

-- ============================================
-- 3. FIX NULL TEMPLATE_IDs (if any exist)
-- ============================================

-- Sessions should always have a template_id - fix any that don't
UPDATE workout_sessions
SET template_id = workout_template_id
WHERE template_id IS NULL 
  AND workout_template_id IS NOT NULL;

-- ============================================
-- 4. VERIFICATION
-- ============================================

DO $$
DECLARE
  v_active_sessions INTEGER;
  v_old_sessions INTEGER;
BEGIN
  -- Count remaining active sessions
  SELECT COUNT(*) INTO v_active_sessions
  FROM workout_sessions
  WHERE status IN ('in_progress', 'paused');
  
  -- Count sessions older than 24 hours that are still active (should be 0 now)
  SELECT COUNT(*) INTO v_old_sessions
  FROM workout_sessions
  WHERE status IN ('in_progress', 'paused')
    AND started_at < NOW() - INTERVAL '24 hours';
  
  RAISE NOTICE '✅ Migration complete:';
  RAISE NOTICE '   - Active sessions: %', v_active_sessions;
  RAISE NOTICE '   - Old stuck sessions (should be 0): %', v_old_sessions;
  RAISE NOTICE '   - cleanup_orphaned_workout_sessions() function created';
END $$;

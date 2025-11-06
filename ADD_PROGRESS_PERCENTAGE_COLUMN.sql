-- Add progress_percentage column to workout_sessions table
-- This column stores the real-time progress percentage (0-100) of a workout session
-- Updated automatically whenever a set is completed or undone

-- Add the column (default to 0 for existing records)
ALTER TABLE workout_sessions 
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

-- Add a check constraint to ensure progress_percentage is between 0 and 100
ALTER TABLE workout_sessions 
ADD CONSTRAINT progress_percentage_range 
CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

-- Update existing in-progress/paused sessions to calculate their current progress
UPDATE workout_sessions
SET progress_percentage = CASE 
    WHEN total_exercises > 0 THEN ROUND((completed_exercises::NUMERIC / total_exercises::NUMERIC) * 100)
    ELSE 0
END
WHERE status IN ('in_progress', 'paused') AND progress_percentage = 0;

-- Add comment to document the column
COMMENT ON COLUMN workout_sessions.progress_percentage IS 'Real-time progress percentage (0-100) calculated as (completed_exercises / total_exercises) * 100';

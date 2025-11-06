-- RUN THIS IN SUPABASE SQL EDITOR
-- Add progress_percentage column to workout_sessions table

-- Add the column if it doesn't exist
ALTER TABLE workout_sessions 
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

-- Drop constraint if it exists and recreate (to ensure it's correct)
ALTER TABLE workout_sessions 
DROP CONSTRAINT IF EXISTS progress_percentage_range;

ALTER TABLE workout_sessions 
ADD CONSTRAINT progress_percentage_range 
CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

-- Update existing in-progress/paused sessions
UPDATE workout_sessions
SET progress_percentage = CASE 
    WHEN total_exercises > 0 THEN ROUND((completed_exercises::NUMERIC / total_exercises::NUMERIC) * 100)
    ELSE 0
END
WHERE status IN ('in_progress', 'paused');

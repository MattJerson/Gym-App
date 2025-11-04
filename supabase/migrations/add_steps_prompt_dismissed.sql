-- Add column to track if user has dismissed the steps tracking prompt
ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS steps_prompt_dismissed BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN user_stats.steps_prompt_dismissed IS 'Tracks whether user has dismissed the step tracking permission prompt. If true, the full modal will not show again, but an enable button will be available in the steps graph.';

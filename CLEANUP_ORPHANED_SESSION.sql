-- Quick fix: Clean up the specific orphaned session
-- Run this in Supabase SQL Editor NOW to fix the immediate issue

-- This is the specific session causing the problem (original)
UPDATE workout_sessions
SET status = 'abandoned', updated_at = NOW()
WHERE id = '689f1209-6801-4aed-b7c3-9d3420fc6e49';

-- Also abandon the newest session if it's orphaned
UPDATE workout_sessions
SET status = 'abandoned', updated_at = NOW()
WHERE id = '1473348c-7caa-4a1c-a11d-e3034fcce09e';

-- Also clean up any other orphaned sessions (older than 24 hours)
UPDATE workout_sessions
SET status = 'abandoned', updated_at = NOW()
WHERE status IN ('in_progress', 'paused')
  AND started_at < NOW() - INTERVAL '24 hours'
  AND completed_at IS NULL;

-- Show the results
SELECT 
  id,
  workout_name,
  status,
  started_at,
  template_id,
  workout_template_id
FROM workout_sessions
WHERE user_id = '630b464a-eef3-4b5d-a91f-74c82e75fa21'
ORDER BY started_at DESC
LIMIT 10;

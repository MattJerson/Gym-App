-- =============================================
-- QUICK FIX: Add missing total_steps column
-- Run this IMMEDIATELY in Supabase SQL Editor
-- =============================================

-- Add total_steps column if it doesn't exist
ALTER TABLE public.user_stats 
  ADD COLUMN IF NOT EXISTS total_steps integer DEFAULT 0;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_stats'
  AND column_name = 'total_steps';

-- You should see:
-- column_name  | data_type | column_default
-- -------------|-----------|---------------
-- total_steps  | integer   | 0

SELECT '✅ total_steps column added successfully!' as status;

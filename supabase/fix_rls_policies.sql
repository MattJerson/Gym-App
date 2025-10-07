-- =============================================
-- FIX: Add missing INSERT/UPDATE policies for user_stats
-- Run this in Supabase SQL Editor Dashboard
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;

-- Add INSERT policy for user_stats
CREATE POLICY "Users can insert their own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy for user_stats
CREATE POLICY "Users can update their own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Add INSERT policy for user_badges
CREATE POLICY "Users can insert their own badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('user_stats', 'user_badges', 'challenge_progress')
ORDER BY tablename, policyname;

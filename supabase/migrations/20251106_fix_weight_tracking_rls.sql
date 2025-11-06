-- =====================================================
-- FIX: Enable RLS and Add Policies for Weight Tracking
-- =====================================================
-- This fixes the issue where the app can't read weight_tracking data
-- because Row Level Security policies are missing
-- =====================================================

-- Enable RLS on weight_tracking table
ALTER TABLE public.weight_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own weight entries
DROP POLICY IF EXISTS "Users can view own weight entries" ON public.weight_tracking;
CREATE POLICY "Users can view own weight entries"
  ON public.weight_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own weight entries
DROP POLICY IF EXISTS "Users can insert own weight entries" ON public.weight_tracking;
CREATE POLICY "Users can insert own weight entries"
  ON public.weight_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own weight entries
DROP POLICY IF EXISTS "Users can update own weight entries" ON public.weight_tracking;
CREATE POLICY "Users can update own weight entries"
  ON public.weight_tracking
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own weight entries
DROP POLICY IF EXISTS "Users can delete own weight entries" ON public.weight_tracking;
CREATE POLICY "Users can delete own weight entries"
  ON public.weight_tracking
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_tracking TO authenticated;

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'weight_tracking'
ORDER BY policyname;

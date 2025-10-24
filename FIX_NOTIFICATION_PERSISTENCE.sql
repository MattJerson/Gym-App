-- Fix notification persistence issue
-- This ensures dismissed/read notifications don't reappear after logout

-- 1. Ensure notification_dismissals table exists
CREATE TABLE IF NOT EXISTS public.notification_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL,
  notification_source TEXT NOT NULL CHECK (notification_source IN ('manual', 'automated')),
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one dismissal per user per notification
  UNIQUE(user_id, notification_id, notification_source)
);

-- 2. Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_notification_dismissals_user_id 
  ON public.notification_dismissals(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_dismissals_notification 
  ON public.notification_dismissals(notification_id, notification_source);

-- 3. Enable RLS
ALTER TABLE public.notification_dismissals ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own dismissals" ON public.notification_dismissals;
DROP POLICY IF EXISTS "Users can insert own dismissals" ON public.notification_dismissals;
DROP POLICY IF EXISTS "Users can delete own dismissals" ON public.notification_dismissals;

-- 5. Create RLS policies
CREATE POLICY "Users can view own dismissals" 
  ON public.notification_dismissals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dismissals" 
  ON public.notification_dismissals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dismissals" 
  ON public.notification_dismissals FOR DELETE 
  USING (auth.uid() = user_id);

-- 6. Add helpful comments
COMMENT ON TABLE public.notification_dismissals IS 'Tracks which notifications users have dismissed/cleared to prevent them from reappearing after logout';
COMMENT ON COLUMN public.notification_dismissals.notification_source IS 'Source of notification: manual (broadcast) or automated (personalized)';

-- 7. Verify notification_reads table has correct RLS policies
-- Drop and recreate if needed
DROP POLICY IF EXISTS "Users can upsert own read status" ON public.notification_reads;

CREATE POLICY "Users can upsert own read status" ON public.notification_reads
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. Create helper function to mark ALL manual notifications as read for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Insert read records for all sent notifications that user hasn't read yet
  WITH sent_notifications AS (
    SELECT id FROM public.notifications WHERE status = 'sent'
  ),
  new_reads AS (
    INSERT INTO public.notification_reads (user_id, notification_id, is_read, read_at)
    SELECT 
      p_user_id,
      sn.id,
      true,
      NOW()
    FROM sent_notifications sn
    WHERE NOT EXISTS (
      SELECT 1 FROM public.notification_reads nr
      WHERE nr.user_id = p_user_id AND nr.notification_id = sn.id
    )
    ON CONFLICT (user_id, notification_id) 
    DO UPDATE SET 
      is_read = true,
      read_at = NOW()
    RETURNING 1
  )
  SELECT COUNT(*) INTO affected_count FROM new_reads;
  
  RETURN affected_count;
END;
$$;

-- 9. Create helper function to dismiss ALL notifications for a user
CREATE OR REPLACE FUNCTION public.dismiss_all_notifications(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  manual_count INTEGER;
  automated_count INTEGER;
  result JSON;
BEGIN
  -- Dismiss all manual notifications (broadcasts)
  WITH manual_dismissals AS (
    INSERT INTO public.notification_dismissals (user_id, notification_id, notification_source, dismissed_at)
    SELECT 
      p_user_id,
      n.id,
      'manual',
      NOW()
    FROM public.notifications n
    WHERE n.status = 'sent'
    AND NOT EXISTS (
      SELECT 1 FROM public.notification_dismissals nd
      WHERE nd.user_id = p_user_id 
      AND nd.notification_id = n.id 
      AND nd.notification_source = 'manual'
    )
    ON CONFLICT (user_id, notification_id, notification_source) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO manual_count FROM manual_dismissals;
  
  -- Also mark them as read
  INSERT INTO public.notification_reads (user_id, notification_id, is_read, read_at)
  SELECT 
    p_user_id,
    n.id,
    true,
    NOW()
  FROM public.notifications n
  WHERE n.status = 'sent'
  ON CONFLICT (user_id, notification_id) 
  DO UPDATE SET 
    is_read = true,
    read_at = NOW();
  
  -- For automated notifications: DELETE them from notification_logs
  -- (they're user-specific, so safe to delete)
  WITH deleted_automated AS (
    DELETE FROM public.notification_logs
    WHERE user_id = p_user_id
    RETURNING id
  )
  SELECT COUNT(*) INTO automated_count FROM deleted_automated;
  
  -- Also clean up any dismissal records for automated (no longer needed)
  DELETE FROM public.notification_dismissals
  WHERE user_id = p_user_id
  AND notification_source = 'automated';
  
  -- Return counts as JSON
  result := json_build_object(
    'manual_dismissed', manual_count,
    'automated_deleted', automated_count,
    'total_cleared', manual_count + automated_count
  );
  
  RETURN result;
END;
$$;

-- 10. Grant execute permissions (users can only run these for themselves via RLS in the app)
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dismiss_all_notifications(UUID) TO authenticated;

-- 11. Add comments
COMMENT ON FUNCTION public.mark_all_notifications_read IS 'Marks all manual broadcast notifications as read for a specific user';
COMMENT ON FUNCTION public.dismiss_all_notifications IS 'Dismisses all notifications (manual + automated) for a specific user, returns counts';

-- 12. Test query to verify setup works
-- Run this after executing the script:
-- SELECT 
--   nd.notification_id,
--   nd.notification_source,
--   nd.dismissed_at
-- FROM public.notification_dismissals nd
-- WHERE nd.user_id = auth.uid()
-- ORDER BY nd.dismissed_at DESC;

-- Test the helper functions:
-- SELECT public.mark_all_notifications_read(auth.uid());
-- SELECT public.dismiss_all_notifications(auth.uid());


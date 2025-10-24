-- Quick cleanup and update script
-- Run this AFTER running FIX_NOTIFICATION_PERSISTENCE.sql

-- 1. Clean up existing automated notification dismissals
-- (No longer needed since we're deleting automated notifications instead)
DELETE FROM public.notification_dismissals
WHERE notification_source = 'automated';

-- 2. For testing: Check your current notification counts
SELECT 
  'Manual Notifications' as type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'sent') as sent
FROM public.notifications
UNION ALL
SELECT 
  'Automated Notifications' as type,
  COUNT(*) as total,
  COUNT(*) as sent
FROM public.notification_logs
WHERE user_id = auth.uid();

-- 3. Check your dismissed records
SELECT 
  notification_source,
  COUNT(*) as count
FROM public.notification_dismissals
WHERE user_id = auth.uid()
GROUP BY notification_source;

-- 4. Test the updated dismiss_all function
-- Uncomment to run:
-- SELECT public.dismiss_all_notifications(auth.uid());

-- 5. Check results after running dismiss_all
-- SELECT 
--   'After Clear All' as status,
--   (SELECT COUNT(*) FROM public.notification_logs WHERE user_id = auth.uid()) as automated_remaining,
--   (SELECT COUNT(*) FROM public.notification_dismissals WHERE user_id = auth.uid() AND notification_source = 'manual') as manual_dismissed;

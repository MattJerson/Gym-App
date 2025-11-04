-- ================================================
-- CLEAN UP USER NOTIFICATIONS
-- ================================================
-- This script cleans up notification_logs for users
-- removing notifications that were sent before they registered
-- or were sent incorrectly due to the old system
-- ================================================

-- Show current notification count per user
SELECT 
  rp.user_id,
  COUNT(nl.id) as notification_count,
  MIN(nl.sent_at) as earliest_notification,
  rp.created_at as user_registered_at,
  CASE 
    WHEN MIN(nl.sent_at) < rp.created_at THEN 'HAS INVALID NOTIFICATIONS'
    ELSE 'OK'
  END as status
FROM public.registration_profiles rp
LEFT JOIN public.notification_logs nl ON nl.user_id = rp.user_id
GROUP BY rp.user_id, rp.created_at
ORDER BY notification_count DESC;

-- Delete notifications sent before user registration
DELETE FROM public.notification_logs nl
USING public.registration_profiles rp
WHERE nl.user_id = rp.user_id
  AND nl.sent_at < rp.created_at;

-- Show how many notifications were deleted
SELECT 
  'Deleted notifications sent before user registration' as action,
  COUNT(*) as deleted_count
FROM (
  SELECT nl.id 
  FROM public.notification_logs nl
  JOIN public.registration_profiles rp ON nl.user_id = rp.user_id
  WHERE nl.sent_at < rp.created_at
) as invalid_notifications;

-- For users registered in the last 7 days, delete ALL automated notifications
-- (they shouldn't have received them yet with proper scheduling)
DELETE FROM public.notification_logs nl
WHERE nl.user_id IN (
  SELECT user_id 
  FROM public.registration_profiles 
  WHERE created_at > NOW() - INTERVAL '7 days'
);

-- Show final notification counts
SELECT 
  rp.user_id,
  COUNT(nl.id) as remaining_notifications,
  rp.created_at as user_registered_at
FROM public.registration_profiles rp
LEFT JOIN public.notification_logs nl ON nl.user_id = rp.user_id
GROUP BY rp.user_id, rp.created_at
ORDER BY rp.created_at DESC
LIMIT 10;

-- Reset all notification cooldowns for fresh start
TRUNCATE TABLE public.user_notification_cooldowns;

-- Summary
SELECT 
  'Cleanup complete' as status,
  (SELECT COUNT(*) FROM public.notification_logs) as total_notifications_remaining,
  (SELECT COUNT(DISTINCT user_id) FROM public.notification_logs) as users_with_notifications,
  (SELECT COUNT(*) FROM public.user_notification_cooldowns) as cooldown_records;


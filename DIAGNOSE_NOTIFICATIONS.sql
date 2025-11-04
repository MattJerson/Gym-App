-- ================================================
-- DIAGNOSE NOTIFICATION ISSUES
-- ================================================
-- This script helps diagnose what notifications exist
-- and whether they should be cleaned up
-- ================================================

-- 1. Show total notification counts
SELECT 
  'Total Overview' as report_section,
  COUNT(*) as total_notifications,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(sent_at) as earliest_notification,
  MAX(sent_at) as latest_notification
FROM public.notification_logs;

-- 2. Show when users registered vs their notifications
SELECT 
  rp.user_id,
  rp.created_at as registered_at,
  COUNT(nl.id) as notification_count,
  MIN(nl.sent_at) as earliest_notification,
  MAX(nl.sent_at) as latest_notification,
  COUNT(CASE WHEN nl.sent_at < rp.created_at THEN 1 END) as invalid_before_registration,
  COUNT(CASE WHEN nl.sent_at >= rp.created_at THEN 1 END) as valid_after_registration,
  EXTRACT(DAY FROM NOW() - rp.created_at) as days_since_registration
FROM public.registration_profiles rp
LEFT JOIN public.notification_logs nl ON nl.user_id = rp.user_id
GROUP BY rp.user_id, rp.created_at
ORDER BY notification_count DESC;

-- 3. Show notification distribution by trigger type
SELECT 
  nt.trigger_type,
  nt.title,
  nt.frequency_type,
  COUNT(nl.id) as notification_count,
  COUNT(DISTINCT nl.user_id) as unique_users
FROM public.notification_logs nl
JOIN public.notification_triggers nt ON nl.trigger_id = nt.id
GROUP BY nt.trigger_type, nt.title, nt.frequency_type
ORDER BY notification_count DESC;

-- 4. Show recent notifications (last 24 hours)
SELECT 
  nl.sent_at,
  nl.title,
  nl.user_id,
  rp.created_at as user_registered_at,
  nl.sent_at - rp.created_at as time_since_registration
FROM public.notification_logs nl
JOIN public.registration_profiles rp ON nl.user_id = rp.user_id
WHERE nl.sent_at > NOW() - INTERVAL '24 hours'
ORDER BY nl.sent_at DESC
LIMIT 20;

-- 5. Check if created_at is properly populated
SELECT 
  COUNT(*) as total_users,
  COUNT(created_at) as users_with_created_at,
  COUNT(*) - COUNT(created_at) as users_without_created_at
FROM public.registration_profiles;

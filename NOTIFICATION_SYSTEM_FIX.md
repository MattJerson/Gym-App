# Notification System Fix

## Problems Identified

### 1. **New users getting old notifications**
- Users registering on Nov 4, 2025 were seeing notifications from Oct 23, 2025
- The system was sending notifications to ALL users in `registration_profiles` regardless of when they registered
- New users were getting backfilled with historical notifications

### 2. **All notifications firing at once**
- Monday Motivation, Friday Challenge, Weekly Report, Daily Hydration, etc. all sending simultaneously
- No day-of-week or time-of-day scheduling
- Every notification trigger was checked and sent on every cron run

## Solutions Implemented

### Database Changes (Migration: `999_fix_notification_system.sql`)

1. **Added user registration tracking**
   - Added `created_at` column to `registration_profiles`
   - Prevents sending notifications to users before they registered

2. **Added scheduling constraints to triggers**
   - `day_of_week` (0-6, Sunday=0, Saturday=6)
   - `hour_of_day` (0-23)
   - `requires_condition` (boolean for condition-based triggers)

3. **Updated all notification triggers with proper schedules:**
   ```sql
   Monday Motivation     → Mondays at 7AM (weekly)
   Friday Challenge      → Fridays at 6PM (weekly)
   Sunday Planning       → Sundays at 7PM (weekly)
   Wednesday Wellness    → Wednesdays at 12PM (weekly)
   Weekly Progress Report → Sundays at 8PM (weekly)
   Daily Hydration       → Every day at 10AM (daily)
   No Workout Logged     → Check at 6PM daily (condition-based)
   No Meal Logged        → Check at 7PM daily (condition-based)
   Inactivity Reminders  → Check at 9AM daily (condition-based)
   ```

4. **Created validation function**
   - `should_send_notification_to_new_user(user_id, trigger_id)`
   - Checks user registration date (must be >24 hours old)
   - Validates day-of-week and hour-of-day constraints
   - Respects cooldown periods

### Edge Function Updates (`auto-notify/index.ts`)

1. **Pre-filter triggers by current time**
   - Before processing, filter out triggers not scheduled for current day/hour
   - Reduces unnecessary database queries
   - Example: On Tuesday, don't even check Monday Motivation trigger

2. **Enhanced user eligibility checks**
   - New users (<24 hours) don't receive ANY notifications
   - Weekly reports only sent to users registered >7 days (need full week of data)
   - Day-specific notifications only to users registered >24 hours

3. **Added time validation in shouldSendToUser()**
   - Checks user registration age
   - Validates day-of-week matches trigger requirement
   - Validates hour-of-day within ±1 hour tolerance
   - Then checks cooldown

### Cleanup Script (`CLEAN_USER_NOTIFICATIONS.sql`)

Run this to clean up existing bad data:

```sql
-- 1. Shows current state
-- 2. Deletes notifications sent before user registration
-- 3. Deletes all notifications for users registered in last 7 days
-- 4. Resets cooldown table for fresh start
-- 5. Shows final state
```

## How It Works Now

### For New Users (Registration)
1. User creates account
2. `created_at` timestamp saved in `registration_profiles`
3. **No notifications sent for first 24 hours**
4. After 24 hours, user becomes eligible for scheduled notifications

### For Existing Users
1. Cron job runs (e.g., every hour)
2. Current day and hour checked
3. Only applicable triggers processed (e.g., on Monday at 7AM, only Monday Motivation)
4. For each trigger:
   - Get target users (based on trigger type)
   - Filter out new users (<24 hours old)
   - Filter out users outside cooldown period
   - Send notifications to eligible users

### Notification Schedule Example

**Monday 7:00 AM:**
- ✅ Monday Motivation (weekly, sent to all users >24h old)

**Tuesday 10:00 AM:**
- ✅ Daily Hydration (daily, sent to all users >24h old)

**Tuesday 6:00 PM:**
- ✅ No Workout Logged (condition: if user hasn't logged workout today)

**Wednesday 12:00 PM:**
- ✅ Wednesday Wellness (weekly)
- ✅ Daily Hydration

**Friday 6:00 PM:**
- ✅ Friday Challenge (weekly)
- ✅ No Workout Logged (condition-based)
- ✅ Daily Hydration (at 10AM earlier)

**Sunday 7:00 PM:**
- ✅ Sunday Planning (weekly)

**Sunday 8:00 PM:**
- ✅ Weekly Progress Report (only users >7 days old)

## Testing Steps

1. **Apply the migration:**
   ```bash
   # Run in Supabase SQL Editor
   -- Execute: 999_fix_notification_system.sql
   ```

2. **Clean up existing bad data:**
   ```bash
   # Run in Supabase SQL Editor
   -- Execute: CLEAN_USER_NOTIFICATIONS.sql
   ```

3. **Deploy updated Edge Function:**
   ```bash
   cd supabase/functions/auto-notify
   supabase functions deploy auto-notify
   ```

4. **Test with a new user:**
   - Create new account
   - Check `notification_logs` table
   - Should see 0 notifications for first 24 hours

5. **Test scheduling:**
   - Manually invoke Edge Function: `POST https://[project-ref].supabase.co/functions/v1/auto-notify`
   - Check logs to see which triggers were filtered by time
   - Verify only appropriate notifications sent

6. **Verify cron schedule:**
   ```sql
   -- In Supabase dashboard, check cron jobs
   -- Should run hourly: 0 * * * *
   ```

## Configuration

### Adjust Notification Times

Edit `notification_triggers` table:

```sql
-- Change Monday Motivation to 8AM instead of 7AM
UPDATE notification_triggers
SET hour_of_day = 8
WHERE trigger_type = 'monday_morning';

-- Change Daily Hydration to 2PM instead of 10AM
UPDATE notification_triggers
SET hour_of_day = 14
WHERE trigger_type = 'daily_hydration';
```

### Disable a Notification

```sql
-- Disable Friday Challenge
UPDATE notification_triggers
SET is_active = FALSE
WHERE trigger_type = 'friday_challenge';
```

### Add New Scheduled Notification

```sql
INSERT INTO notification_triggers (
  trigger_type,
  title,
  message,
  type,
  frequency_type,
  frequency_value,
  frequency_unit,
  day_of_week,
  hour_of_day,
  is_active
) VALUES (
  'saturday_workout_prep',
  'Weekend Warrior! 💪',
  'Get ready for an amazing weekend workout!',
  'info',
  'weekly',
  1,
  'weeks',
  6,  -- Saturday
  9,  -- 9 AM
  TRUE
);
```

## Monitoring

### Check notification logs:
```sql
-- See recent notifications sent
SELECT 
  nl.sent_at,
  nl.title,
  rp.created_at as user_registered_at,
  nl.sent_at - rp.created_at as time_since_registration
FROM notification_logs nl
JOIN registration_profiles rp ON nl.user_id = rp.user_id
ORDER BY nl.sent_at DESC
LIMIT 20;
```

### Check cooldowns:
```sql
-- See active cooldowns
SELECT 
  unc.*,
  nt.trigger_type,
  nt.frequency_type
FROM user_notification_cooldowns unc
JOIN notification_triggers nt ON unc.trigger_id = nt.id
WHERE unc.can_send_again_at > NOW()
ORDER BY unc.can_send_again_at DESC
LIMIT 20;
```

## Summary

✅ **Problem 1 Fixed:** New users won't see notifications from before they registered
✅ **Problem 2 Fixed:** Notifications only fire on their scheduled days/times
✅ **Clean Start:** Run cleanup script to remove invalid historical notifications
✅ **Proper Scheduling:** Each notification has specific day/time constraints
✅ **Cooldown Respected:** Users won't get spammed with repeated notifications

The notification system now works like a proper scheduled notification system with proper timing, user eligibility checks, and cooldown management! 🎉

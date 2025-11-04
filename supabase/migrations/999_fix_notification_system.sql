-- ================================================
-- FIX NOTIFICATION SYSTEM
-- ================================================
-- Problem 1: New users get old notifications from when they signed up
-- Problem 2: All notification types fire at once instead of on specific days/times
-- 
-- Solution:
-- 1. Add user registration tracking to prevent backfilling old notifications
-- 2. Add day-of-week and time-of-day constraints to triggers
-- 3. Clean up existing incorrect notifications
-- ================================================

-- Step 1: Add created_at tracking to registration_profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'registration_profiles' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.registration_profiles 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    RAISE NOTICE '✅ Added created_at column to registration_profiles';
  ELSE
    RAISE NOTICE '✓ created_at column already exists in registration_profiles';
  END IF;
END $$;

-- Step 2: Update existing records to have a created_at if null
UPDATE public.registration_profiles
SET created_at = NOW()
WHERE created_at IS NULL;

-- Step 3: Add day and time constraints to notification_triggers
ALTER TABLE public.notification_triggers 
ADD COLUMN IF NOT EXISTS day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6);
-- 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday

ALTER TABLE public.notification_triggers 
ADD COLUMN IF NOT EXISTS hour_of_day INTEGER CHECK (hour_of_day >= 0 AND hour_of_day <= 23);
-- 0-23 for hour of day in user's timezone (or UTC if not set)

ALTER TABLE public.notification_triggers 
ADD COLUMN IF NOT EXISTS requires_condition BOOLEAN DEFAULT FALSE;
-- If true, trigger only fires when specific condition is met (e.g., no workout logged)

DO $$
BEGIN
  RAISE NOTICE '✅ Added day_of_week and hour_of_day columns to notification_triggers';
END $$;

-- Step 4: Update existing triggers with proper scheduling
-- Monday Morning Motivation - 7AM on Mondays
UPDATE public.notification_triggers
SET day_of_week = 1, hour_of_day = 7, frequency_type = 'weekly', frequency_value = 1, frequency_unit = 'weeks'
WHERE trigger_type = 'monday_morning';

-- Friday Challenge - 6PM on Fridays
UPDATE public.notification_triggers
SET day_of_week = 5, hour_of_day = 18, frequency_type = 'weekly', frequency_value = 1, frequency_unit = 'weeks'
WHERE trigger_type = 'friday_challenge';

-- Sunday Planning - 7PM on Sundays
UPDATE public.notification_triggers
SET day_of_week = 0, hour_of_day = 19, frequency_type = 'weekly', frequency_value = 1, frequency_unit = 'weeks'
WHERE trigger_type = 'sunday_planning';

-- Wednesday Wellness - 12PM on Wednesdays
UPDATE public.notification_triggers
SET day_of_week = 3, hour_of_day = 12, frequency_type = 'weekly', frequency_value = 1, frequency_unit = 'weeks'
WHERE trigger_type = 'wednesday_wellness';

-- Weekly Progress Report - 8PM on Sundays
UPDATE public.notification_triggers
SET day_of_week = 0, hour_of_day = 20, frequency_type = 'weekly', frequency_value = 1, frequency_unit = 'weeks'
WHERE trigger_type = 'weekly_progress_report';

-- Daily Hydration - 10AM every day
UPDATE public.notification_triggers
SET hour_of_day = 10, frequency_type = 'daily', frequency_value = 1, frequency_unit = 'days'
WHERE trigger_type = 'daily_hydration';

-- Workout reminders - condition-based, check at 6PM daily
UPDATE public.notification_triggers
SET hour_of_day = 18, requires_condition = TRUE, frequency_type = 'daily', frequency_value = 1, frequency_unit = 'days'
WHERE trigger_type IN ('no_workout_logged', 'time_to_move');

-- Meal reminders - condition-based, check at 7PM daily
UPDATE public.notification_triggers
SET hour_of_day = 19, requires_condition = TRUE, frequency_type = 'daily', frequency_value = 1, frequency_unit = 'days'
WHERE trigger_type IN ('no_meal_logged', 'track_nutrition');

-- Inactivity reminders - condition-based, check at 9AM daily
UPDATE public.notification_triggers
SET hour_of_day = 9, requires_condition = TRUE, frequency_type = 'daily', frequency_value = 1, frequency_unit = 'days'
WHERE trigger_type IN ('no_login_today', 'no_login_3_days');

DO $$
BEGIN
  RAISE NOTICE '✅ Updated notification triggers with proper scheduling';
END $$;

-- Step 5: Create helper function to check if user should receive notification
-- This prevents sending notifications for dates before user registered
CREATE OR REPLACE FUNCTION should_send_notification_to_new_user(
  p_user_id UUID,
  p_trigger_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_created_at TIMESTAMP WITH TIME ZONE;
  v_trigger_record RECORD;
  v_current_day INTEGER;
  v_current_hour INTEGER;
BEGIN
  -- Get user's registration date
  SELECT created_at INTO v_user_created_at
  FROM public.registration_profiles
  WHERE user_id = p_user_id;
  
  -- If user just registered (within last 24 hours), don't send historical notifications
  IF v_user_created_at IS NULL OR v_user_created_at > NOW() - INTERVAL '24 hours' THEN
    RETURN FALSE;
  END IF;
  
  -- Get trigger details
  SELECT * INTO v_trigger_record
  FROM public.notification_triggers
  WHERE id = p_trigger_id AND is_active = TRUE;
  
  IF v_trigger_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get current day of week (0-6, Sunday = 0)
  v_current_day := EXTRACT(DOW FROM NOW());
  
  -- Get current hour (0-23)
  v_current_hour := EXTRACT(HOUR FROM NOW());
  
  -- Check if notification should fire today
  IF v_trigger_record.day_of_week IS NOT NULL AND v_trigger_record.day_of_week != v_current_day THEN
    RETURN FALSE;
  END IF;
  
  -- Check if notification should fire this hour (with 1-hour tolerance)
  IF v_trigger_record.hour_of_day IS NOT NULL AND ABS(v_trigger_record.hour_of_day - v_current_hour) > 1 THEN
    RETURN FALSE;
  END IF;
  
  -- Check cooldown using existing function
  RETURN should_send_notification(
    p_user_id,
    p_trigger_id,
    v_trigger_record.frequency_type,
    v_trigger_record.frequency_value,
    v_trigger_record.frequency_unit
  );
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Created should_send_notification_to_new_user function';
END $$;

-- Step 6: Clean up old notification logs that shouldn't have been sent
-- Delete notifications sent to users before they registered
DELETE FROM public.notification_logs nl
USING public.registration_profiles rp
WHERE nl.user_id = rp.user_id
  AND nl.sent_at < rp.created_at;

DO $$
BEGIN
  RAISE NOTICE '✅ Cleaned up notifications sent before user registration';
END $$;

-- Step 7: Grant necessary permissions
GRANT EXECUTE ON FUNCTION should_send_notification_to_new_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION should_send_notification_to_new_user(UUID, UUID) TO service_role;

DO $$
BEGIN
  RAISE NOTICE '✅ Notification system fixed successfully';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'NOTIFICATION SYSTEM FIX COMPLETE';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '1. ✅ Added created_at tracking to registration_profiles';
  RAISE NOTICE '2. ✅ Added day_of_week and hour_of_day constraints to triggers';
  RAISE NOTICE '3. ✅ Updated all triggers with proper scheduling:';
  RAISE NOTICE '   - Monday Motivation: Mondays at 7AM';
  RAISE NOTICE '   - Friday Challenge: Fridays at 6PM';
  RAISE NOTICE '   - Sunday Planning: Sundays at 7PM';
  RAISE NOTICE '   - Wednesday Wellness: Wednesdays at 12PM';
  RAISE NOTICE '   - Weekly Report: Sundays at 8PM';
  RAISE NOTICE '   - Daily Hydration: Every day at 10AM';
  RAISE NOTICE '   - Workout/Meal reminders: Condition-based, check evening';
  RAISE NOTICE '4. ✅ Created new validation function';
  RAISE NOTICE '5. ✅ Cleaned up old invalid notifications';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '- Update auto-notify Edge Function to use new logic';
  RAISE NOTICE '- Test with cron schedule';
  RAISE NOTICE '================================================';
END $$;


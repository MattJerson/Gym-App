-- Add tracking for weekly notification types to prevent spam
-- This ensures "we miss you" type notifications only send once per week

-- Create table to track when weekly notifications were last sent
CREATE TABLE IF NOT EXISTS public.weekly_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL, -- 'no_login', 'no_workout', 'no_meal'
  week_start_date date NOT NULL, -- Monday of the week
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT weekly_notification_log_unique UNIQUE (user_id, notification_type, week_start_date)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_weekly_notification_user_type 
  ON public.weekly_notification_log(user_id, notification_type);

CREATE INDEX IF NOT EXISTS idx_weekly_notification_week 
  ON public.weekly_notification_log(week_start_date);

-- Enable RLS
ALTER TABLE public.weekly_notification_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own logs
CREATE POLICY "Users can view own weekly notification logs"
  ON public.weekly_notification_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Function to get the Monday of a given date (start of week)
CREATE OR REPLACE FUNCTION get_week_start(check_date timestamp with time zone DEFAULT now())
RETURNS date
LANGUAGE plpgsql
AS $$
BEGIN
  -- Get Monday of the week for the given date
  RETURN (check_date::date - EXTRACT(DOW FROM check_date)::int + 1)::date;
END;
$$;

-- Function to check if a notification type was already sent this week
CREATE OR REPLACE FUNCTION was_sent_this_week(
  p_user_id uuid,
  p_notification_type text
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_week_start date;
  v_count int;
BEGIN
  -- Get the Monday of this week
  v_week_start := get_week_start(now());
  
  -- Check if notification was sent this week
  SELECT COUNT(*)
  INTO v_count
  FROM public.weekly_notification_log
  WHERE user_id = p_user_id
    AND notification_type = p_notification_type
    AND week_start_date = v_week_start;
  
  RETURN v_count > 0;
END;
$$;

-- Function to log that a weekly notification was sent
CREATE OR REPLACE FUNCTION log_weekly_notification(
  p_user_id uuid,
  p_notification_type text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_week_start date;
BEGIN
  -- Get the Monday of this week
  v_week_start := get_week_start(now());
  
  -- Insert or update the log (using ON CONFLICT to handle race conditions)
  INSERT INTO public.weekly_notification_log (user_id, notification_type, week_start_date, sent_at)
  VALUES (p_user_id, p_notification_type, v_week_start, now())
  ON CONFLICT (user_id, notification_type, week_start_date)
  DO UPDATE SET sent_at = now();
END;
$$;

-- Updated function: Check and create "no login" notification (only once per week)
CREATE OR REPLACE FUNCTION check_no_login_notification(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_login timestamp with time zone;
  v_days_inactive int;
  v_already_sent boolean;
BEGIN
  -- Check if this notification was already sent this week
  v_already_sent := was_sent_this_week(p_user_id, 'no_login');
  
  IF v_already_sent THEN
    RETURN false; -- Already sent this week, don't send again
  END IF;
  
  -- Get user's last login from auth.users
  SELECT last_sign_in_at
  INTO v_last_login
  FROM auth.users
  WHERE id = p_user_id;
  
  -- Calculate days since last login
  v_days_inactive := EXTRACT(DAY FROM (now() - v_last_login));
  
  -- If user hasn't logged in for 3+ days, create notification
  IF v_days_inactive >= 3 THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      target_audience,
      status,
      created_at
    ) VALUES (
      p_user_id,
      'We Miss You! 💪',
      format('It''s been %s days since your last visit. Come back and crush your goals!', v_days_inactive),
      'info',
      'user',
      'draft',
      now()
    );
    
    -- Log that we sent this notification this week
    PERFORM log_weekly_notification(p_user_id, 'no_login');
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Updated function: Check and create "no workout" notification (only once per week)
CREATE OR REPLACE FUNCTION check_no_workout_notification(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_workout timestamp with time zone;
  v_days_inactive int;
  v_already_sent boolean;
BEGIN
  -- Check if this notification was already sent this week
  v_already_sent := was_sent_this_week(p_user_id, 'no_workout');
  
  IF v_already_sent THEN
    RETURN false;
  END IF;
  
  -- Get user's last workout
  SELECT MAX(completed_at)
  INTO v_last_workout
  FROM public.workout_logs
  WHERE user_id = p_user_id;
  
  -- Calculate days since last workout
  IF v_last_workout IS NOT NULL THEN
    v_days_inactive := EXTRACT(DAY FROM (now() - v_last_workout));
  ELSE
    v_days_inactive := 999; -- Never worked out
  END IF;
  
  -- If user hasn't worked out for 5+ days, create notification
  IF v_days_inactive >= 5 THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      target_audience,
      status,
      created_at
    ) VALUES (
      p_user_id,
      'Time to Get Moving! 🏋️',
      format('It''s been %s days since your last workout. Let''s get back on track!', v_days_inactive),
      'warning',
      'user',
      'draft',
      now()
    );
    
    PERFORM log_weekly_notification(p_user_id, 'no_workout');
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Updated function: Check and create "no meal" notification (only once per week)
CREATE OR REPLACE FUNCTION check_no_meal_notification(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_meal timestamp with time zone;
  v_days_inactive int;
  v_already_sent boolean;
BEGIN
  -- Check if this notification was already sent this week
  v_already_sent := was_sent_this_week(p_user_id, 'no_meal');
  
  IF v_already_sent THEN
    RETURN false;
  END IF;
  
  -- Get user's last meal log
  SELECT MAX(logged_at)
  INTO v_last_meal
  FROM public.meal_logs
  WHERE user_id = p_user_id;
  
  -- Calculate days since last meal
  IF v_last_meal IS NOT NULL THEN
    v_days_inactive := EXTRACT(DAY FROM (now() - v_last_meal));
  ELSE
    v_days_inactive := 999; -- Never logged a meal
  END IF;
  
  -- If user hasn't logged meals for 3+ days, create notification
  IF v_days_inactive >= 3 THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      target_audience,
      status,
      created_at
    ) VALUES (
      p_user_id,
      'Track Your Nutrition! 🍎',
      format('It''s been %s days since you logged a meal. Stay on top of your nutrition goals!', v_days_inactive),
      'info',
      'user',
      'draft',
      now()
    );
    
    PERFORM log_weekly_notification(p_user_id, 'no_meal');
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON public.weekly_notification_log TO authenticated;
GRANT ALL ON public.weekly_notification_log TO service_role;

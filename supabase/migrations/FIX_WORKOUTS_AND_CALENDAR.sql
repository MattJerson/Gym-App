-- Fix 1: Update get_user_assigned_workouts to include exercise count
-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_user_assigned_workouts(uuid);

CREATE OR REPLACE FUNCTION public.get_user_assigned_workouts(p_user_id uuid)
RETURNS TABLE (
  workout_id uuid,
  workout_name text,
  workout_description text,
  difficulty text,
  duration_minutes integer,
  exercise_count bigint,
  category_id uuid,
  category_name text,
  assigned_by text,
  assigned_at timestamptz,
  status text,
  notes text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wt.id as workout_id,
    wt.name::text as workout_name,
    wt.description::text as workout_description,
    wt.difficulty::text,
    wt.duration_minutes,
    COUNT(we.id) as exercise_count,
    wt.category_id,
    wc.name::text as category_name,
    (rp.details->>'username')::text as assigned_by,
    uaw.assigned_at,
    uaw.status::text,
    uaw.notes::text
  FROM public.user_assigned_workouts uaw
  JOIN public.workout_templates wt ON uaw.workout_template_id = wt.id
  LEFT JOIN public.workout_categories wc ON wt.category_id = wc.id
  LEFT JOIN public.registration_profiles rp ON uaw.assigned_by_manager_id = rp.user_id
  LEFT JOIN public.workout_exercises we ON we.template_id = wt.id
  WHERE uaw.user_id = p_user_id
    AND uaw.status = 'active'
    AND wt.is_active = true
  GROUP BY wt.id, wt.name, wt.description, wt.difficulty, wt.duration_minutes, 
           wt.category_id, wc.name, rp.details, uaw.assigned_at, uaw.status, uaw.notes
  ORDER BY uaw.assigned_at DESC;
END;
$$;

-- Fix 2: Ensure streak data returns safe defaults
-- Create a function to get or initialize user streak data
CREATE OR REPLACE FUNCTION get_user_streak_data(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  current_streak INTEGER,
  longest_streak INTEGER,
  last_activity_date DATE,
  total_activities INTEGER,
  streak_start_date DATE
) AS $$
DECLARE
  v_streak_exists BOOLEAN;
BEGIN
  -- Check if streak record exists
  SELECT EXISTS(
    SELECT 1 FROM user_streaks WHERE user_id = p_user_id
  ) INTO v_streak_exists;
  
  -- If no streak exists, create one with defaults
  IF NOT v_streak_exists THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, total_activities)
    VALUES (p_user_id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  -- Return the streak data
  RETURN QUERY
  SELECT 
    us.user_id,
    COALESCE(us.current_streak, 0)::INTEGER,
    COALESCE(us.longest_streak, 0)::INTEGER,
    us.last_activity_date,
    COALESCE(us.total_activities, 0)::INTEGER,
    us.streak_start_date
  FROM user_streaks us
  WHERE us.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_streak_data(UUID) TO authenticated;

-- Fix 3: Ensure monthly stats returns safe defaults
CREATE OR REPLACE FUNCTION get_monthly_stats_safe(p_user_id UUID, p_month INTEGER, p_year INTEGER)
RETURNS TABLE (
  workouts_completed INTEGER,
  total_calories_burned INTEGER,
  total_time_minutes INTEGER,
  workouts_per_week DECIMAL,
  most_active_day TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(DISTINCT DATE(completed_at))::INTEGER, 0) as workouts_completed,
    COALESCE(SUM(calories_burned)::INTEGER, 0) as total_calories_burned,
    COALESCE(SUM(duration_minutes)::INTEGER, 0) as total_time_minutes,
    COALESCE(
      (COUNT(DISTINCT DATE(completed_at))::DECIMAL / 
       GREATEST(EXTRACT(DAY FROM DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::INTEGER / 7.0, 1)),
      0.0
    ) as workouts_per_week,
    COALESCE(
      (
        SELECT TO_CHAR(DATE(completed_at), 'Day')
        FROM daily_activity_tracking
        WHERE user_id = p_user_id
          AND EXTRACT(MONTH FROM completed_at) = p_month
          AND EXTRACT(YEAR FROM completed_at) = p_year
        GROUP BY DATE(completed_at)
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ),
      'No data'
    ) as most_active_day
  FROM daily_activity_tracking
  WHERE user_id = p_user_id
    AND EXTRACT(MONTH FROM completed_at) = p_month
    AND EXTRACT(YEAR FROM completed_at) = p_year;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_monthly_stats_safe(UUID, INTEGER, INTEGER) TO authenticated;

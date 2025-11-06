-- Create RPC function for comprehensive monthly analytics
-- Drop existing function first if it exists
DROP FUNCTION IF EXISTS get_monthly_analytics(UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_monthly_analytics(
  p_user_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  total_workouts INTEGER,
  total_duration_minutes INTEGER,
  total_calories_burned INTEGER,
  total_volume_kg NUMERIC,
  avg_workout_duration INTEGER,
  current_streak INTEGER,
  longest_streak INTEGER,
  total_points INTEGER,
  days_active INTEGER,
  completion_rate INTEGER,
  workouts_per_week NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_month_start DATE;
  v_month_end DATE;
  v_days_in_month INTEGER;
BEGIN
  -- Calculate month boundaries
  v_month_start := make_date(p_year, p_month, 1);
  v_month_end := (v_month_start + interval '1 month' - interval '1 day')::DATE;
  v_days_in_month := EXTRACT(DAY FROM v_month_end);
  
  RETURN QUERY
  WITH workout_stats AS (
    SELECT 
      COUNT(*) as workout_count,
      COALESCE(SUM(ws.total_duration_seconds) / 60, 0) as total_duration_min,
      COALESCE(SUM(ws.estimated_calories_burned), 0) as total_cal,
      COALESCE(SUM(ws.total_volume_kg), 0) as total_vol,
      COALESCE(AVG(ws.total_duration_seconds) / 60, 0) as avg_duration_min,
      COUNT(DISTINCT DATE(ws.completed_at)) as active_days_count
    FROM workout_sessions ws
    WHERE ws.user_id = p_user_id
      AND ws.status = 'completed'
      AND DATE(ws.completed_at) >= v_month_start
      AND DATE(ws.completed_at) <= v_month_end
  ),
  user_stats_data AS (
    SELECT
      us.current_streak,
      us.longest_streak,
      us.total_points
    FROM user_stats us
    WHERE us.user_id = p_user_id
  )
  SELECT
    ws.workout_count::INTEGER,
    ws.total_duration_min::INTEGER,
    ws.total_cal::INTEGER,
    ws.total_vol,
    ws.avg_duration_min::INTEGER,
    COALESCE(usd.current_streak, 0)::INTEGER,
    COALESCE(usd.longest_streak, 0)::INTEGER,
    COALESCE(usd.total_points, 0)::INTEGER,
    ws.active_days_count::INTEGER,
    CASE 
      WHEN v_days_in_month > 0 THEN ROUND((ws.active_days_count::NUMERIC / v_days_in_month::NUMERIC) * 100)::INTEGER
      ELSE 0
    END as completion_rate,
    CASE 
      WHEN v_days_in_month > 0 THEN ROUND((ws.workout_count::NUMERIC / v_days_in_month::NUMERIC) * 7, 1)
      ELSE 0
    END as workouts_per_week
  FROM workout_stats ws
  CROSS JOIN user_stats_data usd;
END;
$$;

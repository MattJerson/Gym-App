-- =====================================================
-- Comprehensive Calorie Tracking Integration
-- =====================================================
-- Integrates workout calories + meal calories into weight progress
-- Provides daily calorie balance tracking and weight projections
-- =====================================================

-- =====================================================
-- PART 1: Daily Calorie Summary Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.daily_calorie_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_date date NOT NULL,
  
  -- Meal calories (consumed)
  calories_consumed numeric DEFAULT 0,
  protein_consumed numeric DEFAULT 0,
  carbs_consumed numeric DEFAULT 0,
  fats_consumed numeric DEFAULT 0,
  meals_logged integer DEFAULT 0,
  
  -- Workout calories (burned)
  calories_burned numeric DEFAULT 0,
  workouts_completed integer DEFAULT 0,
  total_workout_minutes integer DEFAULT 0,
  
  -- Net balance
  net_calories numeric GENERATED ALWAYS AS (calories_consumed - calories_burned) STORED,
  
  -- Goals (from meal plan or defaults)
  calorie_goal integer DEFAULT 2000,
  protein_goal integer DEFAULT 140,
  carbs_goal integer DEFAULT 200,
  fats_goal integer DEFAULT 85,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, summary_date)
);

-- Enable RLS
ALTER TABLE public.daily_calorie_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exists to allow re-running migration)
DROP POLICY IF EXISTS "Users can view their own calorie summaries" ON public.daily_calorie_summary;
CREATE POLICY "Users can view their own calorie summaries"
  ON public.daily_calorie_summary
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own calorie summaries" ON public.daily_calorie_summary;
CREATE POLICY "Users can insert their own calorie summaries"
  ON public.daily_calorie_summary
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own calorie summaries" ON public.daily_calorie_summary;
CREATE POLICY "Users can update their own calorie summaries"
  ON public.daily_calorie_summary
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own calorie summaries" ON public.daily_calorie_summary;
CREATE POLICY "Users can delete their own calorie summaries"
  ON public.daily_calorie_summary
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_calorie_summary_user_date 
  ON public.daily_calorie_summary(user_id, summary_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_calorie_summary_date 
  ON public.daily_calorie_summary(summary_date DESC);

-- =====================================================
-- PART 2: Function to Calculate Daily Calorie Balance
-- =====================================================

-- Drop old function if exists (may have different signature)
DROP FUNCTION IF EXISTS public.calculate_daily_calorie_balance(uuid, date);

CREATE OR REPLACE FUNCTION public.calculate_daily_calorie_balance(
  p_user_id uuid,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date date,
  calories_consumed numeric,
  calories_burned numeric,
  net_calories numeric,
  protein_consumed numeric,
  carbs_consumed numeric,
  fats_consumed numeric,
  meals_logged integer,
  workouts_completed integer,
  workout_minutes integer,
  calorie_goal integer,
  protein_goal integer,
  carbs_goal integer,
  fats_goal integer
) AS $$
DECLARE
  v_calories_consumed numeric := 0;
  v_calories_burned numeric := 0;
  v_protein_consumed numeric := 0;
  v_carbs_consumed numeric := 0;
  v_fats_consumed numeric := 0;
  v_meals_logged integer := 0;
  v_workouts_completed integer := 0;
  v_workout_minutes integer := 0;
  v_calorie_goal integer := 2000;
  v_protein_goal integer := 140;
  v_carbs_goal integer := 200;
  v_fats_goal integer := 85;
BEGIN
  -- Get meal calories consumed
  SELECT 
    COALESCE(SUM(calories), 0),
    COALESCE(SUM(protein), 0),
    COALESCE(SUM(carbs), 0),
    COALESCE(SUM(fats), 0),
    COUNT(DISTINCT id)
  INTO 
    v_calories_consumed,
    v_protein_consumed,
    v_carbs_consumed,
    v_fats_consumed,
    v_meals_logged
  FROM public.user_meal_logs
  WHERE user_id = p_user_id
    AND meal_date = p_date;

  -- Get workout calories burned
  SELECT 
    COALESCE(SUM(estimated_calories_burned), 0),
    COUNT(*),
    COALESCE(SUM(total_duration_seconds / 60), 0)
  INTO 
    v_calories_burned,
    v_workouts_completed,
    v_workout_minutes
  FROM public.workout_sessions
  WHERE user_id = p_user_id
    AND DATE(completed_at) = p_date
    AND status = 'completed'
    AND estimated_calories_burned IS NOT NULL;

  -- Get user's calorie goals from active meal plan
  SELECT 
    daily_calories,
    daily_protein,
    daily_carbs,
    daily_fats
  INTO
    v_calorie_goal,
    v_protein_goal,
    v_carbs_goal,
    v_fats_goal
  FROM public.user_meal_plan_calculations
  WHERE user_id = p_user_id
    AND is_active = true
  LIMIT 1;

  -- Use defaults if no meal plan
  v_calorie_goal := COALESCE(v_calorie_goal, 2000);
  v_protein_goal := COALESCE(v_protein_goal, 140);
  v_carbs_goal := COALESCE(v_carbs_goal, 200);
  v_fats_goal := COALESCE(v_fats_goal, 85);

  -- Return calculated values
  RETURN QUERY SELECT
    p_date,
    v_calories_consumed,
    v_calories_burned,
    (v_calories_consumed - v_calories_burned),
    v_protein_consumed,
    v_carbs_consumed,
    v_fats_consumed,
    v_meals_logged,
    v_workouts_completed,
    v_workout_minutes,
    v_calorie_goal,
    v_protein_goal,
    v_carbs_goal,
    v_fats_goal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.calculate_daily_calorie_balance TO authenticated;

-- =====================================================
-- PART 3: Function to Update Daily Calorie Summary
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_daily_calorie_summary(
  p_user_id uuid,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS void AS $$
DECLARE
  v_balance RECORD;
BEGIN
  -- Calculate current balance
  SELECT * INTO v_balance
  FROM public.calculate_daily_calorie_balance(p_user_id, p_date);

  -- Upsert into summary table
  INSERT INTO public.daily_calorie_summary (
    user_id,
    summary_date,
    calories_consumed,
    protein_consumed,
    carbs_consumed,
    fats_consumed,
    meals_logged,
    calories_burned,
    workouts_completed,
    total_workout_minutes,
    calorie_goal,
    protein_goal,
    carbs_goal,
    fats_goal,
    updated_at
  ) VALUES (
    p_user_id,
    p_date,
    v_balance.calories_consumed,
    v_balance.protein_consumed,
    v_balance.carbs_consumed,
    v_balance.fats_consumed,
    v_balance.meals_logged,
    v_balance.calories_burned,
    v_balance.workouts_completed,
    v_balance.workout_minutes,
    v_balance.calorie_goal,
    v_balance.protein_goal,
    v_balance.carbs_goal,
    v_balance.fats_goal,
    now()
  )
  ON CONFLICT (user_id, summary_date)
  DO UPDATE SET
    calories_consumed = EXCLUDED.calories_consumed,
    protein_consumed = EXCLUDED.protein_consumed,
    carbs_consumed = EXCLUDED.carbs_consumed,
    fats_consumed = EXCLUDED.fats_consumed,
    meals_logged = EXCLUDED.meals_logged,
    calories_burned = EXCLUDED.calories_burned,
    workouts_completed = EXCLUDED.workouts_completed,
    total_workout_minutes = EXCLUDED.total_workout_minutes,
    calorie_goal = EXCLUDED.calorie_goal,
    protein_goal = EXCLUDED.protein_goal,
    carbs_goal = EXCLUDED.carbs_goal,
    fats_goal = EXCLUDED.fats_goal,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_daily_calorie_summary TO authenticated;

-- =====================================================
-- PART 4: Triggers to Auto-Update Calorie Summary
-- =====================================================

-- Trigger function for meal logs
CREATE OR REPLACE FUNCTION public.trigger_update_calorie_summary_meals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update summary for the affected date
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_daily_calorie_summary(OLD.user_id, OLD.meal_date);
  ELSE
    PERFORM public.update_daily_calorie_summary(NEW.user_id, NEW.meal_date);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for workout sessions
CREATE OR REPLACE FUNCTION public.trigger_update_calorie_summary_workouts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update summary for the affected date
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_daily_calorie_summary(OLD.user_id, DATE(OLD.completed_at));
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- Workout just completed
    PERFORM public.update_daily_calorie_summary(NEW.user_id, DATE(NEW.completed_at));
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status != 'completed' THEN
    -- Workout uncompleted (rare)
    PERFORM public.update_daily_calorie_summary(NEW.user_id, DATE(OLD.completed_at));
  ELSIF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    -- New completed workout
    PERFORM public.update_daily_calorie_summary(NEW.user_id, DATE(NEW.completed_at));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_meal_log_calorie_update ON public.user_meal_logs;
CREATE TRIGGER trigger_meal_log_calorie_update
  AFTER INSERT OR UPDATE OR DELETE ON public.user_meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_calorie_summary_meals();

DROP TRIGGER IF EXISTS trigger_workout_calorie_update ON public.workout_sessions;
CREATE TRIGGER trigger_workout_calorie_update
  AFTER INSERT OR UPDATE OR DELETE ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_calorie_summary_workouts();

-- =====================================================
-- PART 5: Weight Progress Chart with Calorie Data
-- =====================================================

-- Drop old function if exists (may have different signature)
DROP FUNCTION IF EXISTS public.get_weight_progress_chart(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_weight_progress_chart(
  p_user_id uuid,
  p_days_back integer DEFAULT 7
)
RETURNS TABLE (
  measurement_date date,
  weight_kg numeric,
  is_actual boolean,
  is_projected boolean,
  calorie_balance numeric,
  calories_consumed numeric,
  calories_burned numeric,
  trend varchar
) AS $$
DECLARE
  v_start_date date;
  v_latest_weight numeric;
  v_latest_weight_date date;
  v_current_date date;
  v_projected_weight numeric;
  v_cumulative_deficit numeric := 0;
  v_days_since_measurement integer := 0;
  v_actual_weight numeric;
  v_daily_summary RECORD;
  v_is_actual boolean;
  v_is_projected boolean;
BEGIN
  -- Calculate start date
  v_start_date := CURRENT_DATE - p_days_back;
  
  -- Get the most recent actual weight measurement before or at the start date
  -- This ensures we have a baseline for projections even for long date ranges
  SELECT wt.weight_kg, wt.measurement_date 
  INTO v_latest_weight, v_latest_weight_date
  FROM public.weight_tracking wt
  WHERE wt.user_id = p_user_id
    AND wt.measurement_date <= CURRENT_DATE
  ORDER BY wt.measurement_date DESC
  LIMIT 1;

  -- If no weight recorded, can't generate chart
  IF v_latest_weight IS NULL THEN
    RETURN;
  END IF;

  -- If the latest weight is before our start date, we need to project from that point
  IF v_latest_weight_date < v_start_date THEN
    -- Calculate cumulative deficit from last measurement to start_date
    SELECT COALESCE(SUM(dcs.calorie_goal - dcs.net_calories), 0)
    INTO v_cumulative_deficit
    FROM public.daily_calorie_summary dcs
    WHERE dcs.user_id = p_user_id
      AND dcs.summary_date > v_latest_weight_date
      AND dcs.summary_date < v_start_date;
    
    -- Adjust the baseline weight
    v_latest_weight := v_latest_weight - (v_cumulative_deficit / 7700.0);
    v_cumulative_deficit := 0;
  END IF;

  -- Return data for each day in the requested range
  FOR v_current_date IN 
    SELECT generate_series(v_start_date, CURRENT_DATE, '1 day'::interval)::date
  LOOP
    -- Reset loop variables
    v_actual_weight := NULL;
    v_daily_summary := NULL;
    v_is_actual := false;
    v_is_projected := false;
    
    -- Check if there's an actual measurement for this date
    SELECT wt.weight_kg INTO v_actual_weight
    FROM public.weight_tracking wt
    WHERE wt.user_id = p_user_id
      AND wt.measurement_date = v_current_date;

    -- Get calorie summary for this date (use cached version for performance)
    SELECT 
      COALESCE(calories_consumed, 0) as calories_consumed,
      COALESCE(calories_burned, 0) as calories_burned,
      COALESCE(net_calories, 0) as net_calories,
      COALESCE(calorie_goal, 2000) as calorie_goal
    INTO v_daily_summary
    FROM public.daily_calorie_summary
    WHERE user_id = p_user_id
      AND summary_date = v_current_date;

    -- If no cached summary exists, calculate on-the-fly
    IF v_daily_summary IS NULL THEN
      SELECT 
        calories_consumed,
        calories_burned,
        net_calories,
        calorie_goal
      INTO v_daily_summary
      FROM public.calculate_daily_calorie_balance(p_user_id, v_current_date);
    END IF;

    IF v_actual_weight IS NOT NULL THEN
      -- Use actual measurement
      v_is_actual := true;
      v_latest_weight := v_actual_weight;
      v_cumulative_deficit := 0; -- Reset projection from actual measurement
      v_days_since_measurement := 0;
      
      RETURN QUERY SELECT
        v_current_date,
        v_actual_weight,
        v_is_actual,
        v_is_projected,
        v_daily_summary.net_calories,
        v_daily_summary.calories_consumed,
        v_daily_summary.calories_burned,
        'actual'::varchar;
    ELSE
      -- Project weight based on calorie deficit
      -- 7700 calories deficit = 1 kg weight loss
      -- Cap projection at 90 days to avoid unrealistic long-term projections
      v_is_projected := true;
      v_days_since_measurement := v_days_since_measurement + 1;
      
      -- Only project if within reasonable timeframe (90 days)
      IF v_days_since_measurement <= 90 THEN
        v_cumulative_deficit := v_cumulative_deficit + (v_daily_summary.calorie_goal - v_daily_summary.net_calories);
        v_projected_weight := v_latest_weight - (v_cumulative_deficit / 7700.0);
      ELSE
        -- For projections beyond 90 days, maintain the last projected weight
        v_projected_weight := v_latest_weight - (v_cumulative_deficit / 7700.0);
      END IF;
      
      RETURN QUERY SELECT
        v_current_date,
        ROUND(v_projected_weight, 2),
        v_is_actual,
        v_is_projected,
        v_daily_summary.net_calories,
        v_daily_summary.calories_consumed,
        v_daily_summary.calories_burned,
        'projected'::varchar;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_weight_progress_chart TO authenticated;

-- =====================================================
-- PART 6: Additional Helper Functions for Long-Term Tracking
-- =====================================================

-- Function to get weight measurements only (for performance with large ranges)
CREATE OR REPLACE FUNCTION public.get_weight_measurements_only(
  p_user_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT CURRENT_DATE,
  p_limit integer DEFAULT 1000
)
RETURNS TABLE (
  measurement_date date,
  weight_kg numeric,
  body_fat_percentage numeric,
  muscle_mass_kg numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wt.measurement_date,
    wt.weight_kg,
    wt.body_fat_percentage,
    wt.muscle_mass_kg
  FROM public.weight_tracking wt
  WHERE wt.user_id = p_user_id
    AND (p_start_date IS NULL OR wt.measurement_date >= p_start_date)
    AND wt.measurement_date <= p_end_date
  ORDER BY wt.measurement_date ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_weight_measurements_only TO authenticated;

-- Function to get aggregated calorie data (weekly/monthly for long-term views)
CREATE OR REPLACE FUNCTION public.get_aggregated_calorie_data(
  p_user_id uuid,
  p_start_date date,
  p_end_date date,
  p_interval varchar DEFAULT 'week' -- 'day', 'week', 'month'
)
RETURNS TABLE (
  period_start date,
  period_end date,
  avg_calories_consumed numeric,
  avg_calories_burned numeric,
  avg_net_calories numeric,
  total_meals_logged integer,
  total_workouts_completed integer,
  days_with_data integer
) AS $$
BEGIN
  IF p_interval = 'week' THEN
    RETURN QUERY
    SELECT 
      DATE_TRUNC('week', summary_date)::date as period_start,
      (DATE_TRUNC('week', summary_date) + INTERVAL '6 days')::date as period_end,
      ROUND(AVG(calories_consumed), 0) as avg_calories_consumed,
      ROUND(AVG(calories_burned), 0) as avg_calories_burned,
      ROUND(AVG(net_calories), 0) as avg_net_calories,
      SUM(meals_logged) as total_meals_logged,
      SUM(workouts_completed) as total_workouts_completed,
      COUNT(*)::integer as days_with_data
    FROM public.daily_calorie_summary
    WHERE user_id = p_user_id
      AND summary_date >= p_start_date
      AND summary_date <= p_end_date
    GROUP BY DATE_TRUNC('week', summary_date)
    ORDER BY period_start ASC;
  
  ELSIF p_interval = 'month' THEN
    RETURN QUERY
    SELECT 
      DATE_TRUNC('month', summary_date)::date as period_start,
      (DATE_TRUNC('month', summary_date) + INTERVAL '1 month - 1 day')::date as period_end,
      ROUND(AVG(calories_consumed), 0) as avg_calories_consumed,
      ROUND(AVG(calories_burned), 0) as avg_calories_burned,
      ROUND(AVG(net_calories), 0) as avg_net_calories,
      SUM(meals_logged) as total_meals_logged,
      SUM(workouts_completed) as total_workouts_completed,
      COUNT(*)::integer as days_with_data
    FROM public.daily_calorie_summary
    WHERE user_id = p_user_id
      AND summary_date >= p_start_date
      AND summary_date <= p_end_date
    GROUP BY DATE_TRUNC('month', summary_date)
    ORDER BY period_start ASC;
  
  ELSE -- 'day'
    RETURN QUERY
    SELECT 
      summary_date as period_start,
      summary_date as period_end,
      calories_consumed as avg_calories_consumed,
      calories_burned as avg_calories_burned,
      net_calories as avg_net_calories,
      meals_logged as total_meals_logged,
      workouts_completed as total_workouts_completed,
      1 as days_with_data
    FROM public.daily_calorie_summary
    WHERE user_id = p_user_id
      AND summary_date >= p_start_date
      AND summary_date <= p_end_date
    ORDER BY summary_date ASC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_aggregated_calorie_data TO authenticated;

-- Function to get weight progress statistics over time
CREATE OR REPLACE FUNCTION public.get_weight_progress_stats(
  p_user_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_measurements integer,
  first_weight numeric,
  latest_weight numeric,
  total_change numeric,
  avg_weekly_change numeric,
  min_weight numeric,
  max_weight numeric,
  days_tracked integer,
  avg_calorie_deficit numeric
) AS $$
DECLARE
  v_first_date date;
  v_weeks numeric;
BEGIN
  -- Get the first measurement date if not provided
  IF p_start_date IS NULL THEN
    SELECT MIN(measurement_date) INTO v_first_date
    FROM public.weight_tracking
    WHERE user_id = p_user_id;
  ELSE
    v_first_date := p_start_date;
  END IF;

  -- Calculate number of weeks
  v_weeks := (p_end_date - v_first_date) / 7.0;

  RETURN QUERY
  WITH weight_stats AS (
    SELECT 
      COUNT(*)::integer as measurement_count,
      (SELECT weight_kg FROM public.weight_tracking 
       WHERE user_id = p_user_id 
         AND measurement_date >= v_first_date 
       ORDER BY measurement_date ASC LIMIT 1) as first_wt,
      (SELECT weight_kg FROM public.weight_tracking 
       WHERE user_id = p_user_id 
         AND measurement_date <= p_end_date 
       ORDER BY measurement_date DESC LIMIT 1) as last_wt,
      MIN(weight_kg) as min_wt,
      MAX(weight_kg) as max_wt
    FROM public.weight_tracking
    WHERE user_id = p_user_id
      AND measurement_date >= v_first_date
      AND measurement_date <= p_end_date
  ),
  calorie_stats AS (
    SELECT 
      COUNT(*)::integer as days_count,
      AVG(calorie_goal - net_calories) as avg_deficit
    FROM public.daily_calorie_summary
    WHERE user_id = p_user_id
      AND summary_date >= v_first_date
      AND summary_date <= p_end_date
  )
  SELECT 
    ws.measurement_count,
    ROUND(ws.first_wt, 2),
    ROUND(ws.last_wt, 2),
    ROUND(ws.last_wt - ws.first_wt, 2),
    ROUND((ws.last_wt - ws.first_wt) / NULLIF(v_weeks, 0), 3),
    ROUND(ws.min_wt, 2),
    ROUND(ws.max_wt, 2),
    cs.days_count,
    ROUND(cs.avg_deficit, 0)
  FROM weight_stats ws, calorie_stats cs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_weight_progress_stats TO authenticated;

-- =====================================================
-- PART 7: Optimized Backfill for Historical Data
-- =====================================================

-- Backfill summaries intelligently based on user activity
DO $$
DECLARE
  v_user RECORD;
  v_min_date date;
  v_max_date date;
  v_date date;
  v_batch_size integer := 100; -- Process in batches
  v_processed integer := 0;
BEGIN
  -- For each user who has logged meals or workouts
  FOR v_user IN 
    SELECT DISTINCT user_id 
    FROM (
      SELECT user_id FROM public.user_meal_logs
      UNION
      SELECT user_id FROM public.workout_sessions
    ) AS active_users
  LOOP
    -- Find the date range for this user's activity
    SELECT 
      LEAST(
        COALESCE((SELECT MIN(meal_date) FROM public.user_meal_logs WHERE user_id = v_user.user_id), CURRENT_DATE),
        COALESCE((SELECT MIN(DATE(completed_at)) FROM public.workout_sessions WHERE user_id = v_user.user_id), CURRENT_DATE)
      ),
      CURRENT_DATE
    INTO v_min_date, v_max_date;

    -- Only backfill last 90 days to avoid overload (can be extended gradually)
    v_min_date := GREATEST(v_min_date, CURRENT_DATE - 90);

    -- Update summaries for the user's activity range
    FOR v_date IN 
      SELECT generate_series(v_min_date, v_max_date, '1 day'::interval)::date
    LOOP
      PERFORM public.update_daily_calorie_summary(v_user.user_id, v_date);
      
      v_processed := v_processed + 1;
      
      -- Commit in batches to avoid long transactions
      IF v_processed % v_batch_size = 0 THEN
        RAISE NOTICE 'Processed % calorie summaries...', v_processed;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Backfill complete: % total calorie summaries created', v_processed;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- ✅ Daily calorie summary table created with RLS
-- ✅ Function to calculate daily calorie balance (meals + workouts)
-- ✅ Function to update daily summaries
-- ✅ Triggers to auto-update on meal/workout changes
-- ✅ Weight progress chart with calorie integration
-- ✅ Historical data backfilled for last 30 days
-- =====================================================

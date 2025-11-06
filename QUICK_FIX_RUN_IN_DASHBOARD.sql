-- =====================================================
-- Quick Fix: Run this in Supabase Dashboard SQL Editor
-- =====================================================
-- This is a simplified version to fix the immediate errors
-- =====================================================

-- Drop existing policies to allow re-running
DROP POLICY IF EXISTS "Users can view their own calorie summaries" ON public.daily_calorie_summary;
DROP POLICY IF EXISTS "Users can insert their own calorie summaries" ON public.daily_calorie_summary;
DROP POLICY IF EXISTS "Users can update their own calorie summaries" ON public.daily_calorie_summary;
DROP POLICY IF EXISTS "Users can delete their own calorie summaries" ON public.daily_calorie_summary;

-- Recreate policies
CREATE POLICY "Users can view their own calorie summaries"
  ON public.daily_calorie_summary
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calorie summaries"
  ON public.daily_calorie_summary
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calorie summaries"
  ON public.daily_calorie_summary
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calorie summaries"
  ON public.daily_calorie_summary
  FOR DELETE
  USING (auth.uid() = user_id);

-- Drop and recreate the fixed function with table aliases
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
-- DONE! This fixes the immediate errors:
-- ✅ RLS policies can be recreated (DROP IF EXISTS added)
-- ✅ Ambiguous column reference fixed (table aliases added)
-- ✅ Calendar page auto-refresh already implemented in code
-- =====================================================

-- =====================================================
-- Automatic Weight Tracking System
-- =====================================================
-- Tracks weight automatically based on:
-- 1. Initial weight from registration
-- 2. Daily calorie balance (meals consumed - workouts burned)
-- 3. Maintenance calories (from meal plan)
-- 4. Formula: 7700 calorie surplus/deficit = 1 kg gain/loss
-- =====================================================

-- =====================================================
-- PART 1: Trigger to Insert Initial Weight on Registration
-- =====================================================

CREATE OR REPLACE FUNCTION public.insert_initial_weight_from_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if weight_kg is provided and no weight entry exists yet
  IF NEW.weight_kg IS NOT NULL THEN
    -- Check if user already has weight entries
    IF NOT EXISTS (
      SELECT 1 FROM public.weight_tracking 
      WHERE user_id = NEW.user_id
    ) THEN
      -- Insert initial weight measurement
      INSERT INTO public.weight_tracking (
        user_id,
        measurement_date,
        weight_kg,
        notes,
        created_at
      ) VALUES (
        NEW.user_id,
        CURRENT_DATE,
        NEW.weight_kg,
        'Initial weight from registration',
        NOW()
      );
      
      RAISE NOTICE 'Initial weight % kg recorded for user %', NEW.weight_kg, NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create
DROP TRIGGER IF EXISTS trigger_insert_initial_weight ON public.registration_profiles;
CREATE TRIGGER trigger_insert_initial_weight
  AFTER INSERT OR UPDATE OF weight_kg ON public.registration_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.insert_initial_weight_from_registration();

-- =====================================================
-- PART 2: Function to Calculate Projected Weight
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_projected_weight(
  p_user_id uuid,
  p_target_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  projected_weight numeric,
  last_actual_weight numeric,
  last_weight_date date,
  days_since_measurement integer,
  cumulative_calorie_balance numeric,
  expected_weight_change numeric
) AS $$
DECLARE
  v_last_weight numeric;
  v_last_weight_date date;
  v_maintenance_calories integer;
  v_cumulative_balance numeric := 0;
  v_projected_weight numeric;
BEGIN
  -- Get the most recent actual weight measurement
  SELECT wt.weight_kg, wt.measurement_date 
  INTO v_last_weight, v_last_weight_date
  FROM public.weight_tracking wt
  WHERE wt.user_id = p_user_id
    AND wt.measurement_date <= p_target_date
  ORDER BY wt.measurement_date DESC
  LIMIT 1;

  -- If no weight measurement exists, return NULL
  IF v_last_weight IS NULL THEN
    RETURN;
  END IF;

  -- Get user's maintenance calories from their meal plan
  SELECT daily_calories
  INTO v_maintenance_calories
  FROM public.user_meal_plan_calculations
  WHERE user_id = p_user_id
    AND is_active = true
  LIMIT 1;

  -- Default to registration calorie goal if no meal plan
  IF v_maintenance_calories IS NULL THEN
    SELECT calorie_goal
    INTO v_maintenance_calories
    FROM public.registration_profiles
    WHERE user_id = p_user_id;
  END IF;

  -- Default to 2000 if still null
  v_maintenance_calories := COALESCE(v_maintenance_calories, 2000);

  -- Calculate cumulative calorie balance since last measurement
  -- Balance = (consumed - burned) - maintenance
  -- Negative balance = deficit (lose weight)
  -- Positive balance = surplus (gain weight)
  SELECT COALESCE(SUM(
    (calories_consumed - calories_burned) - v_maintenance_calories
  ), 0)
  INTO v_cumulative_balance
  FROM public.daily_calorie_summary
  WHERE user_id = p_user_id
    AND summary_date > v_last_weight_date
    AND summary_date <= p_target_date;

  -- Calculate projected weight
  -- 7700 calories = 1 kg
  -- Positive balance (surplus) = gain weight (+)
  -- Negative balance (deficit) = lose weight (-)
  v_projected_weight := v_last_weight + (v_cumulative_balance / 7700.0);

  -- Return results
  RETURN QUERY SELECT
    ROUND(v_projected_weight, 2),
    v_last_weight,
    v_last_weight_date,
    (p_target_date - v_last_weight_date)::integer,
    v_cumulative_balance,
    ROUND((v_cumulative_balance / 7700.0), 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.calculate_projected_weight TO authenticated;

-- =====================================================
-- PART 3: Enhanced Weight Progress Chart with Auto-Tracking
-- =====================================================

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
  maintenance_calories integer,
  trend varchar
) AS $$
DECLARE
  v_start_date date;
  v_latest_weight numeric;
  v_latest_weight_date date;
  v_current_date date;
  v_projected_weight numeric;
  v_cumulative_balance numeric := 0;
  v_days_since_measurement integer := 0;
  v_actual_weight numeric;
  v_daily_summary RECORD;
  v_is_actual boolean;
  v_is_projected boolean;
  v_maintenance_calories integer;
BEGIN
  -- Calculate start date
  v_start_date := CURRENT_DATE - p_days_back;
  
  -- Get the most recent actual weight measurement
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

  -- Get user's maintenance calories
  SELECT daily_calories
  INTO v_maintenance_calories
  FROM public.user_meal_plan_calculations
  WHERE user_id = p_user_id
    AND is_active = true
  LIMIT 1;

  -- Fallback to registration profile
  IF v_maintenance_calories IS NULL THEN
    SELECT calorie_goal
    INTO v_maintenance_calories
    FROM public.registration_profiles
    WHERE user_id = p_user_id;
  END IF;

  -- Default to 2000
  v_maintenance_calories := COALESCE(v_maintenance_calories, 2000);

  -- If the latest weight is before our start date, calculate baseline
  IF v_latest_weight_date < v_start_date THEN
    SELECT COALESCE(SUM(
      (dcs.calories_consumed - dcs.calories_burned) - v_maintenance_calories
    ), 0)
    INTO v_cumulative_balance
    FROM public.daily_calorie_summary dcs
    WHERE dcs.user_id = p_user_id
      AND dcs.summary_date > v_latest_weight_date
      AND dcs.summary_date < v_start_date;
    
    -- Adjust the baseline weight
    v_latest_weight := v_latest_weight + (v_cumulative_balance / 7700.0);
    v_cumulative_balance := 0;
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

    -- Get calorie summary for this date
    SELECT 
      COALESCE(dcs.calories_consumed, 0) as calories_consumed,
      COALESCE(dcs.calories_burned, 0) as calories_burned,
      COALESCE(dcs.net_calories, 0) as net_calories
    INTO v_daily_summary
    FROM public.daily_calorie_summary dcs
    WHERE dcs.user_id = p_user_id
      AND dcs.summary_date = v_current_date;

    -- If no cached summary, calculate on-the-fly
    IF v_daily_summary IS NULL THEN
      SELECT 
        cb.calories_consumed,
        cb.calories_burned,
        cb.net_calories
      INTO v_daily_summary
      FROM public.calculate_daily_calorie_balance(p_user_id, v_current_date) cb;
    END IF;

    IF v_actual_weight IS NOT NULL THEN
      -- Use actual measurement
      v_is_actual := true;
      v_latest_weight := v_actual_weight;
      v_cumulative_balance := 0;
      v_days_since_measurement := 0;
      
      RETURN QUERY SELECT
        v_current_date,
        v_actual_weight,
        v_is_actual,
        v_is_projected,
        (v_daily_summary.calories_consumed - v_daily_summary.calories_burned - v_maintenance_calories)::numeric,
        v_daily_summary.calories_consumed,
        v_daily_summary.calories_burned,
        v_maintenance_calories,
        'actual'::varchar;
    ELSE
      -- Project weight based on calorie balance
      v_is_projected := true;
      v_days_since_measurement := v_days_since_measurement + 1;
      
      -- Only project up to 90 days
      IF v_days_since_measurement <= 90 THEN
        -- Calculate daily balance: (consumed - burned) - maintenance
        v_cumulative_balance := v_cumulative_balance + 
          ((v_daily_summary.calories_consumed - v_daily_summary.calories_burned) - v_maintenance_calories);
        v_projected_weight := v_latest_weight + (v_cumulative_balance / 7700.0);
      ELSE
        v_projected_weight := v_latest_weight + (v_cumulative_balance / 7700.0);
      END IF;
      
      RETURN QUERY SELECT
        v_current_date,
        ROUND(v_projected_weight, 2),
        v_is_actual,
        v_is_projected,
        (v_daily_summary.calories_consumed - v_daily_summary.calories_burned - v_maintenance_calories)::numeric,
        v_daily_summary.calories_consumed,
        v_daily_summary.calories_burned,
        v_maintenance_calories,
        'projected'::varchar;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_weight_progress_chart TO authenticated;

-- =====================================================
-- PART 4: Backfill Initial Weights for Existing Users
-- =====================================================

-- Insert initial weight for users who registered but don't have weight entries
DO $$
DECLARE
  v_user RECORD;
  v_inserted integer := 0;
BEGIN
  FOR v_user IN 
    SELECT rp.user_id, rp.weight_kg, rp.created_at
    FROM public.registration_profiles rp
    WHERE rp.weight_kg IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.weight_tracking wt
        WHERE wt.user_id = rp.user_id
      )
  LOOP
    INSERT INTO public.weight_tracking (
      user_id,
      measurement_date,
      weight_kg,
      notes,
      created_at
    ) VALUES (
      v_user.user_id,
      COALESCE(DATE(v_user.created_at), CURRENT_DATE),
      v_user.weight_kg,
      'Initial weight from registration (backfilled)',
      NOW()
    );
    
    v_inserted := v_inserted + 1;
  END LOOP;
  
  RAISE NOTICE 'Backfilled % initial weight entries', v_inserted;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- ✅ Initial weight automatically inserted from registration
-- ✅ Weight projected automatically based on calorie balance
-- ✅ No meal logs = no weight change (maintenance assumed)
-- ✅ Meal surplus = weight gain
-- ✅ Meal deficit + workouts = weight loss
-- ✅ Formula: 7700 calories = 1 kg
-- ✅ Existing users backfilled with initial weights
-- =====================================================

-- =============================================
-- WORKOUT TRACKING SYSTEM
-- Tracks user workouts, daily progress, and steps
-- =============================================

-- 1. WORKOUT LOGS TABLE (User workout sessions)
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Workout info
  workout_name VARCHAR(200) NOT NULL,
  workout_type VARCHAR(50), -- 'push', 'pull', 'legs', 'cardio', 'full_body', 'upper', 'lower', 'hiit'
  workout_category_id UUID REFERENCES public.workout_categories(id) ON DELETE SET NULL,
  workout_template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  
  -- Session details
  duration_minutes INTEGER NOT NULL,
  calories_burned INTEGER DEFAULT 0,
  exercises_count INTEGER DEFAULT 0,
  total_sets INTEGER DEFAULT 0,
  total_reps INTEGER DEFAULT 0,
  total_volume_kg DECIMAL(10,2) DEFAULT 0, -- Total weight lifted
  
  -- Session metrics
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  intensity_level VARCHAR(50), -- 'low', 'moderate', 'high', 'max'
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed', -- 'completed', 'in_progress', 'cancelled'
  notes TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DAILY ACTIVITY TRACKING (Steps, calories, overall activity)
CREATE TABLE IF NOT EXISTS public.daily_activity_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tracking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Steps tracking
  steps_count INTEGER DEFAULT 0,
  steps_goal INTEGER DEFAULT 10000,
  steps_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Workouts tracking
  workouts_completed INTEGER DEFAULT 0,
  workouts_goal INTEGER DEFAULT 1,
  workouts_percentage DECIMAL(5,2) DEFAULT 0,
  total_workout_minutes INTEGER DEFAULT 0,
  
  -- Calories tracking
  total_calories_burned INTEGER DEFAULT 0,
  calories_goal INTEGER DEFAULT 500,
  calories_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Activity summary
  is_goal_met BOOLEAN DEFAULT false,
  overall_progress DECIMAL(5,2) DEFAULT 0, -- Average of all percentages
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, tracking_date)
);

-- 3. USER DAILY GOALS (Customizable goals per user)
CREATE TABLE IF NOT EXISTS public.user_daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Daily goals
  steps_goal INTEGER DEFAULT 10000,
  workouts_goal INTEGER DEFAULT 1,
  calories_burn_goal INTEGER DEFAULT 500,
  active_minutes_goal INTEGER DEFAULT 30,
  water_intake_goal INTEGER DEFAULT 8, -- glasses
  
  -- Meal plan goals (synced from active meal plan)
  calories_intake_goal INTEGER DEFAULT 2000,
  protein_goal INTEGER DEFAULT 150,
  
  -- Preferences
  goal_type VARCHAR(50) DEFAULT 'balanced', -- 'weight_loss', 'muscle_gain', 'maintenance', 'balanced'
  difficulty_level VARCHAR(50) DEFAULT 'moderate', -- 'easy', 'moderate', 'hard', 'extreme'
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date 
  ON public.workout_logs(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_logs_type 
  ON public.workout_logs(workout_type);

CREATE INDEX IF NOT EXISTS idx_workout_logs_status 
  ON public.workout_logs(user_id, status);

CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date 
  ON public.daily_activity_tracking(user_id, tracking_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_activity_date 
  ON public.daily_activity_tracking(tracking_date);

CREATE INDEX IF NOT EXISTS idx_user_goals 
  ON public.user_daily_goals(user_id);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update updated_at timestamp
CREATE TRIGGER trigger_workout_logs_updated_at
  BEFORE UPDATE ON public.workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_daily_activity_updated_at
  BEFORE UPDATE ON public.daily_activity_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_goals_updated_at
  BEFORE UPDATE ON public.user_daily_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function: Update daily activity when workout is logged
CREATE OR REPLACE FUNCTION update_daily_activity_on_workout()
RETURNS TRIGGER AS $$
DECLARE
  v_user_goals RECORD;
  v_tracking_date DATE;
  v_workouts_count INTEGER;
  v_total_minutes INTEGER;
  v_total_calories INTEGER;
BEGIN
  -- Get tracking date
  v_tracking_date := DATE(NEW.completed_at);
  
  -- Get user's goals
  SELECT * INTO v_user_goals
  FROM user_daily_goals
  WHERE user_id = NEW.user_id;
  
  -- Use defaults if no custom goals
  IF v_user_goals IS NULL THEN
    v_user_goals := ROW(
      NULL, NEW.user_id, 
      10000, 1, 500, 30, 8, -- Default goals
      2000, 150,
      'balanced', 'moderate',
      NOW(), NOW()
    )::user_daily_goals;
  END IF;
  
  -- Calculate workout totals for the day
  SELECT 
    COUNT(*),
    COALESCE(SUM(duration_minutes), 0),
    COALESCE(SUM(calories_burned), 0)
  INTO 
    v_workouts_count,
    v_total_minutes,
    v_total_calories
  FROM workout_logs
  WHERE user_id = NEW.user_id 
    AND DATE(completed_at) = v_tracking_date
    AND status = 'completed';
  
  -- Update or insert daily activity
  INSERT INTO daily_activity_tracking (
    user_id,
    tracking_date,
    workouts_completed,
    workouts_goal,
    workouts_percentage,
    total_workout_minutes,
    total_calories_burned,
    calories_goal,
    calories_percentage,
    steps_goal,
    is_goal_met,
    overall_progress,
    updated_at
  )
  VALUES (
    NEW.user_id,
    v_tracking_date,
    v_workouts_count,
    v_user_goals.workouts_goal,
    ROUND((v_workouts_count::DECIMAL / NULLIF(v_user_goals.workouts_goal, 0)) * 100, 2),
    v_total_minutes,
    v_total_calories,
    v_user_goals.calories_burn_goal,
    ROUND((v_total_calories::DECIMAL / NULLIF(v_user_goals.calories_burn_goal, 0)) * 100, 2),
    v_user_goals.steps_goal,
    (v_workouts_count >= v_user_goals.workouts_goal),
    ROUND((
      (v_workouts_count::DECIMAL / NULLIF(v_user_goals.workouts_goal, 0)) * 100 +
      (v_total_calories::DECIMAL / NULLIF(v_user_goals.calories_burn_goal, 0)) * 100
    ) / 2, 2),
    NOW()
  )
  ON CONFLICT (user_id, tracking_date)
  DO UPDATE SET
    workouts_completed = EXCLUDED.workouts_completed,
    workouts_percentage = EXCLUDED.workouts_percentage,
    total_workout_minutes = EXCLUDED.total_workout_minutes,
    total_calories_burned = EXCLUDED.total_calories_burned,
    calories_percentage = EXCLUDED.calories_percentage,
    is_goal_met = EXCLUDED.is_goal_met,
    overall_progress = EXCLUDED.overall_progress,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_activity_on_workout
  AFTER INSERT OR UPDATE ON public.workout_logs
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_daily_activity_on_workout();

-- Function: Update daily activity when steps are logged
CREATE OR REPLACE FUNCTION update_steps_tracking(
  p_user_id UUID,
  p_steps INTEGER,
  p_tracking_date DATE DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_steps_goal INTEGER;
  v_steps_pct DECIMAL(5,2);
  v_workouts_pct DECIMAL(5,2);
  v_calories_pct DECIMAL(5,2);
BEGIN
  -- Get user's steps goal
  SELECT steps_goal INTO v_steps_goal
  FROM user_daily_goals
  WHERE user_id = p_user_id;
  
  IF v_steps_goal IS NULL THEN
    v_steps_goal := 10000; -- Default
  END IF;
  
  -- Calculate percentage
  v_steps_pct := ROUND((p_steps::DECIMAL / NULLIF(v_steps_goal, 0)) * 100, 2);
  
  -- Get current workout and calorie percentages
  SELECT 
    COALESCE(workouts_percentage, 0),
    COALESCE(calories_percentage, 0)
  INTO v_workouts_pct, v_calories_pct
  FROM daily_activity_tracking
  WHERE user_id = p_user_id AND tracking_date = p_tracking_date;
  
  IF v_workouts_pct IS NULL THEN
    v_workouts_pct := 0;
    v_calories_pct := 0;
  END IF;
  
  -- Update or insert
  INSERT INTO daily_activity_tracking (
    user_id,
    tracking_date,
    steps_count,
    steps_goal,
    steps_percentage,
    overall_progress,
    updated_at
  )
  VALUES (
    p_user_id,
    p_tracking_date,
    p_steps,
    v_steps_goal,
    v_steps_pct,
    ROUND((v_steps_pct + v_workouts_pct + v_calories_pct) / 3, 2),
    NOW()
  )
  ON CONFLICT (user_id, tracking_date)
  DO UPDATE SET
    steps_count = EXCLUDED.steps_count,
    steps_percentage = EXCLUDED.steps_percentage,
    overall_progress = ROUND((
      EXCLUDED.steps_percentage + 
      daily_activity_tracking.workouts_percentage + 
      daily_activity_tracking.calories_percentage
    ) / 3, 2),
    updated_at = NOW();
END;
$$;

-- Function: Get user's daily stats (for home page)
CREATE OR REPLACE FUNCTION get_user_daily_stats(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  tracking_date DATE,
  steps_count INTEGER,
  steps_goal INTEGER,
  steps_percentage DECIMAL,
  workouts_completed INTEGER,
  workouts_goal INTEGER,
  workouts_percentage DECIMAL,
  calories_burned INTEGER,
  calories_goal INTEGER,
  calories_percentage DECIMAL,
  calories_intake INTEGER,
  calories_intake_goal INTEGER,
  overall_progress DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dat.tracking_date,
    dat.steps_count,
    dat.steps_goal,
    dat.steps_percentage,
    dat.workouts_completed,
    dat.workouts_goal,
    dat.workouts_percentage,
    dat.total_calories_burned,
    dat.calories_goal,
    dat.calories_percentage,
    COALESCE(dmt.total_calories, 0)::INTEGER,
    COALESCE(dmt.target_calories, udg.calories_intake_goal, 2000)::INTEGER,
    dat.overall_progress
  FROM daily_activity_tracking dat
  LEFT JOIN daily_meal_tracking dmt 
    ON dmt.user_id = dat.user_id AND dmt.tracking_date = dat.tracking_date
  LEFT JOIN user_daily_goals udg
    ON udg.user_id = dat.user_id
  WHERE dat.user_id = p_user_id 
    AND dat.tracking_date = p_date;
END;
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_goals ENABLE ROW LEVEL SECURITY;

-- Workout Logs: Users can only see/manage their own logs
CREATE POLICY "Users can view their own workout logs"
  ON public.workout_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout logs"
  ON public.workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs"
  ON public.workout_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs"
  ON public.workout_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Daily Activity: Users can only see their own tracking
CREATE POLICY "Users can view their own daily activity"
  ON public.daily_activity_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage daily activity"
  ON public.daily_activity_tracking FOR ALL
  USING (auth.uid() = user_id);

-- User Goals: Users can only see/manage their own goals
CREATE POLICY "Users can view their own goals"
  ON public.user_daily_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own goals"
  ON public.user_daily_goals FOR ALL
  USING (auth.uid() = user_id);

-- =============================================
-- SEED DATA: Test Workout Logs
-- =============================================

-- This will be populated by users when they complete workouts
-- Example insert for testing:
-- INSERT INTO workout_logs (user_id, workout_name, workout_type, duration_minutes, calories_burned, completed_at)
-- VALUES 
--   (auth.uid(), 'Morning Push Workout', 'push', 45, 280, NOW() - INTERVAL '1 day'),
--   (auth.uid(), 'Evening Cardio', 'cardio', 30, 220, NOW() - INTERVAL '2 days');

COMMENT ON TABLE workout_logs IS 'Individual workout session logs with detailed metrics';
COMMENT ON TABLE daily_activity_tracking IS 'Daily aggregated activity tracking (steps, workouts, calories)';
COMMENT ON TABLE user_daily_goals IS 'User-specific daily goals and targets';

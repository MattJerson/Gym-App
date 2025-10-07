-- =============================================
-- MEAL PLANS SYSTEM MIGRATION
-- Creates comprehensive meal planning with admin management
-- =============================================

-- 1. MEAL PLAN TEMPLATES (Admin-created plans)
CREATE TABLE IF NOT EXISTS meal_plan_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 4,
  plan_type VARCHAR(100) NOT NULL, -- 'weight_loss', 'bulking', 'cutting', 'maintenance', 'keto', 'vegan', etc.
  
  -- Daily macro targets
  daily_calories INTEGER NOT NULL,
  daily_protein INTEGER NOT NULL, -- grams
  daily_carbs INTEGER NOT NULL, -- grams
  daily_fats INTEGER NOT NULL, -- grams
  daily_fiber INTEGER, -- grams (optional)
  
  -- Macro ratios (for reference)
  protein_percentage INTEGER, -- e.g., 30%
  carbs_percentage INTEGER, -- e.g., 40%
  fats_percentage INTEGER, -- e.g., 30%
  
  -- Plan metadata
  difficulty_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  
  -- Meal structure
  meals_per_day INTEGER DEFAULT 3, -- 3-6 meals
  includes_snacks BOOLEAN DEFAULT true,
  
  -- Additional info
  tags TEXT[], -- ['high-protein', 'low-carb', 'gluten-free', etc.]
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USER MEAL PLAN SUBSCRIPTIONS (Users enrolled in plans)
CREATE TABLE IF NOT EXISTS user_meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES meal_plan_templates(id) ON DELETE CASCADE,
  
  -- Enrollment info
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- Calculated from duration_weeks
  is_active BOOLEAN DEFAULT true,
  
  -- Custom adjustments (user can modify their targets)
  custom_calories INTEGER, -- Override template values
  custom_protein INTEGER,
  custom_carbs INTEGER,
  custom_fats INTEGER,
  
  -- Progress tracking
  days_completed INTEGER DEFAULT 0,
  adherence_score DECIMAL(5,2), -- 0-100%
  
  -- Metadata
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, plan_id, start_date)
);

-- 3. DAILY MEAL PLAN TRACKING (Daily adherence)
CREATE TABLE IF NOT EXISTS daily_meal_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_plan_id UUID REFERENCES user_meal_plans(id) ON DELETE CASCADE,
  tracking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Daily totals (calculated from user_meal_logs)
  total_calories INTEGER DEFAULT 0,
  total_protein INTEGER DEFAULT 0,
  total_carbs INTEGER DEFAULT 0,
  total_fats INTEGER DEFAULT 0,
  total_fiber INTEGER DEFAULT 0,
  
  -- Daily targets (copied from active plan)
  target_calories INTEGER NOT NULL,
  target_protein INTEGER NOT NULL,
  target_carbs INTEGER NOT NULL,
  target_fats INTEGER NOT NULL,
  
  -- Completion metrics
  calories_percentage DECIMAL(5,2), -- % of target achieved
  protein_percentage DECIMAL(5,2),
  carbs_percentage DECIMAL(5,2),
  fats_percentage DECIMAL(5,2),
  
  is_complete BOOLEAN DEFAULT false, -- All macros within ±10%
  meals_logged INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, tracking_date)
);

-- 4. MEAL PLAN ANALYTICS (Weekly/Monthly stats)
CREATE TABLE IF NOT EXISTS meal_plan_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_plan_id UUID REFERENCES user_meal_plans(id) ON DELETE CASCADE,
  
  -- Time period
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  
  -- Weekly averages
  avg_calories INTEGER,
  avg_protein INTEGER,
  avg_carbs INTEGER,
  avg_fats INTEGER,
  
  -- Weekly adherence
  days_tracked INTEGER DEFAULT 0,
  days_completed INTEGER DEFAULT 0, -- Days meeting all targets
  weekly_adherence_score DECIMAL(5,2),
  
  -- Macro adherence breakdown
  protein_adherence DECIMAL(5,2),
  carbs_adherence DECIMAL(5,2),
  fats_adherence DECIMAL(5,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, week_start_date)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_meal_plan_templates_active ON meal_plan_templates(is_active, plan_type);
CREATE INDEX idx_meal_plan_templates_type ON meal_plan_templates(plan_type);
CREATE INDEX idx_user_meal_plans_user ON user_meal_plans(user_id, is_active);
CREATE INDEX idx_user_meal_plans_dates ON user_meal_plans(start_date, end_date);
CREATE INDEX idx_daily_tracking_user_date ON daily_meal_tracking(user_id, tracking_date);
CREATE INDEX idx_daily_tracking_date ON daily_meal_tracking(tracking_date);
CREATE INDEX idx_analytics_user_week ON meal_plan_analytics(user_id, week_start_date);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function: Update user_meal_plans end_date based on duration
CREATE OR REPLACE FUNCTION calculate_meal_plan_end_date()
RETURNS TRIGGER AS $$
DECLARE
  v_duration_weeks INTEGER;
BEGIN
  -- Get the duration_weeks from the meal plan template
  SELECT duration_weeks INTO v_duration_weeks
  FROM meal_plan_templates
  WHERE id = NEW.plan_id;
  
  -- Calculate end_date using NEW.start_date (from the new row being inserted)
  NEW.end_date := NEW.start_date + (v_duration_weeks * 7);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_meal_plan_end_date
  BEFORE INSERT ON user_meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION calculate_meal_plan_end_date();

-- Function: Update daily_meal_tracking when user_meal_logs change
CREATE OR REPLACE FUNCTION update_daily_meal_tracking()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_meal_date DATE;
  v_plan_id UUID;
  v_target_cals INTEGER;
  v_target_protein INTEGER;
  v_target_carbs INTEGER;
  v_target_fats INTEGER;
BEGIN
  -- Get values from the affected row
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_meal_date := OLD.meal_date;
  ELSE
    v_user_id := NEW.user_id;
    v_meal_date := NEW.meal_date;
  END IF;

  -- Get user's active meal plan targets
  SELECT 
    ump.id,
    COALESCE(ump.custom_calories, mpt.daily_calories),
    COALESCE(ump.custom_protein, mpt.daily_protein),
    COALESCE(ump.custom_carbs, mpt.daily_carbs),
    COALESCE(ump.custom_fats, mpt.daily_fats)
  INTO 
    v_plan_id, v_target_cals, v_target_protein, v_target_carbs, v_target_fats
  FROM user_meal_plans ump
  JOIN meal_plan_templates mpt ON ump.plan_id = mpt.id
  WHERE ump.user_id = v_user_id 
    AND ump.is_active = true
    AND v_meal_date BETWEEN ump.start_date AND COALESCE(ump.end_date, v_meal_date)
  LIMIT 1;

  -- If no active plan, use default targets
  IF v_plan_id IS NULL THEN
    v_target_cals := 2000;
    v_target_protein := 150;
    v_target_carbs := 200;
    v_target_fats := 65;
  END IF;

  -- Calculate daily totals from user_meal_logs
  INSERT INTO daily_meal_tracking (
    user_id,
    user_plan_id,
    tracking_date,
    total_calories,
    total_protein,
    total_carbs,
    total_fats,
    total_fiber,
    target_calories,
    target_protein,
    target_carbs,
    target_fats,
    calories_percentage,
    protein_percentage,
    carbs_percentage,
    fats_percentage,
    meals_logged,
    is_complete,
    updated_at
  )
  SELECT
    v_user_id,
    v_plan_id,
    v_meal_date,
    COALESCE(SUM(calories), 0),
    COALESCE(SUM(protein), 0),
    COALESCE(SUM(carbs), 0),
    COALESCE(SUM(fats), 0),
    COALESCE(SUM(fiber), 0),
    v_target_cals,
    v_target_protein,
    v_target_carbs,
    v_target_fats,
    ROUND((COALESCE(SUM(calories), 0)::DECIMAL / NULLIF(v_target_cals, 0)) * 100, 2),
    ROUND((COALESCE(SUM(protein), 0)::DECIMAL / NULLIF(v_target_protein, 0)) * 100, 2),
    ROUND((COALESCE(SUM(carbs), 0)::DECIMAL / NULLIF(v_target_carbs, 0)) * 100, 2),
    ROUND((COALESCE(SUM(fats), 0)::DECIMAL / NULLIF(v_target_fats, 0)) * 100, 2),
    COUNT(*),
    (
      COALESCE(SUM(calories), 0) BETWEEN v_target_cals * 0.9 AND v_target_cals * 1.1 AND
      COALESCE(SUM(protein), 0) BETWEEN v_target_protein * 0.9 AND v_target_protein * 1.1 AND
      COALESCE(SUM(carbs), 0) BETWEEN v_target_carbs * 0.9 AND v_target_carbs * 1.1 AND
      COALESCE(SUM(fats), 0) BETWEEN v_target_fats * 0.9 AND v_target_fats * 1.1
    ),
    NOW()
  FROM user_meal_logs
  WHERE user_id = v_user_id AND meal_date = v_meal_date
  ON CONFLICT (user_id, tracking_date) 
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein = EXCLUDED.total_protein,
    total_carbs = EXCLUDED.total_carbs,
    total_fats = EXCLUDED.total_fats,
    total_fiber = EXCLUDED.total_fiber,
    calories_percentage = EXCLUDED.calories_percentage,
    protein_percentage = EXCLUDED.protein_percentage,
    carbs_percentage = EXCLUDED.carbs_percentage,
    fats_percentage = EXCLUDED.fats_percentage,
    meals_logged = EXCLUDED.meals_logged,
    is_complete = EXCLUDED.is_complete,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_tracking_on_meal_log
  AFTER INSERT OR UPDATE OR DELETE ON user_meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_meal_tracking();

-- Function: Update meal plan adherence score
CREATE OR REPLACE FUNCTION update_meal_plan_adherence()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_meal_plans
  SET 
    adherence_score = (
      SELECT ROUND(AVG(
        CASE 
          WHEN is_complete THEN 100
          ELSE (calories_percentage + protein_percentage + carbs_percentage + fats_percentage) / 4
        END
      ), 2)
      FROM daily_meal_tracking
      WHERE user_plan_id = NEW.user_plan_id
    ),
    days_completed = (
      SELECT COUNT(*)
      FROM daily_meal_tracking
      WHERE user_plan_id = NEW.user_plan_id AND is_complete = true
    )
  WHERE id = NEW.user_plan_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_plan_adherence
  AFTER INSERT OR UPDATE ON daily_meal_tracking
  FOR EACH ROW
  WHEN (NEW.user_plan_id IS NOT NULL)
  EXECUTE FUNCTION update_meal_plan_adherence();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE meal_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_meal_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_analytics ENABLE ROW LEVEL SECURITY;

-- Templates: Everyone can read active templates, only admins can modify
CREATE POLICY "Anyone can view active meal plan templates"
  ON meal_plan_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage meal plan templates"
  ON meal_plan_templates FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- User Plans: Users can only see their own plans
CREATE POLICY "Users can view their own meal plans"
  ON user_meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in meal plans"
  ON user_meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
  ON user_meal_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- Daily Tracking: Users can only see their own tracking
CREATE POLICY "Users can view their own daily tracking"
  ON daily_meal_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage daily tracking"
  ON daily_meal_tracking FOR ALL
  USING (auth.uid() = user_id);

-- Analytics: Users can only see their own analytics
CREATE POLICY "Users can view their own analytics"
  ON meal_plan_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- SEED DATA: Default Meal Plans
-- =============================================

INSERT INTO meal_plan_templates (
  name, 
  description, 
  duration_weeks, 
  plan_type,
  daily_calories, 
  daily_protein, 
  daily_carbs, 
  daily_fats,
  protein_percentage,
  carbs_percentage,
  fats_percentage,
  difficulty_level,
  meals_per_day,
  tags
) VALUES 
  (
    'Weight Loss - Moderate Deficit',
    'Balanced caloric deficit plan for sustainable weight loss. High protein to preserve muscle mass.',
    8,
    'weight_loss',
    1800,
    135,  -- 30% protein (540 cal)
    180,  -- 40% carbs (720 cal)
    60,   -- 30% fats (540 cal)
    30, 40, 30,
    'beginner',
    4,
    ARRAY['high-protein', 'balanced', 'sustainable']
  ),
  (
    'Muscle Building - Lean Bulk',
    'Caloric surplus optimized for lean muscle gain with minimal fat accumulation.',
    12,
    'bulking',
    2800,
    210,  -- 30% protein (840 cal)
    350,  -- 50% carbs (1400 cal)
    62,   -- 20% fats (560 cal)
    30, 50, 20,
    'intermediate',
    5,
    ARRAY['high-protein', 'high-carb', 'muscle-building']
  ),
  (
    'Cutting - Contest Prep',
    'Aggressive caloric deficit for maximum fat loss while preserving muscle. Advanced users only.',
    8,
    'cutting',
    1600,
    160,  -- 40% protein (640 cal)
    120,  -- 30% carbs (480 cal)
    53,   -- 30% fats (480 cal)
    40, 30, 30,
    'advanced',
    5,
    ARRAY['high-protein', 'low-carb', 'aggressive']
  ),
  (
    'Keto - Low Carb High Fat',
    'Ketogenic diet plan with very low carbs, moderate protein, and high fats.',
    4,
    'keto',
    2000,
    100,  -- 20% protein (400 cal)
    25,   -- 5% carbs (100 cal)
    167,  -- 75% fats (1500 cal)
    20, 5, 75,
    'intermediate',
    3,
    ARRAY['keto', 'low-carb', 'high-fat']
  ),
  (
    'Maintenance - Balanced',
    'Maintain current weight with balanced macronutrient distribution.',
    0, -- Ongoing
    'maintenance',
    2200,
    165,  -- 30% protein (660 cal)
    220,  -- 40% carbs (880 cal)
    73,   -- 30% fats (660 cal)
    30, 40, 30,
    'beginner',
    3,
    ARRAY['balanced', 'maintenance', 'flexible']
  ),
  (
    'Vegan High Protein',
    'Plant-based meal plan with optimized protein intake for muscle maintenance.',
    8,
    'vegan',
    2000,
    120,  -- 24% protein (480 cal)
    250,  -- 50% carbs (1000 cal)
    58,   -- 26% fats (520 cal)
    24, 50, 26,
    'intermediate',
    4,
    ARRAY['vegan', 'plant-based', 'high-protein', 'ethical']
  );

-- =============================================
-- HELPER VIEWS
-- =============================================

-- View: Current active meal plans with progress
CREATE OR REPLACE VIEW v_active_meal_plans AS
SELECT 
  ump.id as user_plan_id,
  ump.user_id,
  mpt.name as plan_name,
  mpt.plan_type,
  mpt.description,
  COALESCE(ump.custom_calories, mpt.daily_calories) as daily_calories,
  COALESCE(ump.custom_protein, mpt.daily_protein) as daily_protein,
  COALESCE(ump.custom_carbs, mpt.daily_carbs) as daily_carbs,
  COALESCE(ump.custom_fats, mpt.daily_fats) as daily_fats,
  ump.start_date,
  ump.end_date,
  ump.days_completed,
  ump.adherence_score,
  mpt.duration_weeks,
  (CURRENT_DATE - ump.start_date) as days_active,
  CASE 
    WHEN ump.end_date IS NULL THEN 0
    ELSE ROUND(((CURRENT_DATE - ump.start_date)::DECIMAL / NULLIF((ump.end_date - ump.start_date), 0)) * 100, 2)
  END as progress_percentage
FROM user_meal_plans ump
JOIN meal_plan_templates mpt ON ump.plan_id = mpt.id
WHERE ump.is_active = true
  AND CURRENT_DATE BETWEEN ump.start_date AND COALESCE(ump.end_date, CURRENT_DATE);

COMMENT ON TABLE meal_plan_templates IS 'Admin-created meal plan templates with macro targets';
COMMENT ON TABLE user_meal_plans IS 'User enrollments in meal plans with optional custom targets';
COMMENT ON TABLE daily_meal_tracking IS 'Daily macro tracking and adherence calculations';
COMMENT ON TABLE meal_plan_analytics IS 'Weekly/monthly aggregated meal plan statistics';

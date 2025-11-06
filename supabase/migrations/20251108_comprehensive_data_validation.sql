-- =====================================================
-- COMPREHENSIVE DATA VALIDATION & CONSTRAINTS
-- =====================================================
-- Multi-layered defense:
-- 1. CHECK constraints (database level - cannot be bypassed)
-- 2. Validation triggers (pre-insert/update validation)
-- 3. NOT NULL constraints where appropriate
-- 4. Safe defaults for calculated fields
-- =====================================================

-- =====================================================
-- PART 1: Enhanced Calorie & Macro Constraints
-- =====================================================

-- Workout calories: 0-2000 cal (realistic maximum per session)
ALTER TABLE public.workout_sessions
DROP CONSTRAINT IF EXISTS workout_sessions_calories_check;

ALTER TABLE public.workout_sessions
ADD CONSTRAINT workout_sessions_calories_check 
CHECK (
  estimated_calories_burned IS NULL OR 
  (estimated_calories_burned >= 0 AND estimated_calories_burned <= 2000)
);

-- Meal calories: 0-10000 cal (accounts for binge eating, extreme bulking, full-day totals)
ALTER TABLE public.user_meal_logs
DROP CONSTRAINT IF EXISTS user_meal_logs_calories_check;

ALTER TABLE public.user_meal_logs
ADD CONSTRAINT user_meal_logs_calories_check 
CHECK (
  calories IS NULL OR 
  (calories >= 0 AND calories <= 10000)
);

-- Meal macros validation (prevent negative values)
ALTER TABLE public.user_meal_logs
DROP CONSTRAINT IF EXISTS user_meal_logs_macros_check;

ALTER TABLE public.user_meal_logs
ADD CONSTRAINT user_meal_logs_macros_check 
CHECK (
  (protein IS NULL OR protein >= 0) AND
  (carbs IS NULL OR carbs >= 0) AND
  (fats IS NULL OR fats >= 0) AND
  (fiber IS NULL OR fiber >= 0)
);

-- Weight tracking: 20-500 kg (realistic human range)
ALTER TABLE public.weight_tracking
DROP CONSTRAINT IF EXISTS weight_tracking_weight_check;

ALTER TABLE public.weight_tracking
ADD CONSTRAINT weight_tracking_weight_check 
CHECK (weight_kg > 20 AND weight_kg < 500);

-- Registration profiles weight & height validation
ALTER TABLE public.registration_profiles
DROP CONSTRAINT IF EXISTS registration_profiles_weight_check;

ALTER TABLE public.registration_profiles
ADD CONSTRAINT registration_profiles_weight_check 
CHECK (weight_kg IS NULL OR (weight_kg > 20 AND weight_kg < 500));

ALTER TABLE public.registration_profiles
DROP CONSTRAINT IF EXISTS registration_profiles_height_check;

ALTER TABLE public.registration_profiles
ADD CONSTRAINT registration_profiles_height_check 
CHECK (height_cm IS NULL OR (height_cm > 50 AND height_cm < 300));

-- =====================================================
-- PART 2: Validation Function for Meal Logging
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_meal_log()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate calories
  IF NEW.calories IS NOT NULL THEN
    IF NEW.calories < 0 OR NEW.calories > 10000 THEN
      RAISE EXCEPTION 'Invalid calories: % (must be between 0-10000)', NEW.calories;
    END IF;
  END IF;

  -- Validate macros don't exceed calories
  IF NEW.calories IS NOT NULL THEN
    DECLARE
      calculated_calories numeric;
    BEGIN
      calculated_calories := 
        COALESCE(NEW.protein, 0) * 4 + 
        COALESCE(NEW.carbs, 0) * 4 + 
        COALESCE(NEW.fats, 0) * 9;
      
      -- Allow 10% margin of error for rounding
      IF calculated_calories > (NEW.calories * 1.1) THEN
        RAISE EXCEPTION 'Macro calories (%) exceed total calories (%) by more than 10%%', 
          calculated_calories, NEW.calories;
      END IF;
    END;
  END IF;

  -- Ensure meal_date is not in future
  IF NEW.meal_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot log meals for future dates: %', NEW.meal_date;
  END IF;

  -- Ensure meal_date is not too far in past (prevent data entry errors)
  IF NEW.meal_date < (CURRENT_DATE - INTERVAL '365 days') THEN
    RAISE EXCEPTION 'Cannot log meals more than 1 year in the past: %', NEW.meal_date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger
DROP TRIGGER IF EXISTS trigger_validate_meal_log ON public.user_meal_logs;
CREATE TRIGGER trigger_validate_meal_log
  BEFORE INSERT OR UPDATE ON public.user_meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_meal_log();

-- =====================================================
-- PART 3: Validation Function for Workout Sessions
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_workout_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate calories burned
  IF NEW.estimated_calories_burned IS NOT NULL THEN
    IF NEW.estimated_calories_burned < 0 OR NEW.estimated_calories_burned > 2000 THEN
      RAISE EXCEPTION 'Invalid calories burned: % (must be between 0-2000)', 
        NEW.estimated_calories_burned;
    END IF;
  END IF;

  -- Validate duration (max 8 hours = 28800 seconds)
  IF NEW.total_duration_seconds IS NOT NULL THEN
    IF NEW.total_duration_seconds < 0 OR NEW.total_duration_seconds > 28800 THEN
      RAISE EXCEPTION 'Invalid workout duration: % seconds (must be between 0-28800)', 
        NEW.total_duration_seconds;
    END IF;
  END IF;

  -- Ensure completed_at is not in future
  IF NEW.completed_at IS NOT NULL AND NEW.completed_at > NOW() THEN
    RAISE EXCEPTION 'Cannot log workouts in the future: %', NEW.completed_at;
  END IF;

  -- Ensure completed_at is not too far in past
  IF NEW.completed_at IS NOT NULL AND NEW.completed_at < (NOW() - INTERVAL '365 days') THEN
    RAISE EXCEPTION 'Cannot log workouts more than 1 year in the past: %', NEW.completed_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger
DROP TRIGGER IF EXISTS trigger_validate_workout_session ON public.workout_sessions;
CREATE TRIGGER trigger_validate_workout_session
  BEFORE INSERT OR UPDATE ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_workout_session();

-- =====================================================
-- PART 4: Validation Function for Weight Tracking
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_weight_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate weight is in reasonable range
  IF NEW.weight_kg < 20 OR NEW.weight_kg > 500 THEN
    RAISE EXCEPTION 'Invalid weight: % kg (must be between 20-500)', NEW.weight_kg;
  END IF;

  -- Prevent future dates
  IF NEW.measurement_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot record weight for future dates: %', NEW.measurement_date;
  END IF;

  -- Prevent excessive historical dates
  IF NEW.measurement_date < (CURRENT_DATE - INTERVAL '10 years') THEN
    RAISE EXCEPTION 'Cannot record weight more than 10 years in the past: %', 
      NEW.measurement_date;
  END IF;

  -- Check for unrealistic weight changes (more than 50kg per day)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    DECLARE
      last_weight numeric;
      last_date date;
      days_diff integer;
      weight_change numeric;
    BEGIN
      -- Get last weight measurement for this user
      SELECT weight_kg, measurement_date INTO last_weight, last_date
      FROM public.weight_tracking
      WHERE user_id = NEW.user_id
        AND measurement_date < NEW.measurement_date
      ORDER BY measurement_date DESC
      LIMIT 1;

      IF last_weight IS NOT NULL THEN
        days_diff := NEW.measurement_date - last_date;
        weight_change := ABS(NEW.weight_kg - last_weight);

        -- Allow max 50kg change total, or 2kg per day
        IF weight_change > 50 OR (days_diff > 0 AND weight_change / days_diff > 2) THEN
          RAISE WARNING 'Large weight change detected: % kg in % days (from % to % kg)', 
            weight_change, days_diff, last_weight, NEW.weight_kg;
        END IF;
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger
DROP TRIGGER IF EXISTS trigger_validate_weight_tracking ON public.weight_tracking;
CREATE TRIGGER trigger_validate_weight_tracking
  BEFORE INSERT OR UPDATE ON public.weight_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_weight_tracking();

-- =====================================================
-- PART 5: Safe Division Function (Prevent Division by Zero)
-- =====================================================

CREATE OR REPLACE FUNCTION public.safe_divide(
  numerator numeric,
  denominator numeric,
  default_value numeric DEFAULT 0
)
RETURNS numeric AS $$
BEGIN
  IF denominator IS NULL OR denominator = 0 THEN
    RETURN default_value;
  END IF;
  RETURN numerator / denominator;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- PART 6: Validation Verification Queries
-- =====================================================

-- Verify workout constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.workout_sessions'::regclass
  AND conname LIKE '%calories%';

-- Verify meal constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.user_meal_logs'::regclass
  AND (conname LIKE '%calories%' OR conname LIKE '%macros%');

-- Verify weight constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.weight_tracking'::regclass
  AND conname LIKE '%weight%';

-- Verify triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('user_meal_logs', 'workout_sessions', 'weight_tracking')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- ✅ Workout calories: 0-2000 cal max
-- ✅ Meal calories: 0-10000 cal max (supports binge/bulking)
-- ✅ Macro validation: prevents negative values + calorie mismatch
-- ✅ Weight validation: 20-500 kg range + change detection
-- ✅ Date validation: prevents future dates + excessive history
-- ✅ Safe division function: prevents division by zero errors
-- ✅ Comprehensive triggers: validates ALL data before insert/update
-- =====================================================

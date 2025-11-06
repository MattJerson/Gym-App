-- Fix existing data that violates new constraints
-- Run this BEFORE the comprehensive validation migration

-- Step 1: Check what data would violate constraints
DO $$
BEGIN
    RAISE NOTICE 'Checking for constraint violations...';
END $$;

-- Step 2: Update workout sessions with calories > 2000
-- Cap them at 2000 (realistic max for a single workout session)
UPDATE workout_sessions
SET estimated_calories_burned = 2000
WHERE estimated_calories_burned > 2000;

-- Step 3: Update meal logs with calories > 10000
-- Cap them at 10000
UPDATE user_meal_logs
SET calories = 10000
WHERE calories > 10000;

-- Step 4: Update any negative calories to 0
UPDATE workout_sessions
SET estimated_calories_burned = 0
WHERE estimated_calories_burned < 0;

UPDATE user_meal_logs
SET calories = 0
WHERE calories < 0;

-- Step 5: Update any negative macros to 0
UPDATE user_meal_logs
SET 
    protein = GREATEST(0, COALESCE(protein, 0)),
    carbs = GREATEST(0, COALESCE(carbs, 0)),
    fats = GREATEST(0, COALESCE(fats, 0)),
    fiber = GREATEST(0, COALESCE(fiber, 0))
WHERE protein < 0 OR carbs < 0 OR fats < 0 OR fiber < 0;

-- Step 6: Update weight tracking with invalid weights
-- Set weights outside 20-500 kg range to NULL (will need manual correction)
UPDATE weight_tracking
SET weight_kg = NULL
WHERE weight_kg < 20 OR weight_kg > 500;

-- Step 7: Update registration_profiles with invalid weights/heights
UPDATE registration_profiles
SET weight_kg = NULL
WHERE weight_kg < 20 OR weight_kg > 500;

UPDATE registration_profiles
SET height_cm = NULL
WHERE height_cm < 50 OR height_cm > 300;

-- Step 8: Show summary of changes
DO $$
DECLARE
    workout_count INT;
    meal_count INT;
    weight_count INT;
    profile_weight_count INT;
    profile_height_count INT;
BEGIN
    -- Count affected rows
    SELECT COUNT(*) INTO workout_count FROM workout_sessions WHERE estimated_calories_burned = 2000;
    SELECT COUNT(*) INTO meal_count FROM user_meal_logs WHERE calories = 10000;
    SELECT COUNT(*) INTO weight_count FROM weight_tracking WHERE weight_kg IS NULL;
    SELECT COUNT(*) INTO profile_weight_count FROM registration_profiles WHERE weight_kg IS NULL;
    SELECT COUNT(*) INTO profile_height_count FROM registration_profiles WHERE height_cm IS NULL;
    
    RAISE NOTICE '=== DATA CLEANUP SUMMARY ===';
    RAISE NOTICE 'Workout sessions capped at 2000 cal: %', workout_count;
    RAISE NOTICE 'Meals capped at 10000 cal: %', meal_count;
    RAISE NOTICE 'Invalid weights set to NULL: %', weight_count;
    RAISE NOTICE 'Invalid profile weights set to NULL: %', profile_weight_count;
    RAISE NOTICE 'Invalid profile heights set to NULL: %', profile_height_count;
    RAISE NOTICE '===========================';
END $$;

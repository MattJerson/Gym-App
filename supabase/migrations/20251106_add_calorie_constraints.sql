-- =====================================================
-- PERMANENT FIX: Prevent Invalid Calorie Data Forever
-- =====================================================
-- This adds database constraints and fixes to prevent future issues
-- =====================================================

-- 1. Add CHECK constraint to workout_sessions to prevent unrealistic calorie burns
-- Maximum realistic calories burned in a workout: 2000 calories
ALTER TABLE public.workout_sessions
DROP CONSTRAINT IF EXISTS workout_sessions_calories_check;

ALTER TABLE public.workout_sessions
ADD CONSTRAINT workout_sessions_calories_check 
CHECK (
  estimated_calories_burned IS NULL OR 
  (estimated_calories_burned >= 0 AND estimated_calories_burned <= 2000)
);

-- This prevents inserting workouts with > 2000 calories


-- 2. Add CHECK constraint to user_meal_logs to prevent unrealistic meal calories
-- Maximum realistic calories per meal: 10000 calories
-- (accounts for binge eating, extreme bulking, full-day totals, multiple meals combined)
ALTER TABLE public.user_meal_logs
DROP CONSTRAINT IF EXISTS user_meal_logs_calories_check;

ALTER TABLE public.user_meal_logs
ADD CONSTRAINT user_meal_logs_calories_check 
CHECK (
  calories IS NULL OR 
  (calories >= 0 AND calories <= 10000)
);

-- This prevents inserting meals with > 10000 calories


-- 3. Add CHECK constraint to weight_tracking to ensure positive weights
-- Valid weight range: 20 kg to 500 kg
ALTER TABLE public.weight_tracking
DROP CONSTRAINT IF EXISTS weight_tracking_weight_check;

ALTER TABLE public.weight_tracking
ADD CONSTRAINT weight_tracking_weight_check 
CHECK (weight_kg > 20 AND weight_kg < 500);

-- This prevents negative or unrealistic weights


-- 4. Verify constraints were added
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.workout_sessions'::regclass
  AND conname LIKE '%calories%';

SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.user_meal_logs'::regclass
  AND conname LIKE '%calories%';

SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.weight_tracking'::regclass
  AND conname LIKE '%weight%';

-- Expected: Should show 3 new constraints


-- 5. Test that invalid data is now rejected
-- This should FAIL with constraint violation error:
-- INSERT INTO workout_sessions (user_id, workout_name, total_exercises, estimated_calories_burned)
-- VALUES (auth.uid(), 'Test', 1, 50000);
-- Expected error: "violates check constraint workout_sessions_calories_check"

-- 6. Test that valid data still works
-- This should SUCCEED:
-- INSERT INTO workout_sessions (user_id, workout_name, total_exercises, estimated_calories_burned)
-- VALUES (auth.uid(), 'Test', 1, 500);

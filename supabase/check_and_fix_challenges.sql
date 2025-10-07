-- Check current state of all challenges
SELECT 
  id,
  title,
  challenge_type,
  is_active,
  start_date,
  end_date,
  created_at
FROM challenges
ORDER BY is_active DESC, created_at DESC;

-- If you see challenges that should be templates (inactive) but have is_active = true,
-- run this to set them as inactive:

-- Option 1: Set ALL challenges created from the template SQL as inactive
-- (This assumes they were created recently and don't have valid future dates)
UPDATE challenges
SET is_active = false
WHERE title IN (
  'Weekly Workout Warrior',
  'Calorie Crusher Week',
  'Streak Master Challenge',
  '5-Day Consistency Challenge',
  'Weekend Warrior',
  'Exercise Variety Week',
  'Early Bird Special',
  'Progressive Overload Week',
  'Monthly Marathon',
  'Transformation 30',
  'Consistency Champion',
  'New Year New You',
  'Summer Shred Challenge',
  'Holiday Fitness Blast',
  'Spring Into Action'
);

-- Option 2: Set challenges with past dates as inactive
UPDATE challenges
SET is_active = false
WHERE end_date < NOW();

-- Option 3: Set specific challenges by ID as inactive
-- UPDATE challenges
-- SET is_active = false
-- WHERE id IN ('uuid-here', 'another-uuid-here');

-- Verify the update
SELECT 
  title,
  is_active,
  challenge_type
FROM challenges
ORDER BY is_active DESC, challenge_type, title;

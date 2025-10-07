-- Challenge Templates (Inactive - Ready to Activate)
-- These are pre-made challenges that admins can activate with automatic date calculation

-- IMPORTANT: Set is_active = false so these are templates, not active challenges
-- Also using placeholder dates since admins will activate them with proper dates

-- Weekly Challenges (8 templates)
INSERT INTO challenges (
  title, 
  description, 
  challenge_type, 
  metric_type, 
  target_value, 
  start_date, 
  end_date, 
  is_active,
  prize_description
) VALUES
(
  'Weekly Workout Warrior',
  'Complete 5 workouts this week to earn your warrior status!',
  'weekly',
  'workouts_completed',
  5,
  '2025-01-01 00:00:00+00',
  '2025-01-07 23:59:59+00',
  false,
  'Top 10 earn Workout Warrior badge'
),
(
  'Calorie Crusher Week',
  'Burn 2000+ calories this week through your workouts',
  'weekly',
  'calories_burned',
  2000,
  '2025-01-01 00:00:00+00',
  '2025-01-07 23:59:59+00',
  false,
  'Calorie Crusher badge for top performers'
),
(
  'Streak Master Challenge',
  'Maintain a 7-day workout streak',
  'weekly',
  'streak_days',
  7,
  '2025-01-01 00:00:00+00',
  '2025-01-07 23:59:59+00',
  false,
  'Streak Master badge'
),
(
  '5-Day Consistency Challenge',
  'Work out for 5 consecutive days',
  'weekly',
  'workouts_completed',
  5,
  '2025-01-01 00:00:00+00',
  '2025-01-07 23:59:59+00',
  false,
  '50 bonus points'
),
(
  'Weekend Warrior',
  'Complete 3 workouts over the weekend (Sat-Sun)',
  'weekly',
  'workouts_completed',
  3,
  '2025-01-01 00:00:00+00',
  '2025-01-07 23:59:59+00',
  false,
  'Weekend Warrior badge'
),
(
  'Exercise Variety Week',
  'Complete 20 different exercises this week',
  'weekly',
  'total_exercises',
  20,
  '2025-01-01 00:00:00+00',
  '2025-01-07 23:59:59+00',
  false,
  'Variety Master badge'
),
(
  'Early Bird Special',
  'Complete 4 morning workouts (before 10 AM)',
  'weekly',
  'workouts_completed',
  4,
  '2025-01-01 00:00:00+00',
  '2025-01-07 23:59:59+00',
  false,
  'Early Bird badge'
),
(
  'Progressive Overload Week',
  'Increase workout intensity by completing 30+ total exercises',
  'weekly',
  'total_exercises',
  30,
  '2025-01-01 00:00:00+00',
  '2025-01-07 23:59:59+00',
  false,
  'Progressive Overload badge'
);

-- Monthly Challenges (3 templates)
INSERT INTO challenges (
  title, 
  description, 
  challenge_type, 
  metric_type, 
  target_value, 
  start_date, 
  end_date, 
  is_active,
  prize_description
) VALUES
(
  'Monthly Marathon',
  'Complete 20 workouts in one month',
  'monthly',
  'workouts_completed',
  20,
  '2025-01-01 00:00:00+00',
  '2025-01-31 23:59:59+00',
  false,
  'Marathon Master badge + 200 bonus points'
),
(
  'Transformation 30',
  'Burn 8000 calories over 30 days',
  'monthly',
  'calories_burned',
  8000,
  '2025-01-01 00:00:00+00',
  '2025-01-31 23:59:59+00',
  false,
  'Transformation badge'
),
(
  'Consistency Champion',
  'Maintain a 21-day workout streak',
  'monthly',
  'streak_days',
  21,
  '2025-01-01 00:00:00+00',
  '2025-01-31 23:59:59+00',
  false,
  'Consistency Champion badge'
);

-- Special Event Challenges (4 templates)
INSERT INTO challenges (
  title, 
  description, 
  challenge_type, 
  metric_type, 
  target_value, 
  start_date, 
  end_date, 
  is_active,
  prize_description
) VALUES
(
  'New Year New You',
  'Kickstart your year with 10 workouts in 2 weeks',
  'special_event',
  'workouts_completed',
  10,
  '2025-01-01 00:00:00+00',
  '2025-01-14 23:59:59+00',
  false,
  'New Year Champion badge'
),
(
  'Summer Shred Challenge',
  'Get summer ready - 15 workouts in 3 weeks',
  'special_event',
  'workouts_completed',
  15,
  '2025-06-01 00:00:00+00',
  '2025-06-21 23:59:59+00',
  false,
  'Summer Shred badge'
),
(
  'Holiday Fitness Blast',
  'Stay active during the holidays - 8 workouts in 2 weeks',
  'special_event',
  'workouts_completed',
  8,
  '2025-12-15 00:00:00+00',
  '2025-12-31 23:59:59+00',
  false,
  'Holiday Hero badge'
),
(
  'Spring Into Action',
  'Spring challenge - burn 3000 calories in 2 weeks',
  'special_event',
  'calories_burned',
  3000,
  '2025-03-01 00:00:00+00',
  '2025-03-14 23:59:59+00',
  false,
  'Spring Champion badge'
);

-- Verify the insert
SELECT 
  title,
  challenge_type,
  is_active,
  metric_type,
  target_value
FROM challenges
WHERE is_active = false
ORDER BY challenge_type, title;

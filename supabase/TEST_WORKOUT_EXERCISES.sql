-- Test query to check workout exercises
-- Replace YOUR_USER_ID with your actual user ID

-- 1. Check what workouts are assigned to you
SELECT 
  uaw.user_id,
  uaw.workout_template_id,
  wt.name as workout_name,
  uaw.status
FROM user_assigned_workouts uaw
JOIN workout_templates wt ON uaw.workout_template_id = wt.id
WHERE uaw.user_id = '432a1fe6-1642-419d-b25f-e89251b379cc'
  AND uaw.status = 'active';

-- 2. Check exercises for those workouts
SELECT 
  we.template_id,
  wt.name as workout_name,
  we.exercise_name,
  we.sets,
  we.reps,
  we.order_index
FROM workout_exercises we
JOIN workout_templates wt ON we.template_id = wt.id
WHERE wt.id IN (
  SELECT workout_template_id 
  FROM user_assigned_workouts 
  WHERE user_id = '432a1fe6-1642-419d-b25f-e89251b379cc'
  AND status = 'active'
);

-- 3. Test the RPC function directly
SELECT * FROM get_user_assigned_workouts('432a1fe6-1642-419d-b25f-e89251b379cc');

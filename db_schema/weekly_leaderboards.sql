create view public.weekly_leaderboard as
select
  u.id as user_id,
  COALESCE(
    u.raw_user_meta_data ->> 'full_name'::text,
    u.raw_user_meta_data ->> 'name'::text,
    u.email::text
  ) as user_name,
  us.total_points,
  us.current_streak,
  us.total_workouts,
  us.badges_earned,
  row_number() over (
    order by
      us.total_points desc,
      us.current_streak desc
  ) as "position"
from
  auth.users u
  left join user_stats us on u.id = us.user_id
where
  us.last_workout_date >= (CURRENT_DATE - '7 days'::interval)
order by
  us.total_points desc,
  us.current_streak desc
limit
  100;
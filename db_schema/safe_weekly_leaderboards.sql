create view public.safe_weekly_leaderboard as
select
  anon_id,
  display_name,
  total_points,
  current_streak,
  total_workouts,
  badges_earned,
  last_workout_date,
  row_number() over (
    order by
      total_points desc,
      current_streak desc
  ) as "position"
from
  (
    select
      "substring" (md5(u.id::text), 1, 8) as anon_id,
      COALESCE(
        p.nickname,
        p.full_name,
        'User-'::text || "substring" (md5(u.id::text), 1, 8)
      ) as display_name,
      COALESCE(us.total_points, 0) as total_points,
      COALESCE(us.current_streak, 0) as current_streak,
      COALESCE(us.total_workouts, 0) as total_workouts,
      COALESCE(us.badges_earned, 0) as badges_earned,
      COALESCE(us.last_workout_date, CURRENT_DATE) as last_workout_date
    from
      auth.users u
      left join profiles p on p.id = u.id
      left join user_stats us on us.user_id = u.id
    where
      us.last_workout_date >= (CURRENT_DATE - '7 days'::interval)
    union all
    select
      'fake001'::text,
      'Athlete A'::text,
      50,
      3,
      5,
      1,
      CURRENT_DATE as "current_date"
    union all
    select
      'fake002'::text,
      'Athlete B'::text,
      45,
      2,
      4,
      0,
      CURRENT_DATE as "current_date"
    union all
    select
      'fake003'::text,
      'Athlete C'::text,
      40,
      4,
      6,
      2,
      CURRENT_DATE as "current_date"
    union all
    select
      'fake004'::text,
      'Athlete D'::text,
      35,
      1,
      3,
      0,
      CURRENT_DATE as "current_date"
    union all
    select
      'fake005'::text,
      'Athlete E'::text,
      30,
      2,
      4,
      1,
      CURRENT_DATE as "current_date"
  ) combined
limit
  100;
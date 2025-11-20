-- Drop and recreate function with new return columns
DROP FUNCTION IF EXISTS public.get_user_assigned_workouts(uuid);

CREATE OR REPLACE FUNCTION public.get_user_assigned_workouts(p_user_id uuid)
RETURNS TABLE (
  workout_id uuid,
  workout_name text,
  workout_description text,
  difficulty text,
  duration_minutes integer,
  exercise_count bigint,
  category_id uuid,
  category_name text,
  assigned_by text,
  assigned_at timestamptz,
  status text,
  notes text,
  source_type text,
  created_by_user_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- First, get explicitly assigned workouts
  SELECT 
    wt.id as workout_id,
    wt.name::text as workout_name,
    wt.description::text as workout_description,
    wt.difficulty::text,
    wt.duration_minutes,
    COUNT(we.id) as exercise_count,
    wt.category_id,
    wc.name::text as category_name,
    (rp.details->>'username')::text as assigned_by,
    uaw.assigned_at,
    uaw.status::text,
    uaw.notes::text,
    CASE 
      WHEN wt.created_by_user_id = p_user_id THEN 'self_created'::text
      ELSE 'assigned'::text
    END as source_type,
    wt.created_by_user_id
  FROM public.user_assigned_workouts uaw
  JOIN public.workout_templates wt ON uaw.workout_template_id = wt.id
  LEFT JOIN public.workout_categories wc ON wt.category_id = wc.id
  LEFT JOIN public.registration_profiles rp ON uaw.assigned_by_manager_id = rp.user_id
  LEFT JOIN public.workout_exercises we ON we.template_id = wt.id
  WHERE uaw.user_id = p_user_id
    AND uaw.status = 'active'
    AND wt.is_active = true
  GROUP BY wt.id, wt.name, wt.description, wt.difficulty, wt.duration_minutes, 
           wt.category_id, wc.name, rp.details, uaw.assigned_at, uaw.status, uaw.notes, wt.created_by_user_id
  
  UNION ALL
  
  -- Then, get all public workouts that aren't already assigned
  SELECT 
    wt.id as workout_id,
    wt.name::text as workout_name,
    wt.description::text as workout_description,
    wt.difficulty::text,
    wt.duration_minutes,
    COUNT(we.id) as exercise_count,
    wt.category_id,
    wc.name::text as category_name,
    'Community'::text as assigned_by,
    wt.created_at as assigned_at,
    'active'::text as status,
    NULL::text as notes,
    CASE 
      WHEN wt.created_by_user_id = p_user_id THEN 'self_created'::text
      ELSE 'public'::text
    END as source_type,
    wt.created_by_user_id
  FROM public.workout_templates wt
  LEFT JOIN public.workout_categories wc ON wt.category_id = wc.id
  LEFT JOIN public.workout_exercises we ON we.template_id = wt.id
  WHERE wt.assignment_type = 'public'
    AND wt.is_active = true
    AND NOT EXISTS (
      SELECT 1 
      FROM public.user_assigned_workouts uaw2 
      WHERE uaw2.workout_template_id = wt.id 
      AND uaw2.user_id = p_user_id
    )
  GROUP BY wt.id, wt.name, wt.description, wt.difficulty, wt.duration_minutes, 
           wt.category_id, wc.name, wt.created_at, wt.created_by_user_id
  
  ORDER BY assigned_at DESC;
END;
$$;

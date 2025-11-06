-- =====================================================
-- Create user_meal_plan_calculations View
-- =====================================================
-- This view combines user_meal_plans with meal_plan_templates
-- to provide calculated daily macros for active meal plans

CREATE OR REPLACE VIEW public.user_meal_plan_calculations AS
SELECT 
  ump.id,
  ump.user_id,
  ump.plan_id,
  ump.is_active,
  ump.start_date,
  ump.end_date,
  ump.days_completed,
  ump.adherence_score,
  ump.enrolled_at,
  ump.completed_at,
  
  -- Plan details from template
  mpt.name as plan_name,
  mpt.description as plan_description,
  mpt.duration_weeks,
  mpt.plan_type,
  mpt.difficulty_level,
  mpt.meals_per_day,
  mpt.includes_snacks,
  
  -- Daily macros (custom values override template defaults)
  COALESCE(ump.custom_calories, mpt.daily_calories) as daily_calories,
  COALESCE(ump.custom_protein, mpt.daily_protein) as daily_protein,
  COALESCE(ump.custom_carbs, mpt.daily_carbs) as daily_carbs,
  COALESCE(ump.custom_fats, mpt.daily_fats) as daily_fats,
  mpt.daily_fiber,
  
  -- Percentages
  mpt.protein_percentage,
  mpt.carbs_percentage,
  mpt.fats_percentage,
  
  -- Additional metadata
  mpt.tags,
  mpt.image_url,
  mpt.is_premium

FROM public.user_meal_plans ump
INNER JOIN public.meal_plan_templates mpt 
  ON ump.plan_id = mpt.id
WHERE mpt.is_active = true;

-- Grant permissions
GRANT SELECT ON public.user_meal_plan_calculations TO authenticated;
GRANT SELECT ON public.user_meal_plan_calculations TO anon;

-- Add RLS policy (inherits from base tables)
ALTER VIEW public.user_meal_plan_calculations SET (security_invoker = true);

-- =====================================================
-- Create helper function to get user's active plan
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_active_meal_plan(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  plan_id uuid,
  plan_name varchar,
  daily_calories integer,
  daily_protein integer,
  daily_carbs integer,
  daily_fats integer,
  daily_fiber integer,
  is_active boolean,
  days_completed integer,
  adherence_score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    umpc.id,
    umpc.user_id,
    umpc.plan_id,
    umpc.plan_name,
    umpc.daily_calories,
    umpc.daily_protein,
    umpc.daily_carbs,
    umpc.daily_fats,
    umpc.daily_fiber,
    umpc.is_active,
    umpc.days_completed,
    umpc.adherence_score
  FROM public.user_meal_plan_calculations umpc
  WHERE umpc.user_id = p_user_id
    AND umpc.is_active = true
  ORDER BY umpc.enrolled_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_active_meal_plan TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- The view user_meal_plan_calculations now exists
-- Service layer queries will work correctly
-- =====================================================

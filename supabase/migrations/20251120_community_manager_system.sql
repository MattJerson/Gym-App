-- =============================================
-- COMMUNITY MANAGER SYSTEM MIGRATION
-- Adds role-based permissions and user workout assignment
-- =============================================

-- 1. Add role and subscription_tier to registration_profiles
ALTER TABLE public.registration_profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'community_manager', 'admin')),
ADD COLUMN IF NOT EXISTS subscription_tier text CHECK (subscription_tier IN ('free', 'basic', 'standard', 'rapid_results'));

-- Update existing admins to have admin role
UPDATE public.registration_profiles 
SET role = 'admin' 
WHERE is_admin = true;

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_registration_profiles_role ON public.registration_profiles(role);
CREATE INDEX IF NOT EXISTS idx_registration_profiles_subscription_tier ON public.registration_profiles(subscription_tier);

-- 2. Add assignment fields to workout_templates
ALTER TABLE public.workout_templates
ADD COLUMN IF NOT EXISTS assigned_by_manager_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assignment_type text CHECK (assignment_type IN ('public', 'standard_plan', 'specific_user')) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS is_manager_created boolean DEFAULT false;

-- Create indexes for assignment queries
CREATE INDEX IF NOT EXISTS idx_workout_templates_assignment_type ON public.workout_templates(assignment_type);
CREATE INDEX IF NOT EXISTS idx_workout_templates_assigned_by ON public.workout_templates(assigned_by_manager_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_is_manager_created ON public.workout_templates(is_manager_created);

-- 3. Create user_assigned_workouts junction table
CREATE TABLE IF NOT EXISTS public.user_assigned_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_template_id uuid NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  assigned_by_manager_id uuid NOT NULL REFERENCES auth.users(id),
  assigned_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  notes text,
  due_date date,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_user_workout_assignment UNIQUE(user_id, workout_template_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_assigned_workouts_user_id ON public.user_assigned_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assigned_workouts_template_id ON public.user_assigned_workouts(workout_template_id);
CREATE INDEX IF NOT EXISTS idx_user_assigned_workouts_assigned_by ON public.user_assigned_workouts(assigned_by_manager_id);
CREATE INDEX IF NOT EXISTS idx_user_assigned_workouts_status ON public.user_assigned_workouts(status);

-- 4. Create function to get user's assigned workouts
CREATE OR REPLACE FUNCTION public.get_user_assigned_workouts(p_user_id uuid)
RETURNS TABLE (
  workout_id uuid,
  workout_name text,
  workout_description text,
  difficulty text,
  duration_minutes integer,
  category_id uuid,
  category_name text,
  assigned_by text,
  assigned_at timestamptz,
  status text,
  notes text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wt.id as workout_id,
    wt.name as workout_name,
    wt.description as workout_description,
    wt.difficulty,
    wt.duration_minutes,
    wt.category_id,
    wc.name as category_name,
    rp.details->>'username' as assigned_by,
    uaw.assigned_at,
    uaw.status,
    uaw.notes
  FROM public.user_assigned_workouts uaw
  JOIN public.workout_templates wt ON uaw.workout_template_id = wt.id
  LEFT JOIN public.workout_categories wc ON wt.category_id = wc.id
  LEFT JOIN public.registration_profiles rp ON uaw.assigned_by_manager_id = rp.user_id
  WHERE uaw.user_id = p_user_id
    AND uaw.status = 'active'
    AND wt.is_active = true
  ORDER BY uaw.assigned_at DESC;
END;
$$;

-- 5. Create function to get Standard plan users for assignment
CREATE OR REPLACE FUNCTION public.get_standard_plan_users()
RETURNS TABLE (
  user_id uuid,
  username text,
  email text,
  subscription_tier text,
  created_at timestamptz,
  last_login_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as user_id,
    rp.details->>'username' as username,
    au.email,
    rp.subscription_tier,
    au.created_at,
    rp.last_login_at
  FROM auth.users au
  JOIN public.registration_profiles rp ON au.id = rp.user_id
  WHERE rp.subscription_tier = 'standard'
    AND rp.account_status = 'active'
  ORDER BY rp.last_login_at DESC NULLS LAST;
END;
$$;

-- 6. RLS Policies for user_assigned_workouts
ALTER TABLE public.user_assigned_workouts ENABLE ROW LEVEL SECURITY;

-- Users can view their own assigned workouts
CREATE POLICY "Users can view own assigned workouts"
ON public.user_assigned_workouts
FOR SELECT
USING (auth.uid() = user_id);

-- Community managers and admins can view all assignments
CREATE POLICY "Managers can view all assignments"
ON public.user_assigned_workouts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.registration_profiles
    WHERE user_id = auth.uid()
    AND role IN ('community_manager', 'admin')
  )
);

-- Community managers and admins can create assignments
CREATE POLICY "Managers can create assignments"
ON public.user_assigned_workouts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.registration_profiles
    WHERE user_id = auth.uid()
    AND role IN ('community_manager', 'admin')
  )
);

-- Community managers can update their own assignments
CREATE POLICY "Managers can update own assignments"
ON public.user_assigned_workouts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.registration_profiles
    WHERE user_id = auth.uid()
    AND role IN ('community_manager', 'admin')
  )
  AND assigned_by_manager_id = auth.uid()
);

-- Community managers can delete their own assignments
CREATE POLICY "Managers can delete own assignments"
ON public.user_assigned_workouts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.registration_profiles
    WHERE user_id = auth.uid()
    AND role IN ('community_manager', 'admin')
  )
  AND assigned_by_manager_id = auth.uid()
);

-- 7. Update workout_templates RLS for community managers
-- Allow community managers to create templates
CREATE POLICY "Managers can create templates"
ON public.workout_templates
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.registration_profiles
    WHERE user_id = auth.uid()
    AND role IN ('community_manager', 'admin')
  )
);

-- Allow community managers to update their own created templates
CREATE POLICY "Managers can update own templates"
ON public.workout_templates
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.registration_profiles
    WHERE user_id = auth.uid()
    AND role IN ('community_manager', 'admin')
  )
  AND (
    assigned_by_manager_id = auth.uid() 
    OR created_by_user_id = auth.uid()
  )
);

-- 8. Create admin activity logging for community manager actions
CREATE TABLE IF NOT EXISTS public.community_manager_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL REFERENCES auth.users(id),
  action_type text NOT NULL CHECK (action_type IN (
    'workout_assigned',
    'workout_unassigned', 
    'workout_created',
    'workout_edited',
    'meal_plan_assigned',
    'user_messaged',
    'content_created'
  )),
  target_user_id uuid REFERENCES auth.users(id),
  target_resource_id uuid,
  target_resource_type text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cm_activity_manager_id ON public.community_manager_activity_log(manager_id);
CREATE INDEX IF NOT EXISTS idx_cm_activity_created_at ON public.community_manager_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cm_activity_action_type ON public.community_manager_activity_log(action_type);

-- 9. Create helper function to log community manager actions
CREATE OR REPLACE FUNCTION public.log_community_manager_action(
  p_action_type text,
  p_target_user_id uuid DEFAULT NULL,
  p_target_resource_id uuid DEFAULT NULL,
  p_target_resource_type text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.community_manager_activity_log (
    manager_id,
    action_type,
    target_user_id,
    target_resource_id,
    target_resource_type,
    details
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_target_user_id,
    p_target_resource_id,
    p_target_resource_type,
    p_details
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_assigned_workouts TO authenticated;
GRANT ALL ON public.community_manager_activity_log TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.get_user_assigned_workouts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_standard_plan_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_community_manager_action(text, uuid, uuid, text, jsonb) TO authenticated;

COMMENT ON TABLE public.user_assigned_workouts IS 'Tracks workout assignments from community managers to Standard plan users';
COMMENT ON TABLE public.community_manager_activity_log IS 'Audit log for all community manager actions';
COMMENT ON FUNCTION public.get_user_assigned_workouts IS 'Returns active workout assignments for a specific user';
COMMENT ON FUNCTION public.get_standard_plan_users IS 'Returns all active Standard plan subscribers for workout assignment';

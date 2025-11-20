-- Create function to get ALL users for workout assignment (not just Standard plan)
CREATE OR REPLACE FUNCTION public.get_all_users_for_assignment()
RETURNS TABLE (
  user_id uuid,
  username text,
  email text,
  subscription_tier text,
  role text,
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
    COALESCE(
      rp.details->>'username',
      SPLIT_PART(au.email::text, '@', 1),
      SUBSTRING(au.id::text, 1, 8)
    )::text as username,
    au.email::text,
    COALESCE(rp.subscription_tier::text, 'free'::text),
    COALESCE(rp.role::text, 'user'::text),
    au.created_at,
    rp.last_login_at
  FROM auth.users au
  LEFT JOIN public.registration_profiles rp ON au.id = rp.user_id
  WHERE au.deleted_at IS NULL
    AND (rp.account_status IS NULL OR rp.account_status = 'active')
  ORDER BY username ASC NULLS LAST;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_all_users_for_assignment() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_all_users_for_assignment IS 'Returns all active users with their details for workout assignment';

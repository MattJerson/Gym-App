-- Add Base (Free) Tier Subscription Package
-- This is the tier users fall back to after trial expiration

-- First, check if Base tier already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM subscription_packages WHERE slug = 'base-free'
  ) THEN
    -- Insert Base/Free tier
    INSERT INTO subscription_packages (
      name,
      slug,
      price,
      billing_interval,
      features,
      badge,
      emoji,
      accent_color,
      is_popular,
      sort_order,
      metadata
    ) VALUES (
      'Base',
      'base-free',
      0, -- Free!
      'month',
      jsonb_build_array(
        jsonb_build_object('text', '3 workouts per week', 'included', true),
        jsonb_build_object('text', 'Basic meal planning', 'included', true),
        jsonb_build_object('text', 'Progress tracking', 'included', true),
        jsonb_build_object('text', 'Community support', 'included', true),
        jsonb_build_object('text', 'Limited workout library', 'included', false),
        jsonb_build_object('text', 'No custom workouts', 'included', false),
        jsonb_build_object('text', 'Standard support', 'included', false)
      ),
      'FREE',
      '🆓',
      '#94A3B8', -- Gray color
      false, -- Not popular (we want to promote paid tiers)
      0, -- First in sort order
      jsonb_build_object(
        'workout_limit', 3,
        'workout_limit_period', 'week',
        'meal_plan_limit', 1,
        'meal_plan_limit_period', 'week',
        'custom_workouts_enabled', false,
        'advanced_analytics_enabled', false,
        'priority_support_enabled', false
      )
    );

    RAISE NOTICE '✅ Base (Free) tier created successfully';
  ELSE
    RAISE NOTICE 'ℹ️ Base tier already exists';
  END IF;
END $$;

-- Update existing trial users function to handle tier downgrade
CREATE OR REPLACE FUNCTION handle_trial_expiration()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_package_id uuid;
  expired_user record;
BEGIN
  -- Get Base tier package ID
  SELECT id INTO base_package_id
  FROM subscription_packages
  WHERE slug = 'base-free'
  LIMIT 1;

  IF base_package_id IS NULL THEN
    RAISE EXCEPTION 'Base tier package not found. Please run migration first.';
  END IF;

  -- Find all expired trial users who aren't already on a paid subscription
  FOR expired_user IN
    SELECT DISTINCT s.user_id, s.id as subscription_id
    FROM subscriptions s
    WHERE s.status = 'trialing'
      AND s.trial_end < NOW()
      AND NOT EXISTS (
        -- Check if they have an active paid subscription
        SELECT 1 FROM subscriptions s2
        WHERE s2.user_id = s.user_id
          AND s2.status = 'active'
          AND s2.id != s.id
      )
  LOOP
    -- Update trial subscription to expired
    UPDATE subscriptions
    SET 
      status = 'expired',
      updated_at = NOW()
    WHERE id = expired_user.subscription_id;

    -- Create new Base tier subscription
    INSERT INTO subscriptions (
      user_id,
      package_id,
      status,
      start_date,
      current_period_start,
      current_period_end,
      trial_start,
      trial_end,
      cancel_at_period_end,
      metadata
    ) VALUES (
      expired_user.user_id,
      base_package_id,
      'active',
      NOW(),
      NOW(),
      NOW() + INTERVAL '100 years', -- Never expires (free tier)
      NULL,
      NULL,
      false,
      jsonb_build_object(
        'downgraded_from_trial', true,
        'downgrade_date', NOW()
      )
    );

    RAISE NOTICE 'User % downgraded to Base tier', expired_user.user_id;
  END LOOP;

  RAISE NOTICE '✅ Trial expiration handling complete';
END;
$$;

-- Create a function to check if user can access premium features
CREATE OR REPLACE FUNCTION user_has_premium_access(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_access boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM subscriptions s
    JOIN subscription_packages sp ON s.package_id = sp.id
    WHERE s.user_id = user_id_param
      AND s.status IN ('active', 'trialing')
      AND sp.slug != 'base-free' -- Not on base tier
      AND (
        s.current_period_end > NOW() OR
        s.trial_end > NOW()
      )
  ) INTO has_access;

  RETURN COALESCE(has_access, false);
END;
$$;

-- Create function to get user's current tier limits
CREATE OR REPLACE FUNCTION get_user_tier_limits(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tier_limits jsonb;
BEGIN
  SELECT sp.metadata INTO tier_limits
  FROM subscriptions s
  JOIN subscription_packages sp ON s.package_id = sp.id
  WHERE s.user_id = user_id_param
    AND s.status IN ('active', 'trialing')
  ORDER BY sp.price DESC -- Get highest tier if multiple subscriptions
  LIMIT 1;

  -- If no active subscription, return base tier limits
  IF tier_limits IS NULL THEN
    SELECT metadata INTO tier_limits
    FROM subscription_packages
    WHERE slug = 'base-free'
    LIMIT 1;
  END IF;

  RETURN COALESCE(tier_limits, '{}'::jsonb);
END;
$$;

-- Create a scheduled job to run trial expiration check (if pg_cron is available)
-- Note: This requires pg_cron extension which may need to be enabled by Supabase admin

-- For manual execution, you can call:
-- SELECT handle_trial_expiration();

-- Or set up a webhook/cron job to call this periodically

COMMENT ON FUNCTION handle_trial_expiration() IS 'Automatically downgrades expired trial users to Base (Free) tier';
COMMENT ON FUNCTION user_has_premium_access(uuid) IS 'Returns true if user has access to premium features';
COMMENT ON FUNCTION get_user_tier_limits(uuid) IS 'Returns metadata object with user tier limits and permissions';

-- Example usage:
-- SELECT user_has_premium_access('user-uuid-here');
-- SELECT get_user_tier_limits('user-uuid-here');

SELECT '✅ Base tier and trial expiration handling set up successfully!' as status;

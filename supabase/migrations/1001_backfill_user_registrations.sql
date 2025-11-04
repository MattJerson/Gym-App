-- Backfill existing user registrations into admin_activity_log
-- Run this AFTER 1000_admin_activity_log.sql has been executed

DO $$
DECLARE
  v_user RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Check if we've already backfilled (prevent duplicates)
  IF EXISTS (
    SELECT 1 FROM admin_activity_log 
    WHERE activity_type = 'user_registered' 
    LIMIT 1
  ) THEN
    RAISE NOTICE '⚠️  User registrations already exist in activity log. Skipping backfill to prevent duplicates.';
    RAISE NOTICE '📊 Current count: %', (SELECT COUNT(*) FROM admin_activity_log WHERE activity_type = 'user_registered');
    RETURN;
  END IF;

  -- Insert activity logs for all existing users
  FOR v_user IN 
    SELECT 
      user_id,
      details,
      created_at
    FROM registration_profiles
    ORDER BY created_at DESC
  LOOP
    INSERT INTO admin_activity_log (
      activity_type,
      activity_category,
      title,
      description,
      metadata,
      actor_id,
      target_id,
      target_type,
      created_at
    ) VALUES (
      'user_registered',
      'user',
      'New User Registered',
      'A new user joined the platform: ' || COALESCE(v_user.details->>'display_name', 'Unknown'),
      jsonb_build_object(
        'user_id', v_user.user_id,
        'nickname', v_user.details->>'display_name'
      ),
      NULL, -- System event, no actor
      v_user.user_id,
      'user',
      v_user.created_at -- Preserve original registration date
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE '✅ Successfully backfilled % user registrations into activity log', v_count;
  RAISE NOTICE '📊 Total activities in log: %', (SELECT COUNT(*) FROM admin_activity_log);
END $$;

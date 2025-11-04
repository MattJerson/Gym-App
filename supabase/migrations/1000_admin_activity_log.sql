-- Admin Activity Log
-- Tracks all significant admin actions and system events for the dashboard

-- Create admin_activity_log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL, -- 'content_shuffle', 'notification_sent', 'user_registered', 'user_banned', 'message_deleted', 'announcement_posted', etc.
  activity_category TEXT NOT NULL, -- 'admin', 'system', 'user', 'content', 'moderation'
  title TEXT NOT NULL, -- Brief title of the activity
  description TEXT, -- Detailed description
  metadata JSONB DEFAULT '{}', -- Additional data (user_id, notification_id, content_id, etc.)
  actor_id UUID, -- Admin user who performed the action (NULL for system events)
  target_id UUID, -- ID of the affected entity (user, content, notification, etc.)
  target_type TEXT, -- Type of target ('user', 'notification', 'content', 'message', etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX idx_admin_activity_log_activity_type ON admin_activity_log(activity_type);
CREATE INDEX idx_admin_activity_log_category ON admin_activity_log(activity_category);
CREATE INDEX idx_admin_activity_log_actor_id ON admin_activity_log(actor_id);

-- Enable RLS
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Admin read policy
CREATE POLICY "Admins can view all activity logs"
ON admin_activity_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registration_profiles
    WHERE registration_profiles.user_id = auth.uid()
    AND registration_profiles.is_admin = true
  )
);

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_activity_type TEXT,
  p_activity_category TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_actor_id UUID DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO admin_activity_log (
    activity_type,
    activity_category,
    title,
    description,
    metadata,
    actor_id,
    target_id,
    target_type
  ) VALUES (
    p_activity_type,
    p_activity_category,
    p_title,
    p_description,
    p_metadata,
    COALESCE(p_actor_id, auth.uid()),
    p_target_id,
    p_target_type
  ) RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

-- Trigger function to log new user registrations
CREATE OR REPLACE FUNCTION log_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nickname TEXT;
BEGIN
  -- Extract nickname from details JSONB
  v_nickname := NEW.details->>'display_name';
  
  -- Log the registration
  PERFORM log_admin_activity(
    'user_registered',
    'user',
    'New User Registered',
    'A new user joined the platform: ' || COALESCE(v_nickname, 'Unknown'),
    jsonb_build_object(
      'user_id', NEW.user_id,
      'nickname', v_nickname,
      'email', NEW.email
    ),
    NULL, -- System event, no actor
    NEW.user_id,
    'user'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new user registrations
CREATE TRIGGER trigger_log_new_user_registration
AFTER INSERT ON registration_profiles
FOR EACH ROW
EXECUTE FUNCTION log_new_user_registration();

-- Trigger function to log message deletions
CREATE OR REPLACE FUNCTION log_message_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_channel_name TEXT;
BEGIN
  -- Get the admin who deleted the message
  v_admin_id := auth.uid();
  
  -- Get channel name
  SELECT 
    CASE 
      WHEN OLD.channel_id = 'general' THEN '💬 General'
      WHEN OLD.channel_id = 'announcements' THEN '📢 Announcements'
      ELSE OLD.channel_id
    END
  INTO v_channel_name;
  
  -- Only log if deleted by admin (not self-delete)
  IF OLD.user_id != v_admin_id THEN
    PERFORM log_admin_activity(
      'message_deleted',
      'moderation',
      'Message Deleted',
      'Admin deleted a message in ' || v_channel_name,
      jsonb_build_object(
        'message_id', OLD.id,
        'channel_id', OLD.channel_id,
        'original_user_id', OLD.user_id,
        'content_preview', LEFT(OLD.content, 50)
      ),
      v_admin_id,
      OLD.id,
      'message'
    );
  END IF;
  
  RETURN OLD;
END;
$$;

-- Trigger for message deletions (fires on actual DELETE)
CREATE TRIGGER trigger_log_message_deletion
BEFORE DELETE ON channel_messages
FOR EACH ROW
EXECUTE FUNCTION log_message_deletion();

-- Add comments for documentation
COMMENT ON TABLE admin_activity_log IS 'Tracks all significant admin actions and system events for dashboard visibility';
COMMENT ON FUNCTION log_admin_activity IS 'Helper function to easily log admin activities from anywhere in the system';
COMMENT ON FUNCTION log_new_user_registration IS 'Automatically logs new user registrations to activity log';
COMMENT ON FUNCTION log_message_deletion IS 'Automatically logs admin message deletions to activity log';

-- Backfill existing user registrations into activity log
DO $$
DECLARE
  v_user RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Insert activity logs for all existing users
  FOR v_user IN 
    SELECT 
      user_id,
      email,
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
        'nickname', v_user.details->>'display_name',
        'email', v_user.email
      ),
      NULL, -- System event, no actor
      v_user.user_id,
      'user',
      v_user.created_at -- Preserve original registration date
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE '✅ Admin Activity Log table created successfully!';
  RAISE NOTICE '✅ Triggers created: New user registrations, message deletions';
  RAISE NOTICE '✅ Backfilled % existing user registrations', v_count;
  RAISE NOTICE '📝 To log custom activities, use: SELECT log_admin_activity(type, category, title, description, metadata, actor_id, target_id, target_type);';
END $$;

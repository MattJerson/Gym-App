-- ============================================
-- ADMIN ROLE AND ANNOUNCEMENTS SYSTEM
-- ============================================
-- This migration adds admin functionality for community chat moderation
-- and creates a restricted announcements channel

-- Step 1: Add is_admin column to registration_profiles
ALTER TABLE registration_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for faster admin checks
CREATE INDEX IF NOT EXISTS idx_registration_profiles_is_admin ON registration_profiles(is_admin) WHERE is_admin = true;

-- Step 2: Update/Insert default channels (keep only general and announcements)
-- First, remove old channels that should not exist anymore
DELETE FROM channels WHERE id IN ('nutrition', 'workouts', 'progress');

-- Insert or update the two main channels
INSERT INTO channels (id, name, icon, category) VALUES
('general', 'General', '💬', 'Community'),
('announcements', 'ANNOUNCEMENTS', '📢', 'Important')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category;

-- Step 3: Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  SELECT COALESCE(is_admin, false) INTO is_admin_user
  FROM registration_profiles
  WHERE user_id = user_id_param;
  
  RETURN COALESCE(is_admin_user, false);
END;
$$;

-- Step 4: Create function to check if user can post to channel
CREATE OR REPLACE FUNCTION can_post_to_channel(user_id_param uuid, channel_id_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_is_admin boolean;
BEGIN
  -- Check if user is admin
  user_is_admin := is_user_admin(user_id_param);
  
  -- Announcements channel is only for admins
  IF channel_id_param = 'announcements' THEN
    RETURN user_is_admin;
  END IF;
  
  -- All other channels are open to everyone
  RETURN true;
END;
$$;

-- Step 5: Update RLS policies for channel_messages
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all channel messages" ON channel_messages;
DROP POLICY IF EXISTS "Users can send channel messages" ON channel_messages;
DROP POLICY IF EXISTS "Admins can delete any message" ON channel_messages;

-- Create new policies
-- Everyone can read all channel messages
CREATE POLICY "Users can read all channel messages"
  ON channel_messages
  FOR SELECT
  USING (true);

-- Users can only post to channels they have permission for
CREATE POLICY "Users can send messages to allowed channels"
  ON channel_messages
  FOR INSERT
  WITH CHECK (
    can_post_to_channel(auth.uid(), channel_id)
  );

-- Users can update their own messages
CREATE POLICY "Users can update own messages"
  ON channel_messages
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can delete any message, users can delete their own
CREATE POLICY "Users can delete own messages, admins can delete any"
  ON channel_messages
  FOR DELETE
  USING (
    auth.uid() = user_id OR is_user_admin(auth.uid())
  );

-- Step 6: Create admin helper functions for moderation
-- Function to delete message as admin
CREATE OR REPLACE FUNCTION admin_delete_message(message_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_is_admin boolean;
BEGIN
  -- Check if caller is admin
  user_is_admin := is_user_admin(auth.uid());
  
  IF NOT user_is_admin THEN
    RAISE EXCEPTION 'Only admins can delete messages';
  END IF;
  
  -- Delete the message
  DELETE FROM channel_messages WHERE id = message_id_param;
  
  RETURN true;
END;
$$;

-- Function to post message as admin (bypasses rate limits)
CREATE OR REPLACE FUNCTION admin_post_message(
  p_channel_id text,
  p_content text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_is_admin boolean;
  new_message_id uuid;
BEGIN
  -- Check if caller is admin
  user_is_admin := is_user_admin(auth.uid());
  
  IF NOT user_is_admin THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;
  
  -- Check if admin can post to this channel
  IF NOT can_post_to_channel(auth.uid(), p_channel_id) THEN
    RAISE EXCEPTION 'Cannot post to this channel';
  END IF;
  
  -- Insert message (bypasses rate limiting)
  INSERT INTO channel_messages (user_id, channel_id, content)
  VALUES (auth.uid(), p_channel_id, p_content)
  RETURNING id INTO new_message_id;
  
  RETURN new_message_id;
END;
$$;

-- Step 7: Create view for admin to monitor all chat activity
CREATE OR REPLACE VIEW admin_chat_monitoring AS
SELECT 
  cm.id as message_id,
  cm.channel_id,
  c.name as channel_name,
  cm.user_id,
  ch.username,
  ch.avatar,
  cm.content,
  cm.is_flagged,
  cm.flag_reason,
  cm.created_at,
  rp.is_admin as user_is_admin
FROM channel_messages cm
LEFT JOIN channels c ON cm.channel_id = c.id
LEFT JOIN chats ch ON cm.user_id = ch.id
LEFT JOIN registration_profiles rp ON cm.user_id = rp.user_id
ORDER BY cm.created_at DESC;

-- Grant access to admins only
ALTER VIEW admin_chat_monitoring OWNER TO postgres;

-- Step 8: Add comments
COMMENT ON COLUMN registration_profiles.is_admin IS 'Whether user has admin privileges for chat moderation';
COMMENT ON FUNCTION is_user_admin(uuid) IS 'Checks if a user has admin privileges';
COMMENT ON FUNCTION can_post_to_channel(uuid, text) IS 'Checks if a user can post to a specific channel';
COMMENT ON FUNCTION admin_delete_message(uuid) IS 'Allows admins to delete any message';
COMMENT ON FUNCTION admin_post_message(text, text) IS 'Allows admins to post messages bypassing rate limits';

-- Step 9: Create initial admin user (update with your user ID)
-- You'll need to run this separately with your actual admin user ID:
-- UPDATE registration_profiles SET is_admin = true WHERE user_id = 'YOUR_USER_ID_HERE';

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ADMIN AND ANNOUNCEMENTS SYSTEM INSTALLED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Set admin user: UPDATE registration_profiles SET is_admin = true WHERE user_id = ''YOUR_USER_ID'';';
  RAISE NOTICE '2. Announcements channel is now restricted to admins only';
  RAISE NOTICE '3. General channel is open to all users';
  RAISE NOTICE '4. Old channels (nutrition, workouts, progress) have been removed';
  RAISE NOTICE '========================================';
END $$;

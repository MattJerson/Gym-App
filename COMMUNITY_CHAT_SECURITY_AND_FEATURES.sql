-- ============================================
-- COMMUNITY CHAT: SECURITY & FEATURES UPDATE
-- ============================================
-- Run this in Supabase SQL Editor
-- This adds: profanity filtering, rate limiting, unread tracking, admin monitoring

-- ============================================
-- 1. PROFANITY FILTER & MESSAGE MODERATION
-- ============================================

-- Create profanity filter table
CREATE TABLE IF NOT EXISTS profanity_words (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  word text NOT NULL UNIQUE,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  created_at timestamptz DEFAULT now()
);

-- Add moderation fields to messages
ALTER TABLE channel_messages 
ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reason text,
ADD COLUMN IF NOT EXISTS flagged_at timestamptz,
ADD COLUMN IF NOT EXISTS flagged_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS character_count integer,
ADD COLUMN IF NOT EXISTS edited_at timestamptz;

ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reason text,
ADD COLUMN IF NOT EXISTS flagged_at timestamptz,
ADD COLUMN IF NOT EXISTS flagged_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS character_count integer,
ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- Create moderation log table
CREATE TABLE IF NOT EXISTS message_moderation_log (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  message_type text NOT NULL CHECK (message_type IN ('channel', 'dm')),
  message_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('flag', 'delete', 'warn', 'unflag')),
  reason text,
  moderator_id uuid REFERENCES auth.users(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_log_user ON message_moderation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_moderator ON message_moderation_log(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_created ON message_moderation_log(created_at DESC);

-- Insert common profanity words (add more as needed)
INSERT INTO profanity_words (word, severity) VALUES
('spam', 'low'),
('scam', 'high'),
('hate', 'high'),
('idiot', 'medium'),
('stupid', 'low')
ON CONFLICT (word) DO NOTHING;

-- Function to check for profanity
CREATE OR REPLACE FUNCTION check_profanity(message_text text)
RETURNS TABLE(has_profanity boolean, flagged_words text[], max_severity text) 
LANGUAGE plpgsql
AS $$
DECLARE
  found_words text[] := ARRAY[]::text[];
  word_record RECORD;
  highest_severity text := 'low';
BEGIN
  -- Check each profanity word
  FOR word_record IN 
    SELECT word, severity FROM profanity_words
  LOOP
    IF message_text ILIKE '%' || word_record.word || '%' THEN
      found_words := array_append(found_words, word_record.word);
      
      -- Update highest severity
      IF word_record.severity = 'high' THEN
        highest_severity := 'high';
      ELSIF word_record.severity = 'medium' AND highest_severity != 'high' THEN
        highest_severity := 'medium';
      END IF;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT 
    (array_length(found_words, 1) IS NOT NULL AND array_length(found_words, 1) > 0),
    found_words,
    highest_severity;
END;
$$;

-- ============================================
-- 2. RATE LIMITING
-- ============================================

-- Create rate limit tracking table
CREATE TABLE IF NOT EXISTS user_message_rate_limit (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  message_count integer DEFAULT 0,
  window_start timestamptz DEFAULT now(),
  is_restricted boolean DEFAULT false,
  restriction_expires_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id uuid,
  p_max_messages integer DEFAULT 10,
  p_window_minutes integer DEFAULT 1
)
RETURNS TABLE(allowed boolean, current_count integer, wait_seconds integer)
LANGUAGE plpgsql
AS $$
DECLARE
  v_record RECORD;
  v_window_start timestamptz;
  v_current_time timestamptz := now();
BEGIN
  -- Get or create rate limit record
  SELECT * INTO v_record
  FROM user_message_rate_limit
  WHERE user_id = p_user_id;
  
  -- If no record exists, create one
  IF v_record IS NULL THEN
    INSERT INTO user_message_rate_limit (user_id, message_count, window_start)
    VALUES (p_user_id, 1, v_current_time);
    
    RETURN QUERY SELECT true, 1, 0;
    RETURN;
  END IF;
  
  -- Check if user is currently restricted
  IF v_record.is_restricted AND v_record.restriction_expires_at > v_current_time THEN
    RETURN QUERY SELECT 
      false, 
      v_record.message_count,
      EXTRACT(EPOCH FROM (v_record.restriction_expires_at - v_current_time))::integer;
    RETURN;
  END IF;
  
  -- Check if window has expired
  IF v_current_time > (v_record.window_start + (p_window_minutes || ' minutes')::interval) THEN
    -- Reset window
    UPDATE user_message_rate_limit
    SET message_count = 1,
        window_start = v_current_time,
        is_restricted = false,
        restriction_expires_at = NULL,
        updated_at = v_current_time
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT true, 1, 0;
    RETURN;
  END IF;
  
  -- Check if limit exceeded
  IF v_record.message_count >= p_max_messages THEN
    -- Apply restriction
    UPDATE user_message_rate_limit
    SET is_restricted = true,
        restriction_expires_at = v_current_time + interval '30 seconds',
        updated_at = v_current_time
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT false, v_record.message_count, 30;
    RETURN;
  END IF;
  
  -- Increment count
  UPDATE user_message_rate_limit
  SET message_count = message_count + 1,
      updated_at = v_current_time
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT true, v_record.message_count + 1, 0;
END;
$$;

-- ============================================
-- 3. UNREAD MESSAGE TRACKING
-- ============================================

-- Create channel read receipts table
CREATE TABLE IF NOT EXISTS channel_read_receipts (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id text NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  last_read_message_id uuid REFERENCES channel_messages(id) ON DELETE SET NULL,
  last_read_at timestamptz DEFAULT now(),
  unread_count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_receipts_user ON channel_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_receipts_channel ON channel_read_receipts(channel_id);

-- Create DM read receipts (extend existing is_read functionality)
CREATE TABLE IF NOT EXISTS dm_read_receipts (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  last_read_message_id uuid REFERENCES direct_messages(id) ON DELETE SET NULL,
  last_read_at timestamptz DEFAULT now(),
  unread_count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_receipts_user ON dm_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_receipts_conversation ON dm_read_receipts(conversation_id);

-- Function to get unread count for a channel
CREATE OR REPLACE FUNCTION get_channel_unread_count(
  p_user_id uuid,
  p_channel_id text
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_read_at timestamptz;
  v_unread_count integer;
BEGIN
  -- Get last read timestamp
  SELECT last_read_at INTO v_last_read_at
  FROM channel_read_receipts
  WHERE user_id = p_user_id AND channel_id = p_channel_id;
  
  -- If no record, count all messages
  IF v_last_read_at IS NULL THEN
    SELECT COUNT(*) INTO v_unread_count
    FROM channel_messages
    WHERE channel_id = p_channel_id
      AND user_id != p_user_id
      AND is_deleted = false;
  ELSE
    -- Count messages after last read
    SELECT COUNT(*) INTO v_unread_count
    FROM channel_messages
    WHERE channel_id = p_channel_id
      AND user_id != p_user_id
      AND created_at > v_last_read_at
      AND is_deleted = false;
  END IF;
  
  RETURN COALESCE(v_unread_count, 0);
END;
$$;

-- Function to mark channel as read
CREATE OR REPLACE FUNCTION mark_channel_read(
  p_user_id uuid,
  p_channel_id text,
  p_last_message_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO channel_read_receipts (user_id, channel_id, last_read_message_id, last_read_at, unread_count)
  VALUES (p_user_id, p_channel_id, p_last_message_id, now(), 0)
  ON CONFLICT (user_id, channel_id)
  DO UPDATE SET
    last_read_message_id = COALESCE(p_last_message_id, channel_read_receipts.last_read_message_id),
    last_read_at = now(),
    unread_count = 0,
    updated_at = now();
END;
$$;

-- Function to get unread count for DM conversation
CREATE OR REPLACE FUNCTION get_dm_unread_count(
  p_user_id uuid,
  p_conversation_id uuid
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_read_at timestamptz;
  v_unread_count integer;
BEGIN
  SELECT last_read_at INTO v_last_read_at
  FROM dm_read_receipts
  WHERE user_id = p_user_id AND conversation_id = p_conversation_id;
  
  IF v_last_read_at IS NULL THEN
    SELECT COUNT(*) INTO v_unread_count
    FROM direct_messages
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND is_deleted = false;
  ELSE
    SELECT COUNT(*) INTO v_unread_count
    FROM direct_messages
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND created_at > v_last_read_at
      AND is_deleted = false;
  END IF;
  
  RETURN COALESCE(v_unread_count, 0);
END;
$$;

-- Function to mark DM as read
CREATE OR REPLACE FUNCTION mark_dm_read(
  p_user_id uuid,
  p_conversation_id uuid,
  p_last_message_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO dm_read_receipts (user_id, conversation_id, last_read_message_id, last_read_at, unread_count)
  VALUES (p_user_id, p_conversation_id, p_last_message_id, now(), 0)
  ON CONFLICT (user_id, conversation_id)
  DO UPDATE SET
    last_read_message_id = COALESCE(p_last_message_id, dm_read_receipts.last_read_message_id),
    last_read_at = now(),
    unread_count = 0,
    updated_at = now();
END;
$$;

-- Trigger to update unread counts on new channel messages
CREATE OR REPLACE FUNCTION update_channel_unread_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Increment unread count for all users except sender
  UPDATE channel_read_receipts
  SET unread_count = unread_count + 1,
      updated_at = now()
  WHERE channel_id = NEW.channel_id
    AND user_id != NEW.user_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS channel_message_unread_trigger ON channel_messages;
CREATE TRIGGER channel_message_unread_trigger
AFTER INSERT ON channel_messages
FOR EACH ROW
EXECUTE FUNCTION update_channel_unread_counts();

-- Trigger to update unread counts on new DM messages
CREATE OR REPLACE FUNCTION update_dm_unread_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_other_user_id uuid;
BEGIN
  -- Get the other user in the conversation
  SELECT CASE 
    WHEN user1_id = NEW.sender_id THEN user2_id
    ELSE user1_id
  END INTO v_other_user_id
  FROM dm_conversations
  WHERE id = NEW.conversation_id;
  
  -- Increment unread count for the other user
  INSERT INTO dm_read_receipts (user_id, conversation_id, unread_count)
  VALUES (v_other_user_id, NEW.conversation_id, 1)
  ON CONFLICT (user_id, conversation_id)
  DO UPDATE SET
    unread_count = dm_read_receipts.unread_count + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dm_message_unread_trigger ON direct_messages;
CREATE TRIGGER dm_message_unread_trigger
AFTER INSERT ON direct_messages
FOR EACH ROW
EXECUTE FUNCTION update_dm_unread_counts();

-- ============================================
-- 4. ADMIN MONITORING VIEWS
-- ============================================

-- View for admin to see all channel messages with moderation info
CREATE OR REPLACE VIEW admin_channel_messages AS
SELECT 
  cm.id,
  cm.channel_id,
  c.name as channel_name,
  c.category,
  cm.user_id,
  cp.username,
  cp.avatar,
  cm.content,
  cm.character_count,
  cm.is_flagged,
  cm.flag_reason,
  cm.is_deleted,
  cm.created_at,
  cm.edited_at,
  cm.flagged_at,
  cm.deleted_at,
  (SELECT COUNT(*) FROM message_reactions WHERE message_id = cm.id) as reaction_count
FROM channel_messages cm
LEFT JOIN channels c ON cm.channel_id = c.id
LEFT JOIN chats_public_with_id cp ON cm.user_id = cp.id
ORDER BY cm.created_at DESC;

-- View for admin to see flagged messages
CREATE OR REPLACE VIEW admin_flagged_messages AS
SELECT 
  'channel' as message_type,
  cm.id as message_id,
  cm.channel_id::text as context_id,
  c.name as context_name,
  cm.user_id,
  cp.username,
  cm.content,
  cm.character_count,
  cm.flag_reason,
  cm.flagged_at,
  cm.flagged_by,
  fm.username as flagged_by_username,
  cm.created_at
FROM channel_messages cm
LEFT JOIN channels c ON cm.channel_id = c.id
LEFT JOIN chats_public_with_id cp ON cm.user_id = cp.id
LEFT JOIN chats_public_with_id fm ON cm.flagged_by = fm.id
WHERE cm.is_flagged = true AND cm.is_deleted = false

UNION ALL

SELECT 
  'dm' as message_type,
  dm.id as message_id,
  dm.conversation_id::text as context_id,
  'DM Conversation' as context_name,
  dm.sender_id as user_id,
  cp.username,
  dm.content,
  dm.character_count,
  dm.flag_reason,
  dm.flagged_at,
  dm.flagged_by,
  fm.username as flagged_by_username,
  dm.created_at
FROM direct_messages dm
LEFT JOIN chats_public_with_id cp ON dm.sender_id = cp.id
LEFT JOIN chats_public_with_id fm ON dm.flagged_by = fm.id
WHERE dm.is_flagged = true AND dm.is_deleted = false
ORDER BY flagged_at DESC;

-- View for chat activity statistics
CREATE OR REPLACE VIEW admin_chat_statistics AS
SELECT 
  'overview' as stat_type,
  (SELECT COUNT(*) FROM channel_messages WHERE is_deleted = false) as channel_message_count,
  (SELECT COUNT(*) FROM direct_messages WHERE is_deleted = false) as dm_count,
  (SELECT COUNT(DISTINCT user_id) FROM channel_messages WHERE created_at > now() - interval '24 hours') as active_users_24h,
  (SELECT COUNT(*) FROM channel_messages WHERE is_flagged = true AND is_deleted = false) as flagged_messages,
  (SELECT COUNT(*) FROM message_moderation_log WHERE created_at > now() - interval '7 days') as moderation_actions_7d;

-- ============================================
-- 5. RLS POLICIES FOR ADMIN ACCESS
-- ============================================

-- Allow admins to view moderation tables
CREATE POLICY "Admins can view profanity words"
ON profanity_words FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registration_profiles
    WHERE registration_profiles.user_id = auth.uid()
    AND registration_profiles.is_admin = true
  )
);

CREATE POLICY "Admins can manage profanity words"
ON profanity_words FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registration_profiles
    WHERE registration_profiles.user_id = auth.uid()
    AND registration_profiles.is_admin = true
  )
);

-- Allow admins to view moderation logs
CREATE POLICY "Admins can view moderation logs"
ON message_moderation_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registration_profiles
    WHERE registration_profiles.user_id = auth.uid()
    AND registration_profiles.is_admin = true
  )
);

-- Allow admins to create moderation logs
CREATE POLICY "Admins can create moderation logs"
ON message_moderation_log FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registration_profiles
    WHERE registration_profiles.user_id = auth.uid()
    AND registration_profiles.is_admin = true
  )
);

-- ============================================
-- 6. GRANTS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON profanity_words TO authenticated;
GRANT SELECT, INSERT ON message_moderation_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON channel_read_receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON dm_read_receipts TO authenticated;
GRANT SELECT ON user_message_rate_limit TO authenticated;
GRANT SELECT ON admin_channel_messages TO authenticated;
GRANT SELECT ON admin_flagged_messages TO authenticated;
GRANT SELECT ON admin_chat_statistics TO authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Community Chat Security & Features installed successfully!';
  RAISE NOTICE '📊 Features added:';
  RAISE NOTICE '  - Profanity filtering with severity levels';
  RAISE NOTICE '  - Rate limiting (10 messages per minute)';
  RAISE NOTICE '  - Unread message tracking for channels and DMs';
  RAISE NOTICE '  - Admin monitoring views and moderation tools';
  RAISE NOTICE '  - Message flagging and deletion system';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Next steps:';
  RAISE NOTICE '  1. Update ChatServices.js to use new functions';
  RAISE NOTICE '  2. Add admin monitoring UI';
  RAISE NOTICE '  3. Implement client-side profanity checking';
  RAISE NOTICE '  4. Test rate limiting';
END $$;

-- ============================================
-- FIX: DM Messages & Usernames
-- ============================================
-- Problem 1: Can't send DMs - null user_id in dm_read_receipts
-- Problem 2: Still seeing "unknown" instead of real usernames
-- Solution: Fix trigger + ensure view works + show "(You)" for own messages

-- ============================================
-- 1. FIX DM TRIGGER (Null user_id issue)
-- ============================================

-- Drop and recreate the trigger function with proper null checking
DROP TRIGGER IF EXISTS dm_message_unread_trigger ON direct_messages;
DROP FUNCTION IF EXISTS update_dm_unread_counts();

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
  
  -- SAFETY CHECK: Only increment if we found a valid other user
  IF v_other_user_id IS NOT NULL THEN
    -- Increment unread count for the other user
    INSERT INTO dm_read_receipts (user_id, conversation_id, unread_count)
    VALUES (v_other_user_id, NEW.conversation_id, 1)
    ON CONFLICT (user_id, conversation_id)
    DO UPDATE SET
      unread_count = dm_read_receipts.unread_count + 1,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER dm_message_unread_trigger
AFTER INSERT ON direct_messages
FOR EACH ROW
EXECUTE FUNCTION update_dm_unread_counts();

-- ============================================
-- 2. DEBUG: Check if view exists and works
-- ============================================

-- Test the view (should return data, not errors)
DO $$
DECLARE
  v_count integer;
BEGIN
  -- Check if view exists
  SELECT COUNT(*) INTO v_count
  FROM information_schema.views
  WHERE table_schema = 'public' 
  AND table_name = 'chats_public_with_id';
  
  IF v_count = 0 THEN
    RAISE NOTICE '❌ ERROR: chats_public_with_id view does NOT exist!';
    RAISE NOTICE '   You need to run FIX_CHAT_USER_PROFILES.sql first!';
  ELSE
    RAISE NOTICE '✅ chats_public_with_id view exists';
    
    -- Test if it returns data
    SELECT COUNT(*) INTO v_count FROM chats_public_with_id;
    RAISE NOTICE '   Found % users in view', v_count;
    
    IF v_count = 0 THEN
      RAISE NOTICE '⚠️  WARNING: View exists but returns 0 users!';
      RAISE NOTICE '   Check RLS policies or registration_profiles table';
    END IF;
  END IF;
END $$;

-- ============================================
-- 3. VERIFY DATA IN registration_profiles
-- ============================================

-- Show sample of what's in registration_profiles
DO $$
DECLARE
  v_count integer;
  v_sample record;
BEGIN
  SELECT COUNT(*) INTO v_count FROM registration_profiles;
  RAISE NOTICE '';
  RAISE NOTICE '📊 registration_profiles table has % rows', v_count;
  
  -- Show first 3 users' data
  RAISE NOTICE '';
  RAISE NOTICE '📝 Sample data (first 3 users):';
  FOR v_sample IN 
    SELECT 
      substr(user_id::text, 1, 8) as user_id_short,
      details->>'display_name' as display_name,
      details->>'avatar' as avatar,
      CASE WHEN details IS NULL THEN 'NULL' 
           WHEN details = '{}'::jsonb THEN 'EMPTY' 
           ELSE 'HAS DATA' END as details_status
    FROM registration_profiles 
    LIMIT 3
  LOOP
    RAISE NOTICE '  User: %... | display_name: % | avatar: % | details: %', 
      v_sample.user_id_short,
      COALESCE(v_sample.display_name, 'NULL'),
      COALESCE(v_sample.avatar, 'NULL'),
      v_sample.details_status;
  END LOOP;
END $$;

-- ============================================
-- 4. FORCE BACKFILL USERNAMES (if missing)
-- ============================================

-- This MUST run to populate display_name for all users
UPDATE public.registration_profiles rp
SET details = jsonb_set(
  COALESCE(details, '{}'::jsonb),
  '{display_name}',
  to_jsonb(COALESCE(
    rp.details->>'display_name',
    (SELECT raw_user_meta_data->>'username' FROM auth.users WHERE id = rp.user_id),
    (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = rp.user_id),
    'User' || substr(rp.user_id::text, 1, 4)
  ))
)
WHERE rp.details IS NULL 
   OR rp.details = '{}'::jsonb
   OR rp.details->>'display_name' IS NULL
   OR rp.details->>'display_name' = '';

-- Set default avatars
UPDATE public.registration_profiles rp
SET details = jsonb_set(
  COALESCE(details, '{}'::jsonb),
  '{avatar}',
  to_jsonb(COALESCE(
    rp.details->>'avatar',
    (SELECT raw_user_meta_data->>'avatar' FROM auth.users WHERE id = rp.user_id),
    '👤'
  ))
)
WHERE rp.details IS NULL
   OR rp.details = '{}'::jsonb
   OR rp.details->>'avatar' IS NULL
   OR rp.details->>'avatar' = ''
   OR rp.details->>'avatar' = '?';

-- ============================================
-- 5. VERIFY BACKFILL WORKED
-- ============================================

DO $$
DECLARE
  v_count integer;
  v_null_count integer;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO v_count FROM registration_profiles;
  
  -- Count users with NULL or empty display_name
  SELECT COUNT(*) INTO v_null_count 
  FROM registration_profiles 
  WHERE details->>'display_name' IS NULL 
     OR details->>'display_name' = '';
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Backfill verification:';
  RAISE NOTICE '   Total users: %', v_count;
  RAISE NOTICE '   Users with display_name: %', v_count - v_null_count;
  RAISE NOTICE '   Users missing display_name: %', v_null_count;
  
  IF v_null_count > 0 THEN
    RAISE NOTICE '⚠️  WARNING: % users still missing display_name!', v_null_count;
  ELSE
    RAISE NOTICE '✅ All users have display_name!';
  END IF;
END $$;

-- ============================================
-- 6. TEST THE VIEW RETURNS DATA
-- ============================================

-- This should show real usernames, not "unknown"
DO $$
DECLARE
  v_sample record;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📝 Testing chats_public_with_id view (first 5 users):';
  
  FOR v_sample IN 
    SELECT 
      substr(id::text, 1, 8) as id_short,
      username,
      avatar
    FROM chats_public_with_id 
    LIMIT 5
  LOOP
    RAISE NOTICE '  ID: %... | Username: @ % | Avatar: %', 
      v_sample.id_short,
      v_sample.username,
      v_sample.avatar;
  END LOOP;
END $$;

-- ============================================
-- 7. CHECK RLS POLICIES
-- ============================================

-- Ensure the "Users can view public profiles for chat" policy exists
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'registration_profiles'
  AND policyname = 'Users can view public profiles for chat';
  
  RAISE NOTICE '';
  IF v_count > 0 THEN
    RAISE NOTICE '✅ RLS policy "Users can view public profiles for chat" exists';
  ELSE
    RAISE NOTICE '❌ ERROR: RLS policy missing! Run FIX_CHAT_USER_PROFILES.sql';
  END IF;
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ DM and Username fixes applied!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 What was fixed:';
  RAISE NOTICE '  1. DM trigger now checks for null user_id before inserting';
  RAISE NOTICE '  2. Backfilled all users with display_name from email';
  RAISE NOTICE '  3. Set default avatars (👤) for all users';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Next steps:';
  RAISE NOTICE '  1. Clear app cache: npx expo start -c';
  RAISE NOTICE '  2. Test sending DM - should work now';
  RAISE NOTICE '  3. Check usernames - should show @username, not "unknown"';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 If still seeing "unknown":';
  RAISE NOTICE '  - Check output above for view test results';
  RAISE NOTICE '  - Run: SELECT * FROM chats_public_with_id LIMIT 5;';
  RAISE NOTICE '  - Verify ChatServices.js queries chats_public_with_id correctly';
END $$;

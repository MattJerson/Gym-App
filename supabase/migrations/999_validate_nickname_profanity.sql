-- ============================================
-- NICKNAME PROFANITY VALIDATION
-- ============================================
-- Add database-level validation to prevent inappropriate nicknames
-- This ensures even direct database updates are validated

-- Function to validate nickname on insert/update
CREATE OR REPLACE FUNCTION validate_nickname_profanity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  profanity_check RECORD;
BEGIN
  -- Only validate if nickname is being set/changed
  IF NEW.nickname IS NOT NULL AND NEW.nickname != '' THEN
    -- Check for profanity
    SELECT * INTO profanity_check FROM check_profanity(NEW.nickname);
    
    IF profanity_check.has_profanity THEN
      RAISE EXCEPTION 'Nickname contains inappropriate language: %', 
        array_to_string(profanity_check.flagged_words, ', ')
        USING ERRCODE = '23514'; -- check_violation
    END IF;
    
    -- Additional nickname validation
    IF length(trim(NEW.nickname)) < 3 THEN
      RAISE EXCEPTION 'Nickname must be at least 3 characters'
        USING ERRCODE = '23514';
    END IF;
    
    IF length(trim(NEW.nickname)) > 20 THEN
      RAISE EXCEPTION 'Nickname must be 20 characters or less'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to registration_profiles table
DROP TRIGGER IF EXISTS validate_nickname_before_insert_or_update ON registration_profiles;
CREATE TRIGGER validate_nickname_before_insert_or_update
  BEFORE INSERT OR UPDATE OF nickname ON registration_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_nickname_profanity();

-- Add trigger to profiles table (if it exists and has nickname column)
DO $$
BEGIN
  -- Check if profiles table has nickname column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'nickname'
  ) THEN
    DROP TRIGGER IF EXISTS validate_nickname_before_insert_or_update ON profiles;
    CREATE TRIGGER validate_nickname_before_insert_or_update
      BEFORE INSERT OR UPDATE OF nickname ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION validate_nickname_profanity();
  END IF;
END $$;

-- Test the validation
DO $nickname_test$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_cases text[] := ARRAY[
    'ValidName',
    'f@ck',
    'sh!thead',
    'b1tch',
    'GoodUser123',
    'a$$hole'
  ];
  test_case text;
  should_fail boolean;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTING NICKNAME VALIDATION';
  RAISE NOTICE '========================================';
  
  FOREACH test_case IN ARRAY test_cases
  LOOP
    BEGIN
      -- Try to insert with this nickname
      INSERT INTO registration_profiles (user_id, nickname)
      VALUES (test_user_id, test_case)
      ON CONFLICT (user_id) DO UPDATE SET nickname = test_case;
      
      RAISE NOTICE 'Test: "%" -> PASSED (nickname allowed)', test_case;
      
      -- Clean up
      DELETE FROM registration_profiles WHERE user_id = test_user_id;
      
    EXCEPTION WHEN check_violation THEN
      RAISE NOTICE 'Test: "%" -> BLOCKED (inappropriate)', test_case;
    END;
  END LOOP;
  
  RAISE NOTICE '========================================';
END $nickname_test$;

-- Add comment
COMMENT ON FUNCTION validate_nickname_profanity() IS 'Validates nickname does not contain profanity and meets length requirements (3-20 characters)';

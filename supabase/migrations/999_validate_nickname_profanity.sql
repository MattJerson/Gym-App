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
  display_name_value TEXT;
BEGIN
  -- Extract display_name from details JSONB column
  display_name_value := NEW.details->>'display_name';
  
  -- Only validate if display_name is being set/changed
  IF display_name_value IS NOT NULL AND display_name_value != '' THEN
    -- Check for profanity
    SELECT * INTO profanity_check FROM check_profanity(display_name_value);
    
    IF profanity_check.has_profanity THEN
      RAISE EXCEPTION 'Nickname contains inappropriate language: %', 
        array_to_string(profanity_check.flagged_words, ', ')
        USING ERRCODE = '23514'; -- check_violation
    END IF;
    
    -- Additional nickname validation
    IF length(trim(display_name_value)) < 3 THEN
      RAISE EXCEPTION 'Nickname must be at least 3 characters'
        USING ERRCODE = '23514';
    END IF;
    
    IF length(trim(display_name_value)) > 20 THEN
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
  BEFORE INSERT OR UPDATE OF details ON registration_profiles
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
    -- Create separate function for profiles table
    CREATE OR REPLACE FUNCTION validate_profiles_nickname_profanity()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $func$
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
            USING ERRCODE = '23514';
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
    $func$;
    
    DROP TRIGGER IF EXISTS validate_profiles_nickname_before_insert_or_update ON profiles;
    CREATE TRIGGER validate_profiles_nickname_before_insert_or_update
      BEFORE INSERT OR UPDATE OF nickname ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION validate_profiles_nickname_profanity();
  END IF;
END $$;

-- Test the validation logic (without actual inserts)
DO $nickname_test$
DECLARE
  test_cases text[] := ARRAY[
    'ValidName',
    'f@ck',
    'sh!thead',
    'b1tch',
    'GoodUser123',
    'a$$hole'
  ];
  test_case text;
  profanity_result RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTING NICKNAME VALIDATION LOGIC';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Testing profanity detection on sample nicknames:';
  RAISE NOTICE '';
  
  FOREACH test_case IN ARRAY test_cases
  LOOP
    -- Test the profanity check directly
    SELECT * INTO profanity_result FROM check_profanity(test_case);
    
    IF profanity_result.has_profanity THEN
      RAISE NOTICE 'Test: "%" -> ❌ WOULD BE BLOCKED (profanity detected: %)', 
        test_case, 
        array_to_string(profanity_result.flagged_words, ', ');
    ELSIF length(trim(test_case)) < 3 THEN
      RAISE NOTICE 'Test: "%" -> ❌ WOULD BE BLOCKED (too short, must be 3+ characters)', test_case;
    ELSIF length(trim(test_case)) > 20 THEN
      RAISE NOTICE 'Test: "%" -> ❌ WOULD BE BLOCKED (too long, must be 20 or fewer characters)', test_case;
    ELSE
      RAISE NOTICE 'Test: "%" -> ✅ WOULD BE ALLOWED', test_case;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Trigger installed successfully!';
  RAISE NOTICE 'The trigger will validate nicknames when users:';
  RAISE NOTICE '  - Register a new account';
  RAISE NOTICE '  - Update their profile display name';
  RAISE NOTICE '========================================';
END $nickname_test$;

-- Add comment
COMMENT ON FUNCTION validate_nickname_profanity() IS 'Validates display_name in details JSONB does not contain profanity and meets length requirements (3-20 characters)';

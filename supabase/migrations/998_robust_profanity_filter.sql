-- ============================================
-- ROBUST PROFANITY FILTERING SYSTEM
-- ============================================
-- This migration enhances the profanity detection system to catch
-- common circumvention techniques like leetspeak, special characters,
-- and spacing variations (e.g., f@ck, f u c k, f*ck)

-- Add comprehensive profanity word list with variations
INSERT INTO profanity_words (word, severity) VALUES
-- High severity - slurs, hate speech, violent threats
('nigger', 'high'),
('nigga', 'high'),
('faggot', 'high'),
('retard', 'high'),
('kys', 'high'),
('kill yourself', 'high'),
('die', 'high'),
('suicide', 'high'),

-- Medium severity - sexual/offensive
('fuck', 'medium'),
('shit', 'medium'),
('bitch', 'medium'),
('cunt', 'medium'),
('dick', 'medium'),
('pussy', 'medium'),
('cock', 'medium'),
('whore', 'medium'),
('slut', 'medium'),
('ass', 'medium'),
('asshole', 'medium'),
('bastard', 'medium'),
('damn', 'medium'),
('hell', 'medium'),

-- Low severity - mild insults
('idiot', 'low'),
('stupid', 'low'),
('dumb', 'low'),
('moron', 'low'),
('loser', 'low')
ON CONFLICT (word) DO UPDATE SET severity = EXCLUDED.severity;

-- Create function to normalize text (handle leetspeak and variations)
CREATE OR REPLACE FUNCTION normalize_text(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  normalized text;
BEGIN
  normalized := lower(input_text);
  
  -- Remove common separators that might be used to bypass filters
  normalized := regexp_replace(normalized, '[\s\-_\.\,\|]+', '', 'g');
  
  -- Replace common leetspeak and special character substitutions
  normalized := replace(normalized, '@', 'a');
  normalized := replace(normalized, '4', 'a');
  normalized := replace(normalized, '∆', 'a');
  normalized := replace(normalized, '8', 'b');
  normalized := replace(normalized, '€', 'e');
  normalized := replace(normalized, '3', 'e');
  normalized := replace(normalized, '1', 'i');
  normalized := replace(normalized, '!', 'i');
  normalized := replace(normalized, '|', 'i');
  normalized := replace(normalized, '0', 'o');
  normalized := replace(normalized, '$', 's');
  normalized := replace(normalized, '5', 's');
  normalized := replace(normalized, '7', 't');
  normalized := replace(normalized, '+', 't');
  normalized := replace(normalized, '*', '');
  normalized := replace(normalized, '#', '');
  normalized := replace(normalized, '%', '');
  normalized := replace(normalized, '&', '');
  
  RETURN normalized;
END;
$$;

-- Enhanced profanity check function with pattern matching
CREATE OR REPLACE FUNCTION check_profanity(message_text text)
RETURNS TABLE(has_profanity boolean, flagged_words text[], max_severity text) 
LANGUAGE plpgsql
AS $$
DECLARE
  found_words text[] := ARRAY[]::text[];
  word_record RECORD;
  highest_severity text := 'low';
  normalized_message text;
  pattern text;
BEGIN
  -- Normalize the message
  normalized_message := normalize_text(message_text);
  
  -- Check each profanity word against both original and normalized text
  FOR word_record IN 
    SELECT word, severity FROM profanity_words
  LOOP
    -- Create regex pattern to catch variations
    -- This will match the word with optional special characters between letters
    pattern := regexp_replace(word_record.word, '(.)', '\1[\s\-_\.\,\*\@\#\$\%\&\+\=\~]*', 'g');
    
    -- Check original message (case insensitive, with pattern for variations)
    IF message_text ~* pattern THEN
      found_words := array_append(found_words, word_record.word);
      
      -- Update highest severity
      IF word_record.severity = 'high' THEN
        highest_severity := 'high';
      ELSIF word_record.severity = 'medium' AND highest_severity != 'high' THEN
        highest_severity := 'medium';
      END IF;
    -- Also check normalized version (catches leetspeak)
    ELSIF normalized_message LIKE '%' || word_record.word || '%' THEN
      found_words := array_append(found_words, word_record.word);
      
      IF word_record.severity = 'high' THEN
        highest_severity := 'high';
      ELSIF word_record.severity = 'medium' AND highest_severity != 'high' THEN
        highest_severity := 'medium';
      END IF;
    END IF;
  END LOOP;
  
  -- Remove duplicates from found_words
  found_words := ARRAY(SELECT DISTINCT unnest(found_words));
  
  RETURN QUERY SELECT 
    (array_length(found_words, 1) IS NOT NULL AND array_length(found_words, 1) > 0),
    found_words,
    highest_severity;
END;
$$;

-- Test the new profanity filter with common circumvention attempts
DO $test$
DECLARE
  test_cases text[] := ARRAY[
    'This is a f@ck test',
    'F U C K',
    'sh!t',
    'b1tch',
    'a$$hole',
    'st*pid',
    'f*ck this',
    'what the h3ll',
    'clean message',
    'just chatting'
  ];
  test_case text;
  result record;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTING PROFANITY FILTER';
  RAISE NOTICE '========================================';
  
  FOREACH test_case IN ARRAY test_cases
  LOOP
    SELECT * INTO result FROM check_profanity(test_case);
    RAISE NOTICE 'Test: "%" -> Profanity: %, Words: %, Severity: %', 
      test_case, 
      result.has_profanity, 
      array_to_string(result.flagged_words, ', '),
      result.max_severity;
  END LOOP;
  
  RAISE NOTICE '========================================';
END $test$;

-- Create index for faster profanity lookups
CREATE INDEX IF NOT EXISTS idx_profanity_words_word ON profanity_words(word);
CREATE INDEX IF NOT EXISTS idx_profanity_words_severity ON profanity_words(severity);

-- Add comment
COMMENT ON FUNCTION normalize_text(text) IS 'Normalizes text by converting leetspeak and removing special characters to catch profanity circumvention attempts';
COMMENT ON FUNCTION check_profanity(text) IS 'Enhanced profanity detection that catches variations, leetspeak, and spacing tricks';

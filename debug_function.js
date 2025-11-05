// Get the actual function definition from Supabase
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function getFunctionDefinition() {
  // Query pg_catalog to get the actual function definition
  const { data, error } = await supabase.rpc('get_function_source', {
    func_name: 'complete_workout_session'
  });

  if (error) {
    console.error('Error:', error);
    
    // Try alternative: query information_schema
    const query = `
      SELECT 
        routine_name,
        routine_definition
      FROM information_schema.routines
      WHERE routine_name = 'complete_workout_session'
      AND routine_schema = 'public';
    `;
    
    console.log('\nTrying direct query...');
    console.log('Note: This might not work due to RLS. We need to create a helper function.');
  } else {
    console.log('Function definition:', data);
  }
}

// Create a helper SQL function to get function source
async function createHelperFunction() {
  const helperSQL = `
CREATE OR REPLACE FUNCTION get_function_source(func_name TEXT)
RETURNS TABLE(function_definition TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT pg_get_functiondef(p.oid)::TEXT
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE p.proname = func_name
    AND n.nspname = 'public';
END;
$$;
  `;
  
  console.log('Please run this SQL in Supabase SQL Editor:');
  console.log('═'.repeat(50));
  console.log(helperSQL);
  console.log('═'.repeat(50));
}

createHelperFunction();

-- Fix food_database RLS policies to allow inserts
-- This allows authenticated users to add new foods when searching

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all foods" ON food_database;
DROP POLICY IF EXISTS "Authenticated users can insert foods" ON food_database;
DROP POLICY IF EXISTS "Users can update their own foods" ON food_database;

-- Enable RLS on food_database
ALTER TABLE food_database ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow all authenticated users to read all foods
CREATE POLICY "Users can read all foods"
ON food_database
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow authenticated users to insert new foods
-- This is needed when users search for foods and the API returns new items
CREATE POLICY "Authenticated users can insert foods"
ON food_database
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3: Allow users to update foods they created
CREATE POLICY "Users can update their own foods"
ON food_database
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Optional: Add created_by column if it doesn't exist (for tracking who added foods)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'food_database' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE food_database 
        ADD COLUMN created_by uuid REFERENCES auth.users(id);
        
        -- Set default for new rows
        ALTER TABLE food_database 
        ALTER COLUMN created_by SET DEFAULT auth.uid();
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON food_database TO authenticated;

-- Summary of changes:
-- 1. All authenticated users can read all foods (SELECT)
-- 2. All authenticated users can insert new foods (INSERT)
-- 3. Users can only update foods they created (UPDATE with created_by check)
-- 4. Added created_by column to track food ownership (if it didn't exist)

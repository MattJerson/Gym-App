@echo off
REM ============================================
REM WORKOUT SYSTEM MIGRATION - QUICK START (Windows)
REM ============================================

echo 🏋️  Starting Workout Exercise System Migration
echo ============================================
echo.

REM Check if .env file exists
if not exist .env (
    echo ❌ Error: .env file not found
    echo Please create .env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
    exit /b 1
)

echo Step 1: Database Schema
echo -----------------------------------
echo.
echo Please run the following SQL file in your Supabase dashboard:
echo   supabase/migrations/022_new_exercise_system_schema.sql
echo.
pause

echo.
echo Step 2: Importing exercise data...
echo -----------------------------------
echo.

REM Run the import script
node import-exercises-data.js

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Data import failed
    exit /b 1
)

echo ✅ Data imported successfully
echo.

echo Step 3: Migration Helpers
echo -----------------------------------
echo.
echo Please run the following SQL file in your Supabase dashboard:
echo   supabase/migrations/024_migrate_to_new_exercise_system.sql
echo.
pause

echo.
echo ============================================
echo ✅ Migration Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Update your UI components (see MIGRATION_GUIDE.md)
echo 2. Test the new exercise system
echo 3. Run 025_cleanup_old_exercise_system.sql when ready
echo.
echo For detailed instructions, see MIGRATION_GUIDE.md
echo.
pause

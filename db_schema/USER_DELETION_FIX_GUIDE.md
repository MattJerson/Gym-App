# User Deletion Fix Guide

## Problem
Deleting users from Supabase fails with:
```
ERROR: update or delete on table "users" violates foreign key constraint "profiles_id_fkey" on table "profiles" (SQLSTATE 23503)
```

This happens because your database has 33 tables with foreign keys referencing `auth.users`, and none of them use CASCADE delete.

## Solution Options

### Option 1: Quick Fix (Apply CASCADE) ⭐ RECOMMENDED

Run `fix_user_deletion_cascade.sql` in your Supabase SQL Editor. This will:
1. Update all foreign keys to use `ON DELETE CASCADE`
2. After this, deleting a user will automatically remove all their data
3. Your admin page delete button will work immediately

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `fix_user_deletion_cascade.sql`
3. Paste and click "Run"
4. Wait for success message
5. Try deleting a user from your admin page - it should work now!

**What it does:**
- User-owned data (workouts, meals, stats, etc.) → CASCADE (automatically deleted)
- Content created by users (templates, challenges) → SET NULL (preserved but unattributed)

### Option 2: Manual Delete (One-Time Fix)

Use `manual_user_delete.sql` to delete a specific user right now (before applying CASCADE).

**Steps:**
1. Open `manual_user_delete.sql`
2. Replace **both** instances of `'USER_ID_HERE'` with the actual user UUID
   - Example: `'0b000406-c947-4749-8dc5-26513e46d5c1'`
3. Copy the entire script
4. Go to Supabase Dashboard → SQL Editor
5. Paste and click "Run"

⚠️ **Important:** Replace `USER_ID_HERE` with the real UUID (keep the quotes!)

## Tables Affected (33 total)

### User Personal Data (CASCADE DELETE)
- profiles
- registration_profiles
- bodyfat_profiles
- active_workout_sessions
- challenge_progress
- daily_activity_tracking
- daily_meal_tracking
- exercise_sets
- meal_plan_analytics
- steps_tracking
- user_badges
- user_daily_goals
- user_food_history
- user_goals
- user_meal_filters
- user_meal_logs
- user_meal_plans
- user_meals
- user_saved_workouts
- user_stats
- user_subscriptions
- user_workout_preferences
- user_workout_schedule
- weight_tracking
- workout_logs
- workout_personal_records
- workout_session_exercises
- workout_sessions

### Content Created by Users (SET NULL)
- challenges (created_by)
- featured_content (created_by)
- food_database (created_by)
- meal_plan_templates (created_by)
- workout_templates (created_by_user_id)

## Verification

After applying the CASCADE fix, run this to verify:

```sql
SELECT 
  tc.table_name,
  kcu.column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_schema = 'auth'
  AND ccu.table_name = 'users'
ORDER BY tc.table_name;
```

All rows should show `delete_rule = 'CASCADE'` or `'SET NULL'`.

## Testing

After applying the fix:

1. Create a test user in your admin panel
2. Have that user create some data (workout logs, meals, etc.)
3. Delete the user from the admin panel
4. Verify the user and all their data are gone
5. ✅ Success!

## Rollback

If you need to rollback (restore original constraints), you'll need to:
1. Export your current constraint definitions first
2. DROP the CASCADE constraints
3. Recreate the original constraints without CASCADE

**Backup recommendation:** Export your database schema before making changes.

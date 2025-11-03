# Testing Guide: Calorie Calculation & Completion Tracking

## Step 1: Run the Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/017_fix_calories_and_completion_tracking.sql`
3. Paste into SQL Editor and click **RUN**

### Expected Output:
```
✅ Added estimated_calories column to workout_templates
✅ Updated X workout_templates with estimated calories
📊 Migration Summary:
  - Templates with calories: X
  - Templates missing calories: 0
  - get_my_workouts function: UPDATED
  - create_custom_workout function: UPDATED
  - Completion tracking index: CREATED
```

If you see any errors, copy the error message and share it.

---

## Step 2: Verify Database Changes

Run these queries in Supabase SQL Editor to confirm the migration worked:

### Check 1: Verify Column Exists
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'workout_templates' 
AND column_name = 'estimated_calories';
```
**Expected:** Should return 1 row showing the column exists

### Check 2: View Sample Workouts with Calories
```sql
SELECT id, name, duration_minutes, estimated_calories, is_custom
FROM workout_templates
WHERE is_active = TRUE
LIMIT 10;
```
**Expected:** All rows should have `estimated_calories > 0`

### Check 3: Test get_my_workouts Function
```sql
-- Replace 'YOUR_USER_ID' with your actual user ID from registration_profiles
SELECT workout_name, estimated_calories, times_completed, is_custom
FROM get_my_workouts('YOUR_USER_ID')
LIMIT 5;
```
**Expected:** Shows your workouts with calorie values and completion counts

---

## Step 3: Test in the App

### Test A: Create New Custom Workout
1. Open app → Training tab → "Create Custom Workout"
2. Add 3 exercises (e.g., Push-ups, Squats, Lunges)
3. **CHECK:** Preview card at bottom should show estimated calories (e.g., "🔥 360 kcal")
4. Save the workout
5. Go to "My Workouts"
6. **CHECK:** New workout should show same calorie amount

### Test B: Completion Tracking
1. Go to "My Workouts"
2. Find the "Hold" workout or any workout
3. **Note:** Check the "Done X times" count (probably shows 0)
4. Tap the workout → Start Session → Complete it
5. Return to "My Workouts"
6. **CHECK:** The "Done" count should increment by 1

### Test C: Calorie Consistency
1. Open "My Workouts" → Find "Hold" workout → Note the calorie value
2. Go to Home tab → "Today's Workout" → Find same workout
3. **CHECK:** Both screens should show identical calorie values (e.g., both show 450 kcal)

### Test D: Real-Time Calorie Updates
1. Training → "Create Custom Workout"
2. Add 1 exercise → Note calories in preview
3. Add 2nd exercise → Note calories increased
4. Remove 1 exercise → Note calories decreased
5. **CHECK:** Calories should update instantly as you add/remove exercises

---

## Step 4: Check for Issues

### Common Issues:

**Issue 1: "Done" count still shows 0 after completing workout**
- Query to debug:
```sql
-- Check if workout sessions are being created
SELECT user_id, template_id, status, completed_at
FROM workout_sessions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```
- Should show completed sessions with `status = 'completed'`

**Issue 2: Calories show 0 or NULL**
- Query to debug:
```sql
-- Check your user weight
SELECT user_id, weight_kg
FROM registration_profiles
WHERE user_id = 'YOUR_USER_ID';
```
- Should return your weight (e.g., 75.0)
- If NULL, update it: `UPDATE registration_profiles SET weight_kg = 75 WHERE user_id = 'YOUR_USER_ID';`

**Issue 3: Calories different on different screens**
- Clear app cache: Close app completely → Reopen
- Or run: `npx expo start --clear` in terminal

---

## Step 5: Success Checklist

✅ Migration ran without errors  
✅ `estimated_calories` column exists in `workout_templates`  
✅ Sample workouts show calorie values > 0  
✅ New custom workout shows calories in preview  
✅ Saved workout shows same calories in "My Workouts"  
✅ Completing workout increments "Done X times" counter  
✅ Same workout shows identical calories on all screens  
✅ Adding/removing exercises updates calories in real-time  

---

## Quick Test SQL Script

Run this to get a full diagnostic:

```sql
-- 1. Check column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'workout_templates' 
      AND column_name = 'estimated_calories'
    ) THEN '✅ Column exists'
    ELSE '❌ Column missing'
  END AS column_check;

-- 2. Check calorie data
SELECT 
  COUNT(*) AS total_templates,
  COUNT(estimated_calories) FILTER (WHERE estimated_calories > 0) AS with_calories,
  COUNT(*) FILTER (WHERE estimated_calories IS NULL OR estimated_calories = 0) AS without_calories
FROM workout_templates;

-- 3. Check your workouts (REPLACE YOUR_USER_ID)
SELECT 
  workout_name,
  duration_minutes,
  estimated_calories,
  times_completed,
  is_custom
FROM get_my_workouts('YOUR_USER_ID')
ORDER BY is_custom DESC, workout_name
LIMIT 10;
```

---

## Next Steps

Once all tests pass, you're done! 🎉

The app will now:
- Calculate calories dynamically based on YOUR weight
- Track workout completions accurately
- Show consistent calorie values everywhere
- Update calories in real-time as you build workouts

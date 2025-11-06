# Weight Tracking System - Prevention Guide

## Issues We Fixed
1. ❌ **Negative weights** (-130 kg) - Caused by massive calorie burns in workouts
2. ❌ **Invalid workout calories** (880,831 calories) - Unrealistic data entry
3. ❌ **Missing initial weight** - Users didn't have weight_tracking entries
4. ❌ **RLS policies missing** - App couldn't read weight data

## Permanent Fixes Applied

### 1. Database Constraints (Run `20251106_add_calorie_constraints.sql`)
```sql
-- Workout calories: 0-2000 cal (realistic limit)
-- Meal calories: 0-3000 cal (realistic limit)  
-- Weight: 20-500 kg (realistic human range)
```

**What this does:**
- Database will **reject** any workout with > 2000 calories
- Database will **reject** any meal with > 3000 calories
- Database will **reject** any weight < 20 kg or > 500 kg
- Prevents bad data from ever entering the system

### 2. Application-Level Validation Needed

Add these validations in your workout/meal logging code:

**WorkoutSessionService.js** - Before saving workout:
```javascript
// Validate calories before saving
if (estimatedCalories < 0 || estimatedCalories > 2000) {
  throw new Error('Invalid calorie burn. Must be between 0-2000 calories.');
}
```

**MealPlanDataService.js** - Before saving meal:
```javascript
// Validate meal calories
if (calories < 0 || calories > 3000) {
  throw new Error('Invalid meal calories. Must be between 0-3000 calories.');
}
```

**Weight input forms** - Validate user input:
```javascript
// In registration and weight entry forms
if (weightKg < 20 || weightKg > 500) {
  Alert.alert('Invalid Weight', 'Please enter a weight between 20-500 kg');
  return;
}
```

### 3. Automatic Weight Backfill

The migration `20251106_backfill_initial_weights.sql` ensures:
- ✅ All users with `registration_profiles.weight_kg` get initial `weight_tracking` entry
- ✅ Trigger auto-creates weight entry when user registers
- ✅ No manual intervention needed

### 4. Data Cleanup Process

If bad data exists again:
1. Run `COMPLETE_CLEANUP.sql` to remove invalid workouts
2. Clear `daily_calorie_summary` cache
3. System will auto-regenerate correct data

## Testing Checklist

✅ Run migration: `20251106_add_calorie_constraints.sql`
✅ Try inserting invalid workout (should fail)
✅ Try inserting valid workout (should succeed)
✅ Add validation to app code
✅ Test weight progress shows positive values
✅ Verify new users get initial weight automatically

## Monitoring

Watch for these errors in logs:
- `violates check constraint workout_sessions_calories_check`
- `violates check constraint user_meal_logs_calories_check`
- `violates check constraint weight_tracking_weight_check`

These indicate the constraints are working and blocking bad data! ✅

# 🔧 Database Migration: Fix Calorie Calculation & Completion Tracking

## Issues Identified

### 1. **Missing estimated_calories Column**
- The `workout_templates` table was missing the `estimated_calories` column
- This caused inconsistent calorie displays across different screens

### 2. **Workout Completion Tracking Not Working**
- The "Done" section showing 0 completions even after finishing multiple workouts
- The `get_my_workouts` function wasn't properly counting completed sessions

### 3. **Inconsistent Calorie Values**
- Same workout showing different calories in different screens (360 kcal vs 450 kcal)
- "Hold" workout showing 360 kcal with 3 exercises, but 450 kcal on today's workout screen
- This was due to some templates having hardcoded values while others calculated dynamically

## Solutions Implemented

### Migration File: `017_fix_calories_and_completion_tracking.sql`

#### 1. **Added estimated_calories Column**
```sql
ALTER TABLE public.workout_templates 
ADD COLUMN estimated_calories INTEGER DEFAULT 0;
```

#### 2. **Fixed get_my_workouts Function**
The function now properly counts completed workouts:
```sql
-- Count completed sessions for this template
COALESCE(
  (
    SELECT COUNT(*)::BIGINT
    FROM workout_sessions ws
    WHERE ws.user_id = p_user_id
      AND ws.template_id = usw.template_id
      AND ws.status = 'completed'
  ), 
  0
) AS times_completed
```

#### 3. **Updated create_custom_workout Function**
Now accepts `p_estimated_calories` parameter and stores it:
```sql
CREATE OR REPLACE FUNCTION public.create_custom_workout(
  ...
  p_estimated_calories INTEGER,
  ...
)
```

#### 4. **Set Default Calories for Existing Templates**
All templates without calories now have a basic estimate:
```sql
UPDATE public.workout_templates
SET estimated_calories = duration_minutes * 6
WHERE estimated_calories IS NULL OR estimated_calories = 0;
```

#### 5. **Performance Optimization**
Created index for faster completion count queries:
```sql
CREATE INDEX idx_workout_sessions_user_template_status 
ON workout_sessions(user_id, template_id, status)
WHERE status = 'completed';
```

## How to Apply Migration

### Option 1: Via Supabase Dashboard (Recommended if Docker not available)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/017_fix_calories_and_completion_tracking.sql`
4. Paste and run the SQL

### Option 2: Via Supabase CLI (Requires Docker)
```bash
cd /Users/jai/Documents/Gym-App
npx supabase db reset
```

### Option 3: Direct Database Connection
If you have direct PostgreSQL access:
```bash
psql $DATABASE_URL -f supabase/migrations/017_fix_calories_and_completion_tracking.sql
```

## Expected Results After Migration

### ✅ Completion Tracking
- "Done" counter will now show correct number of completions
- Each time you complete a workout, `times_completed` increments
- Tracked via `workout_sessions` table with `status = 'completed'`

### ✅ Consistent Calories
- All workouts will have `estimated_calories` value
- Custom workouts: Calculated dynamically based on MET values × user weight
- Pre-made workouts: Basic estimate (duration_minutes × 6) until recalculated
- Same workout shows same calories across all screens

### ✅ New Workout Creation
- When creating custom workouts, calories are automatically calculated
- Stored in database immediately
- Used consistently across Today's Workout, My Workouts, Browse sections

## Testing Checklist

After applying migration:

- [ ] Check "My Workouts" section - "Done" count should show completions
- [ ] Complete a workout - verify "Done" count increments
- [ ] Check "Hold" workout - calories should be consistent everywhere
- [ ] Create new custom workout - verify calories calculate and save
- [ ] Reload app - verify data persists correctly

## Data Flow

```
User completes workout
    ↓
workout_sessions.status = 'completed' (with template_id)
    ↓
get_my_workouts() counts matching sessions
    ↓
times_completed displays in UI
```

```
User creates custom workout
    ↓
CalorieCalculator.calculateWorkoutCaloriesForUser()
    ↓
TrainingDataService.createCustomWorkout(estimatedCalories)
    ↓
Stored in workout_templates.estimated_calories
    ↓
Displayed consistently across all screens
```

## Files Modified

1. **Database Migration**: `supabase/migrations/017_fix_calories_and_completion_tracking.sql`
2. **Already Updated** (from previous work):
   - `services/CalorieCalculator.js` - Calculation utility
   - `services/TrainingDataService.js` - Integration with workout creation
   - `app/training/create-workout.jsx` - UI with real-time calories

## Migration Safety

- ✅ Safe to run multiple times (uses `IF NOT EXISTS` checks)
- ✅ Non-destructive (only adds column, doesn't delete data)
- ✅ Backward compatible (default values provided)
- ✅ Performance optimized (index created for fast queries)

## Troubleshooting

### If completions still show 0:
- Verify workout was saved with correct `template_id`
- Check `workout_sessions` table: `SELECT * FROM workout_sessions WHERE user_id = 'your-id' AND status = 'completed'`
- Verify session has matching `template_id` from `user_saved_workouts`

### If calories still inconsistent:
- Check if migration ran: `SELECT column_name FROM information_schema.columns WHERE table_name = 'workout_templates' AND column_name = 'estimated_calories'`
- Verify template has calories: `SELECT id, name, estimated_calories FROM workout_templates WHERE name = 'Hold'`
- Clear app cache and reload

---

**Status**: Migration ready to apply
**Priority**: High - Fixes user-reported bugs
**Impact**: Improves data consistency and user experience

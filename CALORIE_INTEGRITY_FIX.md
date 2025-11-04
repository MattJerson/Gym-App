# 🔥 Calorie Calculation Integrity Fix

## Issue Identified

**Date:** November 5, 2025  
**Severity:** High - Data Integrity  
**Impact:** Calorie tracking accuracy

### Problem Scenario

User completes a workout over multiple sessions:

1. **Day 1:** User starts 45-minute chest workout (estimated 300 calories)
2. **After 1 hour:** User abandons workout (only completed 2/5 exercises)
3. **Day 3:** User resumes and checks off remaining 3 exercises in 2 minutes
4. **Total actual time:** 1 hour + 2 minutes = 62 minutes

**If calories were based on actual duration:**
- Would calculate based on 62 minutes instead of 45 minutes
- MET formula would be applied to wrong time duration
- Calories would be ~413 instead of 300 (38% error!)

### The Core Problem

**Abandoned → Resumed workouts break calorie integrity:**
- Actual workout intensity doesn't change
- Exercise MET values remain the same
- But if we calculate based on actual time, we'd be counting "sitting around time" as active workout time
- This corrupts historical data and makes tracking meaningless

## Solution Implemented

### ✅ Calories Always Based on Template Estimate

**Key Decision:** `estimated_calories_burned` = Template's `estimated_calories` (MET-based calculation)

```sql
-- In create_workout_session_from_template function:
estimated_calories_burned = COALESCE(v_template.estimated_calories, 0)
```

### How It Works

1. **Template Creation:**
   ```javascript
   // When workout template is created
   const estimatedCalories = CalorieCalculator.calculateWorkoutCalories(exercises, userWeight);
   // Formula: Σ(MET × weight × estimated_duration) for all exercises
   ```

2. **Session Start:**
   ```sql
   -- Session inherits template's estimated_calories
   estimated_calories_burned = template.estimated_calories
   ```

3. **Session Completion:**
   - Calories remain at template's estimate (no recalculation)
   - Actual duration is tracked separately for personal records
   - Data integrity maintained

### What Gets Tracked

| Field | Source | Purpose |
|-------|--------|---------|
| `estimated_calories_burned` | Template's `estimated_calories` | **Official calorie count** for gamification/stats |
| `total_duration_seconds` | Actual time (completed_at - started_at - pauses) | Personal record tracking |
| `started_at` | Session start timestamp | Time tracking |
| `completed_at` | Session completion timestamp | Time tracking |
| `total_pause_duration` | Sum of pause times | Accurate active workout time |

## Benefits

### ✅ Data Integrity
- Calories always reflect actual work done (MET × weight × exercises)
- Not influenced by breaks, distractions, or multi-day completions
- Historical data remains meaningful and comparable

### ✅ Fairness
- User who rushes through in 30 minutes: Same calories as template
- User who takes 2 hours with breaks: Same calories as template
- Both did the same exercises with same intensity (MET values)

### ✅ Accurate Comparisons
- Can compare workouts across different completion patterns
- Leaderboards remain fair
- Progress tracking is meaningful

### ✅ Personal Time Tracking Still Available
- `total_duration_seconds` tracks actual time for personal records
- Users can see their pace improvement over time
- Stats page can show "fastest completion" vs "calories burned"

## Technical Implementation

### Database Changes

**File:** `supabase/migrations/021_fix_calories_integrity.sql`

```sql
CREATE OR REPLACE FUNCTION public.create_workout_session_from_template(...)
  -- Session creation now includes:
  estimated_calories_burned = COALESCE(v_template.estimated_calories, 0)
  -- ✅ Uses template's MET-based estimate, not recalculated from actual time
```

### Calorie Calculation Flow

```
Template Creation
  ↓
CalorieCalculator.calculateWorkoutCalories()
  ↓
For each exercise:
  MET × user_weight × estimated_set_duration × sets
  ↓
Sum all exercises → template.estimated_calories
  ↓
Session Creation (from template)
  ↓
session.estimated_calories_burned = template.estimated_calories
  ↓
Session Completion
  ↓
Calories remain unchanged (integrity maintained)
  ↓
Gamification & Stats use session.estimated_calories_burned
```

## Example Scenarios

### Scenario 1: Normal Completion
- **Template:** 45 min, 5 exercises, 300 calories
- **User completes in:** 45 minutes
- **Calories recorded:** 300 ✅
- **Result:** Accurate

### Scenario 2: Fast Completion
- **Template:** 45 min, 5 exercises, 300 calories
- **User completes in:** 30 minutes (rushing)
- **Calories recorded:** 300 ✅
- **Result:** Accurate (same exercises done, just faster rest)

### Scenario 3: Slow Completion (The Problem Case)
- **Template:** 45 min, 5 exercises, 300 calories
- **User completes in:** 2 hours (with long breaks)
- **Calories recorded:** 300 ✅
- **Result:** Accurate (same exercises, breaks don't burn calories)

### Scenario 4: Multi-Day Completion (The Edge Case)
- **Template:** 45 min, 5 exercises, 300 calories
- **Day 1:** User does 2 exercises, abandons (30 min)
- **Day 3:** User resumes, finishes remaining 3 exercises (2 min)
- **Total actual time:** 32 minutes
- **Calories recorded:** 300 ✅
- **Result:** Accurate and fair

## What This Means for Users

### User Perspective
- ✅ **Consistency:** Same workout = same calories, regardless of pace
- ✅ **Honesty:** Can't "game" the system by leaving workout open
- ✅ **Fairness:** Everyone gets credit for actual work done
- ✅ **Tracking:** Still see personal time records for pace improvement

### Developer Perspective
- ✅ **Data Quality:** Historical data remains reliable
- ✅ **Simple Logic:** No complex time-based recalculations
- ✅ **Edge Cases Handled:** Abandoned/resumed workouts work correctly
- ✅ **Performance:** No need to recalculate calories on completion

## Migration Impact

### Existing Sessions
- ❌ Already-completed sessions with `estimated_calories_burned = 0` remain as-is
- ✅ New sessions will have correct calories from template
- 📝 Consider running a backfill script if historical data is important:

```sql
-- Optional: Backfill existing completed sessions with template calories
UPDATE workout_sessions ws
SET estimated_calories_burned = wt.estimated_calories
FROM workout_templates wt
WHERE ws.template_id = wt.id
  AND ws.status = 'completed'
  AND ws.estimated_calories_burned = 0
  AND wt.estimated_calories > 0;
```

### Testing Checklist

- [x] New workout sessions inherit template calories ✅
- [x] Calories remain unchanged on completion ✅
- [x] Actual duration still tracked separately ✅
- [x] Gamification uses session calories ✅
- [x] Stats/leaderboards remain fair ✅
- [x] Multi-day completions work correctly ✅

## Related Files

- `supabase/migrations/020_create_workout_session_from_template.sql` - Original function
- `supabase/migrations/021_fix_calories_integrity.sql` - Updated function with fix
- `services/CalorieCalculator.js` - MET-based calculation logic
- `services/WorkoutSessionServiceV2.js` - Session management
- `services/GamificationDataService.js` - Uses session calories for stats

## Summary

**Before Fix:**
- Calories based on actual duration (vulnerable to gaming/errors)
- Multi-day completions would have wrong calories
- Data integrity issues

**After Fix:**
- Calories based on template's MET calculation (consistent)
- Same workout = same calories, regardless of completion pattern
- Data integrity maintained
- Personal time tracking still available

This ensures our calorie tracking remains **scientifically accurate** and **practically fair** for all users! 🎯

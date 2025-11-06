# 🔧 Calorie Tracking Integration - SQL Fix Complete

## Issues Fixed

### 1. ✅ SQL Ambiguous Column Reference Error
**Error**: `column reference "weight_kg" is ambiguous`

**Root Cause**: In the `get_weight_progress_chart` function, we were selecting `weight_kg` without qualifying it with a table alias. PostgreSQL couldn't distinguish between the column and the local variable `v_actual_weight`.

**Fix Applied**:
- Added table alias `wt` to all `weight_tracking` table references
- Changed `SELECT weight_kg INTO...` to `SELECT wt.weight_kg INTO...`
- Updated all WHERE clauses to use qualified column names

**Files Modified**:
- `supabase/migrations/20251106_calorie_tracking_integration.sql` (lines 354-398)

### 2. ✅ Calendar Page Auto-Refresh on Navigation
**Issue**: Calendar page doesn't refresh when navigating back to it (unlike Training and Meal Plan pages)

**Fix Applied**:
- Added `useFocusEffect` hook from `expo-router`
- Added `useCallback` to React imports
- Implemented focus-based refresh for calendar data and streak data
- Matches the behavior of Training and Meal Plan pages

**Files Modified**:
- `app/page/calendar.jsx`
  - Line 11: Added `useFocusEffect` to imports from `expo-router`
  - Line 14: Added `useCallback` to React imports
  - Lines 87-96: Added useFocusEffect hook to reload data on screen focus

## Migration Execution Instructions

Since `supabase db push` requires migration history sync, you have two options:

### Option A: Run in Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the entire content of:
   ```
   supabase/migrations/20251106_calorie_tracking_integration.sql
   ```
5. Click **Run** to execute

### Option B: Sync Migration History First
```powershell
# Pull remote migrations to sync
supabase db pull

# Then push the new migration
supabase db push
```

## What the Migration Creates

### Tables
- ✅ `daily_calorie_summary` - Cached daily calorie data with RLS policies

### Functions (6 total)
1. ✅ `calculate_daily_calorie_balance(user_id, date)` - Real-time calculation
2. ✅ `update_daily_calorie_summary(user_id, date)` - Cache upsert
3. ✅ `get_weight_progress_chart(user_id, days_back)` - **FIXED** chart with calorie data
4. ✅ `get_weight_measurements_only(user_id, start, end, limit)` - Fast weight queries
5. ✅ `get_aggregated_calorie_data(user_id, start, end, interval)` - Weekly/monthly aggregates
6. ✅ `get_weight_progress_stats(user_id, start, end)` - Comprehensive statistics

### Triggers (2 total)
1. ✅ `trigger_meal_log_calorie_update` - Auto-update on meal changes
2. ✅ `trigger_workout_calorie_update` - Auto-update on workout completion

### Backfill
- ✅ Processes last 90 days of user activity in batches of 100

## Testing After Migration

### 1. Test Calendar Page Refresh
```javascript
// Navigate to Calendar page
// Navigate to another page (Training, Meal Plan)
// Navigate back to Calendar
// ✅ Calendar should refresh automatically with latest data
```

### 2. Test Weight Progress Chart
```javascript
// In your app, navigate to Weight Progress
// The chart should load without the "ambiguous column" error
// ✅ Chart displays weight + calorie data
```

### 3. Test Calorie Integration
```javascript
import { WeightProgressService } from './services/WeightProgressService';

// Test today's balance
const balance = await WeightProgressService.getDailyCalorieBalance(userId);
console.log('Today:', balance);

// Test 7-day chart
const chart = await WeightProgressService.getWeightProgressChart(userId, 7);
console.log('Chart:', chart.calorieData);

// Test long-term stats
const stats = await WeightProgressService.getWeightProgressStats(userId);
console.log('Stats:', stats);
```

## What's Changed

### SQL Functions - Key Improvements
```sql
-- ❌ BEFORE (Ambiguous)
SELECT weight_kg INTO v_actual_weight
FROM public.weight_tracking
WHERE user_id = p_user_id

-- ✅ AFTER (Qualified)
SELECT wt.weight_kg INTO v_actual_weight
FROM public.weight_tracking wt
WHERE wt.user_id = p_user_id
```

### Calendar Page - Auto Refresh
```javascript
// ✅ NEW: Reload data when screen comes into focus
useFocusEffect(
  useCallback(() => {
    if (userId) {
      loadCalendarData();
      loadStreakData();
    }
  }, [userId])
);
```

## Migration Status

- ✅ SQL syntax errors fixed
- ✅ Ambiguous column references resolved
- ✅ Calendar page auto-refresh implemented
- ⏳ Migration ready to execute in Supabase Dashboard
- ⏳ Testing pending after migration execution

## Expected Results

### Before
- ❌ SQL error: "column reference weight_kg is ambiguous"
- ❌ Calendar page shows stale data after navigation
- ❌ Weight progress chart fails to load

### After
- ✅ Weight progress chart loads successfully
- ✅ Calorie data integrated into chart (consumed, burned, net)
- ✅ Calendar refreshes automatically on focus
- ✅ Real-time calorie balance calculations
- ✅ Cached summaries for performance
- ✅ Support for 1 day to 10+ years of tracking

## Next Steps

1. **Execute Migration**: Run the SQL in Supabase Dashboard
2. **Verify Tables**: Check that `daily_calorie_summary` exists
3. **Test Functions**: Call `get_weight_progress_chart()` from your app
4. **Test Navigation**: Navigate to/from Calendar page - should auto-refresh
5. **Monitor Performance**: Check query times with real user data

---

**Migration File**: `supabase/migrations/20251106_calorie_tracking_integration.sql`  
**Total Lines**: 721  
**Status**: ✅ Ready to Execute  
**Date**: November 6, 2025

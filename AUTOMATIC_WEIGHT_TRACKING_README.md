# 🎯 Automatic Weight Tracking System

## Overview

This system automatically tracks weight based on the user's meal logs and workout activity. **No manual weight entry required** - the system calculates projected weight using calorie balance.

## How It Works

### 1. Initial Weight (Registration)
When a user completes registration in `registrationprocess.jsx`:
- They enter their initial weight (e.g., 75 kg)
- This weight is saved to `registration_profiles.weight_kg`
- **Automatic trigger** creates first entry in `weight_tracking` table
- This becomes the baseline for all future projections

### 2. Daily Tracking (Automatic)
The system calculates weight changes based on:

```
Daily Balance = (Calories Consumed - Calories Burned) - Maintenance Calories

Where:
- Calories Consumed = Sum of all meals logged that day
- Calories Burned = Sum of all workout calories that day  
- Maintenance Calories = From user's meal plan (or registration calorie_goal)
```

### 3. Weight Projection Formula

```
Weight Change (kg) = Cumulative Calorie Balance ÷ 7700

Where:
- 7700 calories surplus = 1 kg weight GAIN
- 7700 calories deficit = 1 kg weight LOSS
```

### 4. Key Rules

| Scenario | Result |
|----------|--------|
| **No meals logged** | No weight change (maintenance assumed) |
| **Meals < Maintenance** | Weight LOSS (deficit) |
| **Meals > Maintenance** | Weight GAIN (surplus) |
| **Workouts logged** | Extra calorie burn (helps deficit) |

## Database Architecture

### Tables Involved

#### `registration_profiles`
```sql
- user_id (uuid)
- weight_kg (numeric) ← Initial weight
- calorie_goal (integer) ← Maintenance calories
```

#### `weight_tracking`
```sql
- user_id (uuid)
- measurement_date (date)
- weight_kg (numeric) ← Actual measurements
- notes (text)
```

#### `daily_calorie_summary`
```sql
- user_id (uuid)
- summary_date (date)
- calories_consumed (numeric) ← From meals
- calories_burned (numeric) ← From workouts
- net_calories (numeric) ← Auto-calculated
```

#### `user_meal_logs`
```sql
- user_id (uuid)
- meal_date (date)
- calories (numeric)
- protein, carbs, fats (numeric)
```

#### `workout_sessions`
```sql
- user_id (uuid)
- completed_at (timestamptz)
- estimated_calories_burned (numeric)
```

### Functions Created

#### `insert_initial_weight_from_registration()`
**Trigger**: Runs when user completes registration
**Purpose**: Automatically creates first weight entry
```sql
-- Creates entry in weight_tracking with:
-- - weight_kg from registration
-- - measurement_date = registration date (or today)
-- - notes = 'Initial weight from registration'
```

#### `calculate_projected_weight(user_id, target_date)`
**Purpose**: Calculate projected weight for any date
**Returns**:
- `projected_weight` - Calculated weight based on calorie balance
- `last_actual_weight` - Most recent actual measurement
- `last_weight_date` - When last measured
- `days_since_measurement` - Days since last actual measurement
- `cumulative_calorie_balance` - Total surplus/deficit
- `expected_weight_change` - kg change from balance

**Logic**:
```sql
1. Get most recent actual weight measurement
2. Get user's maintenance calories (meal plan or registration)
3. Sum all daily balances since last measurement:
   Balance = (consumed - burned) - maintenance
4. Convert to kg: weight_change = cumulative_balance / 7700
5. Return: last_weight + weight_change
```

#### `get_weight_progress_chart(user_id, days_back)`
**Purpose**: Generate chart data with actual + projected weights
**Returns**: Table with columns:
- `measurement_date` - Date for data point
- `weight_kg` - Weight value (actual or projected)
- `is_actual` - True if from weight_tracking table
- `is_projected` - True if calculated from calorie balance
- `calorie_balance` - Daily balance vs maintenance
- `calories_consumed` - Meals logged
- `calories_burned` - Workouts logged
- `maintenance_calories` - Daily goal
- `trend` - 'actual' or 'projected'

**Logic**:
```sql
FOR each day in date range:
  - Check if actual weight measurement exists
  - If YES: Use actual weight, reset cumulative balance
  - If NO: Project weight from cumulative calorie balance
  - Track days since last measurement (max 90 days projection)
```

## User Experience Flow

### First-Time User (Day 1)

```
1. User registers → Enters weight: 80 kg
   ✅ Automatic: Initial weight entry created

2. User logs breakfast (500 cal) + lunch (600 cal)
   ✅ Automatic: daily_calorie_summary updated
   
3. User logs workout (300 cal burned)
   ✅ Automatic: daily_calorie_summary updated
   
4. System calculates:
   - Consumed: 1100 cal
   - Burned: 300 cal  
   - Maintenance: 2000 cal (from registration)
   - Balance: (1100 - 300) - 2000 = -1200 cal (DEFICIT)
   - Expected change: -1200 / 7700 = -0.16 kg
   - Projected weight: 80 - 0.16 = 79.84 kg
   
5. Calendar shows: "Projected: 79.8 kg (0.2 kg loss from tracking)"
```

### Ongoing User (Day 7)

```
User has logged meals/workouts for 7 days
Cumulative deficit: -8400 calories
Expected loss: 8400 / 7700 = 1.09 kg
Projected weight: 80 - 1.09 = 78.91 kg

Calendar shows:
📊 Weight Progress Chart:
   - Day 1: 80.0 kg (actual) ●
   - Day 2: 79.8 kg (projected) ○
   - Day 3: 79.6 kg (projected) ○
   - Day 4: 79.4 kg (projected) ○
   - Day 5: 79.2 kg (projected) ○
   - Day 6: 79.0 kg (projected) ○
   - Day 7: 78.9 kg (projected) ○
```

### User Who Doesn't Log (Day 3)

```
Day 1: Logged meals → Projected: 79.8 kg
Day 2: Logged meals → Projected: 79.6 kg
Day 3: NO MEALS LOGGED → Projected: 79.6 kg (no change)

System assumes maintenance when no meals logged
Weight projection stays same
```

## Calendar Page Integration

### Current Display (Empty State)
```javascript
"Start Tracking - Complete more workouts to see your progress trends"
```

### New Display (With Automatic Tracking)

#### Unlocked (Has Initial Weight)
```javascript
📊 Weight Progress
Current: 79.8 kg (projected)
Change: -0.2 kg from initial weight
Based on 3 days of meal tracking

📈 Chart shows:
- Initial weight (actual measurement)
- Daily projections based on meal logs
- Workout calorie contributions
```

#### Locked (No Initial Weight - Shouldn't Happen)
```javascript
🔒 Weight Tracking Locked
Complete registration to set your initial weight
Then log meals to see automatic weight projections
```

## Service Layer Usage

### WeightProgressService.js

```javascript
// Get today's projected weight
const projection = await WeightProgressService.getProjectedWeightToday(userId);
console.log(projection);
// {
//   hasInitialWeight: true,
//   projectedWeight: 79.84,
//   lastActualWeight: 80.0,
//   lastWeightDate: '2025-11-01',
//   daysSinceMeasurement: 6,
//   cumulativeCalorieBalance: -1200,
//   expectedWeightChange: -0.16,
//   message: 'Projected 0.2kg loss based on 6 days of tracking'
// }

// Get 7-day weight chart
const chart = await WeightProgressService.getWeightProgressChart(userId, 7);
console.log(chart);
// {
//   labels: ['11/01', '11/02', '11/03', ...],
//   values: [80.0, 79.8, 79.6, ...],
//   actualMeasurements: [{date: '2025-11-01', weight: 80.0, ...}],
//   projections: [{date: '2025-11-02', weight: 79.8, ...}, ...],
//   calorieData: [{date: '2025-11-01', consumed: 1800, burned: 300, ...}, ...],
//   trend: 'decreasing',
//   weightChange: -0.4,
//   currentWeight: 79.6
// }
```

## Migration Files

### Execute These in Order:

1. **`20251106_calorie_tracking_integration.sql`** (Already done ✅)
   - Creates `daily_calorie_summary` table
   - Creates calorie calculation functions
   - Creates automatic triggers for meals/workouts

2. **`20251106_automatic_weight_tracking.sql`** (Run this now!)
   - Creates automatic initial weight insertion trigger
   - Creates weight projection functions
   - Backfills existing users with initial weights

## Testing Checklist

### 1. New User Registration
- [ ] Register new user with weight 75 kg
- [ ] Check `weight_tracking` table has entry
- [ ] Verify entry date matches registration date
- [ ] Verify notes says "Initial weight from registration"

### 2. Meal Logging (Deficit)
- [ ] Log meals totaling 1500 cal (below maintenance 2000)
- [ ] Check `daily_calorie_summary` updated
- [ ] Call `getProjectedWeightToday(userId)`
- [ ] Verify projected weight is LESS than initial (weight loss)

### 3. Meal Logging (Surplus)
- [ ] Log meals totaling 2500 cal (above maintenance 2000)
- [ ] Check `daily_calorie_summary` updated
- [ ] Call `getProjectedWeightToday(userId)`
- [ ] Verify projected weight is MORE than initial (weight gain)

### 4. Workout Integration
- [ ] Log workout with 300 cal burned
- [ ] Log meals totaling 2000 cal
- [ ] Net = (2000 - 300) - 2000 = -300 cal deficit
- [ ] Verify projection shows slight weight loss

### 5. No Meal Logging
- [ ] Skip logging meals for a day
- [ ] Call `getProjectedWeightToday(userId)`
- [ ] Verify weight stays same (maintenance assumed)

### 6. Chart Display
- [ ] Call `getWeightProgressChart(userId, 7)`
- [ ] Verify Day 1 has `is_actual: true`
- [ ] Verify Days 2-7 have `is_projected: true`
- [ ] Verify calorie data shows consumed/burned for each day

## Troubleshooting

### "No weight progress data found"
**Cause**: User hasn't completed registration with weight
**Fix**: Ensure registration saves `weight_kg` field

### "Weight not changing despite meal logs"
**Cause**: Maintenance calories not set
**Check**: 
1. User has active meal plan
2. Or registration has `calorie_goal` set
3. Function defaults to 2000 if both null

### "Projection seems wrong"
**Check**:
1. `daily_calorie_summary` has correct data
2. Triggers are firing on meal/workout inserts
3. Cumulative balance calculation is correct
4. Formula: balance / 7700 = kg change

### "Initial weight not created"
**Cause**: Trigger not firing
**Fix**: 
1. Check trigger exists: `trigger_insert_initial_weight`
2. Manually run backfill script
3. Verify `weight_kg` field is not null in registration

## Production Deployment

### Pre-Deployment
1. Backup `weight_tracking` table
2. Backup `registration_profiles` table
3. Test migration on staging database

### Deployment Steps
1. Run `20251106_automatic_weight_tracking.sql` in Supabase Dashboard
2. Verify backfill completed (check NOTICE messages)
3. Test with one user manually
4. Monitor logs for errors
5. Deploy app code changes

### Post-Deployment Monitoring
- Check trigger is firing on new registrations
- Monitor RPC function performance
- Verify weight projections are reasonable
- Check user feedback on weight tracking

## Future Enhancements

### Phase 2: Manual Weight Entry
- Allow users to manually log actual weight
- Reset projections from actual measurements
- Show comparison: projected vs actual

### Phase 3: Smart Insights
- "You're on track to reach goal weight in X days"
- "Increase deficit by 200 cal/day to lose 0.5kg/week"
- Weekly progress notifications

### Phase 4: Body Composition
- Body fat percentage tracking
- Muscle mass estimation
- Visual progress photos

---

**Migration File**: `20251106_automatic_weight_tracking.sql`  
**Status**: ✅ Ready to Execute  
**Impact**: All users with registration weight will get automatic tracking  
**Risk**: Low - only adds new triggers/functions, doesn't modify existing data

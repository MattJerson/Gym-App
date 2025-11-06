# Calorie Tracking Integration - Complete Implementation

## 🎯 Overview
This implementation integrates **workout calories burned** and **meal calories consumed** into the **Weight Progress Tracking** system, providing accurate calorie balance tracking and weight projections based on actual user data.

**Optimized for both daily active users and long-term tracking (1 day to 10+ years).**

## 📊 Architecture

### Data Flow
```
User Activity → Database Triggers → Daily Summary → Weight Projections
     ↓                  ↓                ↓                ↓
Workouts +        Auto-update       Cached         Chart with
  Meals           on changes      Calculations    Projections
```

### Core Components

#### 1. **Daily Calorie Summary Table** (`daily_calorie_summary`)
Stores aggregated calorie data per user per day:
- **Consumed**: Calories from logged meals (from `user_meal_logs`)
- **Burned**: Calories from completed workouts (from `workout_sessions`)
- **Net Balance**: `consumed - burned`
- **Goals**: User's meal plan targets or defaults
- **Activity Counts**: Meals logged, workouts completed, total minutes

**Benefits**:
- ✅ Fast queries (cached data)
- ✅ Historical tracking
- ✅ Auto-updates via triggers
- ✅ Per-user isolation with RLS

#### 2. **Database Functions**

##### `calculate_daily_calorie_balance(p_user_id, p_date)`
Calculates real-time calorie balance for a specific date:
- Sums calories from all meals on that date
- Sums calories from all completed workouts on that date
- Gets user's calorie goals from active meal plan
- Returns comprehensive breakdown

**Returns**:
```javascript
{
  calories_consumed: numeric,    // Total from meals
  calories_burned: numeric,      // Total from workouts
  net_calories: numeric,         // consumed - burned
  protein_consumed: numeric,     // Total protein
  carbs_consumed: numeric,       // Total carbs
  fats_consumed: numeric,        // Total fats
  meals_logged: integer,         // Count of meals
  workouts_completed: integer,   // Count of workouts
  workout_minutes: integer,      // Total workout time
  calorie_goal: integer,         // User's daily goal
  protein_goal: integer,
  carbs_goal: integer,
  fats_goal: integer
}
```

##### `update_daily_calorie_summary(p_user_id, p_date)`
Updates or creates cached summary in `daily_calorie_summary` table:
- Calls `calculate_daily_calorie_balance()`
- Upserts result into summary table
- Used by triggers for automatic updates

##### `get_weight_progress_chart(p_user_id, p_days_back)`
Generates weight progress chart with calorie integration:
- Returns actual weight measurements
- Projects future weight based on calorie deficit
- Includes calorie data for each day
- **Projection Formula**: `3500 cal deficit = 1 lb (0.45 kg) loss`
  - More accurate: `7700 cal deficit = 1 kg loss`

**Returns**:
```javascript
{
  measurement_date: date,
  weight_kg: numeric,           // Actual or projected
  is_actual: boolean,           // Real measurement
  is_projected: boolean,        // Calculated projection
  calorie_balance: numeric,     // Net calories for day
  calories_consumed: numeric,   // From meals
  calories_burned: numeric,     // From workouts
  trend: varchar                // 'actual' or 'projected'
}
```

#### 3. **Automatic Triggers**

##### Meal Log Trigger (`trigger_meal_log_calorie_update`)
Fires on `INSERT`, `UPDATE`, `DELETE` of `user_meal_logs`:
- Automatically updates `daily_calorie_summary` for affected date
- Keeps calorie balance in sync with meal logging

##### Workout Session Trigger (`trigger_workout_calorie_update`)
Fires on `INSERT`, `UPDATE`, `DELETE` of `workout_sessions`:
- Updates summary when workout is completed
- Tracks status changes (`in_progress` → `completed`)
- Keeps calorie burn data accurate

## 🔧 Service Layer

### WeightProgressService Updates

#### New Methods

**`getDailyCalorieBalance(userId, date)`**
- Real-time calculation for specific date
- Returns comprehensive calorie breakdown
- Includes macros, activity counts, goals

**`getDailyCalorieSummary(userId, date)`**
- Fast cached version from database
- Falls back to real-time if no cache
- Optimized for frequent queries

**`getCalorieSummaryRange(userId, startDate, endDate)`**
- Bulk fetch for date ranges
- Useful for charts and analytics
- Returns array of daily summaries

**Enhanced `getWeightProgressChart(userId, daysBack)`**
- Now includes calorie data per day
- Shows consumed/burned/net for each point
- Calculates average daily balance
- Provides total calories over period

**Returns Enhanced Data**:
```javascript
{
  labels: ['11/01', '11/02', ...],
  values: [75.5, 75.3, ...],
  actualMeasurements: [{date, weight, calorieBalance, ...}],
  projections: [{date, weight, calorieBalance, ...}],
  calorieData: [{date, consumed, burned, net}],
  trend: 'decreasing',
  weightChange: -0.8,
  avgCalorieBalance: -350,           // NEW
  totalCaloriesConsumed: 14500,      // NEW
  totalCaloriesBurned: 2800          // NEW
}
```

## 📱 Usage Examples

### Get Today's Calorie Balance
```javascript
import { WeightProgressService } from './services/WeightProgressService';

const balance = await WeightProgressService.getDailyCalorieBalance(userId);
console.log(`Consumed: ${balance.caloriesConsumed} cal`);
console.log(`Burned: ${balance.caloriesBurned} cal`);
console.log(`Net: ${balance.netCalories} cal`);
console.log(`Deficit: ${balance.deficit} cal`);
```

### Get Weight Progress with Calorie Data (7 days)
```javascript
const progress = await WeightProgressService.getWeightProgressChart(userId, 7);

// Chart data
console.log('Weight values:', progress.values);
console.log('Calorie data:', progress.calorieData);

// Statistics
console.log(`Weight change: ${progress.weightChange} kg`);
console.log(`Avg daily balance: ${progress.avgCalorieBalance} cal`);
console.log(`Total consumed: ${progress.totalCaloriesConsumed} cal`);
console.log(`Total burned: ${progress.totalCaloriesBurned} cal`);
```

### Get Long-Term Progress (1+ years) - OPTIMIZED
```javascript
// Get weight measurements only (fast for large ranges)
const measurements = await WeightProgressService.getWeightMeasurementsOnly(
  userId,
  '2023-01-01',  // Start date
  '2025-11-06',  // End date
  1000           // Max results
);

// measurements: [{date, weight, bodyFat, muscleMass}, ...]
console.log(`${measurements.length} measurements over ${Math.floor((new Date(measurements[measurements.length-1].date) - new Date(measurements[0].date)) / (1000*60*60*24))} days`);
```

### Get Aggregated Data for Long-Term Views
```javascript
// Weekly aggregates (perfect for 3+ month views)
const weeklyData = await WeightProgressService.getAggregatedCalorieData(
  userId,
  '2025-01-01',
  '2025-11-06',
  'week'  // or 'day', 'month'
);

weeklyData.forEach(week => {
  console.log(`Week ${week.periodStart} to ${week.periodEnd}:`);
  console.log(`  Avg consumed: ${week.avgCaloriesConsumed} cal/day`);
  console.log(`  Avg burned: ${week.avgCaloriesBurned} cal/day`);
  console.log(`  ${week.totalWorkoutsCompleted} workouts, ${week.totalMealsLogged} meals`);
});
```

### Get Overall Progress Statistics
```javascript
// Get comprehensive stats for entire tracking period
const stats = await WeightProgressService.getWeightProgressStats(userId);

console.log(`Total measurements: ${stats.totalMeasurements}`);
console.log(`Weight: ${stats.firstWeight}kg → ${stats.latestWeight}kg (${stats.totalChange > 0 ? '+' : ''}${stats.totalChange}kg)`);
console.log(`Average change: ${stats.avgWeeklyChange}kg/week`);
console.log(`Range: ${stats.minWeight}kg - ${stats.maxWeight}kg`);
console.log(`Days tracked: ${stats.daysTracked}`);
console.log(`Avg calorie deficit: ${stats.avgCalorieDeficit} cal/day`);
```

### Get Calorie History
```javascript
const history = await WeightProgressService.getCalorieSummaryRange(
  userId,
  '2025-11-01',
  '2025-11-07'
);

history.forEach(day => {
  console.log(`${day.date}: ${day.netCalories} cal (${day.mealsLogged} meals, ${day.workoutsCompleted} workouts)`);
});
```

## 🔐 Security

### Row Level Security (RLS)
All tables have RLS policies ensuring users can only access their own data:

**daily_calorie_summary**:
- ✅ SELECT: `auth.uid() = user_id`
- ✅ INSERT: `auth.uid() = user_id`
- ✅ UPDATE: `auth.uid() = user_id`
- ✅ DELETE: `auth.uid() = user_id`

### Function Security
All functions use `SECURITY DEFINER` to run with elevated privileges while still respecting RLS on underlying tables.

## 🎨 UI Integration Points

### Dashboard Stats
```javascript
const today = await WeightProgressService.getDailyCalorieSummary(userId);

<StatsCard 
  value={today.netCalories}
  label="Net Calories Today"
  trend={today.isDeficit ? 'down' : 'up'}
  color={today.isDeficit ? 'green' : 'red'}
/>
```

### Weight Progress Chart
```javascript
const progress = await WeightProgressService.getWeightProgressChart(userId, 30);

<LineChart
  data={{
    labels: progress.labels,
    datasets: [
      {
        label: 'Weight',
        data: progress.values,
        borderColor: '#3B82F6'
      },
      {
        label: 'Calorie Balance',
        data: progress.calorieData.map(d => d.net),
        borderColor: '#10B981',
        yAxisID: 'calories'
      }
    ]
  }}
/>
```

### Calorie Breakdown
```javascript
const balance = await WeightProgressService.getDailyCalorieBalance(userId);

<View>
  <Text>🍽️ Consumed: {balance.caloriesConsumed} cal</Text>
  <Text>💪 Burned: {balance.caloriesBurned} cal</Text>
  <Text>📊 Net: {balance.netCalories} cal</Text>
  <Text>🎯 Goal: {balance.calorieGoal} cal</Text>
  <Text style={{color: balance.isDeficit ? 'green' : 'red'}}>
    {balance.isDeficit ? 'Deficit' : 'Surplus'}: {Math.abs(balance.deficit)} cal
  </Text>
</View>
```

## 📈 Weight Projection Algorithm

### Formula
```
Projected Weight = Current Weight - (Cumulative Deficit / 7700)
```

Where:
- **7700 calories** = 1 kg of body weight
- **Cumulative Deficit** = Sum of (Goal - Net Calories) for each day since last measurement

### Example
```
Day 1: Goal 2000 cal, Net 1500 cal → Deficit: 500 cal
Day 2: Goal 2000 cal, Net 1600 cal → Deficit: 400 cal
Day 3: Goal 2000 cal, Net 1700 cal → Deficit: 300 cal

Cumulative Deficit = 500 + 400 + 300 = 1200 cal
Weight Loss = 1200 / 7700 = 0.156 kg

If current weight = 75 kg
Projected weight = 75 - 0.156 = 74.844 kg
```

## 🚀 Performance Optimizations

### For Daily Active Users
1. **Cached Summaries**: `daily_calorie_summary` table caches calculations
2. **Automatic Updates**: Triggers keep cache in sync without manual intervention
3. **Indexed Queries**: Indexes on `(user_id, summary_date)` for fast lookups
4. **Efficient Aggregations**: Database-level SUM() operations instead of app-level
5. **Batch Queries**: `getCalorieSummaryRange()` fetches multiple days in one query

### For Long-Term Tracking (Months/Years)
1. **Measurement-Only Queries**: `getWeightMeasurementsOnly()` skips calorie joins for speed
2. **Aggregated Views**: Weekly/monthly aggregates reduce data points by 7x-30x
3. **Smart Projections**: Weight projections capped at 90 days to avoid unrealistic extrapolation
4. **Optimized Baseline**: For large date ranges, finds baseline weight efficiently
5. **Batch Processing**: Backfill processes in 100-record batches to avoid memory issues

### Recommended Approaches by Date Range

**1-30 days**: Use `getWeightProgressChart(userId, days)` with full calorie data
```javascript
const data = await WeightProgressService.getWeightProgressChart(userId, 30);
// Returns: daily weights + calorie data for each day
```

**1-3 months**: Use weekly aggregates
```javascript
const weekly = await WeightProgressService.getAggregatedCalorieData(
  userId, startDate, endDate, 'week'
);
// Returns: 12-13 data points instead of 90+
```

**3-12 months**: Use monthly aggregates + weight measurements
```javascript
const monthly = await WeightProgressService.getAggregatedCalorieData(
  userId, startDate, endDate, 'month'
);
const weights = await WeightProgressService.getWeightMeasurementsOnly(
  userId, startDate, endDate
);
// Combine for efficient visualization
```

**1+ years**: Use stats + sparse measurements
```javascript
const stats = await WeightProgressService.getWeightProgressStats(userId);
const weights = await WeightProgressService.getWeightMeasurementsOnly(
  userId, null, null, 365  // Limit to 1 point per day max
);
// Overview stats + trend line
```

## 🔄 Migration Steps

### 1. Run Migration
```bash
# In Supabase Dashboard SQL Editor
# Run: supabase/migrations/20251106_calorie_tracking_integration.sql
```

### 2. Verify Tables
```sql
-- Check table created
SELECT * FROM daily_calorie_summary LIMIT 5;

-- Check backfill completed
SELECT user_id, COUNT(*) as days_tracked
FROM daily_calorie_summary
GROUP BY user_id;
```

### 3. Test Functions
```sql
-- Test calorie balance calculation
SELECT * FROM calculate_daily_calorie_balance(
  'user-uuid-here', 
  CURRENT_DATE
);

-- Test weight progress chart
SELECT * FROM get_weight_progress_chart(
  'user-uuid-here',
  7
);
```

## 📊 Data Validation

### Verify Calorie Tracking
```sql
-- Check meals logged today
SELECT user_id, meal_date, SUM(calories) as total_calories
FROM user_meal_logs
WHERE meal_date = CURRENT_DATE
GROUP BY user_id, meal_date;

-- Check workouts completed today
SELECT user_id, DATE(completed_at), SUM(estimated_calories_burned) as total_burned
FROM workout_sessions
WHERE DATE(completed_at) = CURRENT_DATE
  AND status = 'completed'
GROUP BY user_id, DATE(completed_at);

-- Compare with summary table
SELECT user_id, summary_date, calories_consumed, calories_burned, net_calories
FROM daily_calorie_summary
WHERE summary_date = CURRENT_DATE;
```

## 🎯 Benefits

### For Users
- ✅ See how workouts impact weight loss goals
- ✅ Understand calorie balance in context of progress
- ✅ Accurate weight projections based on actual activity
- ✅ Motivation from seeing workout calories burned

### For Developers
- ✅ Automatic data synchronization via triggers
- ✅ Fast queries with cached summaries
- ✅ Scalable architecture (database-level aggregations)
- ✅ Type-safe service layer with comprehensive error handling
- ✅ Easy to extend with additional metrics

### For System
- ✅ Efficient database operations
- ✅ No manual cache invalidation needed
- ✅ Historical data automatically tracked
- ✅ RLS ensures data security
- ✅ Backfill completed for existing users

## 🔮 Future Enhancements

1. **Weekly/Monthly Summaries**: Aggregate by week/month for trends
2. **Goal Adjustments**: Auto-adjust calorie goals based on progress
3. **Predictive Analytics**: ML-based weight predictions
4. **Activity Multipliers**: Account for NEAT (non-exercise activity thermogenesis)
5. **BMR Integration**: Calculate accurate daily calorie needs based on user stats
6. **Notifications**: Alert when consistently over/under goals
7. **Streak Tracking**: Days of calorie deficit/surplus streaks

## ✅ Testing Checklist

- [ ] Run migration successfully
- [ ] Verify `daily_calorie_summary` table created
- [ ] Check RLS policies active
- [ ] Test `calculate_daily_calorie_balance()` function
- [ ] Test `get_weight_progress_chart()` function
- [ ] Verify triggers fire on meal log insert
- [ ] Verify triggers fire on workout completion
- [ ] Test service layer methods
- [ ] Validate calorie balance calculations
- [ ] Check weight projections accuracy
- [ ] Test with multiple users (RLS isolation)
- [ ] Performance test with large datasets

## 📝 Notes

- **Calorie Accuracy**: Relies on accurate workout calorie calculations (MET-based)
- **Meal Logging**: Users must log meals for consumed calories to be tracked
- **Workout Completion**: Only completed workouts count toward calories burned
- **Backfill**: Migration automatically backfills last 90 days for all active users
- **Real-time Updates**: Triggers ensure summaries update immediately on data changes
- **Long-Term Support**: Optimized for tracking from 1 day to 10+ years
- **Projection Limits**: Weight projections capped at 90 days from last measurement for accuracy
- **Performance**: Uses aggregation for long-term views, full data for recent activity

---

## 🎓 Quick Reference - Which Function to Use?

| Use Case | Function | Best For | Returns |
|----------|----------|----------|---------|
| Today's calories | `getDailyCalorieBalance()` | Current day tracking | Consumed, burned, net, macros |
| Recent progress (7-30 days) | `getWeightProgressChart()` | Daily chart with calories | Weight + calorie data per day |
| Long-term weights only | `getWeightMeasurementsOnly()` | Multi-year charts | Just weight measurements |
| Weekly/monthly trends | `getAggregatedCalorieData()` | 3+ month views | Averaged calorie data |
| Overall statistics | `getWeightProgressStats()` | Summary cards | Total change, avg rate, etc. |
| Date range calories | `getCalorieSummaryRange()` | Custom periods | Daily calorie summaries |

### Example: All-Time Progress View
```javascript
// Get stats for overview
const stats = await WeightProgressService.getWeightProgressStats(userId);

// Get monthly averages for chart
const startDate = stats.daysTracked > 365 
  ? new Date(Date.now() - 365*24*60*60*1000).toISOString().split('T')[0]
  : null;

const monthlyData = await WeightProgressService.getAggregatedCalorieData(
  userId, 
  startDate, 
  new Date().toISOString().split('T')[0],
  'month'
);

// Get actual measurements for overlay
const measurements = await WeightProgressService.getWeightMeasurementsOnly(
  userId,
  startDate,
  null,
  365
);

console.log(`Total change: ${stats.totalChange}kg over ${stats.daysTracked} days`);
console.log(`Average: ${stats.avgWeeklyChange}kg/week`);
console.log(`${measurements.length} weight measurements`);
console.log(`${monthlyData.length} months of data`);
```

---

**Migration File**: `supabase/migrations/20251106_calorie_tracking_integration.sql`
**Service Updates**: `services/WeightProgressService.js`
**Dependencies**: Requires `user_meal_logs`, `workout_sessions`, `user_meal_plan_calculations` tables

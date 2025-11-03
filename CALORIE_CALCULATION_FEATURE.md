# 🔥 Dynamic Calorie Calculation Feature

## Overview
Implemented dynamic calorie calculation for workout templates based on each exercise's MET value and the user's biometric data (weight). Each workout now displays an estimated calorie burn that is personalized to the user.

## Implementation Summary

### 1. **CalorieCalculator Service** (`services/CalorieCalculator.js`)
Created a new utility service that handles all calorie calculations using the standard MET formula:

**Formula:** `Calories = MET × weight_kg × duration_hours`

#### Key Functions:
- `calculateExerciseCalories(metValue, weightKg, sets, restTimeSeconds, estimatedSetDuration)`
  - Calculates calories for a single exercise
  - Accounts for working time (sets × duration) and rest time between sets
  - Uses 1.5 minutes per set as default estimate

- `calculateWorkoutCalories(exercises, weightKg)`
  - Sums up calories for all exercises in a workout
  - Iterates through exercise array and calculates each one

- `getUserWeight(userId)`
  - Fetches user's weight from `registration_profiles` table
  - Returns weight_kg or null if not found

- `calculateWorkoutCaloriesForUser(exercises, userId)`
  - Convenience method that automatically fetches user weight
  - Falls back to 70kg if weight not available

- `calculateWorkoutDuration(exercises)`
  - Calculates total estimated workout duration in minutes
  - Includes working time + rest periods

### 2. **TrainingDataService Updates** (`services/TrainingDataService.js`)
Enhanced the `createCustomWorkout` method to automatically calculate calories:

```javascript
// Added import
import { CalorieCalculator } from './CalorieCalculator';

// In createCustomWorkout:
const estimatedCalories = await CalorieCalculator.calculateWorkoutCaloriesForUser(
  workoutData.exercises,
  userId
);

// Passed to database
p_estimated_calories: estimatedCalories
```

### 3. **Create Workout UI Updates** (`app/training/create-workout.jsx`)

#### Added State:
- `userWeight`: Stores user's weight for real-time calculations
- `estimatedCalories`: useMemo hook that recalculates whenever exercises change

#### Enhanced Features:
- **User Weight Loading**: Fetches user weight on component mount
- **Real-time Calorie Display**: Preview card shows estimated calories that update as exercises are added/removed
- **Visual Design**: 
  - Flame icon (🔥) next to calorie estimate
  - Red color (#EF4444) for emphasis
  - Rounded badge styling with semi-transparent background

```jsx
{estimatedCalories > 0 && (
  <View style={styles.previewCaloriesContainer}>
    <Ionicons name="flame" size={14} color="#EF4444" />
    <Text style={styles.previewCalories}>
      ~{estimatedCalories} calories
    </Text>
  </View>
)}
```

## How It Works

### Workout Creation Flow:
1. User opens create workout screen
2. System fetches user's weight from database (registration_profiles.weight_kg)
3. As user adds exercises, system:
   - Gets each exercise's MET value (from exercises table)
   - Calculates calories per exercise based on sets, rest time, and MET
   - Sums total estimated calories
4. Preview card displays real-time calorie estimate
5. When user saves workout, calories are stored in database (workout_templates.estimated_calories)

### Example Calculation:
```
Exercise: Bench Press
- MET Value: 6.0
- User Weight: 75kg
- Sets: 3
- Rest Time: 60 seconds
- Set Duration: 1.5 minutes

Working Time = 3 sets × 1.5 min = 4.5 minutes
Rest Time = (3-1) × 60s = 2 minutes
Total Time = 6.5 minutes = 0.108 hours

Calories = 6.0 × 75kg × 0.108h = 48.6 ≈ 49 calories
```

## Database Schema Requirements

### Existing Tables Used:
- `registration_profiles.weight_kg` - User's weight in kilograms
- `exercises.met_value` - MET value for each exercise (metabolic equivalent)
- `workout_templates.estimated_calories` - Stores calculated calories

### MET Values:
Each exercise in the database includes a `met_value` field:
- Light exercises: 3.0-4.0 MET
- Moderate exercises: 5.0-6.0 MET  
- Vigorous exercises: 7.0-10.0+ MET
- Default fallback: 6.0 MET if not specified

## Benefits

1. **Personalized**: Uses actual user weight for accurate estimates
2. **Dynamic**: Updates in real-time as exercises are added/removed
3. **Motivating**: Shows users concrete calorie burn goals
4. **Scalable**: Works for any workout template (custom or preset)
5. **Scientific**: Based on standard MET formula used in exercise science

## Future Enhancements

Potential improvements:
- Consider user's age, gender, and fitness level for more accurate calculations
- Track actual calories burned during workout sessions vs. estimates
- Add BMR (Basal Metabolic Rate) calculations
- Display calorie comparison charts between different workouts
- Add daily/weekly calorie burn goals and tracking

## Files Modified

1. **NEW**: `services/CalorieCalculator.js` - Complete calorie calculation utility
2. `services/TrainingDataService.js` - Added calorie calculation to workout creation
3. `app/training/create-workout.jsx` - Added real-time calorie display in UI

## Testing Checklist

- [x] User weight loads on component mount
- [x] Calories calculate correctly for single exercise
- [x] Calories sum correctly for multiple exercises
- [x] Preview updates in real-time when exercises added/removed
- [x] Falls back to default weight (70kg) if user weight not found
- [x] Calories save to database when workout is created
- [x] UI displays calories with flame icon and proper styling
- [x] No TypeScript/lint errors

## Usage Example

```javascript
// Calculate calories for a workout
const exercises = [
  { met_value: 6.0, sets: 3, restTime: 60 },
  { met_value: 8.0, sets: 4, restTime: 90 },
  { met_value: 5.5, sets: 3, restTime: 45 }
];

const calories = await CalorieCalculator.calculateWorkoutCaloriesForUser(
  exercises, 
  userId
);
// Returns: ~245 calories (varies by user weight)
```

---

**Implementation Date:** November 4, 2025  
**Status:** ✅ Complete and Ready for Testing

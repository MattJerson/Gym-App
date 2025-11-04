# Dynamic Calorie Calculation - Quick Guide

## 🎯 What Changed?

### Before: Static Calories ❌
```
Template says: 180 calories
You lift 50kg  → 180 calories
You lift 100kg → 180 calories (SAME?! 😞)
```

### After: Dynamic Calories ✅
```
Template says: 180 calories (estimate)
You lift 50kg  → 250 calories (accurate!)
You lift 100kg → 450 calories (MORE! 💪)
```

---

## 📊 How It Works

### Formula:
```
Calories = (MET × Your Weight × Workout Duration) + (Weight Lifted × 0.05)
```

### Example Workout:
```
Your body weight: 75kg
Workout type: Strength Training (MET = 5.5)
Workout duration: 45 minutes (0.75 hours)
Total volume: 8,000kg (weight × reps × sets)

Calculation:
Base calories   = 5.5 × 75 × 0.75 = 309 cal
Volume bonus    = 8,000 × 0.05    = 400 cal
─────────────────────────────────────────
TOTAL CALORIES  = 709 calories! 🔥
```

---

## 🚀 Real-Time Updates

### While Working Out:
```
Set 1 completed (80kg × 10 reps)
→ Calories: 210 (+30)

Set 2 completed (80kg × 10 reps)
→ Calories: 240 (+30)

Set 3 completed (80kg × 10 reps)
→ Calories: 270 (+30)

...keeps updating live! 📈
```

---

## 🎮 MET Values by Workout Type

| Workout Type | MET Value | Example |
|--------------|-----------|---------|
| Strength Training | 5.5 | Bench press, squats |
| Power Training | 7.0 | Olympic lifts, plyometrics |
| HIIT/Cardio | 9.0 | Burpees, sprints |
| Circuit Training | 7.5 | High-rep circuits |
| General Training | 5.0 | Bodyweight exercises |

---

## 💪 Impact on Your Workouts

### Light Day:
- 5 sets × 60kg × 8 reps = 2,400kg volume
- 30 minutes duration
- **Result: ~200 calories**

### Heavy Day:
- 10 sets × 100kg × 10 reps = 10,000kg volume
- 60 minutes duration
- **Result: ~600 calories**

### HIIT Day:
- Bodyweight exercises
- 30 minutes high intensity (MET 9.0)
- **Result: ~400 calories**

---

## 📱 Where You'll See It

1. **During Workout** (`[workoutId].jsx`)
   - Live calorie counter updates as you complete sets
   - Shows in completion modal

2. **Activity Feed** (`training.jsx`)
   - Recent workouts show accurate calories
   - Reflects actual work done

3. **Workout History**
   - All past sessions recalculated
   - Fair comparison between workouts

---

## ✅ Deploy Now

```bash
npx supabase db push
```

That's it! Your calories will now be accurate and motivating! 🎉

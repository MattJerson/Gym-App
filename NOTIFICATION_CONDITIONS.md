# Smart Notification Conditions

All notifications now have intelligent requirements to ensure they're relevant and helpful.

## 🚀 Motivational Notifications (Day-Specific)

### Monday Morning Motivation
- **Schedule**: Mondays at 7:00 AM
- **Conditions**:
  - User registered >24 hours ago
  - User logged in within last 14 days (active user)
- **Cooldown**: Once per week

### Wednesday Wellness Check
- **Schedule**: Wednesdays at 12:00 PM (noon)
- **Conditions**:
  - User registered >24 hours ago
  - User logged in within last 14 days (active user)
- **Cooldown**: Once per week

### Friday Challenge
- **Schedule**: Fridays at 6:00 PM
- **Conditions**:
  - User registered >24 hours ago
  - User logged in within last 14 days (active user)
- **Cooldown**: Once per week

### Sunday Planning
- **Schedule**: Sundays at 7:00 PM
- **Conditions**:
  - User registered >24 hours ago
  - User logged in within last 14 days (active user)
- **Cooldown**: Once per week

---

## 💪 Activity-Based Notifications

### No Workout Logged
- **Schedule**: Daily at 6:00 PM
- **Conditions**:
  - User registered >48 hours ago (grace period)
  - User has logged at least ONE workout before (knows how to use the feature)
  - User has NOT logged a workout TODAY
- **Cooldown**: Once per day
- **Why**: Only reminds users who already use the workout feature but forgot today

### No Meal Logged
- **Schedule**: Daily at 7:00 PM
- **Conditions**:
  - User registered >48 hours ago (grace period)
  - User has logged at least ONE meal before (knows how to use the feature)
  - User has NOT logged a meal TODAY
- **Cooldown**: Once per day
- **Why**: Only reminds users who already track nutrition but forgot today

### Daily Hydration
- **Schedule**: Every day at 10:00 AM
- **Conditions**:
  - User registered >24 hours ago
  - User logged in within last 7 days (recently active)
- **Cooldown**: Once per day
- **Why**: Only sends to recently active users who would benefit from the reminder

---

## 📊 Progress & Achievements

### Weekly Progress Report
- **Schedule**: Sundays at 8:00 PM
- **Conditions**:
  - User registered >7 days ago (need full week of data)
  - User logged at least ONE workout OR meal this week (has activity to report)
- **Cooldown**: Once per week
- **Why**: Only sends if user has actual progress to review

### Streak Milestones
- **Schedule**: When milestone is reached
- **Conditions**:
  - User's current streak equals milestone (3, 7, or 30 days)
- **Cooldown**: Once per milestone
- **Why**: Celebrates actual achievements

---

## 😢 Re-engagement Notifications

### We Miss You Today
- **Schedule**: Daily at 9:00 AM
- **Conditions**:
  - User registered >3 days ago (not brand new)
  - User has logged in before (has used the app)
  - User has NOT logged in TODAY
- **Cooldown**: Once per day
- **Why**: Gentle reminder for users who usually log in but forgot today

### We Miss You (3 Days Inactive)
- **Schedule**: Daily at 9:00 AM
- **Conditions**:
  - User registered >7 days ago
  - User has logged in before
  - User has NOT logged in for 3+ days
- **Cooldown**: Once per day
- **Why**: Stronger re-engagement for users who've been away for a while

---

## 🎯 Key Principles

### 1. **Grace Periods**
- New users (<24h): No automated notifications
- Very new users (<48h): No activity-based reminders
- New users (<3-7 days): No re-engagement notifications

### 2. **Feature Awareness**
- "No workout logged" only targets users who've logged workouts before
- "No meal logged" only targets users who've tracked meals before
- This prevents nagging users who don't use certain features

### 3. **Activity-Based Targeting**
- Motivational notifications only go to active users (logged in recently)
- Progress reports only go to users with activity to report
- Prevents spam to inactive/churned users

### 4. **Smart Scheduling**
- Day-specific notifications respect the day (Monday Motivation only Mondays)
- Time-specific delivery (morning motivation vs evening reminders)
- Cooldowns prevent duplicate notifications

### 5. **User Journey Awareness**
```
Day 0 (Registration):     No notifications
Day 1:                    No notifications (24h grace period)
Day 2+:                   Hydration reminders + day-specific motivation (if active)
Day 3+:                   Activity reminders (if user has logged before)
Day 7+:                   Weekly progress reports + re-engagement (if needed)
```

---

## 🔧 Configuration

All conditions are coded in the Edge Function. To modify:

1. **Change schedules**: Update `day_of_week` and `hour_of_day` in `notification_triggers` table
2. **Change grace periods**: Adjust the day calculations in Edge Function
3. **Change activity thresholds**: Modify the "last 7 days" / "last 14 days" checks
4. **Disable notifications**: Set `is_active = FALSE` in `notification_triggers` table

---

## ✅ Result

**Before**: All users got all notifications every hour = spam
**After**: Smart, contextual notifications based on:
- User age (registration date)
- User activity (login, workouts, meals)
- User behavior patterns (feature usage)
- Proper timing and frequency

Users now receive **relevant notifications at the right time** instead of constant spam! 🎉

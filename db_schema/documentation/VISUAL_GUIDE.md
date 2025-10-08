# 🎯 WHAT YOU'LL SEE AFTER RUNNING THE SQL

## Admin Dashboard (Badges.jsx)

### Weekly Leaderboard Card (Top Right)
```
┌─────────────────────────────────────────┐
│  🏆 Weekly Leaderboard                  │
├─────────────────────────────────────────┤
│  🥇  Athlete A                          │
│      50 points                          │
│      5 workouts • 3🔥 streak            │
├─────────────────────────────────────────┤
│  🥈  Athlete B                          │
│      45 points                          │
│      4 workouts • 2🔥 streak            │
├─────────────────────────────────────────┤
│  🥉  Athlete C                          │
│      40 points                          │
│      6 workouts • 4🔥 streak            │
├─────────────────────────────────────────┤
│  #4  Athlete D                          │
│      35 points                          │
│      3 workouts • 1🔥 streak            │
├─────────────────────────────────────────┤
│  #5  Athlete E                          │
│      30 points                          │
│      4 workouts • 2🔥 streak            │
└─────────────────────────────────────────┘
```

## Mobile App Profile Page

### Weekly Leaderboard Section
```
┌─────────────────────────────────────────┐
│  🏁 Weekly Leaderboard    ⏱️ 6d 14h left│
├─────────────────────────────────────────┤
│  🥇  Athlete A           50 pts 3🔥     │
│      ████████████████████ 100%          │
├─────────────────────────────────────────┤
│  🥈  Athlete B           45 pts 2🔥     │
│      ████████████████░░░░  90%          │
├─────────────────────────────────────────┤
│  🥉  Athlete C           40 pts 4🔥     │
│      ██████████████░░░░░░  80%          │
├─────────────────────────────────────────┤
│  #4  Athlete D           35 pts 1🔥     │
│      ██████████░░░░░░░░░░  70%          │
├─────────────────────────────────────────┤
│  #5  Athlete E           30 pts 2🔥     │
│      ████████░░░░░░░░░░░░  60%          │
├─────────────────────────────────────────┤
│  💪 Keep pushing to climb higher!       │
└─────────────────────────────────────────┘
```

## When Real Users Join

### Example: User "John Doe" completes 20 workouts
```
┌─────────────────────────────────────────┐
│  🥇  J**** (You)        200 pts 20🔥    │  ← Highlighted
│      ████████████████████ 100%          │
├─────────────────────────────────────────┤
│  🥈  Athlete A           50 pts 3🔥     │
│      ███████░░░░░░░░░░░░░  25%          │
├─────────────────────────────────────────┤
│  🥉  Athlete B           45 pts 2🔥     │
│      ██████░░░░░░░░░░░░░░  22%          │
├─────────────────────────────────────────┤
│  #4  Athlete C           40 pts 4🔥     │
│      █████░░░░░░░░░░░░░░░  20%          │
└─────────────────────────────────────────┘
```

## Database Query Results

### SELECT * FROM safe_weekly_leaderboard;
```
 position | anon_id  | display_name | total_points | current_streak | total_workouts | badges_earned | last_workout_date
----------|----------|--------------|--------------|----------------|----------------|---------------|------------------
    1     | fake001  | Athlete A    |      50      |       3        |       5        |       1       | 2025-10-08
    2     | fake002  | Athlete B    |      45      |       2        |       4        |       0       | 2025-10-08
    3     | fake003  | Athlete C    |      40      |       4        |       6        |       2       | 2025-10-08
    4     | fake004  | Athlete D    |      35      |       1        |       3        |       0       | 2025-10-08
    5     | fake005  | Athlete E    |      30      |       2        |       4        |       1       | 2025-10-08
```

### SELECT * FROM weekly_leaderboard; (Admin PII View)
```
 position | user_id | email | user_name | total_points | current_streak | total_workouts | badges_earned
----------|---------|-------|-----------|--------------|----------------|----------------|---------------
  (empty - no real users active in last 7 days yet)
```

## Security Test Results

### ✅ Client tries to access PII view (should fail)
```javascript
// In browser console or app
const { data, error } = await supabase
  .from('weekly_leaderboard')  // PII view
  .select('*');

console.log(error);
// ❌ Error: permission denied for view weekly_leaderboard
```

### ✅ Client accesses safe view (should work)
```javascript
const { data, error } = await supabase
  .from('safe_weekly_leaderboard')  // Safe view
  .select('*');

console.log(data);
// ✅ Returns 5 placeholder athletes with anonymized data
```

### ✅ Server (with service role key) accesses PII view
```javascript
// backend/admin-weekly-leaderboard.js
const { data, error } = await supabaseAdmin  // service_role client
  .from('weekly_leaderboard')
  .select('*');

console.log(data);
// ✅ Returns full user details (emails, real names, IDs)
```

## Points Calculation Example

### User completes activities:
- ✅ 10 workouts = 100 points (10 per workout)
- ✅ 2,000 calories burned = 20 points (1 per 100 cal)
- ✅ 3 badges earned = 30 points (varies by badge)
- ✅ 5,000 steps = 5 points (1 per 1000 steps)
- **Total: 155 points**

### Updated user_stats:
```sql
user_id    | total_points | current_streak | total_workouts | badges_earned
-----------|--------------|----------------|----------------|---------------
uuid-123   |     155      |       7        |       10       |       3
```

### Leaderboard position:
```
1. User (155 points) ← #1
2. Athlete A (50 points)
3. Athlete B (45 points)
```

## Success Indicators

### ✅ Setup is working if you see:
- [ ] Admin dashboard shows 5 athletes in leaderboard card
- [ ] Mobile app shows 5 athletes in profile section
- [ ] Supabase query returns 5 rows from `safe_weekly_leaderboard`
- [ ] Client cannot query `weekly_leaderboard` (permission denied)
- [ ] Athlete A is #1 with 50 points
- [ ] All 5 athletes have different points/workouts/streaks

### ❌ Troubleshooting if you don't see placeholders:
- Run VERIFICATION_QUERIES.sql to check setup
- Verify view was created: `\dv public.safe_weekly_leaderboard`
- Check for SQL errors in Supabase SQL Editor
- Ensure RLS permissions are set correctly
- Clear client cache and refresh

## File Locations

- **SQL to run:** `db_schema/COMPLETE_LEADERBOARD_SETUP.sql`
- **Verification queries:** `db_schema/VERIFICATION_QUERIES.sql`
- **Full guide:** `LEADERBOARD_IMPLEMENTATION_COMPLETE.md`
- **Admin page:** `admin/src/pages/Badges.jsx` (already coded)
- **Mobile page:** `app/page/profile.jsx` (already coded)
- **Service layer:** `services/GamificationDataService.js` (already coded)

## Quick Start Commands

```bash
# 1. Open Supabase SQL Editor
# Go to: https://supabase.com/dashboard/project/hjytowwfhgngbilousri/sql

# 2. Copy and paste COMPLETE_LEADERBOARD_SETUP.sql
# Click "Run"

# 3. Verify it worked
# Run: SELECT * FROM safe_weekly_leaderboard;
# Should see 5 athletes

# 4. Test admin dashboard
cd admin
npm run dev
# Navigate to http://localhost:5173 → Badges page

# 5. Test mobile app
npx expo start
# Navigate to Profile page in app
```

## You're Ready! 🚀

Everything is already coded and ready. Just run the SQL file and the leaderboard will populate with the 5 generic athletes in both the admin dashboard and mobile app.

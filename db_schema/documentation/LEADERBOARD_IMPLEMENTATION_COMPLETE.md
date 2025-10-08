# ✅ COMPLETE LEADERBOARD IMPLEMENTATION - READY TO DEPLOY

## What You Have Now

### 1. Admin Page (Badges.jsx) ✅
**Location:** `admin/src/pages/Badges.jsx`

**Already Implemented:**
- Fetches `safe_weekly_leaderboard` view (lines 114-173)
- Displays top 5 users in "Weekly Leaderboard" card (lines 522-555)
- Shows:
  - User position with medals (🥇🥈🥉) for top 3
  - Display name (anonymized)
  - Total points
  - Total workouts
  - Current streak with 🔥 emoji
- **The 5 generic placeholder users (Athlete A-E) will display here automatically**

**Optional Admin PII Access:**
- If you set `VITE_ADMIN_SECRET` in your `.env`, it will also fetch full PII data
- Requires backend endpoint (already created at `backend/admin-weekly-leaderboard.js`)

### 2. Client App (profile.jsx) ✅
**Location:** `app/page/profile.jsx`

**Already Implemented:**
- Fetches safe leaderboard via `GamificationDataService.getWeeklyLeaderboard()`
- Shows top 10 users with anonymized names
- Highlights current user's row
- Shows position, points, streak, and progress bars
- **Will display the 5 generic athletes plus any real active users**

### 3. Database Service ✅
**Location:** `services/GamificationDataService.js`

**Already Implemented:**
- `getWeeklyLeaderboard()` - Queries `safe_weekly_leaderboard` (privacy-safe)
- `getUserLeaderboardPosition()` - Gets user's rank without exposing PII
- `syncUserStatsFromActivity()` - Aggregates workout/badge/steps data into `user_stats`
- `getAdminWeeklyLeaderboard()` - Server-only method for PII access

## What You Need to Do

### STEP 1: Run SQL in Supabase ⚡ (REQUIRED)

1. Open your Supabase project
2. Go to SQL Editor
3. Open the file: **`db_schema/COMPLETE_LEADERBOARD_SETUP.sql`**
4. Copy ALL the SQL (the entire file)
5. Paste into Supabase SQL Editor
6. Click "Run"

**What this does:**
- ✅ Ensures `user_stats` table has all required columns
- ✅ Creates `safe_weekly_leaderboard` view with 5 placeholder athletes
- ✅ Creates `weekly_leaderboard` view (admin PII access)
- ✅ Sets up proper permissions (clients can't see PII)
- ✅ Creates indexes for performance
- ✅ Creates admin audit table
- ✅ Auto-updates `last_workout_date` when workouts are completed

### STEP 2: Verify It Works

After running the SQL, run these verification queries in Supabase:

```sql
-- Should return at least 5 (the placeholder users)
SELECT COUNT(*) FROM public.safe_weekly_leaderboard;

-- Should show 5 athletes: A, B, C, D, E
SELECT position, display_name, total_points 
FROM public.safe_weekly_leaderboard 
ORDER BY position 
LIMIT 5;
```

### STEP 3: Test in Admin Dashboard

1. Open your admin dashboard: `cd admin && npm run dev`
2. Navigate to Badges page
3. Look at "Weekly Leaderboard" card (top right)
4. **You should see:**
   - 🥇 Athlete A - 50 points, 5 workouts, 3🔥 streak
   - 🥈 Athlete B - 45 points, 4 workouts, 2🔥 streak
   - 🥉 Athlete C - 40 points, 6 workouts, 4🔥 streak
   - #4 Athlete D - 35 points, 3 workouts, 1🔥 streak
   - #5 Athlete E - 30 points, 4 workouts, 2🔥 streak

### STEP 4: Test in Mobile App

1. Start Expo: `npx expo start`
2. Navigate to Profile page
3. Scroll to "Weekly Leaderboard"
4. **You should see the same 5 athletes**

## How Users Get on the Leaderboard

### For Real Users to Appear:

1. **User must have a `user_stats` record** - Created automatically when:
   - They complete their first workout
   - They earn their first badge
   - `syncUserStatsFromActivity()` is called

2. **User must be active (last 7 days)** - The view filters:
   ```sql
   WHERE us.last_workout_date >= (CURRENT_DATE - INTERVAL '7 days')
   ```

3. **User needs points** - Points come from:
   - Workouts completed (10 points each)
   - Badges earned (varies by badge)
   - Calories burned (1 point per 100 cal)
   - Exercise sets completed

### To Manually Add a User to Test:

```sql
-- Replace YOUR_USER_ID with an actual user ID from auth.users
INSERT INTO public.user_stats (
  user_id,
  total_points,
  current_streak,
  total_workouts,
  badges_earned,
  last_workout_date
) VALUES (
  'YOUR_USER_ID',
  100,
  5,
  10,
  2,
  CURRENT_DATE
) ON CONFLICT (user_id) DO UPDATE SET
  total_points = 100,
  current_streak = 5,
  total_workouts = 10,
  badges_earned = 2,
  last_workout_date = CURRENT_DATE;
```

## Privacy & Security Setup ✅

### What's Protected:

1. **Safe View (`safe_weekly_leaderboard`):**
   - ✅ Anonymous user IDs (md5 hash)
   - ✅ Privacy-safe display names (nicknames or "J****")
   - ✅ No emails, no real user IDs
   - ✅ Accessible by authenticated clients

2. **Admin View (`weekly_leaderboard`):**
   - ⚠️ Contains real user IDs, emails, full names
   - 🔒 ONLY accessible via service role (server-side)
   - 🔒 Blocked from client access via RLS

### Security Recommendations:

#### ⚡ URGENT - Rotate Your Service Role Key
Your `.env` file exposes the service role key. You MUST:

1. Go to Supabase Dashboard → Settings → API
2. Click "Reset Service Role Key" 
3. Copy the new key
4. **DO NOT put it in client `.env` files**
5. Only use it in:
   - `backend/` server files
   - Secure server environments
   - Never in Expo/React Native builds

#### Update .env Files

**Client `.env` (Expo app) - REMOVE service role key:**
```env
SUPABASE_URL=https://hjytowwfhgngbilousri.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# DO NOT include VITE_SUPABASE_SERVICE_ROLE_KEY here
```

**Admin `.env` (Vite app) - For safe leaderboard only:**
```env
VITE_SUPABASE_URL=https://hjytowwfhgngbilousri.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Optional: For admin PII endpoint access
VITE_ADMIN_API_URL=http://localhost:8080/api/admin/weekly-leaderboard
VITE_ADMIN_SECRET=your-strong-secret-here
```

**Backend `.env` (Node.js server) - Service role ONLY:**
```env
SUPABASE_URL=https://hjytowwfhgngbilousri.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<NEW_ROTATED_KEY>
ADMIN_SECRET=your-strong-secret-here
```

## Optional: Admin PII Endpoint Setup

If you want the admin dashboard to show real user names/emails:

### 1. Start Backend Server
```bash
cd backend
node admin-weekly-leaderboard.js
```

### 2. Set Environment Variables
Create `backend/.env`:
```env
SUPABASE_URL=https://hjytowwfhgngbilousri.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<ROTATED_SERVICE_ROLE_KEY>
ADMIN_SECRET=your-strong-secret-123
PORT=8080
```

### 3. Configure Admin Dashboard
In `admin/.env`:
```env
VITE_ADMIN_API_URL=http://localhost:8080/api/admin/weekly-leaderboard
VITE_ADMIN_SECRET=your-strong-secret-123
```

### 4. Deploy Backend (Production)
- Deploy `backend/admin-weekly-leaderboard.js` to:
  - Vercel Serverless
  - Railway
  - Render
  - AWS Lambda
- Set environment variables in deployment platform
- Update `VITE_ADMIN_API_URL` to production URL

## File Changes Summary

### ✅ Already Modified (Previous Session):
- `admin/src/pages/Badges.jsx` - Leaderboard display + admin PII fetch
- `app/page/profile.jsx` - Safe leaderboard display
- `services/GamificationDataService.js` - All leaderboard methods
- `backend/admin-weekly-leaderboard.js` - Admin endpoint (created)

### ✅ New Files Created (This Session):
- `db_schema/COMPLETE_LEADERBOARD_SETUP.sql` - **RUN THIS IN SUPABASE**

### 🔄 Files You Need to Update:
- `.env` - Remove service role key, rotate keys
- `admin/.env` - Optional admin secret config
- `backend/.env` - Service role key (server only)

## Testing Checklist

- [ ] Run `COMPLETE_LEADERBOARD_SETUP.sql` in Supabase
- [ ] Verify 5 placeholder users appear: `SELECT * FROM safe_weekly_leaderboard;`
- [ ] Admin dashboard shows 5 athletes in leaderboard card
- [ ] Mobile app shows 5 athletes in profile leaderboard
- [ ] Complete a workout as a test user
- [ ] Run `SELECT * FROM user_stats WHERE user_id = 'YOUR_USER_ID';`
- [ ] Verify user appears in leaderboard (if workout was within 7 days)
- [ ] Rotate service role key in Supabase
- [ ] Remove service role key from client `.env` files
- [ ] Test that clients can't access `weekly_leaderboard` directly

## Support & Next Steps

### If Placeholders Don't Show:
1. Check Supabase SQL Editor for errors
2. Verify the view was created: `SELECT * FROM pg_views WHERE viewname = 'safe_weekly_leaderboard';`
3. Check RLS permissions: `SELECT * FROM pg_policies WHERE tablename = 'safe_weekly_leaderboard';`

### To Add More Placeholder Users:
Edit the SQL view and add more UNION ALL lines:
```sql
UNION ALL SELECT 'fake006', 'Athlete F', 25, 1, 2, 0, CURRENT_DATE
```

### To Customize Points Formula:
Edit `services/GamificationDataService.js` in `syncUserStatsFromActivity()` function:
```javascript
const computed_points = 
  total_workouts * 10 + 
  Math.floor(total_calories / 100) + 
  badge_points_sum + 
  Math.floor(total_steps / 1000);
```

## 🎉 You're Done!

Once you run the SQL, the admin page and mobile app will immediately show the 5 generic athletes. As real users complete workouts, they'll appear on the leaderboard ranked by points.

**Key Benefits:**
- ✅ Privacy-safe by default (anonymized IDs)
- ✅ Always shows content (5 placeholder users minimum)
- ✅ Auto-updates when users complete activities
- ✅ Secure admin access to PII when needed
- ✅ Performant (indexed queries)
- ✅ Ready for production

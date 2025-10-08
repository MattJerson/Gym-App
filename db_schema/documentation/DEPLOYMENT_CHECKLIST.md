# ✅ DEPLOYMENT CHECKLIST

## Pre-Deployment

- [ ] Backup your current database (Supabase Dashboard → Database → Backup)
- [ ] Review `COMPLETE_LEADERBOARD_SETUP.sql` 
- [ ] Understand what each section does (read comments)
- [ ] Review `LOGIN_VALIDATION_FIX.md` to understand the login changes

## Step 0: Quick Fix (REQUIRED - 30 seconds)

⚠️ **DO THIS FIRST** or app will crash!

- [ ] Open Supabase SQL Editor: https://supabase.com/dashboard
- [ ] Open file: `db_schema/QUICK_FIX_ADD_TOTAL_STEPS.sql`
- [ ] Copy and paste into SQL Editor
- [ ] Click "Run"
- [ ] Should see: `✅ Column added!`

## Step 1: Run SQL in Supabase

- [ ] Open Supabase SQL Editor
- [ ] Open file: `db_schema/COMPLETE_LEADERBOARD_SETUP.sql`
- [ ] Copy ALL content (Ctrl+A, Ctrl+C)
- [ ] Paste into SQL Editor
- [ ] Click "Run" button
- [ ] Check for any errors (should be green ✓)
- [ ] See "✅ LEADERBOARD SETUP COMPLETE" message

## Step 2: Verify Database Setup

- [ ] Run: `SELECT COUNT(*) FROM safe_weekly_leaderboard;`
  - Expected: At least 5 rows
- [ ] Run: `SELECT * FROM safe_weekly_leaderboard ORDER BY position LIMIT 5;`
  - Expected: See Athlete A, B, C, D, E
- [ ] Run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'user_stats';`
  - Expected: See total_points, current_streak, total_workouts, badges_earned, last_workout_date
- [ ] Run: `SELECT viewname FROM pg_views WHERE viewname IN ('safe_weekly_leaderboard', 'weekly_leaderboard');`
  - Expected: Both views exist

## Step 3: Test Admin Dashboard

- [ ] `cd admin`
- [ ] `npm install` (if first time)
- [ ] `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Navigate to Badges page
- [ ] Look for "Weekly Leaderboard" card (top right)
- [ ] Verify you see:
  - [ ] 🥇 Athlete A - 50 points
  - [ ] 🥈 Athlete B - 45 points
  - [ ] 🥉 Athlete C - 40 points
  - [ ] #4 Athlete D - 35 points
  - [ ] #5 Athlete E - 30 points

## Step 4: Test Mobile App

- [ ] `npx expo start` (from root directory)
- [ ] Open app in simulator or Expo Go
- [ ] Navigate to Profile page
- [ ] Scroll to "Weekly Leaderboard" section
- [ ] Verify you see the same 5 athletes
- [ ] Check that progress bars are showing
- [ ] Check that streaks (🔥) are displaying

## Step 5: Security Verification

- [ ] Open browser console on admin page
- [ ] Try to access PII view:
  ```javascript
  const { data, error } = await supabase
    .from('weekly_leaderboard')
    .select('*');
  console.log(error);
  ```
  - [ ] Expected: Permission denied error ❌
- [ ] Try to access safe view:
  ```javascript
  const { data, error } = await supabase
    .from('safe_weekly_leaderboard')
    .select('*');
  console.log(data);
  ```
  - [ ] Expected: Returns 5 athletes ✅

## Step 6: Test Login Validation Fix

- [ ] Create a test account or use existing account
- [ ] In Supabase SQL Editor, partially clear registration data:
  ```sql
  UPDATE registration_profiles 
  SET calorie_goal = NULL, meals_per_day = NULL 
  WHERE user_id = 'YOUR_TEST_USER_ID';
  ```
- [ ] Log out from mobile app
- [ ] Log in again
- [ ] Verify:
  - [ ] User is NOT redirected to registration process
  - [ ] User goes directly to home page
  - [ ] Profile page loads correctly
- [ ] Now clear essential fields:
  ```sql
  UPDATE registration_profiles 
  SET height_cm = NULL 
  WHERE user_id = 'YOUR_TEST_USER_ID';
  ```
- [ ] Log out and log in again
- [ ] Verify:
  - [ ] User IS redirected to registration process
  - [ ] Can complete missing fields
  - [ ] After filling height, can access home

## Step 7: Test User Sync

- [ ] Complete a workout in the app as a test user
- [ ] In Supabase SQL Editor, run:
  ```sql
  SELECT * FROM user_stats WHERE user_id = 'YOUR_USER_ID';
  ```
- [ ] Verify `last_workout_date` is today
- [ ] Verify `total_workouts` incremented
- [ ] Refresh leaderboard in app
- [ ] Check if user appears (if they have enough points)

## Step 8: Security Hardening

- [ ] Go to Supabase Dashboard → Settings → API
- [ ] Click "Reset Service Role Key"
- [ ] Copy new service role key
- [ ] Update `backend/.env` with new key (if using admin endpoint)
- [ ] Remove service role key from:
  - [ ] `Gym-App/.env`
  - [ ] `admin/.env`
  - [ ] Any client-side config files
- [ ] Verify only these files have service role key:
  - [ ] `backend/.env` (server only)
  - [ ] Secure deployment environment variables

## Step 9: Optional Admin PII Endpoint

Only if you want admin dashboard to show real user emails/names:

- [ ] Create `backend/.env`:
  ```env
  SUPABASE_URL=https://hjytowwfhgngbilousri.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=<NEW_ROTATED_KEY>
  ADMIN_SECRET=<generate-strong-random-secret>
  PORT=8080
  ```
- [ ] Test locally:
  ```bash
  cd backend
  npm install
  node admin-weekly-leaderboard.js
  ```
- [ ] Verify server starts on port 8080
- [ ] Update `admin/.env`:
  ```env
  VITE_ADMIN_API_URL=http://localhost:8080/api/admin/weekly-leaderboard
  VITE_ADMIN_SECRET=<same-secret-as-backend>
  ```
- [ ] Refresh admin dashboard
- [ ] Check browser network tab for admin endpoint call
- [ ] Verify `adminLeaderboard` state is populated

## Step 10: Production Deployment

- [ ] Deploy backend (if using admin endpoint):
  - [ ] Choose platform (Vercel/Railway/Render)
  - [ ] Set environment variables:
    - [ ] SUPABASE_URL
    - [ ] SUPABASE_SERVICE_ROLE_KEY (rotated)
    - [ ] ADMIN_SECRET
  - [ ] Deploy `backend/admin-weekly-leaderboard.js`
  - [ ] Get production URL
- [ ] Update admin `.env` with production URL:
  ```env
  VITE_ADMIN_API_URL=https://your-backend.vercel.app/api/admin/weekly-leaderboard
  ```
- [ ] Build admin dashboard:
  ```bash
  cd admin
  npm run build
  ```
- [ ] Deploy admin dashboard
- [ ] Test in production

## Step 11: Final Verification

- [ ] Admin dashboard (production) shows 5 athletes
- [ ] Mobile app shows 5 athletes
- [ ] Real users can appear on leaderboard
- [ ] Client cannot access PII view
- [ ] Service role key is not in client code
- [ ] Admin endpoint requires secret header (if deployed)
- [ ] Leaderboard updates when users complete workouts

## Rollback Plan (If Something Goes Wrong)

If you need to rollback:

```sql
-- Drop the views
DROP VIEW IF EXISTS public.safe_weekly_leaderboard;
DROP VIEW IF EXISTS public.weekly_leaderboard;

-- Drop the audit table
DROP TABLE IF EXISTS public.admin_access_audit;

-- Restore from backup
-- (Use Supabase Dashboard → Database → Backups)
```

Then re-run your original schema if needed.

## Success Criteria

### ✅ Consider deployment successful when:
- Admin dashboard displays 5 placeholder athletes
- Mobile app displays 5 placeholder athletes
- Real users appear when they complete workouts
- Privacy is maintained (no PII in safe view)
- Performance is acceptable (queries under 200ms)
- No errors in browser console
- No errors in Expo console
- Database queries are efficient (check Supabase logs)

### ❌ Rollback if:
- Errors prevent app from loading
- Database performance degraded significantly
- User data is exposed inappropriately
- Critical functionality is broken

## Post-Deployment Monitoring

Monitor for 24-48 hours:

- [ ] Check Supabase logs for errors
- [ ] Monitor database query performance
- [ ] Track user engagement with leaderboard
- [ ] Check for privacy concerns in logs
- [ ] Verify real users are appearing correctly

## Documentation

- [ ] Update team documentation with:
  - [ ] How leaderboard works
  - [ ] How points are calculated
  - [ ] Privacy safeguards in place
  - [ ] Admin access procedures
- [ ] Add to README:
  - [ ] Leaderboard feature description
  - [ ] Setup instructions for new developers
  - [ ] Environment variable requirements

## Support Contacts

If issues arise:
- Supabase Support: https://supabase.com/support
- GitHub Copilot: Available in VS Code
- Stack Overflow: Tag questions with `supabase`, `expo`, `react-native`

---

**Last Updated:** October 8, 2025
**Version:** 1.0
**Status:** Ready for Production ✅

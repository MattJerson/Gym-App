# Chat User Profiles - Deployment Checklist

## ✅ Pre-Deployment

- [ ] Read `CHAT_PROFILES_QUICK_FIX.md` for quick overview
- [ ] Review `CHAT_PROFILES_SECURITY_ARCHITECTURE.md` for security details
- [ ] Backup current database (Supabase Dashboard → Database → Backups)

## 🚀 Deployment Steps

### Step 1: Run SQL Migration (2 minutes)
- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Copy contents of `FIX_CHAT_USER_PROFILES.sql`
- [ ] Paste and click "Run"
- [ ] Verify success message appears
- [ ] Check for any errors in output

### Step 2: Verify Database (1 minute)
```sql
-- Run these verification queries:

-- 1. Check view exists
SELECT * FROM chats_public_with_id LIMIT 5;

-- 2. Verify columns (should ONLY show safe fields)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'chats_public_with_id';
-- Expected: id, username, avatar, is_online, last_seen
-- Should NOT see: email, phone, password

-- 3. Check permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'chats_public_with_id';
-- Expected: authenticated = SELECT

-- 4. Verify policies
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'registration_profiles'
ORDER BY policyname;
```

- [ ] View returns data (not empty)
- [ ] Only safe columns visible (no email/phone)
- [ ] Permissions granted to `authenticated` role
- [ ] RLS policies exist and active

### Step 3: Test Mobile App (3 minutes)
- [ ] Clear Expo cache: `npx expo start -c`
- [ ] Login as User A
- [ ] Navigate to Community Chat
- [ ] Send a message in any channel
- [ ] Note User A's username and avatar displayed
- [ ] Logout User A

- [ ] Login as User B (different device or browser)
- [ ] Navigate to same channel
- [ ] Verify User A's message shows:
  - [ ] ✅ Real username (not "Unknown")
  - [ ] ✅ Real avatar (not "?")
  - [ ] ✅ Online status (green dot if online)

- [ ] Send message as User B
- [ ] Verify User B's name shows correctly for User A

### Step 4: Security Verification (2 minutes)
- [ ] Open browser DevTools → Network tab
- [ ] Send a chat message
- [ ] Check API response from `chats_public_with_id`
- [ ] Verify response does NOT contain:
  - [ ] ❌ Email addresses
  - [ ] ❌ Phone numbers
  - [ ] ❌ Password hashes
  - [ ] ❌ Auth tokens (beyond session token)
  - [ ] ❌ Any PII not shown in UI

- [ ] Test as anonymous user (logged out):
  - [ ] Try to access `chats_public_with_id` via API
  - [ ] Should receive 401/403 error (not allowed)

## 🧪 Additional Tests

### Test Real-Time Updates
- [ ] User A online → User B should see green dot
- [ ] User A goes offline → User B should see gray dot
- [ ] User A changes display name → Update reflects in chat

### Test Edge Cases
- [ ] User with no display name set
  - [ ] Should show "User" as fallback
- [ ] User with no avatar set
  - [ ] Should show "?" as fallback
- [ ] User with very long display name
  - [ ] Should truncate properly in UI
- [ ] User with emoji in display name
  - [ ] Should render correctly

### Test Admin Access
- [ ] Login as admin user
- [ ] Open Admin Dashboard → Chat Monitoring
- [ ] Verify all messages show correct usernames
- [ ] Check flagged messages view works
- [ ] Ensure admin can see user details (for moderation)

## 📊 Performance Check

- [ ] Chat loads within 2 seconds
- [ ] Scrolling smooth with 50+ messages
- [ ] Real-time updates work without lag
- [ ] No console errors in browser/app
- [ ] Database query time < 100ms (check Supabase logs)

## 🔍 Monitoring (First 24 Hours)

### Database Metrics
- [ ] Monitor query performance in Supabase Dashboard
- [ ] Check for slow queries on `chats_public_with_id`
- [ ] Verify RLS policies not causing recursion
- [ ] Ensure no spike in database CPU/memory

### Application Logs
- [ ] No errors related to user profiles
- [ ] No "Unknown" fallbacks triggering
- [ ] Real-time subscriptions stable
- [ ] Message delivery rate normal

### User Feedback
- [ ] Users report seeing real names ✅
- [ ] Users report seeing avatars ✅
- [ ] No privacy complaints (email exposed) ✅
- [ ] Community engagement improving ✅

## 🐛 Rollback Plan (If Needed)

If issues occur, rollback with:

```sql
-- 1. Drop the views
DROP VIEW IF EXISTS chats_public_with_id CASCADE;
DROP VIEW IF EXISTS chats_public CASCADE;

-- 2. Restore restrictive policy (temporary)
DROP POLICY IF EXISTS "Users can view public profiles for chat" ON registration_profiles;

CREATE POLICY "Users can only view own profile"
ON registration_profiles FOR SELECT
USING (user_id = auth.uid());

-- 3. Clear app cache
-- npx expo start -c
```

**Note:** This will bring back "Unknown" users, but restore previous security posture.

## ✅ Success Criteria

Deployment is successful when:
- [x] View `chats_public_with_id` exists and returns data
- [x] Users see real names instead of "Unknown"
- [x] Users see real avatars instead of "?"
- [x] Online status updates in real-time
- [x] Email/phone/sensitive data NOT exposed in API responses
- [x] Only authenticated users can access profiles
- [x] Admin monitoring dashboard shows correct data
- [x] No performance degradation
- [x] No security vulnerabilities introduced
- [x] GDPR compliance maintained

## 📝 Post-Deployment Tasks

### Optional Enhancements
- [ ] Add user profile editing UI
  - [ ] Let users update display name
  - [ ] Let users update avatar
  - [ ] Add "Show online status" toggle

- [ ] Backfill missing display names
  ```sql
  UPDATE registration_profiles 
  SET details = jsonb_set(
    COALESCE(details, '{}'::jsonb), 
    '{display_name}', 
    to_jsonb(split_part(email, '@', 1))
  )
  WHERE details->>'display_name' IS NULL;
  ```

- [ ] Set default avatars
  ```sql
  UPDATE registration_profiles 
  SET details = jsonb_set(
    COALESCE(details, '{}'::jsonb), 
    '{avatar}', 
    '"👤"'
  )
  WHERE details->>'avatar' IS NULL;
  ```

### Documentation Updates
- [ ] Update API documentation with new view schema
- [ ] Add to onboarding: "Set your display name"
- [ ] Update privacy policy to mention public profiles in chat
- [ ] Document for developers: how to safely access user data

## 🎉 Completion

When all checklist items are complete:
- ✅ Chat user profiles working correctly
- ✅ Security verified and compliant
- ✅ Performance acceptable
- ✅ Users can interact and build community
- ✅ Privacy maintained

**Estimated Total Time:** 10-15 minutes
**Risk Level:** Low (only adds missing view)
**Reversibility:** High (can rollback instantly)

---

## Support

If you encounter issues:
1. Check `CHAT_PROFILES_FIX_GUIDE.md` for detailed troubleshooting
2. Review `CHAT_PROFILES_SECURITY_ARCHITECTURE.md` for security questions
3. Check Supabase logs for database errors
4. Review browser console for client-side errors

**Files Created:**
- `FIX_CHAT_USER_PROFILES.sql` - Main migration
- `CHAT_PROFILES_FIX_GUIDE.md` - Detailed guide
- `CHAT_PROFILES_QUICK_FIX.md` - Quick reference
- `CHAT_PROFILES_SECURITY_ARCHITECTURE.md` - Security details
- `CHAT_PROFILES_DEPLOYMENT_CHECKLIST.md` - This checklist

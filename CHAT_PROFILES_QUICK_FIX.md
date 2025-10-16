# Quick Fix: Chat User Profiles Showing "Unknown"

## The Problem
Other users in community chat show as "Unknown" with "?" icon.

## The Cause
The database view `chats_public_with_id` **doesn't exist**. ChatServices.js tries to query it, gets no results, falls back to default "Unknown" user.

## The Fix (2 Minutes)

### Step 1: Run SQL Migration
1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open file: `FIX_CHAT_USER_PROFILES.sql`
4. Click **Run**
5. Wait for success message

### Step 2: Test
1. Clear Expo cache: `npx expo start -c`
2. Login and send a chat message
3. Have another user login and view the message
4. ✅ Should see real username and avatar instead of "Unknown" and "?"

## What This Does

### Creates Secure Views
```sql
-- Exposes ONLY: username, avatar, online status
-- Keeps private: email, phone, password, etc.
CREATE VIEW chats_public_with_id AS
SELECT 
  user_id AS id,
  details->>'display_name' AS username,
  details->>'avatar' AS avatar,
  is_online,
  last_seen
FROM registration_profiles;
```

### Updates Permissions
- Allows authenticated users to see each other's **public profiles**
- Does NOT expose sensitive data (email, phone)
- Admins still have full access

## Security

### ✅ Safe to Show
- Display name (username)
- Avatar image
- Online/offline status

### 🔒 Never Exposed
- Email addresses
- Phone numbers
- Real names (unless user sets as display name)
- Auth credentials
- Any PII

## Files

### Created
1. **FIX_CHAT_USER_PROFILES.sql** - Run this in Supabase
2. **CHAT_PROFILES_FIX_GUIDE.md** - Detailed documentation
3. **CHAT_PROFILES_QUICK_FIX.md** - This file

### No App Code Changes
ChatServices.js already queries the view correctly - it just needed to be created in the database!

## Troubleshooting

**Still showing "Unknown"?**
```sql
-- Verify view exists
SELECT * FROM chats_public_with_id LIMIT 5;

-- If error, re-run the migration
```

**Users have no display names?**
```sql
-- Backfill from email
UPDATE registration_profiles 
SET details = jsonb_set(
  COALESCE(details, '{}'::jsonb), 
  '{display_name}', 
  to_jsonb(split_part(email, '@', 1))
)
WHERE details->>'display_name' IS NULL;
```

## That's It!

Run the SQL file, clear cache, and users will see each other's names and avatars. No app code changes needed.

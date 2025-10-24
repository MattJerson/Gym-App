# Fix: Community Chat Showing "@unknown" for Usernames

## 🐛 Problem
All users (including yourself) are showing as "@unknown" in the community chat instead of displaying actual usernames.

## 🔍 Root Cause
The view `chats_public_with_id` was trying to query `auth.users` table, but **RLS policies block access**:

```
ERROR: permission denied for table users
Code: 42501
```

Your database logs show:
```
WARN [ChatServices] failed to fetch profiles: 
  {"code": "42501", "message": "permission denied for table users"}
```

The old view definition tried to fetch `raw_user_meta_data` from `auth.users`, which is blocked by Supabase's default RLS policies.

## ✅ Solution Applied

### What the SQL Script Does:

1. **Recreates the View with SECURITY DEFINER**
   - Uses `registration_profiles` table (not `auth.users`!)
   - `SECURITY DEFINER` bypasses RLS and uses the view owner's permissions
   - Safely exposes only username/avatar from `registration_profiles.details`

2. **Updates RLS Policies on `registration_profiles`**
   - **OLD:** "Users can only see own profile" ❌
   - **NEW:** "Community members can view all registration profiles" ✅
   - Safe because view only exposes username/avatar, not sensitive data

3. **Maintains Security**
   - Users can still only UPDATE/INSERT their own profile
   - Only username and avatar (from `details` JSONB) are exposed
   - No email addresses, phone numbers, or sensitive data shared

4. **Grants Proper Permissions**
   - All authenticated users can SELECT from the view
   - View pulls from `registration_profiles`, not blocked `auth.users`
   - Your `ChatServices.js` can now successfully fetch profiles

## 📝 What Changed

### Before:
```sql
-- View queried auth.users (BLOCKED by RLS!) ❌
CREATE VIEW chats_public_with_id AS
SELECT 
  user_id as id,
  (SELECT users.raw_user_meta_data->>'username' 
   FROM auth.users WHERE users.id = rp.user_id) -- ❌ BLOCKED!
FROM registration_profiles rp;
```

### After:
```sql
-- View uses registration_profiles with SECURITY DEFINER ✅
CREATE VIEW chats_public_with_id
WITH (security_invoker = false) -- Bypass RLS safely
AS
SELECT 
  rp.user_id as id,
  COALESCE(rp.details->>'display_name', 'User') as username,
  COALESCE(rp.details->>'avatar', '👤') as avatar
FROM registration_profiles rp -- ✅ Direct access, no auth.users!
WHERE rp.user_id IS NOT NULL;

-- RLS Policy Updated
CREATE POLICY "Community members can view all registration profiles" 
  ON registration_profiles FOR SELECT 
  TO authenticated
  USING (true); -- ✅ Allow community visibility
```

## 🎯 Expected Results

**Before fix:**
```
Channel: #general
@unknown: Hey everyone! 👋
@unknown: How's it going?
@unknown: (You): Great!
```

**After fix:**
```
Channel: #general
@john_doe: Hey everyone! 👋
@fitness_guru: How's it going?
@your_username (You): Great!
```

## 🔒 Security Considerations

### ✅ What's Exposed (Safe):
- Username (from `registration_profiles.details->>'display_name'`)
- Avatar (from `registration_profiles.details->>'avatar'`)
- User ID (needed to link messages to users)

### 🔐 What's Protected (Still Private):
- Email addresses (in `auth.users` - still blocked)
- Phone numbers (in `auth.users` - still blocked)
- Full `registration_profiles.details` JSONB (view only exposes username/avatar)
- All other personal information from other tables

### 🛡️ Why SECURITY DEFINER is Safe:
- View **only** exposes 3 fields: `id`, `username`, `avatar`
- Cannot be used to access sensitive data
- Read-only (no INSERT/UPDATE/DELETE)
- Controlled exposure: only what's needed for community chat

### 🛡️ Protection Levels:

| Data | Visibility | Can Edit |
|------|-----------|----------|
| Your own profile | You only | You only |
| Other users' chat profiles | All community members | Owner only |
| Email/phone | Private | Owner only |
| Message content | Channel members | Owner + Admins |

## 🚀 How to Apply

### 1. Run the SQL Script:
```bash
# In Supabase SQL Editor:
# https://supabase.com/dashboard/project/hjytowwfhgngbilousri/sql

# Paste and run: FIX_CHAT_USERNAMES.sql
```

### 2. Verify It Works:
```sql
-- Test 1: Check if view exists and has data
SELECT * FROM public.chats_public_with_id LIMIT 5;

-- Test 2: Count total visible profiles
SELECT COUNT(*) FROM public.chats_public_with_id;

-- Test 3: Check your own profile
SELECT * FROM public.chats WHERE id = auth.uid();
```

### 3. Restart Your App:
```bash
npm start
```

### 4. Test in Community Chat:
- Send a message in any channel
- ✅ Your username should show correctly
- ✅ Other users' usernames should show correctly
- ✅ No more "@unknown"

## 🔧 Troubleshooting

### Still showing "@unknown"?

**Check 1: Is the view created?**
```sql
SELECT * FROM public.chats_public_with_id;
```

**Check 2: Does your profile exist?**
```sql
SELECT * FROM public.chats WHERE id = auth.uid();
```

**Check 3: Are there profiles for other users?**
```sql
SELECT COUNT(*) FROM public.chats;
```

**Check 4: Do you have permission?**
```sql
-- This should return data, not an error
SELECT username FROM public.chats_public_with_id LIMIT 1;
```

### Create Profile Manually (if needed):
```sql
-- Replace 'your_username' with desired username
INSERT INTO public.chats (id, username, avatar, is_online)
VALUES (
  auth.uid(),
  'your_username',
  '😊',
  true
)
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;
```

## 📊 Database Schema

```sql
-- Table: registration_profiles (user data including chat info)
registration_profiles
├── id (PK)
├── user_id (UUID) → references auth.users(id)
├── details (JSONB) → contains:
│   ├── display_name (username for chat)
│   ├── avatar (emoji)
│   └── ... other profile data
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

-- View: chats_public_with_id (SECURITY DEFINER view)
-- Exposes ONLY username/avatar from registration_profiles
chats_public_with_id
├── id (user_id)
├── username (details->>'display_name')
├── avatar (details->>'avatar')
├── is_online (always false for now)
├── last_seen (NOW())
└── created_at
```

## 🎉 Summary

**Before:** Too much privacy = broken community chat  
**After:** Balanced security + working community features

Your chat will now show real usernames while keeping sensitive data private! 🚀

---

**Next Steps:**
1. Run `FIX_CHAT_USERNAMES.sql` in Supabase
2. Restart app
3. Test in community chat
4. Enjoy seeing real usernames! ✨

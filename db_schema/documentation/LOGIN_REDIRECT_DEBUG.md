# 🔍 LOGIN REDIRECT DEBUG GUIDE

## 🐛 Issue
User completes registration but is still redirected to registration process on login.

## ✅ What I Added

Enhanced logging in `loginregister.jsx` to help diagnose the issue:

```javascript
// Now logs:
- User ID being checked
- Profile error (if any)
- Profile data found (gender, fitness_goal, height_cm, weight_kg)
- Each field validation result
- Final decision (redirect or home)
```

## 🧪 How to Debug

### Step 1: Restart App
```powershell
# Stop Expo (Ctrl+C)
npx expo start
```

### Step 2: Clear Console
In the terminal, clear old logs so you see fresh output.

### Step 3: Try to Login
1. Enter your email/password
2. Click "Sign In"
3. **Watch the console logs carefully!**

### Step 4: Check Console Output

You should see something like this:

#### ✅ **If Profile Exists and Complete**:
```
Checking registration profile for user: abc-123-def-456
Profile data found: {
  gender: "female",
  fitness_goal: "maintain",
  height_cm: 180,
  weight_kg: 100
}
Field gender: female - Valid: true
Field fitness_goal: maintain - Valid: true
Field height_cm: 180 - Valid: true
Field weight_kg: 100 - Valid: true
Has essential fields: true
Login successful, navigating to home
```
**Result**: Goes to home page ✅

#### ❌ **If Profile Missing**:
```
Checking registration profile for user: abc-123-def-456
Profile error: { code: "PGRST116", message: "No rows found" }
Has essential fields: false
Registration incomplete, redirecting to registration process
```
**Result**: Goes to registration ❌

#### ⚠️ **If Profile Incomplete**:
```
Checking registration profile for user: abc-123-def-456
Profile data found: {
  gender: "female",
  fitness_goal: "maintain",
  height_cm: null,          ← MISSING!
  weight_kg: 100
}
Field gender: female - Valid: true
Field fitness_goal: maintain - Valid: true
Field height_cm: null - Valid: false     ← PROBLEM!
Field weight_kg: 100 - Valid: true
Has essential fields: false
Registration incomplete, redirecting to registration process
```
**Result**: Goes to registration ❌

---

## 🔍 Possible Issues

### Issue 1: Profile Not Saved
**Symptom**: `Profile error: No rows found`

**Cause**: Data didn't save to `registration_profiles` table

**Fix**:
```sql
-- Check in Supabase SQL Editor
SELECT * FROM registration_profiles WHERE user_id = 'YOUR_USER_ID';
-- If empty, data wasn't saved
```

**Solution**: Complete registration process again

### Issue 2: Wrong Field Names
**Symptom**: Fields show as `undefined` or `null` but you filled them

**Cause**: Field name mismatch (e.g., `fitnessGoal` vs `fitness_goal`)

**Check in registrationprocess.jsx**:
```javascript
// Line ~350
gender: finalData.gender,           // ✅ Correct
fitness_goal: finalData.fitnessGoal, // ❓ Check this
height_cm: finalData.height,        // ❓ Should be parseInt?
weight_kg: finalData.weight,        // ❓ Should be parseFloat?
```

### Issue 3: Data Type Mismatch
**Symptom**: Fields saved as strings instead of numbers

**Example**:
```javascript
height_cm: "180"  // ❌ String
height_cm: 180    // ✅ Number
```

**Check**: Look at the profile data in logs - are numbers in quotes?

### Issue 4: AsyncStorage vs Database Mismatch
**Symptom**: Data shows in logs during registration but not in database

**Cause**: Data saved locally but database save failed

**Fix**: Check for error messages during registration:
```
Failed to save registration_profiles: ...
```

---

## 🛠️ Quick Fixes

### Fix 1: Manually Verify Database
```sql
-- Run in Supabase SQL Editor
SELECT 
  user_id,
  gender,
  fitness_goal,
  height_cm,
  weight_kg,
  age,
  calorie_goal
FROM registration_profiles
ORDER BY created_at DESC
LIMIT 10;

-- Check if your user_id is there and fields have values
```

### Fix 2: Manually Insert Profile
If profile doesn't exist, manually create it:

```sql
-- Replace YOUR_USER_ID with actual ID from auth.users
INSERT INTO registration_profiles (
  user_id,
  gender,
  fitness_goal,
  height_cm,
  weight_kg,
  age,
  use_metric
) VALUES (
  'YOUR_USER_ID',
  'female',
  'maintain',
  180,
  100,
  20,
  true
) ON CONFLICT (user_id) 
DO UPDATE SET
  gender = EXCLUDED.gender,
  fitness_goal = EXCLUDED.fitness_goal,
  height_cm = EXCLUDED.height_cm,
  weight_kg = EXCLUDED.weight_kg;
```

### Fix 3: Check Data Types
```sql
-- Verify column types match expectations
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'registration_profiles'
  AND column_name IN ('gender', 'fitness_goal', 'height_cm', 'weight_kg');

-- Should show:
-- gender: text
-- fitness_goal: text
-- height_cm: integer
-- weight_kg: numeric
```

---

## 📊 Decision Tree

```
Login Attempt
     │
     ▼
Check registration_profiles
     │
     ├─── Profile exists? ────NO──► Redirect to registration
     │         │
     │        YES
     │         │
     ├─── Has gender? ────NO──► Redirect to registration
     │         │
     │        YES
     │         │
     ├─── Has fitness_goal? ────NO──► Redirect to registration
     │         │
     │        YES
     │         │
     ├─── Has height_cm? ────NO──► Redirect to registration
     │         │
     │        YES
     │         │
     └─── Has weight_kg? ────NO──► Redirect to registration
               │
              YES
               │
               ▼
          GO TO HOME ✅
```

---

## 🎯 Next Steps

1. **Restart app** with new logging
2. **Try to login** with your existing account
3. **Copy the console logs** and send them to me
4. Based on logs, I'll tell you exactly what's wrong!

---

## 📝 Console Log Template

Copy this and fill it in with what you see:

```
=== LOGIN ATTEMPT ===
Checking registration profile for user: [COPY USER_ID]
Profile error: [COPY ERROR OR "none"]
Profile data found: [COPY DATA OR "none"]
Field gender: [COPY]
Field fitness_goal: [COPY]
Field height_cm: [COPY]
Field weight_kg: [COPY]
Has essential fields: [COPY true/false]
Result: [Went to home / Redirected to registration]
```

---

**Status**: Logging enabled, ready to debug!  
**Action**: Restart app, login, send console logs

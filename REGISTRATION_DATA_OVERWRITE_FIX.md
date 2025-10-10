# 🐛 CRITICAL FIX: Registration Data Being Overwritten with Nulls

**Date**: October 8, 2025  
**Severity**: **HIGH** - Data loss bug  
**Status**: ✅ **FIXED**

---

## 🚨 The Problem

User completes registration with all fields filled:
```javascript
{
  gender: "female",
  fitnessGoal: "maintain",
  height: "180",
  weight: "100",
  // ... all other fields
}
```

But when they login, database shows:
```javascript
{
  gender: null,
  fitness_goal: null,
  height_cm: null,
  weight_kg: null
}
```

**All data was being overwritten with nulls!** 😱

---

## 🔍 Root Cause Analysis

### **The Flow**:

1. **Step 1-3**: `registrationprocess.jsx` collects data
   - Saves to AsyncStorage
   - On final step (Step 3), saves to database ✓

2. **bodyfatuser.jsx**: User enters body fat data
   - Saves to AsyncStorage
   - Clears registration AsyncStorage ❌

3. **selectmealplan.jsx**: User selects meal plan
   - Reads from AsyncStorage → **EMPTY!** ❌
   - Builds payload with empty data
   - **Upserts to database, overwriting good data with nulls!** 💥

### **The Bug**:

In `selectmealplan.jsx` (lines 111-152):

```javascript
// Gets data from AsyncStorage
const registration = regRaw ? JSON.parse(regRaw) : {};
// If AsyncStorage was cleared, registration = {}

// Builds payload with null values
const registrationPayload = {
  user_id: user.id,
  gender: registration.gender || null,  // undefined || null = null
  fitness_goal: registration.fitnessGoal || null,  // null
  height_cm: registration.height || null,  // null
  weight_kg: registration.weight || null,  // null
  // ... all nulls
};

// UPSERTS to database - OVERWRITES EXISTING DATA!
await supabase
  .from('registration_profiles')
  .upsert(registrationPayload, { onConflict: 'user_id' });
```

**Result**: Good data → Replaced with nulls → User can't login!

---

## ✅ The Solution

### **Fix 1**: `selectmealplan.jsx` - Don't overwrite if AsyncStorage is empty

```javascript
// Only save if we actually have registration data
if (Object.keys(registration).length > 0 && registration.gender) {
  console.log('Saving registration profile...');
  const registrationPayload = { /* ... */ };
  await supabase.from('registration_profiles').upsert(registrationPayload);
  console.log('✅ Registration profile saved');
} else {
  console.log('⚠️ Skipping registration save - no data (already saved)');
}
```

### **Fix 2**: `registrationprocess.jsx` - Better logging

Added detailed logging to see what's being saved:
```javascript
console.log('=== REGISTRATION SAVE DEBUG ===');
console.log('Payload to save:', JSON.stringify({
  gender: payload.gender,
  fitness_goal: payload.fitness_goal,
  height_cm: payload.height_cm,
  weight_kg: payload.weight_kg
}, null, 2));
```

### **Fix 3**: `loginregister.jsx` - Better debugging

Added per-field validation logging to see exactly which fields are missing.

---

## 📝 Files Modified

### **1. `app/features/selectmealplan.jsx`** (Lines 108-154)
**Before**:
```javascript
// Always saves registration data, even if empty
const registrationPayload = { /* ... */ };
await supabase.from('registration_profiles').upsert(registrationPayload);
```

**After**:
```javascript
// Only save if we have data
if (Object.keys(registration).length > 0 && registration.gender) {
  const registrationPayload = { /* ... */ };
  await supabase.from('registration_profiles').upsert(registrationPayload);
} else {
  console.log('Skipping - already saved in previous step');
}
```

### **2. `app/features/registrationprocess.jsx`** (Lines 372-400)
Added detailed logging:
```javascript
console.log('=== REGISTRATION SAVE DEBUG ===');
console.log('Payload:', { gender, fitness_goal, height_cm, weight_kg });
// Changed returning: 'minimal' → 'representation' to see saved data
```

### **3. `app/auth/loginregister.jsx`** (Lines 177-218)
Added per-field validation logging:
```javascript
console.log(`Field ${field}: ${value} - Valid: ${isValid}`);
```

---

## 🧪 Testing

### **Test Scenario**:

1. **Complete fresh onboarding**:
   ```
   Step 1-3: Fill all fields → Save
   bodyfatuser: Enter body fat → Save
   selectmealplan: Select meal plan → Complete
   ```

2. **Check console logs**:
   ```
   === REGISTRATION SAVE DEBUG ===
   Payload: { gender: "female", fitness_goal: "maintain", ... }
   ✅ Registration saved to Supabase successfully!
   
   === SELECTMEALPLAN DEBUG ===
   Registration data from AsyncStorage: {}
   ⚠️ Skipping registration save - no data (already saved)
   ```

3. **Verify database**:
   ```sql
   SELECT gender, fitness_goal, height_cm, weight_kg 
   FROM registration_profiles 
   WHERE user_id = 'USER_ID';
   
   -- Should show:
   -- gender: female
   -- fitness_goal: maintain
   -- height_cm: 180
   -- weight_kg: 100
   ```

4. **Test login**:
   ```
   Checking registration profile for user: ...
   Profile data found: { gender: "female", fitness_goal: "maintain", ... }
   Has essential fields: true
   Login successful, navigating to home ✅
   ```

---

## 🚀 Deployment

### **Step 1: Restart App**
```powershell
# Stop Expo (Ctrl+C)
npx expo start
```

### **Step 2: Clean Existing Bad Data** (Optional)

If you have users with null data, fix it manually:

```sql
-- Option A: Delete null records (users will re-register)
DELETE FROM registration_profiles 
WHERE gender IS NULL 
  AND fitness_goal IS NULL 
  AND height_cm IS NULL;

-- Option B: Ask users to complete profile again
-- They can edit in Settings → Edit Profile
```

### **Step 3: Test Fresh Onboarding**

1. Create new test account
2. Complete full onboarding
3. Check console logs (should skip duplicate save)
4. Login → Should go to home ✓

---

## 📊 Impact Analysis

### **Before Fix**:
```
User Flow:
Registration → bodyfat → selectmealplan
     ✓            ✓            ❌
  [Saves data]  [Clears]   [Overwrites with nulls]

Result: Data loss → Can't login → Stuck in loop
```

### **After Fix**:
```
User Flow:
Registration → bodyfat → selectmealplan
     ✓            ✓            ✓
  [Saves data]  [Clears]   [Skips save - data exists]

Result: Data preserved → Login works → Access home ✅
```

---

## 🎓 Key Learnings

### **1. Upsert is Dangerous with Incomplete Data**

**Never upsert incomplete data!** Always check if data exists first:

```javascript
// ❌ BAD: Blindly upsert
await supabase.from('table').upsert({ id: 1, field: null });
// Overwrites existing data with null!

// ✅ GOOD: Check first
if (hasCompleteData) {
  await supabase.from('table').upsert(payload);
}
```

### **2. AsyncStorage Can Be Unreliable**

AsyncStorage might be:
- Cleared by user
- Cleared by app
- Cleared by OS
- Never saved in first place

**Always validate before using**:
```javascript
const data = storageData ? JSON.parse(storageData) : {};
if (Object.keys(data).length === 0) {
  console.warn('No data in storage - skipping');
  return;
}
```

### **3. Multi-Step Onboarding Needs Careful State Management**

Options:
1. **Save everything at the end** (no intermediate saves)
2. **Never overwrite existing data** (check before upsert)
3. **Use merge strategy** (only update non-null fields)

We chose option 2: Skip save if data doesn't exist in AsyncStorage.

---

## 🔄 Related Issues

This same pattern might exist in other files. Check:

- `bodyfatuser.jsx` - Does it overwrite registration data?
- `settings/edit.jsx` - Does it handle missing data gracefully?
- Any other file that uses `.upsert()` on `registration_profiles`

---

## 🐛 Debugging Tips

If users still report login issues:

1. **Check console logs**:
   ```
   === REGISTRATION SAVE DEBUG ===
   === SELECTMEALPLAN DEBUG ===
   ```

2. **Check database directly**:
   ```sql
   SELECT * FROM registration_profiles 
   WHERE user_id = 'USER_ID';
   ```

3. **Check AsyncStorage** (add temp logging):
   ```javascript
   const regRaw = await AsyncStorage.getItem('onboarding:registration');
   console.log('AsyncStorage registration:', regRaw);
   ```

4. **Verify save order**:
   ```
   Should be:
   1. registrationprocess saves to DB
   2. bodyfatuser clears AsyncStorage
   3. selectmealplan skips save (no data)
   ```

---

## ✅ Verification Checklist

- [x] `selectmealplan.jsx` - Only saves if data exists
- [x] `registrationprocess.jsx` - Logs what's being saved
- [x] `loginregister.jsx` - Logs validation results
- [ ] Test fresh onboarding (your turn!)
- [ ] Test login after onboarding (your turn!)
- [ ] Verify database has correct data (your turn!)

---

## 🎉 Summary

**Critical bug found and fixed!**

**Problem**: `selectmealplan.jsx` was overwriting good registration data with nulls from empty AsyncStorage.

**Solution**: Only save registration data if it exists in AsyncStorage.

**Impact**: 
- ✅ No more data loss
- ✅ Users can login after onboarding
- ✅ Registration data preserved correctly

**Status**: ✅ Fixed and ready to test!

---

**Last Updated**: October 8, 2025  
**Developer**: GitHub Copilot  
**Fix Type**: Critical bug fix - Data preservation

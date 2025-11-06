# 🚀 QUICK FIX INSTRUCTIONS

## Issues Fixed
1. ✅ **SQL Error**: "column reference weight_kg is ambiguous" 
2. ✅ **SQL Error**: "policy already exists"
3. ✅ **Calendar Page**: Now auto-refreshes on navigation (like Training/Meal Plan pages)

## 📋 Run This Now

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy & Paste
Copy the entire content of this file:
```
QUICK_FIX_RUN_IN_DASHBOARD.sql
```

### Step 3: Execute
Click **RUN** button

## ✅ What This Fixes

### SQL Fixes
- Drops and recreates RLS policies (fixes "already exists" error)
- Recreates `get_weight_progress_chart()` with table aliases (fixes ambiguous column)
- Grants execute permissions

### App Fixes (Already Done in Code)
- Calendar page now uses `useFocusEffect` hook
- Auto-refreshes when you navigate back to calendar
- Matches Training and Meal Plan page behavior

## 🧪 Test After Running

1. **Test Calendar Navigation**:
   - Open Calendar page
   - Navigate to Training or Meal Plan
   - Navigate back to Calendar
   - ✅ Should see fresh data (auto-refreshed)

2. **Test Weight Progress**:
   - Navigate to Weight Progress section
   - ✅ Chart should load without errors
   - ✅ Should see calorie data if available

## 📁 Files Changed

### SQL
- `QUICK_FIX_RUN_IN_DASHBOARD.sql` - **RUN THIS IN DASHBOARD**
- `supabase/migrations/20251106_calorie_tracking_integration.sql` - Updated with fixes

### JavaScript
- `app/page/calendar.jsx` - Added auto-refresh on focus

## ❓ If You Get Errors

### "function does not exist"
This is okay - the function didn't exist yet. The CREATE will succeed.

### "table does not exist"
You need to run the full migration first:
```
supabase/migrations/20251106_calorie_tracking_integration.sql
```

### Still getting errors?
Check the error message and let me know - we can debug together!

---

**Status**: ✅ Ready to Execute  
**Time to Complete**: < 1 minute  
**Risk**: Low (only updates policies and one function)

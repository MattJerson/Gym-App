# 🔧 Weekly Leaderboard Column Name Fix

## ❌ **The Error**

```
400 Bad Request
WITHIN GROUP is required for ordered-set aggregate rank
```

Multiple 400 errors on API calls:
- `badges` table: ✅ Fixed by Supabase client import
- `weekly_leaderboard` view: ❌ Column name mismatch

---

## 🔍 **Root Cause**

The Badges.jsx code was using **incorrect column names** that don't exist in the `weekly_leaderboard` view:

### **What the Code Was Using:**
```javascript
// ❌ WRONG - These columns don't exist!
.order('rank', { ascending: true })  // Column is 'position', not 'rank'

// In rendering:
user.rank          // Should be: user.position
user.display_name  // Should be: user.user_name
user.email         // Doesn't exist in view
user.workout_count // Should be: user.total_workouts
```

### **Actual View Schema (weekly_leaderboard):**
```sql
CREATE VIEW weekly_leaderboard AS
SELECT
  user_id,           -- ✅ User UUID
  user_name,         -- ✅ Display name (not 'display_name')
  total_points,      -- ✅ Points
  current_streak,    -- ✅ Streak
  total_workouts,    -- ✅ Workouts (not 'workout_count')
  badges_earned,     -- ✅ Badges
  position           -- ✅ Rank (not 'rank')
FROM ...
```

**Note:** The view uses `position` as the column name to avoid conflicts with PostgreSQL's `rank()` window function.

---

## ✅ **The Fix**

### **1. Changed Order By Column**

```diff
  const { data, error } = await supabase
    .from('weekly_leaderboard')
    .select('*')
-   .order('rank', { ascending: true })
+   .order('position', { ascending: true })
    .limit(10);
```

### **2. Updated Column References in Rendering**

```diff
  {leaderboard.map((user, index) => (
    <div>
      {/* Rank Badge */}
-     <span>#{user.rank || index + 1}</span>
+     <span>#{user.position || index + 1}</span>
      
      {/* User Info */}
-     <p>{user.display_name || user.email || 'Anonymous'}</p>
+     <p>{user.user_name || 'Anonymous User'}</p>
-     <p>{user.email || 'No email'}</p>
+     <p>User ID: {user.user_id?.substring(0, 8)}</p>
      
      {/* Stats */}
-     <div>Workouts: {user.workout_count || 0}</div>
+     <div>Workouts: {user.total_workouts || 0}</div>
+     <div>Badges: {user.badges_earned || 0}</div>
    </div>
  ))}
```

---

## 📊 **Column Mapping**

| Old (Wrong) | New (Correct) | Description |
|-------------|---------------|-------------|
| `rank` | `position` | Leaderboard rank |
| `display_name` | `user_name` | User's display name |
| `email` | ❌ Not in view | Removed from display |
| `workout_count` | `total_workouts` | Number of workouts |
| ➕ N/A | `badges_earned` | **Added** to display |

---

## 🎯 **What Now Works**

### **API Calls:**
- ✅ `badges` table fetches successfully
- ✅ `weekly_leaderboard` view fetches successfully
- ✅ No more 400 errors
- ✅ Proper ordering by position

### **Leaderboard Display:**
- ✅ Shows correct rank (position)
- ✅ Shows user name
- ✅ Shows user ID (first 8 chars for privacy)
- ✅ Shows total points
- ✅ Shows total workouts (not workout_count)
- ✅ Shows current streak
- ✅ **NEW:** Shows badges earned
- ✅ Top 3 get medals

---

## 🔄 **Before vs After**

### **Before (Broken):**
```javascript
// Fetch
.order('rank', { ascending: true })  // ❌ Column doesn't exist

// Display
<span>#{user.rank}</span>                    // ❌ undefined
<p>{user.display_name || user.email}</p>     // ❌ both undefined
<div>Workouts: {user.workout_count}</div>    // ❌ undefined
```

### **After (Working):**
```javascript
// Fetch
.order('position', { ascending: true })  // ✅ Correct column

// Display
<span>#{user.position || index + 1}</span>     // ✅ Shows rank
<p>{user.user_name || 'Anonymous'}</p>         // ✅ Shows name
<div>Workouts: {user.total_workouts}</div>     // ✅ Shows count
<div>Badges: {user.badges_earned}</div>        // ✅ Shows badges
```

---

## 🎨 **Enhanced Display**

Added **4th stat column** for badges earned:

```jsx
<div className="flex items-center gap-6">
  {/* Points */}
  <div className="text-center">
    <p>Points</p>
    <p>{user.total_points || 0}</p>
  </div>
  
  {/* Workouts */}
  <div className="text-center">
    <p>Workouts</p>
    <p>{user.total_workouts || 0}</p>
  </div>
  
  {/* Streak */}
  <div className="text-center">
    <p>Streak</p>
    <p>{user.current_streak || 0}</p>
  </div>
  
  {/* Badges - NEW! */}
  <div className="text-center">
    <p>Badges</p>
    <p>{user.badges_earned || 0}</p>
  </div>
</div>
```

---

## 📝 **Database View Structure**

For reference, here's what the `weekly_leaderboard` view returns:

```typescript
interface WeeklyLeaderboard {
  user_id: UUID;           // User's unique ID
  user_name: string;       // Display name (from metadata or email)
  total_points: number;    // Total weekly points
  current_streak: number;  // Current workout streak
  total_workouts: number;  // Total workouts this week
  badges_earned: number;   // Total badges earned
  position: number;        // Leaderboard rank (1-100)
}
```

---

## 🧪 **Testing**

### **Verify the Fix:**

1. **Check Console:**
   ```
   ✅ No more 400 errors
   ✅ No "rank" column errors
   ✅ Successful API calls
   ```

2. **Check Leaderboard Display:**
   ```
   ✅ Ranks show correctly (1-10)
   ✅ User names display
   ✅ All stats show (Points, Workouts, Streak, Badges)
   ✅ Top 3 have medals
   ✅ No undefined values
   ```

3. **Check Data:**
   ```javascript
   // In browser console:
   const { data } = await supabase
     .from('weekly_leaderboard')
     .select('*')
     .order('position', { ascending: true });
   
   console.log(data); // Should show array of users
   ```

---

## 🚨 **Why "rank" Was Wrong**

PostgreSQL has a built-in `rank()` window function for ordered-set aggregates. When you try to order by a column named `rank`, PostgREST gets confused and thinks you're trying to use the aggregate function, which requires `WITHIN GROUP` syntax.

**Solution:** The view was smartly created with `position` instead of `rank` to avoid this conflict.

---

## ✅ **Files Modified**

```
admin/src/pages/Badges.jsx
├── Line ~63: Changed .order('rank') to .order('position')
└── Lines ~420-460: Updated column names in rendering
    - user.rank → user.position
    - user.display_name → user.user_name  
    - user.workout_count → user.total_workouts
    - Added: user.badges_earned display
```

---

## 📚 **Key Takeaways**

1. **Always check view schema** before using column names
2. **Avoid reserved words** like `rank` for column names
3. **Match column names exactly** - case-sensitive!
4. **Test API calls** in browser console before building UI
5. **Read error messages carefully** - they often tell you exactly what's wrong

---

## ✅ **Status**

**Problem:** 400 errors due to incorrect column names  
**Solution:** Updated to use correct view schema  
**Result:** ✅ **All leaderboard data now loads correctly!**

---

**Date:** October 9, 2025  
**Fixed By:** AI Assistant  
**Impact:** Critical - Leaderboard now functional

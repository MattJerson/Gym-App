# Free Tier & Trial Expiration Strategy

## 🎯 Business Model Overview

### New User Journey

```
Day 0: Sign Up
  ↓
  7-Day Premium Trial (Full Access)
  - All workouts
  - Custom meal plans
  - Priority support
  - Advanced analytics
  ↓
Day 7: Trial Expires
  ↓
  ↙️ Option A               ↘️ Option B
Subscribe to Paid        Stay on Base (Free)
- Unlimited access       - Limited but functional
- All premium features   - 3 workouts/week
                         - Basic meal plans
                         - Standard features
```

## 📊 Tier Comparison

| Feature | Base (Free) | Monthly | Yearly |
|---------|-------------|---------|---------|
| **Price** | $0/month | $9.99/month | $89.99/year |
| **Badge** | 🆓 FREE | 💎 POPULAR | ⭐ BEST VALUE |
| **Workouts** | 3 per week | Unlimited | Unlimited |
| **Meal Plans** | 1 basic plan/week | Custom plans | Custom plans |
| **Custom Workouts** | ❌ No | ✅ Yes | ✅ Yes |
| **Progress Analytics** | Basic | Advanced | Advanced |
| **Support** | Community | Email | Priority |
| **Workout Library** | Limited (50 workouts) | Full library | Full library |

## 🆓 Base (Free) Tier Features

### What's Included:
- ✅ **3 Workouts per Week**: Enough to stay active
- ✅ **Basic Meal Planning**: 1 simple meal plan per week
- ✅ **Progress Tracking**: Weight, measurements, basic stats
- ✅ **Community Support**: Forums, tips from other users
- ✅ **Limited Workout Library**: 50 curated workouts

### What's NOT Included (Upgrade Prompts):
- ❌ **Custom Workouts**: "Create your own workout with Premium"
- ❌ **Advanced Analytics**: "Unlock detailed insights with Premium"
- ❌ **Unlimited Workouts**: "You've reached your weekly limit. Upgrade for unlimited!"
- ❌ **Premium Meal Plans**: "Custom macros & recipes - Premium only"
- ❌ **Priority Support**: "Get help faster with Premium support"

## 🔄 Trial Expiration Flow

### Automatic Downgrade Process

1. **Trial Ends** (Day 7)
   ```
   User's trial subscription status: 'trialing' → 'expired'
   ```

2. **Automatic Downgrade**
   ```
   New subscription created:
   - Package: Base (Free)
   - Status: 'active'
   - Never expires (free tier)
   ```

3. **User Notification** (In-App)
   ```
   "Your 7-day trial has ended! 
   You're now on the Base (Free) plan. 
   Upgrade anytime to unlock all features."
   ```

4. **Feature Restrictions Apply**
   - Workout counter: 0/3 this week
   - Custom workout button: "Upgrade to Premium"
   - Advanced charts: Blurred with upgrade prompt

## 🛠️ Implementation Components

### 1. Database Setup

**Run Migration:**
```sql
-- Execute: ADD_BASE_FREE_TIER.sql
-- Creates:
- Base tier package (slug: 'base-free')
- handle_trial_expiration() function
- user_has_premium_access() function
- get_user_tier_limits() function
```

### 2. Backend Functions

**Check Premium Access:**
```javascript
const hasPremium = await supabase.rpc('user_has_premium_access', {
  user_id_param: userId
});

if (!hasPremium.data) {
  // Show upgrade prompt
}
```

**Get User Limits:**
```javascript
const limits = await supabase.rpc('get_user_tier_limits', {
  user_id_param: userId
});

console.log(limits.data);
// {
//   workout_limit: 3,
//   workout_limit_period: "week",
//   custom_workouts_enabled: false,
//   ...
// }
```

### 3. Mobile App Changes

#### A. Workout Limit Counter

```javascript
// components/WorkoutCard.jsx
import { useState, useEffect } from 'react';

const WorkoutCard = ({ workout }) => {
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [limit, setLimit] = useState(null);

  useEffect(() => {
    checkWorkoutLimit();
  }, []);

  const checkWorkoutLimit = async () => {
    const { data: limits } = await supabase.rpc('get_user_tier_limits', {
      user_id_param: user.id
    });

    if (limits?.workout_limit) {
      setLimit(limits.workout_limit);
      
      // Count this week's workouts
      const weekStart = startOfWeek(new Date());
      const { count } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('completed_at', weekStart.toISOString());
      
      setWeeklyCount(count);
    }
  };

  const handleStartWorkout = () => {
    if (limit && weeklyCount >= limit) {
      // Show upgrade prompt
      Alert.alert(
        'Workout Limit Reached',
        `You've completed ${limit} workouts this week. Upgrade to Premium for unlimited workouts!`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade Now', onPress: () => navigation.navigate('Subscriptions') }
        ]
      );
      return;
    }

    // Start workout normally
    navigation.navigate('WorkoutSession', { workout });
  };

  return (
    <TouchableOpacity onPress={handleStartWorkout}>
      {/* Workout card UI */}
      {limit && (
        <Text style={styles.limitText}>
          {weeklyCount}/{limit} workouts this week
        </Text>
      )}
    </TouchableOpacity>
  );
};
```

#### B. Feature Lock UI Components

```javascript
// components/PremiumFeatureLock.jsx
const PremiumFeatureLock = ({ feature, children }) => {
  const { data: hasPremium } = useQuery({
    queryKey: ['premium-access'],
    queryFn: async () => {
      const { data } = await supabase.rpc('user_has_premium_access', {
        user_id_param: user.id
      });
      return data;
    }
  });

  if (hasPremium) {
    return children; // Show full feature
  }

  return (
    <View style={styles.lockedContainer}>
      <View style={styles.blurOverlay}>
        <Lock size={48} color="#FFD700" />
        <Text style={styles.lockTitle}>Premium Feature</Text>
        <Text style={styles.lockDescription}>
          {feature} is available with Premium subscription
        </Text>
        <Button onPress={() => navigation.navigate('Subscriptions')}>
          Upgrade to Premium
        </Button>
      </View>
      <View style={{ opacity: 0.3 }}>
        {children} {/* Show blurred preview */}
      </View>
    </View>
  );
};

// Usage:
<PremiumFeatureLock feature="Custom Workouts">
  <CustomWorkoutBuilder />
</PremiumFeatureLock>
```

#### C. Upgrade Prompts

**Strategic Placement:**
1. After completing 3rd workout of the week
2. When trying to access custom workouts
3. When viewing advanced analytics
4. Banner at top of home screen for Base users

```javascript
// components/UpgradeBanner.jsx
const UpgradeBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    checkTier();
  }, []);

  const checkTier = async () => {
    const { data } = await supabase.rpc('user_has_premium_access', {
      user_id_param: user.id
    });
    setShowBanner(!data);
  };

  if (!showBanner) return null;

  return (
    <TouchableOpacity 
      style={styles.banner}
      onPress={() => navigation.navigate('Subscriptions')}
    >
      <Sparkles size={20} color="#FFD700" />
      <Text style={styles.bannerText}>
        Unlock unlimited workouts & premium features
      </Text>
      <ChevronRight size={20} color="#666" />
    </TouchableOpacity>
  );
};
```

### 4. Admin Panel Updates

**Show User's Current Tier:**

```javascript
// admin/src/pages/Users.jsx
const UserRow = ({ user }) => {
  const [tier, setTier] = useState('Loading...');

  useEffect(() => {
    fetchUserTier();
  }, []);

  const fetchUserTier = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_packages (name, slug)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    setTier(data?.subscription_packages?.name || 'Base');
  };

  return (
    <tr>
      <td>{user.email}</td>
      <td>
        <Badge color={tier === 'Base' ? 'gray' : 'blue'}>
          {tier}
        </Badge>
      </td>
      {/* ... */}
    </tr>
  );
};
```

### 5. Automated Trial Expiration

**Option A: Supabase Edge Function (Recommended)**

```typescript
// supabase/functions/check-trial-expirations/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Call the trial expiration function
    const { error } = await supabaseClient.rpc('handle_trial_expiration')
    
    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, message: 'Trial expiration check complete' }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

**Schedule with Cron:**
```bash
# Run daily at midnight
curl -X POST \
  'https://your-project.supabase.co/functions/v1/check-trial-expirations' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

**Option B: GitHub Actions (Alternative)**

```yaml
# .github/workflows/check-trials.yml
name: Check Trial Expirations
on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight UTC
  workflow_dispatch: # Manual trigger

jobs:
  check-trials:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl -X POST \
            '${{ secrets.SUPABASE_URL }}/rest/v1/rpc/handle_trial_expiration' \
            -H 'apikey: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            -H 'Content-Type: application/json'
```

## 📱 User Experience Examples

### Example 1: Free User Starting 4th Workout

**Before Limit Check:**
```
User taps "Start Workout"
  ↓
Check: get_user_tier_limits()
  ↓
Result: { workout_limit: 3, workout_limit_period: "week" }
  ↓
Count this week: 3 workouts completed
  ↓
3 >= 3 → Show upgrade prompt
```

**Prompt:**
```
┌─────────────────────────────────────┐
│  🚫 Workout Limit Reached           │
│                                      │
│  You've completed your 3 free       │
│  workouts this week!                │
│                                      │
│  Upgrade to Premium for:            │
│  ✨ Unlimited workouts              │
│  ✨ Custom meal plans               │
│  ✨ Advanced analytics              │
│                                      │
│  [Maybe Later]  [Upgrade for $9.99] │
└─────────────────────────────────────┘
```

### Example 2: Trial User Post-Expiration

**Day 8 (After Trial):**
```
User opens app
  ↓
Check subscription status
  ↓
Status changed: trialing → active (base-free)
  ↓
Show notification:
```

**Notification:**
```
┌─────────────────────────────────────┐
│  ℹ️ Trial Ended                     │
│                                      │
│  Thanks for trying Premium!          │
│                                      │
│  You're now on our Base (Free) plan:│
│  • 3 workouts per week              │
│  • Basic meal plans                 │
│  • Progress tracking                │
│                                      │
│  Miss unlimited access?             │
│                                      │
│  [See Plans]              [Dismiss] │
└─────────────────────────────────────┘
```

## 💰 Conversion Optimization

### Upgrade Trigger Points

1. **Workout Limit Hit** (Highest conversion)
   - User wants to workout NOW
   - Strong intent to use app

2. **Custom Workout Attempt** (High conversion)
   - User invested in app
   - Has specific needs

3. **Week Reset Reminder** (Medium conversion)
   - "Your 3 free workouts reset tomorrow!"
   - Creates FOMO

4. **Progress Milestone** (Medium conversion)
   - "You've lost 5 lbs! Unlock advanced tracking"
   - Positive reinforcement

### Messaging Strategy

**Emphasize Value, Not Restrictions:**
- ❌ "You can't access this feature"
- ✅ "Unlock unlimited workouts with Premium"

**Show What They're Missing:**
- Display blurred premium features
- Show "Premium" badges on locked content
- Highlight subscriber testimonials

**Time-Limited Offers:**
- "Upgrade within 24 hours: Get 20% off"
- "Trial ended? Come back for 50% off first month"

## 📊 Metrics to Track

### Key Metrics:

1. **Trial-to-Paid Conversion**: % of trial users who upgrade
2. **Base-to-Paid Conversion**: % of free users who eventually upgrade
3. **Retention**: % of Base users still active after 30/60/90 days
4. **Workout Limit Hits**: How often users hit the 3/week limit
5. **Upgrade Prompt CTR**: Click-through rate on upgrade prompts

### Target KPIs:

- Trial → Paid: 5-10% (industry standard)
- Base → Paid: 2-5% over 90 days
- Base User Retention: 40% at 30 days
- Limit Hit Rate: 60%+ (shows limit is effective)

## 🚀 Deployment Checklist

### Phase 1: Database Setup
- [ ] Run `ADD_BASE_FREE_TIER.sql` migration
- [ ] Verify Base tier created in subscription_packages
- [ ] Test `user_has_premium_access()` function
- [ ] Test `get_user_tier_limits()` function

### Phase 2: Backend
- [ ] Deploy Edge Function for trial expiration (or set up cron)
- [ ] Test manual execution: `SELECT handle_trial_expiration();`
- [ ] Set up daily scheduled job

### Phase 3: Mobile App
- [ ] Add workout limit counter component
- [ ] Add PremiumFeatureLock component
- [ ] Add upgrade banner for Base users
- [ ] Add upgrade prompts at key touchpoints
- [ ] Test limit enforcement

### Phase 4: Admin Panel
- [ ] Add Base tier to subscriptions page
- [ ] Show user tier in users list
- [ ] Add analytics for conversions

### Phase 5: Testing
- [ ] Test: New user → Trial → Auto downgrade to Base
- [ ] Test: Base user hits workout limit → Prompt shows
- [ ] Test: Base user upgrades → All features unlock
- [ ] Test: Edge cases (multiple subscriptions, etc.)

### Phase 6: Launch
- [ ] Monitor trial expirations
- [ ] Track conversion metrics
- [ ] A/B test upgrade prompts
- [ ] Iterate based on data

## 🎓 Best Practices

### DO:
- ✅ Make Base tier functional (not frustrating)
- ✅ Show value of premium features
- ✅ Use soft paywalls (can see but can't use)
- ✅ Celebrate milestones ("You've completed 3 workouts!")
- ✅ Offer time-limited upgrade discounts

### DON'T:
- ❌ Make app unusable on Base tier
- ❌ Spam users with constant upgrade prompts
- ❌ Hide that Base tier exists (be transparent)
- ❌ Lock basic features (progress tracking, etc.)
- ❌ Forget to remind about weekly limit reset

## 📈 Expected Results

### Conservative Estimates:

**Scenario: 1000 trial users**
```
1000 users start trial
  ↓
Day 7: Trial ends
  ↓
  ↙️ 50 users (5%)       ↘️ 950 users (95%)
Subscribe immediately    Move to Base tier
                              ↓
                         30 days later
                              ↓
                         ↙️ 50 users (5%)  ↘️ 900 users
                      Upgrade after        Stay free or churn
                      seeing limits
                         
Total Conversions: 100/1000 = 10% (industry average)
Active Free Users: 400/1000 = 40% retention
```

### Revenue Impact:
- Trial → Paid: 50 users × $9.99 = $499.50/month
- Base → Paid: 50 users × $9.99 = $499.50/month
- **Total: $999/month from 1000 signups**

Without Base tier, you'd lose those extra 50 conversions!

---

**Status:** 📋 Ready to implement  
**Estimated Development Time:** 2-3 days  
**Expected ROI:** 2-5% additional conversion from Base users

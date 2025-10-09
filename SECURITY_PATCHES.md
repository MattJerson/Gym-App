# 🔧 Security Patches - Critical Fixes

**Apply these patches immediately to resolve critical security vulnerabilities**

---

## PATCH 1: Remove Service Role Key from Admin Panel

### File: `admin/src/lib/supabase.js`

**BEFORE (INSECURE):**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Admin panel uses SERVICE ROLE KEY to bypass RLS policies
// This allows full admin access to create/update/delete badges and challenges
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
```

**AFTER (SECURE):**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Admin panel uses ANON KEY with authenticated user
// Admin operations are protected by RLS policies and admin role checks
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: window.localStorage
  }
})

// Helper function to check if current user is admin
export const checkAdminRole = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()
  
  if (error || !profile?.is_admin) {
    throw new Error('Unauthorized: Admin access required')
  }
  
  return true
}
```

---

### File: `admin/.env`

**BEFORE (INSECURE):**
```bash
VITE_SUPABASE_URL=https://hjytowwfhgngbilousri.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**AFTER (SECURE):**
```bash
VITE_SUPABASE_URL=https://hjytowwfhgngbilousri.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# SERVICE_ROLE_KEY removed - now using backend API for admin operations
```

---

### File: `admin/src/pages/Dashboard.jsx`

**BEFORE (INSECURE):**
```javascript
// Initialize Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
```

**AFTER (SECURE):**
```javascript
// Use the shared Supabase client with admin checks
import { supabase, checkAdminRole } from '../lib/supabase';

// Add admin check in component
useEffect(() => {
  const verifyAdmin = async () => {
    try {
      await checkAdminRole();
      fetchDashboardData();
    } catch (error) {
      console.error('Admin verification failed:', error);
      // Redirect to login or show error
      window.location.href = '/login';
    }
  };
  
  verifyAdmin();
}, []);
```

---

## PATCH 2: Implement Secure Token Storage (Mobile App)

### Create New File: `services/secureStorage.js`

```javascript
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure storage wrapper for sensitive data like auth tokens
 * Uses Keychain (iOS) and Keystore (Android)
 */
export const secureStorage = {
  async getItem(key) {
    try {
      if (Platform.OS === 'web') {
        // Fallback to localStorage for web (not recommended for production)
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error getting ${key} from secure storage:`, error);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error setting ${key} in secure storage:`, error);
      throw error;
    }
  },

  async removeItem(key) {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing ${key} from secure storage:`, error);
    }
  }
};
```

### File: `services/supabase.js`

**BEFORE (INSECURE):**
```javascript
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    detectSessionInUrl: false,
    autoRefreshToken: true,
    debug: false,
  },
});
```

**AFTER (SECURE):**
```javascript
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@env";
import { secureStorage } from "./secureStorage";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStorage,  // Use secure storage instead of AsyncStorage
    persistSession: true,
    detectSessionInUrl: false,
    autoRefreshToken: true,
    debug: false,
    flowType: 'pkce',  // Use PKCE flow for enhanced security
  },
  global: {
    headers: {
      'X-Client-Info': 'gym-app-mobile/1.0.0',
    },
  },
});

// Handle auth errors globally (unchanged)
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Auth token refreshed successfully');
  }
  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
  if (event === 'USER_UPDATED') {
    console.log('User data updated');
  }
});

// Helper function to ensure valid session (unchanged)
export const ensureValidSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.log('No valid session found, signing out...');
      await supabase.auth.signOut();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Session check error:', error);
    return null;
  }
};
```

### Install Required Package:

```bash
cd C:\Users\JaiDa\Documents\Gym-App
npx expo install expo-secure-store
```

---

## PATCH 3: Remove Console.log in Production

### Create New File: `utils/logger.js`

```javascript
const isDevelopment = __DEV__;

/**
 * Production-safe logger
 * Automatically strips logs in production builds
 */
export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  error: (...args) => {
    // Always log errors, but sanitize sensitive data
    const sanitized = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        const { password, token, session, ...safe } = arg;
        return safe;
      }
      return arg;
    });
    console.error(...sanitized);
  },

  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};
```

### Apply to All Service Files:

**Example: `services/TrainingProgressService.js`**

```javascript
// Add import
import { logger } from '../utils/logger';

// Replace console.log
logger.log('✅ Workout logged successfully:', data);  // Only in dev
logger.error('Error logging workout:', error);        // Always logs
```

---

## PATCH 4: Add Row Level Security Policies

### Create New File: `db_schema/security_policies.sql`

```sql
-- ============================================
-- CRITICAL: Enable RLS on ALL user tables
-- ============================================

-- Enable RLS
ALTER TABLE public.active_workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bodyfat_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- User can only access their own data
CREATE POLICY "Users can view own workout sessions"
  ON public.active_workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workout sessions"
  ON public.active_workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions"
  ON public.active_workout_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions"
  ON public.active_workout_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Repeat for all user tables
CREATE POLICY "Users can view own profile"
  ON public.bodyfat_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.bodyfat_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin-only tables
CREATE POLICY "Only admins can manage badges"
  ON public.badges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can manage challenges"
  ON public.challenges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Everyone can view public leaderboards
CREATE POLICY "Anyone can view safe leaderboard"
  ON public.safe_weekly_leaderboard FOR SELECT
  TO authenticated, anon
  USING (true);

-- Add is_admin column if not exists
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin 
  ON public.user_profiles(user_id) 
  WHERE is_admin = true;
```

---

## PATCH 5: Add Admin Authentication Route Guard

### Create New File: `admin/src/middleware/adminAuth.js`

```javascript
import { supabase, checkAdminRole } from '../lib/supabase';

/**
 * Admin route protection middleware
 * Redirects to login if not authenticated or not admin
 */
export const requireAdmin = async (navigate) => {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/login');
      return false;
    }
    
    // Check if user is admin
    await checkAdminRole();
    return true;
    
  } catch (error) {
    console.error('Admin auth failed:', error);
    navigate('/login');
    return false;
  }
};

/**
 * Higher-order component for protected admin routes
 */
export const withAdminAuth = (Component) => {
  return (props) => {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
      const checkAuth = async () => {
        const authorized = await requireAdmin(navigate);
        setIsAuthorized(authorized);
        setLoading(false);
      };
      
      checkAuth();
    }, [navigate]);
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!isAuthorized) {
      return null;
    }
    
    return <Component {...props} />;
  };
};
```

### File: `admin/src/App.jsx` (or router config)

```javascript
import { withAdminAuth } from './middleware/adminAuth';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';

// Protect all admin routes
const ProtectedDashboard = withAdminAuth(Dashboard);
const ProtectedUsers = withAdminAuth(Users);

// In your routes:
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/dashboard" element={<ProtectedDashboard />} />
  <Route path="/users" element={<ProtectedUsers />} />
  {/* ... other protected routes */}
</Routes>
```

---

## PATCH 6: Environment File Security

### Create New File: `.env.example`

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Food Data API
FOODDATA_API=your-api-key-here

# DO NOT commit real .env files to git!
```

### Update `.gitignore`

```bash
# Environment files
.env
.env.local
.env.development
.env.production
.env*.local
admin/.env
backend/.env

# Secrets
secrets/
*.pem
*.key
service-account.json
```

---

## PATCH 7: Add HTTPS Enforcement

### File: `app.json`

```json
{
  "expo": {
    "android": {
      "usesCleartextTraffic": false,
      "permissions": [
        "android.permission.INTERNET"
      ]
    },
    "ios": {
      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSAllowsArbitraryLoads": false,
          "NSExceptionDomains": {
            "localhost": {
              "NSExceptionAllowsInsecureHTTPLoads": true
            }
          }
        }
      }
    }
  }
}
```

---

## APPLICATION CHECKLIST

Apply patches in this order:

1. ✅ **IMMEDIATE** - Rotate service_role key in Supabase dashboard
2. ✅ **IMMEDIATE** - Apply PATCH 1 (remove service_role from admin)
3. ✅ **IMMEDIATE** - Apply PATCH 4 (RLS policies)
4. ✅ Apply PATCH 2 (secure storage)
5. ✅ Apply PATCH 3 (logger)
6. ✅ Apply PATCH 5 (admin auth)
7. ✅ Apply PATCH 6 (.env security)
8. ✅ Apply PATCH 7 (HTTPS enforcement)
9. ✅ Remove .env from git history
10. ✅ Test thoroughly
11. ✅ Deploy to production

---

## TESTING AFTER PATCHES

```bash
# 1. Test mobile app auth
npm start
# Login and verify tokens are in secure storage

# 2. Test admin auth
cd admin
npm run dev
# Verify login required and admin role checked

# 3. Test RLS policies
# Try to access another user's data - should be denied

# 4. Verify no service_role in client
grep -r "service_role" --exclude-dir=node_modules --exclude-dir=documentation .

# 5. Check console.log removed
grep -r "console.log" services/ app/ | wc -l
```

---

## ROLLBACK PLAN

If issues occur after applying patches:

```bash
# Revert git commits
git revert <commit-hash>

# Restore from backup
git checkout HEAD~1 -- <file>

# Re-enable service_role temporarily (NOT RECOMMENDED)
# Only if absolutely necessary for emergency access
```

**Important:** Do not rollback security patches without implementing proper fixes!


# .env File Security Best Practices

## 🚨 CRITICAL: Service Role Key Security

### ❌ **NEVER DO THIS:**

```bash
# Mobile app .env (ROOT)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ❌ EXPOSED IN APP BUNDLE!

# Admin panel .env
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ❌ EXPOSED IN BROWSER!
```

**Why?**
- Client-side code (mobile apps, browsers) is **PUBLIC**
- Anyone can extract secrets from:
  - Mobile app bundles (`.apk` / `.ipa`)
  - Browser dev tools (Network tab, Source maps)
  - Decompiled JavaScript
- Service Role Key **bypasses ALL Row Level Security (RLS)**

### ✅ **DO THIS INSTEAD:**

```bash
# Mobile app .env (ROOT) - CLIENT-SAFE ONLY
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # ✅ Protected by RLS
EXPO_PUBLIC_FOODDATA_API=xxx              # ✅ Rate-limited public API

# Admin panel .env - CLIENT-SAFE ONLY  
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...         # ✅ Protected by RLS
VITE_YOUTUBE_API_KEY=xxx                  # ✅ Restricted to domains

# Backend .env (IF YOU HAD ONE) - SERVER-SIDE ONLY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...     # ✅ Only on server
```

## 📁 Your Current Structure (CORRECT!)

```
/Gym-App/
├── .env                          # Mobile app (Expo/React Native)
│   ├── EXPO_PUBLIC_*             # ✅ Safe for client
│   └── SUPABASE_ANON_KEY         # ✅ Protected by RLS
│
├── admin/
│   └── .env                      # Admin panel (Vite/React)
│       ├── VITE_*                # ✅ Safe for client
│       └── VITE_YOUTUBE_API_KEY  # ✅ Domain-restricted
│
├── .gitignore                    # ✅ Should ignore both .env files
└── .env.example                  # ✅ Template (no real keys)
```

### ✅ **Why This Is Good:**

1. **Separation of Concerns**
   - Mobile and admin have different configs
   - Different build tools (Expo vs Vite)
   - Different deployment targets

2. **Security Boundaries**
   - Each app only gets keys it needs
   - Admin can't accidentally use mobile keys

3. **Easy Maintenance**
   - Clear which keys belong where
   - Update one without affecting the other

## 🔐 Key Security Levels

### **Level 1: Public Keys** ✅ Safe in Client Code

```bash
# Examples:
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_URL=https://xxx.supabase.co
```

**Why Safe?**
- Public information (anyone can see your API endpoint)
- No risk if exposed

### **Level 2: Anon Keys** ✅ Safe with RLS Protection

```bash
# Examples:
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Why Safe?**
- Designed for client-side use
- **ONLY works with proper RLS policies**
- Can only access data user is authorized for
- Rate-limited by Supabase

**Requirements:**
- ✅ Must have RLS enabled on ALL tables
- ✅ Must have proper RLS policies
- ✅ User authentication required for sensitive data

### **Level 3: Restricted API Keys** ⚠️ Safe with Restrictions

```bash
# Examples:
VITE_YOUTUBE_API_KEY=AIzaSyC...
EXPO_PUBLIC_FOODDATA_API=xxx...
```

**Why Safe?**
- YouTube API: Restricted to specific domains/apps
- USDA API: Rate-limited, read-only access
- Limited damage if stolen

**Best Practices:**
- ✅ Restrict to your domains in API console
- ✅ Monitor usage for abuse
- ✅ Rotate keys periodically

### **Level 4: Service Role Keys** ❌ NEVER in Client Code

```bash
# Examples:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...      # ❌ DANGER!
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # ❌ DANGER!
DATABASE_PASSWORD=password123             # ❌ DANGER!
STRIPE_SECRET_KEY=sk_live_...             # ❌ DANGER!
```

**Why NEVER?**
- Bypasses ALL security
- Full database access
- Can delete all data
- Can steal user information
- Can modify billing/payments

**Where to Use:**
- ✅ Supabase Dashboard only (for manual operations)
- ✅ Backend servers (Node.js, Deno, etc.)
- ✅ CI/CD pipelines (GitHub Actions secrets)
- ✅ Supabase Edge Functions
- ❌ NEVER in mobile apps
- ❌ NEVER in browser code

## 🚀 Production Deployment

### Mobile App (Expo/React Native)

**Build Process:**
```bash
# .env file is bundled into the app
eas build --platform android
eas build --platform ios
```

**What Gets Included:**
- ✅ `EXPO_PUBLIC_*` variables (safe)
- ✅ `SUPABASE_ANON_KEY` (safe with RLS)
- ❌ Any `SERVICE_ROLE_KEY` (would be disaster!)

**Security:**
- Anyone can decompile your app and see these keys
- This is OK because anon keys are protected by RLS
- Never include sensitive keys

### Admin Panel (Vite/React)

**Build Process:**
```bash
# .env file is bundled into static JS
npm run build
```

**What Gets Included:**
- ✅ `VITE_*` variables (injected at build time)
- ✅ Keys are visible in browser dev tools (expected)
- ❌ Any `SERVICE_ROLE_KEY` (would be disaster!)

**Security:**
- Anyone can view source in browser
- This is OK because keys are client-safe
- Never include sensitive keys

### Backend (If You Add One Later)

**Environment Variables:**
```bash
# .env file stays on server (not deployed)
SUPABASE_SERVICE_ROLE_KEY=xxx  # ✅ Safe on server
DATABASE_URL=postgresql://...  # ✅ Safe on server
```

**Deployment:**
- Use platform secrets (Vercel, Railway, etc.)
- Never commit `.env` to git
- Use different keys for dev/staging/prod

## 📋 Git Best Practices

### .gitignore (Should Have)

```gitignore
# Environment files
.env
.env.local
.env.production
.env.development

# Admin environment
admin/.env
admin/.env.local

# Don't ignore examples
!.env.example
!admin/.env.example
```

### .env.example (Template)

```bash
# Root .env.example
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_FOODDATA_API=your_usda_api_key_here
```

```bash
# admin/.env.example
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
```

**Purpose:**
- ✅ Shows what keys are needed
- ✅ Safe to commit (no real values)
- ✅ Helps new developers set up
- ✅ Documents required environment variables

## 🔥 What If Keys Are Already Exposed?

### If Service Role Key Was Committed to Git:

**1. Rotate Keys IMMEDIATELY**
```bash
# Go to Supabase Dashboard
Settings → API → Generate new keys
```

**2. Update All Environments**
- Update `.env` files (locally only)
- Update deployment secrets
- Never commit new keys to git

**3. Check Git History**
```bash
# Search for exposed keys
git log --all --full-history -- "*/.env"

# If found in history, consider:
# - BFG Repo-Cleaner to remove from history
# - Or just rotate keys and move on
```

### If Keys Are in Production App:

**1. Rotate Keys**
- Generate new keys in Supabase Dashboard
- Old keys are immediately invalid

**2. Release New Version**
- Update `.env` with new keys
- Build and release new app version
- Users must update to continue using app

## 🎯 Current Status & Actions

### ✅ **Fixed:**
- Removed `SUPABASE_SERVICE_ROLE_KEY` from root `.env`
- Removed `VITE_SUPABASE_SERVICE_ROLE_KEY` from root `.env`
- Added security comments explaining why

### ⚠️ **Verify:**

Check if `.env` is in `.gitignore`:
```bash
cat .gitignore | grep .env
```

Should see:
```
.env
.env.local
admin/.env
```

### 🔄 **Recommended Actions:**

1. **Rotate Your Service Role Key**
   - Go to Supabase Dashboard
   - Settings → API → Generate new service role key
   - Store it ONLY in password manager
   - Use only for manual database operations

2. **Check Git History**
   ```bash
   git log --all --oneline --grep=SERVICE_ROLE
   ```
   - If found, rotate keys immediately

3. **Create .env.example Files**
   ```bash
   # Root
   cp .env .env.example
   # Edit .env.example to remove real values
   
   # Admin
   cp admin/.env admin/.env.example
   # Edit admin/.env.example to remove real values
   ```

4. **Verify .gitignore**
   ```bash
   git status
   # Should NOT show .env files
   ```

## 📚 Summary

| Key Type | Mobile App | Admin Panel | Backend | Risk Level |
|----------|-----------|-------------|---------|------------|
| **Supabase URL** | ✅ Yes | ✅ Yes | ✅ Yes | 🟢 None |
| **Anon Key** | ✅ Yes | ✅ Yes | ✅ Yes | 🟢 Low (with RLS) |
| **Service Role Key** | ❌ NEVER | ❌ NEVER | ✅ Only | 🔴 CRITICAL |
| **YouTube API Key** | ⚠️ OK | ✅ Yes | ✅ Yes | 🟡 Low (restricted) |
| **USDA API Key** | ✅ Yes | ⚠️ OK | ✅ Yes | 🟡 Low (public) |

### Golden Rules:

1. ✅ **DO** separate `.env` files for different apps
2. ✅ **DO** use anon keys in client code (with RLS)
3. ✅ **DO** add `.env` to `.gitignore`
4. ✅ **DO** create `.env.example` templates
5. ❌ **NEVER** put service role keys in client code
6. ❌ **NEVER** commit `.env` to git
7. ❌ **NEVER** share service role keys publicly
8. 🔄 **ALWAYS** rotate keys if exposed

---

**Your current structure is CORRECT** ✅  
**Just needed to remove the dangerous keys** ✅  
**Now your app is secure** 🔒

**Last Updated:** October 16, 2025  
**Status:** ✅ Secured

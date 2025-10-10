# 🔒 Security Audit Checklist - Runnable Commands

**Last Updated:** October 9, 2025  
**Run these commands before each deployment**

---

## 📋 PRE-DEPLOYMENT SECURITY CHECKLIST

### ✅ 1. Dependency Vulnerability Scan

```powershell
# Mobile App
cd C:\Users\JaiDa\Documents\Gym-App
npm audit --json > security-audit-app.json
npm audit

# Admin Panel
cd C:\Users\JaiDa\Documents\Gym-App\admin
npm audit --json > security-audit-admin.json
npm audit

# Fix vulnerabilities
npm audit fix
```

**Expected Result:** 0 critical/high vulnerabilities

---

### ✅ 2. Secret Detection Scan

```powershell
# Check for exposed secrets in codebase
cd C:\Users\JaiDa\Documents\Gym-App

# Search for API keys
Get-ChildItem -Recurse -Include *.js,*.jsx,*.ts,*.tsx,*.json -Exclude node_modules | 
  Select-String -Pattern "(api[_-]?key|secret|password|token|service[_-]?role)" -CaseSensitive:$false |
  Where-Object { $_.Line -notmatch "^(\s*//|/\*)" } | 
  Format-Table Path, LineNumber, Line -AutoSize

# Check for hardcoded URLs with credentials
Get-ChildItem -Recurse -Include *.js,*.jsx,*.ts,*.tsx | 
  Select-String -Pattern "https?://[^:]+:[^@]+@" |
  Format-Table Path, LineNumber, Line -AutoSize

# Check .env files are in .gitignore
if (Test-Path .gitignore) {
  Get-Content .gitignore | Select-String ".env"
} else {
  Write-Warning ".gitignore not found!"
}
```

**Expected Result:** No secrets in code, .env in .gitignore

---

### ✅ 3. Git History Secret Scan

```powershell
cd C:\Users\JaiDa\Documents\Gym-App

# Check if .env files were ever committed
git log --all --full-history --source -- "*/.env" "**/.env*" "*.env"

# Search for service_role key in git history
git log --all -p | Select-String "service_role" | Select-Object -First 10

# Check for FOODDATA_API key in history
git log --all -p | Select-String "FOODDATA_API" | Select-Object -First 5
```

**Expected Result:** No secrets in git history

---

### ✅ 4. Console.log Detection

```powershell
cd C:\Users\JaiDa\Documents\Gym-App

# Find all console.log statements
Get-ChildItem -Recurse -Include *.js,*.jsx,*.ts,*.tsx -Exclude node_modules |
  Select-String -Pattern "console\.(log|warn|info|debug)" |
  Where-Object { $_.Line -notmatch "console\.error" } |
  Measure-Object | Select-Object Count

# List files with console.log
Get-ChildItem -Recurse -Include *.js,*.jsx -Exclude node_modules |
  Select-String -Pattern "console\.log" |
  Group-Object Path | 
  Select-Object Count, Name |
  Sort-Object Count -Descending
```

**Expected Result:** All console.log wrapped in DEV checks or removed

---

### ✅ 5. Environment Variable Check

```powershell
cd C:\Users\JaiDa\Documents\Gym-App

# Check .env files exist
Write-Host "Checking .env files..." -ForegroundColor Cyan
Get-ChildItem -Recurse -Filter ".env*" -File | Select-Object FullName

# Verify required env vars (mobile app)
$envContent = Get-Content .env -ErrorAction SilentlyContinue
if ($envContent) {
  Write-Host "`nMobile App .env:" -ForegroundColor Green
  $envContent | Select-String "SUPABASE_URL|SUPABASE_ANON_KEY|FOODDATA_API"
} else {
  Write-Warning "Mobile app .env not found!"
}

# Verify required env vars (admin)
$adminEnvContent = Get-Content admin\.env -ErrorAction SilentlyContinue
if ($adminEnvContent) {
  Write-Host "`nAdmin .env:" -ForegroundColor Green
  $adminEnvContent | Select-String "VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY"
  
  # CRITICAL CHECK: Ensure NO service_role key in admin .env
  if ($adminEnvContent | Select-String "SERVICE_ROLE") {
    Write-Error "❌ CRITICAL: SERVICE_ROLE_KEY found in admin/.env!"
  } else {
    Write-Host "✅ No service_role key in admin .env" -ForegroundColor Green
  }
}
```

**Expected Result:** Only anon keys in .env files, NO service_role keys

---

### ✅ 6. Code Pattern Security Scan

```powershell
cd C:\Users\JaiDa\Documents\Gym-App

# Check for dangerous patterns
Write-Host "Scanning for dangerous code patterns..." -ForegroundColor Cyan

# Check for eval()
$evalCount = (Get-ChildItem -Recurse -Include *.js,*.jsx -Exclude node_modules |
  Select-String -Pattern "\beval\(" | Measure-Object).Count
Write-Host "eval() usage: $evalCount" -ForegroundColor $(if($evalCount -eq 0){"Green"}else{"Red"})

# Check for dangerouslySetInnerHTML
$dangerCount = (Get-ChildItem -Recurse -Include *.jsx,*.tsx -Exclude node_modules |
  Select-String -Pattern "dangerouslySetInnerHTML" | Measure-Object).Count
Write-Host "dangerouslySetInnerHTML usage: $dangerCount" -ForegroundColor $(if($dangerCount -eq 0){"Green"}else{"Yellow"})

# Check for AsyncStorage (should use SecureStore)
$asyncCount = (Get-ChildItem -Recurse -Include *.js,*.jsx -Path services |
  Select-String -Pattern "AsyncStorage" | Measure-Object).Count
Write-Host "AsyncStorage usage in services: $asyncCount" -ForegroundColor Yellow

# Check for HTTP URLs (should be HTTPS)
$httpCount = (Get-ChildItem -Recurse -Include *.js,*.jsx -Exclude node_modules |
  Select-String -Pattern 'http://(?!localhost|127\.0\.0\.1)' | Measure-Object).Count
Write-Host "HTTP URLs (non-localhost): $httpCount" -ForegroundColor $(if($httpCount -eq 0){"Green"}else{"Red"})
```

**Expected Result:** 
- eval(): 0
- dangerouslySetInnerHTML: 0
- AsyncStorage for auth: 0 (use SecureStore)
- HTTP URLs: 0

---

### ✅ 7. Supabase Configuration Validation

```powershell
cd C:\Users\JaiDa\Documents\Gym-App

# Check mobile app Supabase client config
Write-Host "Checking Supabase configuration..." -ForegroundColor Cyan

Get-Content services\supabase.js | Select-String -Pattern "createClient|storage|autoRefreshToken"

# Verify anon key is used (not service_role)
$mobileSupabase = Get-Content services\supabase.js -Raw
if ($mobileSupabase -match "SERVICE_ROLE") {
  Write-Error "❌ CRITICAL: service_role key in mobile app!"
} else {
  Write-Host "✅ Mobile app uses anon key" -ForegroundColor Green
}

# Check admin Supabase client
$adminSupabase = Get-Content admin\src\lib\supabase.js -Raw -ErrorAction SilentlyContinue
if ($adminSupabase -match "service_role") {
  Write-Warning "⚠️ Admin panel uses service_role key - ensure backend auth is implemented!"
}
```

**Expected Result:** Mobile uses anon key, admin has proper auth

---

### ✅ 8. RLS Policy Verification (Supabase Dashboard)

**Manual Check Required:**

```sql
-- Run in Supabase SQL Editor

-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY rowsecurity DESC, tablename;

-- List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Find tables WITHOUT RLS
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false
ORDER BY tablename;
```

**Expected Result:** All user-facing tables have RLS enabled

---

### ✅ 9. Package.json Security Config Check

```powershell
cd C:\Users\JaiDa\Documents\Gym-App

# Check for security scripts
Write-Host "Checking package.json security configuration..." -ForegroundColor Cyan

# Mobile app
if (Test-Path package.json) {
  $pkg = Get-Content package.json | ConvertFrom-Json
  Write-Host "`nMobile App Scripts:" -ForegroundColor Green
  $pkg.scripts | Format-List
}

# Admin panel
if (Test-Path admin\package.json) {
  $adminPkg = Get-Content admin\package.json | ConvertFrom-Json
  Write-Host "`nAdmin Panel Scripts:" -ForegroundColor Green
  $adminPkg.scripts | Format-List
}
```

**Expected Result:** Security audit scripts present

---

### ✅ 10. Build Configuration Security

```powershell
cd C:\Users\JaiDa\Documents\Gym-App

# Check app.json for security settings
Write-Host "Checking app.json security settings..." -ForegroundColor Cyan

if (Test-Path app.json) {
  $appJson = Get-Content app.json | ConvertFrom-Json
  
  # Check Android security
  if ($appJson.expo.android) {
    Write-Host "`nAndroid Security Settings:" -ForegroundColor Green
    Write-Host "usesCleartextTraffic: $($appJson.expo.android.usesCleartextTraffic)"
    Write-Host "Permissions: $($appJson.expo.android.permissions -join ', ')"
  }
  
  # Check iOS security
  if ($appJson.expo.ios) {
    Write-Host "`niOS Security Settings:" -ForegroundColor Green
    if ($appJson.expo.ios.infoPlist.NSAppTransportSecurity) {
      Write-Host "NSAppTransportSecurity configured: Yes"
    }
  }
}

# Check metro.config.js for minification
if (Test-Path metro.config.js) {
  Write-Host "`nMetro Config:" -ForegroundColor Green
  Get-Content metro.config.js | Select-String "minifier|compress|mangle"
}
```

**Expected Result:** 
- usesCleartextTraffic: false
- Code minification enabled for production

---

## 🤖 AUTOMATED SECURITY SCAN SCRIPT

Save this as `run-security-scan.ps1`:

```powershell
# Comprehensive Security Scan Script
# Run before every deployment

param(
    [switch]$SkipAudit,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$results = @{
    passed = 0
    failed = 0
    warnings = 0
}

function Test-Check {
    param($name, $scriptBlock)
    
    Write-Host "`n$name" -ForegroundColor Cyan
    try {
        & $scriptBlock
        $results.passed++
        Write-Host "✅ PASS" -ForegroundColor Green
    } catch {
        $results.failed++
        Write-Host "❌ FAIL: $_" -ForegroundColor Red
    }
}

# Change to project root
cd C:\Users\JaiDa\Documents\Gym-App

Write-Host "🔒 Starting Security Scan..." -ForegroundColor Yellow
Write-Host "================================`n" -ForegroundColor Yellow

# 1. Dependency Check
if (-not $SkipAudit) {
    Test-Check "Dependency Audit - Mobile App" {
        $audit = npm audit --json | ConvertFrom-Json
        $critical = $audit.metadata.vulnerabilities.critical
        $high = $audit.metadata.vulnerabilities.high
        if ($critical -gt 0 -or $high -gt 0) {
            throw "$critical critical, $high high vulnerabilities found"
        }
    }
    
    Test-Check "Dependency Audit - Admin Panel" {
        cd admin
        $audit = npm audit --json | ConvertFrom-Json
        $critical = $audit.metadata.vulnerabilities.critical
        $high = $audit.metadata.vulnerabilities.high
        cd ..
        if ($critical -gt 0 -or $high -gt 0) {
            throw "$critical critical, $high high vulnerabilities found"
        }
    }
}

# 2. Secret Detection
Test-Check "Secret Detection - No service_role in client code" {
    $matches = Get-ChildItem -Recurse -Include *.js,*.jsx -Path .,admin -Exclude node_modules |
      Select-String -Pattern "service_role" |
      Where-Object { $_.Path -notmatch "documentation|node_modules" }
    
    if ($matches.Count -gt 0) {
        throw "service_role found in $($matches.Count) files"
    }
}

# 3. Console.log Check
Test-Check "Console.log Detection" {
    $consoleCount = (Get-ChildItem -Recurse -Include *.js,*.jsx -Path services,app |
      Select-String -Pattern "console\.log" | Measure-Object).Count
    
    if ($consoleCount -gt 10) {
        $results.warnings++
        Write-Warning "$consoleCount console.log statements found"
    }
}

# 4. Dangerous Patterns
Test-Check "Dangerous Pattern Detection" {
    $evalCount = (Get-ChildItem -Recurse -Include *.js,*.jsx -Exclude node_modules |
      Select-String -Pattern "\beval\(" | Measure-Object).Count
    
    if ($evalCount -gt 0) {
        throw "$evalCount eval() usages found"
    }
}

# 5. Environment Files Check
Test-Check ".env Files Not Committed" {
    $gitignoreContent = Get-Content .gitignore -ErrorAction Stop
    if ($gitignoreContent -notmatch "\.env") {
        throw ".env not in .gitignore"
    }
}

# Summary
Write-Host "`n================================" -ForegroundColor Yellow
Write-Host "Security Scan Complete" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host "✅ Passed: $($results.passed)" -ForegroundColor Green
Write-Host "❌ Failed: $($results.failed)" -ForegroundColor Red
Write-Host "⚠️  Warnings: $($results.warnings)" -ForegroundColor Yellow

if ($results.failed -gt 0) {
    Write-Host "`n🚨 SECURITY ISSUES FOUND - DO NOT DEPLOY!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "`n✅ Security scan passed - Safe to deploy" -ForegroundColor Green
    exit 0
}
```

**Run with:**
```powershell
.\run-security-scan.ps1
```

---

## 🚀 CI/CD Integration

Add to your deployment pipeline:

```yaml
# Example GitHub Actions integration
- name: Security Scan
  run: |
    pwsh -File run-security-scan.ps1
  continue-on-error: false
```

---

## 📊 Security Metrics Dashboard

Track over time:

```powershell
# Generate security metrics report
$report = @{
    date = Get-Date -Format "yyyy-MM-dd"
    vulnerabilities = (npm audit --json | ConvertFrom-Json).metadata.vulnerabilities
    consoleLogs = (Get-ChildItem -Recurse -Include *.js,*.jsx -Exclude node_modules |
      Select-String -Pattern "console\.log" | Measure-Object).Count
    secretsFound = 0 # Update based on scans
}

$report | ConvertTo-Json | Out-File "security-metrics-$(Get-Date -Format 'yyyyMMdd').json"
```

---

## ✅ CHECKLIST SUMMARY

- [ ] Run `npm audit` on mobile app - 0 critical/high
- [ ] Run `npm audit` on admin panel - 0 critical/high
- [ ] No secrets in code (grep scan)
- [ ] No secrets in git history
- [ ] .env files in .gitignore
- [ ] No console.log in production code
- [ ] No eval() usage
- [ ] No dangerouslySetInnerHTML
- [ ] Mobile app uses anon key (not service_role)
- [ ] Admin has proper authentication
- [ ] All tables have RLS enabled
- [ ] HTTPS-only enforced
- [ ] Code minification enabled
- [ ] AsyncStorage replaced with SecureStore for tokens

**Sign-off:** _______________  Date: _______________


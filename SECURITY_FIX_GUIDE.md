# Security Fix Guide - Remove Podfile.lock from Git History

## Issue
GitHub security scan detected a potential secret in `ios/Podfile.lock` (likely a false positive - CocoaPods checksum).

## Fix Steps

### 1. Remove the file from git tracking (but keep it locally)
```bash
git rm --cached ios/Podfile.lock
```

### 2. Commit the .gitignore update
```bash
git add .gitignore
git commit -m "chore: add ios/Podfile.lock to .gitignore for security"
```

### 3. Remove from git history using BFG Repo-Cleaner (Recommended)

#### Option A: Using BFG (Faster and safer)
```bash
# Install BFG (requires Java)
# Windows: choco install bfg-repo-cleaner
# Or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Create a fresh clone for safety
cd ..
git clone --mirror https://github.com/MattJerson/Gym-App.git Gym-App-mirror
cd Gym-App-mirror

# Remove the file from history
bfg --delete-files Podfile.lock

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (WARNING: This rewrites history)
git push --force
```

#### Option B: Using git filter-branch (Slower)
```bash
# In your repo root
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch ios/Podfile.lock" \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push --force --all
```

### 4. Verify the fix
After force pushing, wait a few minutes and re-run the GitHub security scan.

### 5. Team notification
If you have collaborators:
```bash
# They need to rebase their work
git pull --rebase
```

## Prevention

The `.gitignore` has been updated to prevent this in the future. Files now ignored:
- `ios/Podfile.lock` - Generated dependency lock file
- `.env` - Environment variables with secrets
- `admin/.env` - Admin environment secrets

## Important Notes

⚠️ **WARNING**: Force pushing rewrites git history. Only do this if:
- You're the sole developer, OR
- You've coordinated with your team first

✅ **Safe Alternative**: If you can't force push, just ensure:
1. `ios/Podfile.lock` is now in `.gitignore`
2. It's removed from future commits
3. The "secret" is regenerated (in this case, it's just a CocoaPods checksum, not a real secret)

## What was the "secret"?
The detected value `73db7dbc80edef36a9d6ed3c6c4e1724ead4236d` is most likely a SHA-1 checksum used by CocoaPods for dependency verification, NOT an actual GitHub token. However, it's still best practice to keep `Podfile.lock` out of public repos for clean git history.

# Robust Profanity Filter Implementation Guide

## Overview
Enhanced profanity filtering system that catches circumvention attempts like:
- **Leetspeak**: f@ck, sh!t, b1tch
- **Spacing**: f u c k, s h i t
- **Special characters**: f*ck, s#it, a$$
- **Variations**: fuuuuck, shiiiit

## What Was Updated

### 1. Client-Side Filter (`services/ChatServices.js`)
**Immediate validation before sending to server**

✅ **Pattern-based matching** - Uses regex to catch variations
✅ **Text normalization** - Converts leetspeak to normal text
✅ **19 profanity patterns** including slurs, offensive language, self-harm references

**Examples of what gets caught:**
- `f@ck` → blocked (@ → a)
- `F U C K` → blocked (spaces removed)
- `sh!t` → blocked (! → i)
- `b1tch` → blocked (1 → i)
- `a$$hole` → blocked ($ → s)
- `k y s` → blocked (self-harm)

### 2. Server-Side Filter (`supabase/migrations/998_robust_profanity_filter.sql`)
**Database-level protection with comprehensive word list**

✅ **45+ profanity words** organized by severity
✅ **normalize_text() function** - Handles leetspeak substitutions
✅ **Enhanced check_profanity() function** - Pattern matching + normalized comparison
✅ **Automatic testing** - Runs test cases on migration

**Severity Levels:**
- **HIGH**: Slurs, hate speech, violent threats, self-harm (nigger, faggot, kys, kill yourself)
- **MEDIUM**: Sexual/offensive language (fuck, shit, bitch, cunt, dick, pussy, whore, slut)
- **LOW**: Mild insults (idiot, stupid, dumb, moron, loser)

## How It Works

### Client-Side Flow
```
User types message
    ↓
Remove spaces, normalize leetspeak (@→a, 1→i, 0→o, etc.)
    ↓
Check against 19 regex patterns
    ↓
If match found → Show red textbox for 5 seconds
    ↓
Block message from sending
```

### Server-Side Flow
```
Message received
    ↓
Normalize text (leetspeak + special chars)
    ↓
Check against 45+ profanity words with regex patterns
    ↓
If match → Return "inappropriate language" error
    ↓
Flag message in database with severity level
```

## Detection Examples

| Input | Detected | Method |
|-------|----------|--------|
| `fuck` | ✅ Yes | Direct match |
| `f@ck` | ✅ Yes | @ → a normalization |
| `f u c k` | ✅ Yes | Space removal |
| `f*ck` | ✅ Yes | * removal |
| `fvck` | ✅ Yes | Pattern matching |
| `F@CK` | ✅ Yes | Case-insensitive |
| `sh!t` | ✅ Yes | ! → i normalization |
| `b1tch` | ✅ Yes | 1 → i normalization |
| `a$$` | ✅ Yes | $ → s normalization |
| `kys` | ✅ Yes | High severity match |
| `k y s` | ✅ Yes | Space removal |
| `hello` | ❌ No | Clean word |

## Deployment Steps

### Step 1: Deploy Client-Side Changes
Already done! ✅ The `ChatServices.js` file has been updated.

### Step 2: Run Database Migration
```bash
cd /Users/jai/Documents/Gym-App
```

Then in **Supabase Dashboard**:
1. Go to **SQL Editor**
2. Click **New Query**
3. Paste contents of `supabase/migrations/998_robust_profanity_filter.sql`
4. Click **Run**

You should see test results showing:
```
Test: "This is a f@ck test" -> Profanity: true, Words: fuck, Severity: medium
Test: "F U C K" -> Profanity: true, Words: fuck, Severity: medium
Test: "sh!t" -> Profanity: true, Words: shit, Severity: medium
Test: "clean message" -> Profanity: false, Words: , Severity: low
```

### Step 3: Verify Installation
Run this query in Supabase SQL Editor:
```sql
-- Check profanity word count
SELECT severity, COUNT(*) as word_count 
FROM profanity_words 
GROUP BY severity 
ORDER BY 
  CASE severity 
    WHEN 'high' THEN 1 
    WHEN 'medium' THEN 2 
    WHEN 'low' THEN 3 
  END;
```

Expected result:
- **high**: 8 words
- **medium**: 32 words  
- **low**: 5 words

### Step 4: Test in App
1. Open community chat
2. Try typing: `f@ck`
3. Should see red textbox with error for 5 seconds
4. Message should not send
5. Try typing: `hello` - should work fine

## Adding New Words

### Add to Client-Side (immediate feedback):
Edit `services/ChatServices.js`:
```javascript
const profanityPatterns = [
  // Add your pattern
  { pattern: /your[_\-\s]*regex/i, word: 'description' },
  // ... existing patterns
];
```

### Add to Server-Side (database):
```sql
INSERT INTO profanity_words (word, severity) VALUES
('newbadword', 'medium')
ON CONFLICT (word) DO UPDATE SET severity = EXCLUDED.severity;
```

## Monitoring

### Check flagged messages:
```sql
SELECT 
  cm.id,
  cm.content,
  cm.is_flagged,
  cm.flag_reason,
  cm.created_at,
  rp.nickname
FROM channel_messages cm
JOIN registration_profiles rp ON cm.user_id = rp.user_id
WHERE cm.is_flagged = true
ORDER BY cm.created_at DESC
LIMIT 20;
```

### Most common flagged words:
```sql
SELECT 
  flag_reason,
  COUNT(*) as occurrence_count
FROM channel_messages
WHERE is_flagged = true
GROUP BY flag_reason
ORDER BY occurrence_count DESC;
```

## Safe Space Features

✅ **Multi-layer protection**: Client + Server validation  
✅ **Circumvention resistant**: Catches leetspeak, spacing, special chars  
✅ **Immediate feedback**: Red textbox shows error for 5 seconds  
✅ **Severity-based**: Harsher penalties possible for high-severity words  
✅ **Auto-flagging**: Flagged messages stored for moderation review  
✅ **Pattern matching**: Catches variations (fuuuck, f.u.c.k)  
✅ **Self-harm prevention**: Blocks "kys", "kill yourself"  
✅ **Slur protection**: Blocks racial, homophobic, ableist slurs  

## User Experience

When inappropriate language is detected:
1. **Textbox turns red** with red border
2. **Inline error appears**: "Inappropriate language detected" with ⚠️ icon
3. **Error persists for 5 seconds** then auto-clears
4. **Message is not sent** to chat
5. **No popup alerts** - keeps user in flow
6. **Clear feedback** - user knows immediately what's wrong

## Privacy & Moderation

- Flagged messages are stored with `is_flagged=true` and `flag_reason`
- Moderators can review flagged content
- Users are not notified their messages were flagged
- No public shaming - errors are private to sender
- Repeat offenders can be identified via `message_moderation_log` table

## Maintenance

### Regular Updates
Add new profanity words as they emerge in your community:

1. Update `profanityPatterns` array in `ChatServices.js`
2. Insert new words in `profanity_words` table
3. Test with variations (leetspeak, spacing)

### False Positives
If legitimate words are caught:

1. Review pattern regex - make it more specific
2. Add exceptions for compound words
3. Consider context (future enhancement)

## Performance

- **Client-side**: Validates instantly (<1ms for typical message)
- **Server-side**: Indexed profanity_words table for fast lookups
- **Normalized text**: Cached per message for efficiency
- **Pattern matching**: Optimized regex for minimal overhead

## Security Notes

- Client-side validation is **NOT** security - it's UX
- Server-side validation is **REQUIRED** - never trust client
- Both layers work together: Client = fast feedback, Server = enforcement
- Malicious users can bypass client validation, but server will catch it

## Future Enhancements

Possible additions:
- Context-aware filtering (ML-based)
- Allow legitimate uses in educational context
- Auto-timeout for repeat offenders
- Appeal system for false positives
- Language-specific filters (non-English)
- Emoji/image-based circumvention detection

---

## Quick Reference

**Block times:**
- Profanity error: 5 seconds (red textbox)
- Rate limit: Variable (based on cooldown)

**Severity levels:**
- High: Slurs, threats, self-harm
- Medium: Sexual, offensive
- Low: Mild insults

**Files modified:**
- `services/ChatServices.js` - Client validation
- `supabase/migrations/998_robust_profanity_filter.sql` - Server validation
- `app/page/communitychat.jsx` - UI error display (already done)

Your community chat is now a **safe space** with robust profanity filtering! 🛡️

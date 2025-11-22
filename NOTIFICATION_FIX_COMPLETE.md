# Notification Inbox Fix - Complete ✅

## Problem
Admin notifications were being sent successfully (push notifications worked), but users couldn't see them in their mobile app notification inbox.

## Root Cause
The `notify` Edge Function was only sending Expo push notifications (ephemeral) but wasn't creating persistent database records in `notification_logs` table that the mobile app queries to display notification history.

**Flow was:**
1. Admin creates notification → stored in `notifications` table ✅
2. Admin clicks "Send" → calls Edge Function ✅
3. Edge Function sends Expo push → works ✅
4. **Missing**: No records created in `notification_logs` ❌
5. Mobile app queries `notification_logs` → empty results ❌

## Solution Implemented

### 1. Updated Edge Function (`supabase/functions/notify/index.ts`)
**Changes:**
- Added logic to fetch ALL target user IDs (single user or broadcast)
- Creates `notification_logs` entries for each user with:
  - `user_id`: Individual user ID
  - `title`: Notification title
  - `message`: Notification message
  - `type`: Notification type (info, success, warning, error)
  - `sent_at`: Timestamp
  - `metadata`: Includes original `notification_id` and source tracking

**Code addition (lines 80-107):**
```typescript
// Create notification_logs entries for each target user (so they can see in inbox)
let loggedCount = 0;
if (targetUserIds.length > 0) {
  const notificationLogs = targetUserIds.map((uid: string) => ({
    user_id: uid,
    title: title,
    message: message,
    type: meta.type || 'info',
    sent_at: new Date().toISOString(),
    metadata: {
      notification_id: notificationId,
      sent_from: 'admin_panel'
    }
  }));

  const { data: insertedLogs, error: logError } = await adminClient
    .from('notification_logs')
    .insert(notificationLogs)
    .select('id');

  if (logError) {
    console.error('Error creating notification_logs:', logError.message);
  } else {
    loggedCount = insertedLogs?.length || 0;
  }
}
```

**Response now includes:**
```json
{
  "sent": 10,        // Number of push notifications sent
  "logged": 10,      // Number of inbox records created
  "results": [...]   // Expo API responses
}
```

### 2. Updated Admin Panel (`admin/src/pages/Notifications.jsx`)
**Changes:**
- Now passes `notification_id` to Edge Function for tracking
- Logs the response from Edge Function for debugging

**Code update (lines 251-272):**
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/notify`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    notification_id: notificationId, // NEW: Pass notification ID
    user_id: targetUserId,
    title: notification.title,
    body: notification.message,
    data: { type: notification.type }
  })
});

const result = await response.json();
console.log('Notification sent:', result); // NEW: Log response
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN PANEL                              │
│  Creates notification → notifications table (status='draft')     │
│  Clicks "Send Now" → Updates status='sent'                       │
│  Calls Edge Function: /functions/v1/notify                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EDGE FUNCTION (notify)                      │
│  1. Authenticates admin caller                                   │
│  2. Fetches target user IDs (single or all)                      │
│  3. Creates notification_logs for EACH user ✅ NEW              │
│  4. Fetches device_tokens for push                               │
│  5. Sends Expo push notifications                                │
│  Returns: { sent: N, logged: N, results: [...] }                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                 │
│  Tables:                                                         │
│  • notifications (admin creates/manages)                         │
│  • notification_logs (per-user inbox records) ✅ NOW POPULATED  │
│  • notification_reads (tracks read status)                       │
│  • notification_dismissals (tracks dismissed notifications)      │
│  • device_tokens (Expo push tokens)                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                               │
│  NotificationBar.jsx queries:                                    │
│  • notification_logs (automated, per-user) ✅ NOW HAS DATA      │
│  • notifications (manual broadcasts)                             │
│  Displays combined list with read/unread status                  │
│  Real-time subscription for new notifications                    │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema (relevant tables)

### `notification_logs` (per-user notification inbox)
```sql
CREATE TABLE notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  sent_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);
```

### `notifications` (admin-created broadcasts)
```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  target_audience text DEFAULT 'all',
  status text CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

## Mobile App Integration

The mobile app already has full support for querying `notification_logs`:

**NotificationService.js:**
- `fetchUserNotifications()`: Fetches from both `notifications` (broadcasts) and `notification_logs` (personalized)
- `getUnreadCount()`: Counts unread from both sources
- `subscribeToNotifications()`: Real-time updates for both tables
- `markAsRead()`: Marks manual notifications as read
- `dismissAllNotifications()`: Clears all notifications

**NotificationBar.jsx:**
- Displays combined list of notifications
- Shows unread badge count
- Supports mark as read, mark all read, clear all
- Real-time updates with bell animation
- Load more functionality (pagination)

## Testing Steps

1. **Admin Panel:**
   - Navigate to Notifications page
   - Create a new notification (title, message, type)
   - Click "Send Now"
   - Verify success message

2. **Edge Function (check logs):**
   - Open Supabase Dashboard → Functions → notify
   - Check logs for latest invocation
   - Should see: `logged: N` in response (N = number of users)

3. **Database:**
   ```sql
   -- Check notification_logs were created
   SELECT * FROM notification_logs 
   ORDER BY sent_at DESC 
   LIMIT 10;
   ```

4. **Mobile App:**
   - Open app and log in as a user
   - Check notification bell icon
   - Should show unread count badge
   - Click bell to open dropdown
   - Should see the sent notification
   - Click "Mark as read" or notification itself
   - Badge count should decrease

## Deployment Status
✅ Edge Function deployed: `npx supabase functions deploy notify`
✅ Admin panel updated (auto-refresh on save)
✅ No mobile app changes needed (already supports notification_logs)

## Next Steps (Optional Enhancements)
- [ ] Add notification analytics dashboard (open rate, click rate)
- [ ] Support scheduled notifications (cron job)
- [ ] Add rich media support (images, action buttons)
- [ ] Implement notification categories/channels
- [ ] Add user notification preferences (which types to receive)

---

**Fixed:** December 2024
**Files Changed:**
- `/supabase/functions/notify/index.ts` (Edge Function)
- `/admin/src/pages/Notifications.jsx` (Admin Panel)

**Result:** Users can now see admin notifications in their mobile app inbox! 🎉

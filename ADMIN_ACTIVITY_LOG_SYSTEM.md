# Admin Activity Log System

## Overview
The admin dashboard now tracks comprehensive activity across the platform, displaying everything from user registrations to admin actions in the **Recent Activity** section.

---

## 📋 What's Tracked

### **Automated System Events**
- ✅ **New User Registrations** - Shows nickname when users join the platform
- ✅ **Workout Completions** - User workout activity (kept for engagement metrics)

### **Admin Actions**
- ✅ **Featured Content Shuffled** - When admin manually shuffles content display order
- ✅ **Notifications Launched** - When admin sends/resends notifications (shows notification title)
- ✅ **Announcements Posted** - When admin posts to announcements channel
- ✅ **Messages Deleted** - When admin deletes community chat messages (moderation)

### **Future Extensions** (easy to add)
- User bans/unbans
- Subscription changes
- Badge awards
- Content approvals
- System configuration changes

---

## 🗄️ Database Structure

### **Table: `admin_activity_log`**
```sql
id                UUID PRIMARY KEY
activity_type     TEXT              -- Specific action (e.g., 'content_shuffled', 'notification_sent')
activity_category TEXT              -- Category ('admin', 'system', 'user', 'content', 'moderation')
title             TEXT              -- Brief title shown in dashboard
description       TEXT              -- Detailed description
metadata          JSONB             -- Additional data (IDs, names, previews, etc.)
actor_id          UUID              -- Admin who performed the action (NULL for system events)
target_id         UUID              -- Affected entity ID (user, notification, content, etc.)
target_type       TEXT              -- Type of target entity
created_at        TIMESTAMPTZ       -- Timestamp
```

### **Helper Function**
```sql
log_admin_activity(
  p_activity_type,      -- e.g., 'content_shuffled'
  p_activity_category,  -- e.g., 'content'
  p_title,              -- e.g., 'Featured Content Shuffled'
  p_description,        -- Optional detailed description
  p_metadata,           -- Optional JSONB data
  p_actor_id,           -- Optional (defaults to current user)
  p_target_id,          -- Optional
  p_target_type         -- Optional
)
```

---

## 🎨 Visual Design

### **Activity Types & Icons**
| Activity Type | Icon | Color | Border |
|---------------|------|-------|--------|
| User Registration | UserPlus | Green | Green |
| Workout Completed | Dumbbell | Orange | Orange |
| Content Shuffled | Shuffle | Purple | Purple |
| Notification Sent | Bell | Blue | Blue |
| Announcement Posted | Megaphone | Orange | Orange |
| Message Deleted | Trash2 | Red | Red |
| User Banned | Shield | Red | Red |

### **Dashboard Display**
- Shows **10 most recent activities** across all types
- Activities sorted by timestamp (newest first)
- Displays:
  - Icon (based on activity type)
  - Title (e.g., "Featured Content Shuffled")
  - Description/Action
  - Metadata (e.g., notification title, nickname, content preview)
  - Time ago (e.g., "5m ago", "2h ago", "Just now")

---

## 🔧 Implementation Examples

### **1. Featured Content Shuffle**
**File:** `admin/src/pages/FeaturedContent.jsx`
```javascript
// After successful shuffle
await supabase.rpc('log_admin_activity', {
  p_activity_type: 'content_shuffled',
  p_activity_category: 'content',
  p_title: 'Featured Content Shuffled',
  p_description: 'Admin manually shuffled featured content display order',
  p_metadata: {
    shuffle_count: data?.length || 0,
    timestamp: new Date().toISOString()
  }
});
```

**Dashboard Shows:**
```
🔀 Featured Content Shuffled
Admin manually shuffled featured content display order
2m ago
```

---

### **2. Notification Sent**
**File:** `admin/src/pages/Notifications.jsx`
```javascript
// After sending notification
await supabase.rpc('log_admin_activity', {
  p_activity_type: 'notification_launched',
  p_activity_category: 'admin',
  p_title: 'Notification Sent',
  p_description: `Sent notification: "${notification.title}"`,
  p_metadata: {
    notification_id: notificationId,
    notification_title: notification.title,
    target_audience: notification.target_audience,
    notification_type: notification.type
  },
  p_target_id: notificationId,
  p_target_type: 'notification'
});
```

**Dashboard Shows:**
```
🔔 Notification Sent
Sent notification: "Weekly Workout Challenge!"
"Weekly Workout Challenge!"
15m ago
```

---

### **3. Announcement Posted**
**File:** `admin/src/pages/ChatMonitoring.jsx`
```javascript
// When posting to announcements channel
await supabase.rpc('log_admin_activity', {
  p_activity_type: 'announcement_posted',
  p_activity_category: 'admin',
  p_title: 'Announcement Posted',
  p_description: 'Admin posted an announcement to the community',
  p_metadata: {
    channel_id: activeTab,
    content_preview: newMessage.trim().substring(0, 100)
  }
});
```

**Dashboard Shows:**
```
📢 Announcement Posted
Admin posted an announcement to the community
in announcements
Just now
```

---

### **4. New User Registration (Automatic)**
**Trigger:** Automatically fires when new user registers
**File:** `supabase/migrations/1000_admin_activity_log.sql`

**Dashboard Shows:**
```
➕ New User Registered
A new user joined the platform: JohnDoe123
JohnDoe123
5m ago
```

---

### **5. Message Deleted (Automatic)**
**Trigger:** Automatically fires when admin deletes a message
**File:** `supabase/migrations/1000_admin_activity_log.sql`

**Dashboard Shows:**
```
🗑️ Message Deleted
Admin deleted a message in 💬 General
in general
10m ago
```

---

## 🚀 Adding New Activity Types

To track a new activity type:

### **1. In Your Admin Page:**
```javascript
await supabase.rpc('log_admin_activity', {
  p_activity_type: 'your_activity_type',      // e.g., 'user_banned'
  p_activity_category: 'moderation',          // Pick: admin/system/user/content/moderation
  p_title: 'User Banned',                     // Short title
  p_description: `Banned user: ${username}`,  // Details
  p_metadata: {                               // Any extra data
    user_id: userId,
    reason: banReason,
    duration: banDuration
  },
  p_target_id: userId,                        // Optional: affected entity ID
  p_target_type: 'user'                       // Optional: entity type
});
```

### **2. Update Icon Mapping (Optional):**
**File:** `admin/src/components/dashboard/RecentActivityCard.jsx`
```javascript
case 'user_banned':
  return <Shield className="h-5 w-5 text-red-600" />;
```

### **3. Update Color Mapping (Optional):**
```javascript
case 'user_banned':
  return 'border-red-500';
```

---

## 📊 Benefits

1. **Real-Time Visibility** - See all platform activity at a glance
2. **Admin Accountability** - Track who did what and when
3. **User Growth Monitoring** - See new users joining with their nicknames
4. **Moderation Tracking** - Track deleted messages and moderation actions
5. **Content Management** - Know when content was shuffled or updated
6. **Notification Tracking** - See which notifications were sent and when
7. **Audit Trail** - Complete history of admin actions for compliance

---

## 🔒 Security

- **RLS Enabled** - Only admins can view activity logs
- **SECURITY DEFINER** - Functions run with elevated permissions for system events
- **Automatic Triggers** - User registrations and message deletions logged automatically
- **Admin-Only Access** - Dashboard protected by admin authentication

---

## 📝 Deployment Checklist

- [x] Create migration file: `1000_admin_activity_log.sql`
- [x] Update Dashboard to fetch admin activities
- [x] Update RecentActivityCard with new icons and colors
- [x] Add logging to FeaturedContent shuffle
- [x] Add logging to Notifications send
- [x] Add logging to ChatMonitoring announcements
- [x] Automatic triggers for user registrations
- [x] Automatic triggers for message deletions
- [ ] **Run migration in Supabase SQL Editor**
- [ ] Test each activity type in admin panel
- [ ] Verify dashboard displays activities correctly

---

## 🎯 Next Steps

1. **Deploy Migration**: Run `1000_admin_activity_log.sql` in Supabase SQL Editor
2. **Test Activities**:
   - Register a new user → Check dashboard
   - Shuffle content → Check dashboard
   - Send notification → Check dashboard
   - Post announcement → Check dashboard
   - Delete message → Check dashboard
3. **Add More Activities** (Optional):
   - User bans/unbans
   - Subscription changes
   - Content approvals
   - Badge awards

---

## 🐛 Troubleshooting

### Activity not showing in dashboard
- Check if migration was run successfully
- Verify RLS policies allow admin to read from `admin_activity_log`
- Check browser console for errors
- Verify `log_admin_activity` function exists

### Trigger not firing
- Check if trigger was created: `SELECT * FROM pg_trigger WHERE tgname LIKE '%activity%';`
- Verify trigger function exists: `\df log_*` in psql
- Check Supabase logs for trigger errors

### Icons not displaying
- Verify icon imported in `RecentActivityCard.jsx`
- Check if `activityType` is being passed correctly
- Fallback to category-based icon should work

---

## 📚 Related Files

- `supabase/migrations/1000_admin_activity_log.sql` - Database migration
- `admin/src/pages/Dashboard.jsx` - Dashboard data fetching
- `admin/src/components/dashboard/RecentActivityCard.jsx` - Activity display component
- `admin/src/pages/FeaturedContent.jsx` - Content shuffle logging
- `admin/src/pages/Notifications.jsx` - Notification send logging
- `admin/src/pages/ChatMonitoring.jsx` - Announcement logging

---

**System Status:** ✅ Ready for deployment
**Migration File:** `1000_admin_activity_log.sql`
**Last Updated:** November 5, 2025

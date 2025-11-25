# Contact Support System - Implementation Guide

## Overview
This document outlines the contact support system architecture for the Gym App. The mobile app allows users to submit support inquiries, which are stored in Supabase and can be managed through the admin dashboard.

## Database Schema

### Tables Required

#### `support_inquiries`
```sql
CREATE TABLE support_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL, -- 'account', 'billing', 'technical', 'feedback', 'other'
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES auth.users(id), -- Admin user assigned to this inquiry
  
  -- Metadata
  device_info JSONB, -- { os, app_version, device_model }
  attachments TEXT[], -- Array of file URLs if attachments are supported
  
  CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_category CHECK (category IN ('account', 'billing', 'technical', 'feedback', 'other'))
);

CREATE INDEX idx_support_user ON support_inquiries(user_id);
CREATE INDEX idx_support_status ON support_inquiries(status);
CREATE INDEX idx_support_created ON support_inquiries(created_at DESC);
```

#### `support_responses`
```sql
CREATE TABLE support_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID NOT NULL REFERENCES support_inquiries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  attachments TEXT[]
);

CREATE INDEX idx_response_inquiry ON support_responses(inquiry_id);
CREATE INDEX idx_response_created ON support_responses(created_at DESC);
```

## Mobile App Implementation

### Current Status
- ✅ Contact form UI created (`app/settings/help/contact.jsx`)
- ✅ Inquiry list UI created (`app/settings/help/my-inquiries.jsx`)
- ✅ Inquiry detail view created (`app/settings/help/inquiry-detail.jsx`)
- ✅ FAQ page created (`app/settings/help/faq.jsx`)
- ⏳ Database integration ready for testing

### User Flow
1. **Submit Inquiry**: User fills out contact form with subject, category, and message
2. **View Inquiries**: User can view all their submitted inquiries with status
3. **Track Progress**: User can see responses from admin team
4. **Receive Notifications**: User gets notified when admin responds (future enhancement)

### Key Features
- Real-time status updates
- Category-based filtering
- Device info automatically attached for technical issues
- Email notifications on status change
- Inquiry history with timestamps

## Admin Dashboard Implementation

### Required Features

#### 1. **Support Inbox** (`admin/src/pages/Support.jsx` - to be created)
- View all inquiries with filters:
  - Status (open, in progress, resolved, closed)
  - Priority (low, medium, high, urgent)
  - Category
  - Date range
- Sort by: date, priority, status
- Search by user email or inquiry ID
- Bulk actions: assign, change status, close

#### 2. **Inquiry Detail View** (`admin/src/pages/SupportDetail.jsx` - to be created)
- Full conversation thread
- User profile sidebar (subscription, account info)
- Response composer with markdown support
- Status and priority updates
- Assignment to team members
- Internal notes (not visible to user)
- Close/resolve actions

#### 3. **Analytics Dashboard**
- Response time metrics (average, median)
- Resolution time by category
- Open inquiry count by status
- Admin performance metrics
- User satisfaction ratings (future)

### Admin Workflow
1. **New Inquiry Notification**: Admin receives notification of new inquiry
2. **Triage**: Admin reviews and assigns priority/category
3. **Assignment**: Inquiry assigned to appropriate team member
4. **Response**: Admin responds to user
5. **Follow-up**: Track until resolved
6. **Resolution**: Mark as resolved with optional feedback request

## API Endpoints (Supabase RPC Functions)

### For Mobile App
```sql
-- Get user's inquiries
CREATE OR REPLACE FUNCTION get_user_inquiries(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  subject TEXT,
  category TEXT,
  status TEXT,
  priority TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  unread_responses INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.subject,
    i.category,
    i.status,
    i.priority,
    i.created_at,
    i.updated_at,
    (
      SELECT COUNT(*)::INTEGER
      FROM support_responses r
      WHERE r.inquiry_id = i.id
        AND r.is_admin = TRUE
        AND r.created_at > COALESCE(i.last_user_read, i.created_at)
    ) as unread_responses
  FROM support_inquiries i
  WHERE i.user_id = p_user_id
  ORDER BY i.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### For Admin Dashboard
```sql
-- Get all inquiries with user info
CREATE OR REPLACE FUNCTION get_all_inquiries(
  p_status TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  subject TEXT,
  category TEXT,
  status TEXT,
  priority TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  response_count INTEGER,
  assigned_to_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.user_id,
    u.email as user_email,
    COALESCE(p.nickname, p.full_name, u.email) as user_name,
    i.subject,
    i.category,
    i.status,
    i.priority,
    i.created_at,
    i.updated_at,
    (SELECT COUNT(*)::INTEGER FROM support_responses WHERE inquiry_id = i.id) as response_count,
    COALESCE(admin_p.nickname, admin_p.full_name, admin_u.email) as assigned_to_name
  FROM support_inquiries i
  LEFT JOIN auth.users u ON u.id = i.user_id
  LEFT JOIN profiles p ON p.id = i.user_id
  LEFT JOIN auth.users admin_u ON admin_u.id = i.assigned_to
  LEFT JOIN profiles admin_p ON admin_p.id = i.assigned_to
  WHERE 
    (p_status IS NULL OR i.status = p_status) AND
    (p_category IS NULL OR i.category = p_category)
  ORDER BY 
    CASE i.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    i.updated_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Security & Permissions

### Row Level Security (RLS)
```sql
-- Users can only see their own inquiries
ALTER TABLE support_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inquiries"
  ON support_inquiries FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can insert own inquiries"
  ON support_inquiries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can update inquiries
CREATE POLICY "Admins can update inquiries"
  ON support_inquiries FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Responses
ALTER TABLE support_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses to their inquiries"
  ON support_responses FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM support_inquiries WHERE id = inquiry_id
    ) OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users and admins can insert responses"
  ON support_responses FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    auth.jwt() ->> 'role' = 'admin'
  );
```

## Notification System Integration

### Email Notifications
- New inquiry submitted → Notify admin team
- Admin responds → Notify user via email
- Status changed to resolved → Notify user
- Inquiry auto-closed after 30 days of inactivity

### In-App Notifications
- Use existing `NotificationService` to create notifications when:
  - Admin responds to inquiry
  - Inquiry status changes
  - Inquiry is resolved

Example:
```javascript
await NotificationService.createNotification({
  user_id: inquiry.user_id,
  type: 'support_response',
  title: 'Support Team Responded',
  message: `We've responded to your inquiry: "${inquiry.subject}"`,
  data: { inquiry_id: inquiry.id },
  source: 'manual'
});
```

## Future Enhancements
1. **File Attachments**: Allow users to upload screenshots/logs
2. **Live Chat**: Real-time chat support during business hours
3. **AI Assistant**: Suggest FAQ articles based on inquiry content
4. **Satisfaction Ratings**: Request feedback after resolution
5. **Knowledge Base**: Searchable help articles
6. **Canned Responses**: Template responses for common issues
7. **SLA Tracking**: Monitor response/resolution times
8. **Multi-language Support**: Translate inquiries/responses

## Testing Checklist
- [ ] User can submit inquiry with all fields
- [ ] User can view list of their inquiries
- [ ] User can view inquiry details and responses
- [ ] Status updates reflect in real-time
- [ ] Email notifications sent correctly
- [ ] Admin can view all inquiries
- [ ] Admin can respond to inquiries
- [ ] Admin can change status/priority
- [ ] Admin can assign inquiries
- [ ] Permissions enforced (users can't see other users' inquiries)
- [ ] Database indexes optimized for performance
- [ ] Error handling for network failures

## Deployment Steps
1. Run database migrations to create tables
2. Apply RLS policies
3. Create RPC functions
4. Test mobile app functionality
5. Deploy admin dashboard pages
6. Configure email notifications
7. Test end-to-end workflow
8. Monitor for 24 hours
9. Gather initial feedback
10. Iterate based on usage patterns

## Support
For questions about this implementation, contact the development team or refer to the Supabase documentation for RLS and RPC functions.

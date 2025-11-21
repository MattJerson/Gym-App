// Community Manager Permission Configuration
// Defines what each role can do in the admin dashboard

export const ROLE_PERMISSIONS = {
  admin: {
    // Full access to everything
    dashboard: { view: true, edit: true, delete: true },
    meals: { view: true, create: true, edit: true, delete: true, assign: true },
    workouts: { view: true, create: true, edit: true, delete: true, assign: true },
    featured_content: { view: true, create: true, edit: true, delete: true, toggle_active: true },
    notifications: { view: true, create: true, edit: true, delete: true, send: true },
    community_chat: { view: true, create: true, edit: true, delete: true, moderate: true, all_channels: true },
    subscriptions: { view: true, create: true, edit: true, delete: true },
    users: { view: true, create: true, edit: true, delete: true, suspend: true },
    reports: { view: true },
    analytics: { view: true },
    leadership: { view: true, create_challenge: true, edit_challenge: true, delete_challenge: true, switch_challenge: true, edit_badges: true, delete_badges: true },
  },
  
  community_manager: {
    // Limited access as specified
    dashboard: { view: true, edit: false, delete: false }, // View only, can't do anything
    meals: { view: true, create: true, edit: true, delete: true, assign: true }, // Same as admin
    workouts: { view: true, create: true, edit: true, delete: true, assign: true }, // Same as admin
    featured_content: { view: true, create: true, edit: true, delete: false, toggle_active: true }, // Can't delete
    notifications: { view: true, create: true, edit: false, delete: false, send: true }, // Can create and push, not delete
    community_chat: { view: true, create: true, edit: false, delete: false, moderate: false, all_channels: false }, // Only general chat
    subscriptions: { view: true, create: false, edit: false, delete: false }, // View only
    users: { view: true, create: false, edit: false, delete: false, suspend: true }, // View and suspend only
    reports: { view: true }, // Same as admin (nothing to do)
    analytics: { view: true }, // Same as admin (nothing to do)
    leadership: { view: true, create_challenge: true, edit_challenge: false, delete_challenge: false, switch_challenge: true, edit_badges: false, delete_badges: false }, // Can create and switch challenges, can't edit/delete badges
  },
  
  user: {
    // No admin access
    dashboard: { view: false, edit: false, delete: false },
    meals: { view: false, create: false, edit: false, delete: false, assign: false },
    workouts: { view: false, create: false, edit: false, delete: false, assign: false },
    featured_content: { view: false, create: false, edit: false, delete: false, toggle_active: false },
    notifications: { view: false, create: false, edit: false, delete: false, send: false },
    community_chat: { view: false, create: false, edit: false, delete: false, moderate: false, all_channels: false },
    subscriptions: { view: false, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false, suspend: false },
    reports: { view: false },
    analytics: { view: false },
    leadership: { view: false, create_challenge: false, edit_challenge: false, delete_challenge: false, switch_challenge: false, edit_badges: false, delete_badges: false },
  },
};

// Helper function to check if user has permission
export const hasPermission = (role, section, action) => {
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
  const sectionPerms = permissions[section];
  
  if (!sectionPerms) return false;
  return sectionPerms[action] === true;
};

// Helper to get all permissions for a role and section
export const getSectionPermissions = (role, section) => {
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
  return permissions[section] || {};
};

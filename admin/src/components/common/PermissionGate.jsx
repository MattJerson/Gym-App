import React from 'react';
import { useUserRole } from '../../middleware/adminAuth';

/**
 * Permission-based component wrapper
 * Shows content only if user has required permission
 * 
 * @param {string} permission - Required permission ('create_workouts', 'edit_workouts', etc.)
 * @param {ReactNode} children - Content to show if permission granted
 * @param {ReactNode} fallback - Content to show if permission denied (optional)
 */
export const PermissionGate = ({ permission, children, fallback = null }) => {
  const { role, loading } = useUserRole();
  
  if (loading) {
    return null;
  }
  
  const permissions = {
    admin: ['all'],
    community_manager: [
      'view_all',
      'create_workouts',
      'edit_own_workouts',
      'assign_workouts',
      'create_meals',
      'edit_own_meals',
      'assign_meals',
      'create_featured_content',
      'edit_own_featured_content',
      'view_chat',
      'moderate_chat'
    ],
    user: ['view_own']
  };
  
  const userPermissions = permissions[role] || [];
  const hasPermission = userPermissions.includes('all') || userPermissions.includes(permission);
  
  return hasPermission ? children : fallback;
};

/**
 * Badge component to show user's role
 */
export const RoleBadge = () => {
  const { role, loading } = useUserRole();
  
  if (loading || !role) {
    return null;
  }
  
  const roleConfig = {
    admin: {
      label: 'Admin',
      className: 'bg-red-100 text-red-800 border-red-300'
    },
    community_manager: {
      label: 'Community Manager',
      className: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    user: {
      label: 'User',
      className: 'bg-gray-100 text-gray-800 border-gray-300'
    }
  };
  
  const config = roleConfig[role] || roleConfig.user;
  
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${config.className}`}>
      {config.label}
    </span>
  );
};

/**
 * HOC to add role-based rendering
 */
export const withPermission = (Component, requiredPermission) => {
  return (props) => {
    return (
      <PermissionGate permission={requiredPermission}>
        <Component {...props} />
      </PermissionGate>
    );
  };
};

/**
 * Hook to check specific permissions
 */
export const usePermission = (permission) => {
  const { role, loading } = useUserRole();
  
  const permissions = {
    admin: ['all'],
    community_manager: [
      'view_all',
      'create_workouts',
      'edit_own_workouts',
      'assign_workouts',
      'create_meals',
      'edit_own_meals',
      'assign_meals',
      'create_featured_content',
      'edit_own_featured_content',
      'view_chat',
      'moderate_chat'
    ],
    user: ['view_own']
  };
  
  const userPermissions = permissions[role] || [];
  const hasPermission = !loading && (userPermissions.includes('all') || userPermissions.includes(permission));
  
  return { hasPermission, loading, role };
};

export default PermissionGate;

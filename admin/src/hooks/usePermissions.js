import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { hasPermission as checkPermission, getSectionPermissions } from '../lib/permissions';

/**
 * Hook to get current user's role and check permissions
 */
export const usePermissions = () => {
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setRole('user');
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Fetch role from registration_profiles
      const { data: profile, error } = await supabase
        .from('registration_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching role:', error);
        setRole('user');
      } else {
        setRole(profile?.role || 'user');
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      setRole('user');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if current user has permission for a specific action
   * @param {string} section - Section name (e.g., 'meals', 'workouts')
   * @param {string} action - Action name (e.g., 'edit', 'delete', 'create')
   * @returns {boolean}
   */
  const hasPermission = (section, action) => {
    return checkPermission(role, section, action);
  };

  /**
   * Get all permissions for a specific section
   * @param {string} section - Section name
   * @returns {object} - Object with permission flags
   */
  const getPermissions = (section) => {
    return getSectionPermissions(role, section);
  };

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  const isAdmin = () => {
    return role === 'admin';
  };

  /**
   * Check if user is community manager
   * @returns {boolean}
   */
  const isCommunityManager = () => {
    return role === 'community_manager';
  };

  /**
   * Check if user has any admin access (admin or community manager)
   * @returns {boolean}
   */
  const hasAdminAccess = () => {
    return role === 'admin' || role === 'community_manager';
  };

  return {
    role,
    userId,
    loading,
    hasPermission,
    getPermissions,
    isAdmin: isAdmin(),
    isCommunityManager: isCommunityManager(),
    hasAdminAccess: hasAdminAccess(),
  };
};

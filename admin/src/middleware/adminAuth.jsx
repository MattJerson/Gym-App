import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, checkAdminRole, checkCommunityManagerRole, getUserRole } from '../lib/supabase';

/**
 * Admin route protection middleware
 * Redirects to login if not authenticated or not admin/manager
 * NOTE: This now allows both admins AND community managers
 */
export const requireAdmin = async (navigate) => {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('[Auth] No session found, redirecting to login');
      navigate('/login');
      return false;
    }
    
    // Check if user is admin OR community manager (both have access)
    const isManagerOrAdmin = await checkCommunityManagerRole();
    
    if (!isManagerOrAdmin) {
      console.log('[Auth] User is not admin or community manager, redirecting to login');
      navigate('/login');
      return false;
    }
    
    console.log('[Auth] Access granted');
    return true;
    
  } catch (error) {
    console.error('[Auth] Admin auth failed:', error);
    navigate('/login');
    return false;
  }
};

/**
 * Community Manager route protection middleware
 * Allows both admins and community managers
 */
export const requireManagerOrAdmin = async (navigate) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/login');
      return false;
    }
    
    const isManager = await checkCommunityManagerRole();
    
    if (!isManager) {
      navigate('/login');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Manager auth failed:', error);
    navigate('/login');
    return false;
  }
};

/**
 * Higher-order component for protected admin routes
 */
export const withAdminAuth = (Component) => {
  return (props) => {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
      const checkAuth = async () => {
        const authorized = await requireAdmin(navigate);
        setIsAuthorized(authorized);
        setLoading(false);
      };
      
      checkAuth();
    }, [navigate]);
    
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '18px',
          color: '#666'
        }}>
          Verifying admin access...
        </div>
      );
    }
    
    if (!isAuthorized) {
      return null;
    }
    
    return <Component {...props} />;
  };
};

/**
 * Higher-order component for community manager routes
 * Allows both admins and community managers
 */
export const withManagerAuth = (Component) => {
  return (props) => {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [userRole, setUserRole] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
      const checkAuth = async () => {
        const authorized = await requireManagerOrAdmin(navigate);
        if (authorized) {
          const role = await getUserRole();
          setUserRole(role);
        }
        setIsAuthorized(authorized);
        setLoading(false);
      };
      
      checkAuth();
    }, [navigate]);
    
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '18px',
          color: '#666'
        }}>
          Verifying access...
        </div>
      );
    }
    
    if (!isAuthorized) {
      return null;
    }
    
    return <Component {...props} userRole={userRole} />;
  };
};

/**
 * React hook to get current user's role
 */
export const useUserRole = () => {
  const [role, setRole] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchRole = async () => {
      const userRole = await getUserRole();
      setRole(userRole);
      setLoading(false);
    };
    
    fetchRole();
  }, []);
  
  return { role, loading, isAdmin: role === 'admin', isManager: role === 'community_manager' || role === 'admin' };
};

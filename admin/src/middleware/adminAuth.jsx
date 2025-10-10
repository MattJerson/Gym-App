import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, checkAdminRole } from '../lib/supabase';

/**
 * Admin route protection middleware
 * Redirects to login if not authenticated or not admin
 */
export const requireAdmin = async (navigate) => {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/login');
      return false;
    }
    
    // Check if user is admin
    const isAdmin = await checkAdminRole();
    
    if (!isAdmin) {
      navigate('/login');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Admin auth failed:', error);
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

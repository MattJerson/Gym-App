import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Attempting login with:', email);
      
      // Sign in with Supabase
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('❌ Auth sign-in failed:', signInError);
        throw signInError;
      }

      console.log('✅ Auth successful, user:', user?.id);

      // Check if user is admin
      console.log('🔍 Checking admin status for user:', user.id);
      const { data: profile, error: profileError } = await supabase
        .from('registration_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      console.log('📋 Profile query result:', { profile, profileError });

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        await supabase.auth.signOut();
        throw new Error(`Profile Error: ${profileError.message} (Code: ${profileError.code})`);
      }

      if (!profile?.is_admin) {
        console.error('❌ User is not admin:', profile);
        await supabase.auth.signOut();
        throw new Error('Unauthorized: Admin access required');
      }

      console.log('✅ Admin verified, redirecting to dashboard');
      // Success - redirect to dashboard
      navigate('/dashboard');
      
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🔐 Admin Portal</h1>
          <p>Gym App Administration</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Verifying...
              </>
            ) : (
              'Login to Admin Panel'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>🔒 Secure admin-only access</p>
        </div>
      </div>
    </div>
  );
}

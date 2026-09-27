// -------------------------------------------------------------
// SHADOW ASCENSION - PROTECTED ADMIN ROUTE GUARD
// Strictly ensures authenticated session with role === 'admin'.
// Redirects unauthorized users to /user/dashboard or /login.
// -------------------------------------------------------------

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCustomAuth } from '../context/CustomAuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const ProtectedAdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useCustomAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#07070b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e2e8f0',
          gap: 16
        }}
      >
        <Loader2 className="animate-spin" size={36} color="#ef4444" />
        <div style={{ letterSpacing: '2px', fontSize: 13, textTransform: 'uppercase', color: '#94a3b8' }}>
          Verifying Overseer Clearance...
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in as regular user -> Access Denied (cannot access Admin Portal)
  if (!isAdmin) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: '#07070b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          color: '#f8fafc'
        }}
      >
        <div
          className="glass-panel"
          style={{
            maxWidth: 480,
            padding: 36,
            borderRadius: 12,
            border: '1px solid rgba(239, 68, 68, 0.4)',
            textAlign: 'center',
            boxShadow: '0 0 40px rgba(239, 68, 68, 0.2)'
          }}
        >
          <div style={{ display: 'inline-flex', padding: 16, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', marginBottom: 16 }}>
            <ShieldAlert size={48} color="#ef4444" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 24, margin: '0 0 10px 0', color: '#f87171' }}>
            403 - ACCESS DENIED
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Hunter <strong style={{ color: '#f1f5f9' }}>{user.displayName}</strong>, your account lacks Overseer administrative privileges.
          </p>
          <a
            href="/user/dashboard"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              borderRadius: 6,
              fontWeight: 700,
              letterSpacing: '1px',
              textDecoration: 'none'
            }}
          >
            RETURN TO HUNTER DASHBOARD
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedAdminRoute;

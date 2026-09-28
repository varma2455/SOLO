// -------------------------------------------------------------
// SHADOW ASCENSION - PROTECTED ROUTE GUARD
// Requires an active Firebase Authentication session.
// Redirects unauthenticated visitors to /login.
// -------------------------------------------------------------

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading && !user) {
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
        <Loader2 className="animate-spin" size={36} color="#a855f7" />
        <div style={{ letterSpacing: '2px', fontSize: 13, textTransform: 'uppercase', color: '#c084fc', fontWeight: 700 }}>
          AUTHENTICATING...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

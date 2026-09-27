// -------------------------------------------------------------
// SHADOW ASCENSION - PROTECTED USER ROUTE GUARD
// Requires an active authenticated session.
// Redirects unauthenticated users to /login.
// -------------------------------------------------------------

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCustomAuth } from '../context/CustomAuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedUserRoute = ({ children }) => {
  const { user, loading } = useCustomAuth();
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
        <Loader2 className="animate-spin" size={36} color="#38bdf8" />
        <div style={{ letterSpacing: '2px', fontSize: 13, textTransform: 'uppercase', color: '#94a3b8' }}>
          Awakening Hunter Session...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedUserRoute;

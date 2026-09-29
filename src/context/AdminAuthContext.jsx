// -------------------------------------------------------------
// SHADOW ASCENSION - ADMIN AUTHENTICATION CONTEXT ADAPTER
// Bridges to centralized AuthContext.jsx to enforce single-source-of-truth
// authentication while maintaining backward compatibility.
// -------------------------------------------------------------

import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

export const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  return <>{children}</>;
};

export const useAdminAuth = () => {
  const { user, isAdmin, loading, login, logout } = useAuth();
  return {
    adminUser: user,
    isAdmin,
    authLoading: loading,
    loginAdmin: login,
    logoutAdmin: logout
  };
};

export default useAdminAuth;

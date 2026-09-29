// -------------------------------------------------------------
// SHADOW ASCENSION - SHARED AUTHENTICATION ROUTE
// There is strictly ONE shared login page (/login) for both normal
// users and administrators. This module redirects any legacy
// references to the unified /login endpoint.
// -------------------------------------------------------------

import React from 'react';
import { Navigate } from 'react-router-dom';

export const AdminLoginPage = () => {
  return <Navigate to="/login" replace />;
};

export default AdminLoginPage;

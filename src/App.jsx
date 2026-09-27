// -------------------------------------------------------------
// SHADOW ASCENSION - MAIN APPLICATION ROUTING
// Custom Authentication with Admin & User Role Isolation
// -------------------------------------------------------------

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomAuthProvider } from './context/CustomAuthContext';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import { ProtectedUserRoute } from './components/ProtectedUserRoute';

import { HomePage } from './pages/HomePage';
import { UnifiedLoginPage } from './pages/UnifiedLoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { GameRoute } from './pages/GameRoute';
import { AdminControlCenter } from './pages/AdminControlCenter';
import { AdminUserProfile } from './pages/admin/AdminUserProfile';

import { UserDashboard } from './pages/user/UserDashboard';
import { UserProfile } from './pages/user/UserProfile';
import { UserShadows } from './pages/user/UserShadows';
import { UserInventory } from './pages/user/UserInventory';
import { UserQuests } from './pages/user/UserQuests';
import { UserSettings } from './pages/user/UserSettings';

export const App = () => {
  return (
    <CustomAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Authentication Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<UnifiedLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/login" replace />} />

          {/* Protected Administrator Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <Navigate to="/admin/dashboard" replace />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/users/:userId"
            element={
              <ProtectedAdminRoute>
                <AdminUserProfile />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/:tab"
            element={
              <ProtectedAdminRoute>
                <AdminControlCenter />
              </ProtectedAdminRoute>
            }
          />

          {/* Protected Hunter/User Routes */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedUserRoute>
                <UserDashboard />
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/user/game"
            element={
              <ProtectedUserRoute>
                <GameRoute />
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/user/profile"
            element={
              <ProtectedUserRoute>
                <UserProfile />
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/user/shadows"
            element={
              <ProtectedUserRoute>
                <UserShadows />
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/user/inventory"
            element={
              <ProtectedUserRoute>
                <UserInventory />
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/user/quests"
            element={
              <ProtectedUserRoute>
                <UserQuests />
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/user/settings"
            element={
              <ProtectedUserRoute>
                <UserSettings />
              </ProtectedUserRoute>
            }
          />

          {/* Direct game access mapping */}
          <Route path="/game" element={<GameRoute />} />
          <Route path="/profile" element={<Navigate to="/user/profile" replace />} />

          {/* Catch-all Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CustomAuthProvider>
  );
};

export default App;

// -------------------------------------------------------------
// SHADOW ASCENSION - MAIN APPLICATION ROUTING
// Unified Authentication & Strict Role-Based Protected Routes
// -------------------------------------------------------------

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminRoute } from './routes/AdminRoute';
import { UserRoute } from './routes/UserRoute';

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
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Authentication Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<UnifiedLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Explicitly disallow separate admin login: redirect to unified /login */}
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/login" replace />} />

          {/* Protected Administrator Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Navigate to="/admin/dashboard" replace />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminControlCenter />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminControlCenter />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users/:userId"
            element={
              <AdminRoute>
                <AdminUserProfile />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/monsters"
            element={
              <AdminRoute>
                <AdminControlCenter />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/shadows"
            element={
              <AdminRoute>
                <AdminControlCenter />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/quests"
            element={
              <AdminRoute>
                <AdminControlCenter />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/dungeons"
            element={
              <AdminRoute>
                <AdminControlCenter />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <AdminControlCenter />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/statistics"
            element={
              <AdminRoute>
                <AdminControlCenter />
              </AdminRoute>
            }
          />
          {/* Admin tab catch-all */}
          <Route
            path="/admin/:tab"
            element={
              <AdminRoute>
                <AdminControlCenter />
              </AdminRoute>
            }
          />

          {/* Protected Hunter/User Routes */}
          <Route
            path="/user"
            element={
              <UserRoute>
                <Navigate to="/user/dashboard" replace />
              </UserRoute>
            }
          />
          <Route
            path="/user/dashboard"
            element={
              <UserRoute>
                <UserDashboard />
              </UserRoute>
            }
          />
          <Route
            path="/user/game"
            element={
              <UserRoute>
                <GameRoute />
              </UserRoute>
            }
          />
          <Route
            path="/user/profile"
            element={
              <UserRoute>
                <UserProfile />
              </UserRoute>
            }
          />
          <Route
            path="/user/shadows"
            element={
              <UserRoute>
                <UserShadows />
              </UserRoute>
            }
          />
          <Route
            path="/user/inventory"
            element={
              <UserRoute>
                <UserInventory />
              </UserRoute>
            }
          />
          <Route
            path="/user/quests"
            element={
              <UserRoute>
                <UserQuests />
              </UserRoute>
            }
          />
          <Route
            path="/user/settings"
            element={
              <UserRoute>
                <UserSettings />
              </UserRoute>
            }
          />

          {/* Direct game & profile access aliases */}
          <Route path="/game" element={<GameRoute />} />
          <Route path="/profile" element={<Navigate to="/user/profile" replace />} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

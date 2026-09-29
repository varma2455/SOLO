// -------------------------------------------------------------
// SHADOW ASCENSION - MAIN APPLICATION ROUTING
// Unified Authentication & Strict Role-Based Protected Routes
// Multi-Page Admin Portal with Dedicated Nested Routes
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

// Admin Modular Layout & Dedicated Page Components
import { AdminLayout } from './admin/AdminLayout';
import { AdminDashboard } from './admin/pages/AdminDashboard';
import { AdminUsers } from './admin/pages/AdminUsers';
import { AdminUserDetails } from './admin/pages/AdminUserDetails';
import { AdminMonsters } from './admin/pages/AdminMonsters';
import { AdminShadows } from './admin/pages/AdminShadows';
import { AdminQuests } from './admin/pages/AdminQuests';
import { AdminDungeons } from './admin/pages/AdminDungeons';
import { AdminStatistics } from './admin/pages/AdminStatistics';
import { AdminSettings } from './admin/pages/AdminSettings';

// Hunter User Pages
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

          {/* Protected Multi-Page Overseer Admin Portal */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:userId" element={<AdminUserDetails />} />
            <Route path="monsters" element={<AdminMonsters />} />
            <Route path="shadows" element={<AdminShadows />} />
            <Route path="quests" element={<AdminQuests />} />
            <Route path="dungeons" element={<AdminDungeons />} />
            <Route path="statistics" element={<AdminStatistics />} />
            <Route path="settings" element={<AdminSettings />} />
            {/* Admin catch-all: redirects unknown admin sub-routes to dashboard */}
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>

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

          {/* Global Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

// -------------------------------------------------------------
// SHADOW ASCENSION - USER PORTAL NAVIGATION
// -------------------------------------------------------------

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCustomAuth } from '../../context/CustomAuthContext';
import {
  Shield,
  LayoutDashboard,
  User,
  Ghost,
  Backpack,
  Scroll,
  Settings,
  LogOut,
  Swords
} from 'lucide-react';

export const UserNav = () => {
  const { user, logout } = useCustomAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { label: 'DASHBOARD', path: '/user/dashboard', icon: LayoutDashboard },
    { label: 'PLAY GAME', path: '/user/game', icon: Swords, highlight: true },
    { label: 'PROFILE', path: '/user/profile', icon: User },
    { label: 'SHADOWS', path: '/user/shadows', icon: Ghost },
    { label: 'INVENTORY', path: '/user/inventory', icon: Backpack },
    { label: 'QUESTS', path: '/user/quests', icon: Scroll },
    { label: 'SETTINGS', path: '/user/settings', icon: Settings },
  ];

  return (
    <nav
      style={{
        backgroundColor: '#0a0a14',
        borderBottom: '1px solid rgba(168, 85, 247, 0.25)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      {/* Brand / Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(59, 130, 246, 0.3))',
            border: '1.5px solid #a855f7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Shield size={18} color="#c084fc" />
        </div>
        <Link
          to="/user/dashboard"
          style={{
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontWeight: 900,
              fontSize: 16,
              color: '#f8fafc',
              letterSpacing: '1.5px'
            }}
          >
            SHADOW ASCENSION
          </span>
          <span
            style={{
              fontSize: 9,
              letterSpacing: '2px',
              color: '#a855f7',
              fontWeight: 800
            }}
          >
            HUNTER PORTAL
          </span>
        </Link>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '1px',
                textDecoration: 'none',
                transition: 'all 0.2s',
                backgroundColor: item.highlight
                  ? 'rgba(168, 85, 247, 0.2)'
                  : isActive
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'transparent',
                color: item.highlight
                  ? '#c084fc'
                  : isActive
                  ? '#ffffff'
                  : '#94a3b8',
                border: item.highlight
                  ? '1px solid rgba(168, 85, 247, 0.5)'
                  : isActive
                  ? '1px solid rgba(255, 255, 255, 0.15)'
                  : '1px solid transparent'
              }}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Hunter Info & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', letterSpacing: '0.8px' }}>
            {user?.displayName || 'HUNTER'}
          </div>
          <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, letterSpacing: '1px' }}>
            ● ACTIVE HUNTER
          </div>
        </div>

        <button
          id="hunter-logout-button"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 6,
            color: '#f87171',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
        >
          <LogOut size={14} />
          <span>LOGOUT</span>
        </button>
      </div>
    </nav>
  );
};

export default UserNav;

// -------------------------------------------------------------
// SHADOW ASCENSION - OVERSEER PORTAL SIDEBAR
// Multi-page navigation using React Router NavLink
// -------------------------------------------------------------

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Crown,
  LayoutDashboard,
  Users,
  Skull,
  Ghost,
  ScrollText,
  Castle,
  BarChart3,
  Sliders,
  LogOut,
  X,
  ShieldCheck
} from 'lucide-react';

const navItems = [
  { path: '/admin/dashboard', label: 'ADMIN DASHBOARD', icon: LayoutDashboard },
  { path: '/admin/users', label: 'USERS', icon: Users },
  { path: '/admin/monsters', label: 'MONSTERS', icon: Skull },
  { path: '/admin/shadows', label: 'SHADOWS', icon: Ghost },
  { path: '/admin/quests', label: 'QUESTS', icon: ScrollText },
  { path: '/admin/dungeons', label: 'DUNGEONS', icon: Castle },
  { path: '/admin/statistics', label: 'STATISTICS', icon: BarChart3 },
  { path: '/admin/settings', label: 'SETTINGS', icon: Sliders }
];

export const AdminSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
            display: 'block'
          }}
          className="admin-mobile-backdrop"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`admin-sidebar ${isOpen ? 'open' : ''}`}
        style={{
          width: 260,
          minWidth: 260,
          backgroundColor: '#0a0a14',
          borderRight: '1px solid rgba(239, 68, 68, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          overflowY: 'auto',
          overflowX: 'hidden',
          flexShrink: 0,
          zIndex: 50,
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Header / Brand */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(168, 85, 247, 0.2) 100%)',
                border: '1px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.35)'
              }}
            >
              <Crown size={22} color="#f87171" />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-cinzel, serif)',
                  fontWeight: 900,
                  fontSize: 14,
                  letterSpacing: '1px',
                  color: '#ffffff',
                  lineHeight: 1.2
                }}
              >
                SHADOW ASCENSION
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: '#f87171',
                  letterSpacing: '2.5px',
                  marginTop: 2
                }}
              >
                OVERSEER PORTAL
              </div>
            </div>
          </div>

          {/* Mobile close toggle */}
          {isOpen && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Items via React Router NavLink */}
        <nav
          style={{
            padding: '16px 12px',
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: 6,
                  border: isActive ? '1px solid #ef4444' : '1px solid transparent',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.22) 0%, rgba(239, 68, 68, 0.08) 100%)'
                    : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textDecoration: 'none',
                  boxShadow: isActive ? '0 0 12px rgba(239, 68, 68, 0.2)' : 'none',
                  transition: 'all 0.15s ease-in-out'
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      color={isActive ? '#ef4444' : '#94a3b8'}
                      style={{
                        flexShrink: 0,
                        filter: isActive ? 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' : 'none'
                      }}
                    />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Overseer Profile & Logout Footer */}
        <div
          style={{
            padding: '16px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#06060c'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <ShieldCheck size={13} color="#f87171" />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#f87171',
                letterSpacing: '1.5px',
                textTransform: 'uppercase'
              }}
            >
              OVERSEER CLEARANCE
            </span>
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#e2e8f0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: 12
            }}
            title={user?.email}
          >
            {user?.email || 'admin@shadowascension.com'}
          </div>

          <button
            id="admin-sidebar-logout-btn"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '9px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 6,
              color: '#f87171',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '1px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)')}
          >
            <LogOut size={14} /> LOGOUT
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;

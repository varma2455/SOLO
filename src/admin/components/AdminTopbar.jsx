// -------------------------------------------------------------
// SHADOW ASCENSION - OVERSEER TOPBAR
// Sticky header with mobile trigger, section indicator, status
// -------------------------------------------------------------

import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, ShieldAlert, Gamepad2, UserCheck, Activity } from 'lucide-react';

const sectionTitles = {
  dashboard: { title: 'ADMIN DASHBOARD', subtitle: 'OVERSEER CONTROL CENTER' },
  users: { title: 'USER MANAGEMENT', subtitle: 'MANAGE HUNTERS AND ADMINISTRATORS' },
  monsters: { title: 'MONSTER DATABASE', subtitle: 'MANAGE ENEMIES AND BOSSES' },
  shadows: { title: 'SHADOW ARMY', subtitle: 'MANAGE SUMMONABLE SHADOW SOLDIERS' },
  quests: { title: 'QUEST MANAGEMENT', subtitle: 'SYSTEM QUESTS AND HUNTER OBJECTIVES' },
  dungeons: { title: 'DUNGEON MANAGEMENT', subtitle: 'GATES, CRYPTS, AND ENCOUNTERS' },
  statistics: { title: 'GAME STATISTICS', subtitle: 'HUNTER ACTIVITY AND COMBAT TELEMETRY' },
  settings: { title: 'SYSTEM SETTINGS', subtitle: 'GLOBAL GAMEPLAY AND SECURITY BALANCE' }
};

export const AdminTopbar = ({ onToggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Extract current section from pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentKey = pathParts[1] || 'dashboard';
  const section = sectionTitles[currentKey] || {
    title: currentKey.toUpperCase(),
    subtitle: 'OVERSEER REALM'
  };

  return (
    <header
      className="admin-topbar"
      style={{
        height: 64,
        flexShrink: 0,
        padding: '0 28px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(10, 10, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Left: Mobile Toggle & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={onToggleSidebar}
          style={{
            display: 'none',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 6,
            color: '#f8fafc',
            padding: 8,
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          className="admin-hamburger-btn"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu size={20} />
        </button>

        <div>
          <div
            style={{
              fontFamily: 'var(--font-cinzel, serif)',
              fontWeight: 800,
              fontSize: 15,
              color: '#f8fafc',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span>{section.title}</span>
            <span
              style={{
                fontSize: 9,
                padding: '2px 8px',
                borderRadius: 4,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                fontWeight: 800,
                letterSpacing: '1px'
              }}
            >
              OVERSEER
            </span>
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.5px' }}>
            {section.subtitle}
          </div>
        </div>
      </div>

      {/* Right: Quick link & System Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* System telemetry indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 20,
            fontSize: 11,
            color: '#4ade80',
            fontWeight: 700
          }}
          className="hide-mobile"
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              boxShadow: '0 0 8px #22c55e',
              display: 'inline-block'
            }}
          />
          <span>SYSTEM ONLINE</span>
        </div>

        {/* Link to Play Game */}
        <Link
          to="/user/game"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 6,
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            color: '#c084fc',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.5px',
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.28)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.15)';
          }}
        >
          <Gamepad2 size={15} />
          <span className="hide-mobile">LAUNCH GAME</span>
        </Link>

        {/* Admin Avatar Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 800
            }}
          >
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#f8fafc',
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            className="hide-mobile"
          >
            {user?.displayName || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;

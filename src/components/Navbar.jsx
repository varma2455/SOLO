// -------------------------------------------------------------
// SHADOW ASCENSION - NAVIGATION BAR
// Unified navigation supporting Player & Admin sessions
// -------------------------------------------------------------

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCustomAuth } from '../context/CustomAuthContext';
import { Shield, Play, LogOut, Menu, X, Crown, Lock, User, Swords } from 'lucide-react';

export const Navbar = () => {
  const { user, isAdmin, isUser, logout } = useCustomAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 68,
        backgroundColor: 'rgba(7, 7, 12, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(168, 85, 247, 0.25)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px'
      }}
    >
      {/* Brand Logo */}
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textDecoration: 'none',
          color: '#f8fafc'
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #7e22ce, #3b0764)',
            border: '1px solid #c084fc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(168, 85, 247, 0.5)'
          }}
        >
          <Shield size={20} color="#38bdf8" />
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: '2px',
              color: '#f8fafc',
              textShadow: '0 0 12px rgba(168, 85, 247, 0.6)'
            }}
          >
            SHADOW ASCENSION
          </div>
          <div style={{ fontSize: 9, letterSpacing: '2px', color: '#c084fc', fontWeight: 700 }}>
            CORE AWAKENING
          </div>
        </div>
      </Link>

      {/* Desktop Navigation Links */}
      <div
        className="nav-links-desktop"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 28
        }}
      >
        <button
          onClick={() => scrollToSection('hero')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#cbd5e1',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '1.5px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => (e.target.style.color = '#38bdf8')}
          onMouseLeave={(e) => (e.target.style.color = '#cbd5e1')}
        >
          HOME
        </button>

        <button
          onClick={() => scrollToSection('features')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#cbd5e1',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '1.5px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => (e.target.style.color = '#38bdf8')}
          onMouseLeave={(e) => (e.target.style.color = '#cbd5e1')}
        >
          FEATURES
        </button>

        <button
          onClick={() => scrollToSection('how-to-play')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#cbd5e1',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '1.5px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => (e.target.style.color = '#38bdf8')}
          onMouseLeave={(e) => (e.target.style.color = '#cbd5e1')}
        >
          HOW TO PLAY
        </button>

        <button
          onClick={() => scrollToSection('about')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#cbd5e1',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '1.5px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => (e.target.style.color = '#38bdf8')}
          onMouseLeave={(e) => (e.target.style.color = '#cbd5e1')}
        >
          ABOUT
        </button>
      </div>

      {/* Right Side Actions */}
      <div
        className="nav-actions-desktop"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}
      >
        {/* Play Game Button */}
        <Link
          to={user ? "/user/game" : "/game"}
          className="btn-rpg glow-box-purple"
          style={{
            padding: '9px 20px',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '1.5px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, #7e22ce, #a855f7)',
            borderColor: '#c084fc',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: 6
          }}
        >
          <Play size={15} /> PLAY GAME
        </Link>

        {/* Authenticated Admin */}
        {isAdmin && (
          <>
            <Link
              to="/admin/dashboard"
              className="btn-rpg"
              style={{
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(239, 68, 68, 0.2)',
                borderColor: '#ef4444',
                color: '#f87171',
                textDecoration: 'none',
                borderRadius: 6
              }}
            >
              <Crown size={15} /> ADMIN PANEL
            </Link>

            <button
              onClick={handleLogout}
              className="btn-rpg btn-rpg-secondary"
              style={{
                padding: '8px 12px',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                borderRadius: 6,
                cursor: 'pointer'
              }}
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </>
        )}

        {/* Authenticated Player User */}
        {isUser && (
          <>
            <Link
              to="/user/dashboard"
              className="btn-rpg"
              style={{
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(56, 189, 248, 0.15)',
                borderColor: '#38bdf8',
                color: '#38bdf8',
                textDecoration: 'none',
                borderRadius: 6
              }}
            >
              <User size={15} /> {user.displayName?.toUpperCase() || 'HUNTER'}
            </Link>

            <button
              onClick={handleLogout}
              className="btn-rpg btn-rpg-secondary"
              style={{
                padding: '8px 12px',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                borderRadius: 6,
                cursor: 'pointer'
              }}
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </>
        )}

        {/* Unauthenticated Visitor */}
        {!user && (
          <Link
            to="/login"
            style={{
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              textDecoration: 'none',
              borderRadius: 6,
              transition: 'all 0.2s'
            }}
          >
            <Lock size={14} color="#a855f7" />
            <span>LOGIN</span>
          </Link>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <button
        className="nav-mobile-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#f8fafc',
          cursor: 'pointer',
          padding: 8
        }}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 68,
            left: 0,
            right: 0,
            backgroundColor: '#0a0a14',
            borderBottom: '1px solid rgba(168, 85, 247, 0.3)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          <button onClick={() => scrollToSection('hero')} style={{ background: 'none', border: 'none', color: '#cbd5e1', textAlign: 'left', fontSize: 14, fontWeight: 700 }}>HOME</button>
          <button onClick={() => scrollToSection('features')} style={{ background: 'none', border: 'none', color: '#cbd5e1', textAlign: 'left', fontSize: 14, fontWeight: 700 }}>FEATURES</button>
          <button onClick={() => scrollToSection('how-to-play')} style={{ background: 'none', border: 'none', color: '#cbd5e1', textAlign: 'left', fontSize: 14, fontWeight: 700 }}>HOW TO PLAY</button>
          <Link to={user ? "/user/game" : "/game"} onClick={() => setMobileMenuOpen(false)} style={{ color: '#c084fc', textDecoration: 'none', fontWeight: 800 }}>PLAY GAME</Link>
          {isAdmin ? (
            <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color: '#f87171', textDecoration: 'none', fontWeight: 800 }}>ADMIN PORTAL</Link>
          ) : isUser ? (
            <Link to="/user/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 800 }}>HUNTER DASHBOARD</Link>
          ) : (
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ color: '#f8fafc', textDecoration: 'none', fontWeight: 800 }}>LOGIN</Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

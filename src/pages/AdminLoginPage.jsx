// -------------------------------------------------------------
// SHADOW ASCENSION - EXCLUSIVE ADMIN LOGIN PORTAL
// The ONLY authentication screen in the game system.
// -------------------------------------------------------------

import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Crown, Lock, Mail, AlertTriangle, ArrowLeft, Shield } from 'lucide-react';

export const AdminLoginPage = () => {
  const { adminUser, isAdmin, authLoading, loginAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated and verified as admin, redirect directly to /admin
  if (!authLoading && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide administrator credentials.');
      return;
    }

    setSubmitting(true);
    try {
      await loginAdmin(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      console.error('Admin login error:', err);
      let msg = err.message || 'Authentication failed.';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
        msg = 'Invalid administrator email or password.';
      } else if (msg.includes('auth/too-many-requests')) {
        msg = 'Too many attempts. Access temporarily locked. Please try again later.';
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#07070b',
        background: 'radial-gradient(ellipse at center, #1e0914 0%, #0d0309 60%, #030104 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden',
        color: '#f8fafc'
      }}
    >
      {/* Background Ambient Glows */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, rgba(147, 51, 234, 0.08) 45%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Admin Login Panel */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '40px 36px',
          borderRadius: 12,
          border: '1px solid rgba(239, 68, 68, 0.45)',
          boxShadow: '0 0 50px rgba(239, 68, 68, 0.2), inset 0 0 20px rgba(239, 68, 68, 0.08)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Overseer Icon Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(127, 29, 29, 0.4))',
              border: '2px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.5)'
            }}
          >
            <Crown size={32} color="#f87171" />
          </div>
        </div>

        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '3px',
              color: '#ef4444',
              textTransform: 'uppercase',
              marginBottom: 6
            }}
          >
            SHADOW ASCENSION
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: 28,
              fontWeight: 900,
              margin: '0 0 8px 0',
              letterSpacing: '2px',
              color: '#f8fafc',
              textShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
            }}
          >
            ADMIN PORTAL
          </h1>
          <p
            style={{
              fontSize: 12,
              color: '#94a3b8',
              letterSpacing: '0.8px',
              margin: 0,
              fontWeight: 600
            }}
          >
            RESTRICTED ACCESS &bull; OVERSEER CLEARANCE REQUIRED
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 6,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#fca5a5',
              fontSize: 13,
              marginBottom: 20
            }}
          >
            <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Email Field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '2px',
                color: '#cbd5e1',
                textTransform: 'uppercase',
                marginBottom: 8
              }}
            >
              EMAIL
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                color="#94a3b8"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@shadowascension.io"
                autoComplete="email"
                required
                style={{
                  width: '100%',
                  padding: '13px 14px 13px 44px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 6,
                  color: '#f8fafc',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ef4444';
                  e.target.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.35)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '2px',
                color: '#cbd5e1',
                textTransform: 'uppercase',
                marginBottom: 8
              }}
            >
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="#94a3b8"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
                style={{
                  width: '100%',
                  padding: '13px 14px 13px 44px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 6,
                  color: '#f8fafc',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ef4444';
                  e.target.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.35)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 10,
              width: '100%',
              padding: '14px',
              backgroundColor: '#dc2626',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              border: '1px solid #f87171',
              borderRadius: 6,
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '2px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.4)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {submitting ? 'VERIFYING CLEARANCE...' : 'ADMIN LOGIN'}
          </button>
        </form>

        {/* Back Link */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link
            to="/"
            style={{
              color: '#94a3b8',
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
              letterSpacing: '1px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => (e.target.style.color = '#f8fafc')}
            onMouseLeave={(e) => (e.target.style.color = '#94a3b8')}
          >
            <ArrowLeft size={14} /> RETURN TO REALM
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;

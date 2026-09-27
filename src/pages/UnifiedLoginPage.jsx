// -------------------------------------------------------------
// SHADOW ASCENSION - UNIFIED LOGIN PORTAL
// Single login page for both Administrator and Player accounts.
// Role determination and routing are handled exclusively by the server.
// -------------------------------------------------------------

import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useCustomAuth } from '../context/CustomAuthContext';
import { Mail, Lock, AlertTriangle, ArrowLeft, Shield, CheckCircle2, UserPlus } from 'lucide-react';

export const UnifiedLoginPage = () => {
  const { user, isAdmin, isUser, loading, login } = useCustomAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registeredMessage = location.state?.registeredMessage;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to appropriate portal
  if (!loading && user) {
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/user/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      // Backend returns authenticated user with role
      if (res.user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/user/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
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
        background: 'radial-gradient(ellipse at center, #150d2a 0%, #0d091a 55%, #05030a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden',
        color: '#f8fafc'
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(59, 130, 246, 0.08) 45%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '40px 36px',
          borderRadius: 12,
          border: '1px solid rgba(168, 85, 247, 0.35)',
          boxShadow: '0 0 50px rgba(168, 85, 247, 0.15), inset 0 0 20px rgba(168, 85, 247, 0.05)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Emblem */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(59, 130, 246, 0.2))',
              border: '2px solid #a855f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.4)'
            }}
          >
            <Shield size={28} color="#c084fc" />
          </div>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '3px',
              color: '#c084fc',
              textTransform: 'uppercase',
              marginBottom: 6
            }}
          >
            SHADOW ASCENSION
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: 24,
              fontWeight: 900,
              margin: '0 0 8px 0',
              letterSpacing: '1.5px',
              color: '#f8fafc',
              textShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
            }}
          >
            ENTER THE AWAKENED WORLD
          </h1>
          <p
            style={{
              fontSize: 12,
              color: '#94a3b8',
              letterSpacing: '0.5px',
              margin: 0,
              fontWeight: 500
            }}
          >
            Sign in with your hunter or administrative credentials
          </p>
        </div>

        {/* Success Alert Box (e.g. redirected from registration) */}
        {registeredMessage && !error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 6,
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.5)',
              color: '#86efac',
              fontSize: 13,
              marginBottom: 20
            }}
          >
            <CheckCircle2 size={18} color="#22c55e" style={{ flexShrink: 0 }} />
            <span>{registeredMessage}</span>
          </div>
        )}

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
                id="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hunter@example.com"
                autoComplete="email"
                required
                style={{
                  width: '100%',
                  padding: '13px 14px 13px 44px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: 6,
                  color: '#f8fafc',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#a855f7';
                  e.target.style.boxShadow = '0 0 12px rgba(168, 85, 247, 0.35)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(168, 85, 247, 0.3)';
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
                id="login-password-input"
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
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: 6,
                  color: '#f8fafc',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#a855f7';
                  e.target.style.boxShadow = '0 0 12px rgba(168, 85, 247, 0.35)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="login-submit-button"
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 10,
              width: '100%',
              padding: '14px',
              backgroundColor: '#9333ea',
              background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
              border: '1px solid #c084fc',
              borderRadius: 6,
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '2px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.4)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {submitting ? 'AUTHENTICATING...' : 'LOGIN'}
          </button>
        </form>

        {/* New Player / Create Account */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: '1px solid rgba(168, 85, 247, 0.2)',
            textAlign: 'center'
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', marginBottom: 10 }}>
            NEW PLAYER?
          </div>
          <Link
            id="login-create-account-link"
            to="/register"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              borderRadius: 6,
              color: '#93c5fd',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '1.5px',
              textDecoration: 'none',
              transition: 'all 0.2s',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.15)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.22)';
              e.currentTarget.style.borderColor = '#60a5fa';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.35)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.4)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.15)';
              e.currentTarget.style.color = '#93c5fd';
            }}
          >
            <UserPlus size={16} /> CREATE ACCOUNT
          </Link>
        </div>

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

export default UnifiedLoginPage;

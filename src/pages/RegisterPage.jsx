// -------------------------------------------------------------
// SHADOW ASCENSION - PLAYER REGISTRATION PORTAL
// Public hunter registration creating role: "user".
// After creation, redirects to /login to enter credentials.
// -------------------------------------------------------------

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomAuth } from '../context/CustomAuthContext';
import { User, Mail, Lock, Shield, AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const RegisterPage = () => {
  const { register } = useCustomAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please complete all registration fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register(displayName.trim(), email.trim(), password);
      // Redirect to /login as per user flow
      navigate('/login', {
        state: { registeredMessage: 'Account created successfully! Please log in with your credentials.' },
        replace: true
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create player account.');
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
      {/* Background ambient glow */}
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
          maxWidth: 460,
          padding: '36px 32px',
          borderRadius: 12,
          border: '1px solid rgba(168, 85, 247, 0.35)',
          boxShadow: '0 0 50px rgba(168, 85, 247, 0.15), inset 0 0 20px rgba(168, 85, 247, 0.05)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Emblem */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(59, 130, 246, 0.2))',
              border: '2px solid #a855f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.4)'
            }}
          >
            <Shield size={26} color="#c084fc" />
          </div>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '3px',
              color: '#c084fc',
              textTransform: 'uppercase',
              marginBottom: 4
            }}
          >
            SHADOW ASCENSION
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: 22,
              fontWeight: 900,
              margin: '0 0 6px 0',
              letterSpacing: '1.5px',
              color: '#f8fafc',
              textShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
            }}
          >
            NEW PLAYER REGISTRATION
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
            Awaken your Ascension Core to conquer the Forgotten Crypt
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
              marginBottom: 18
            }}
          >
            <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Player Name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '2px',
                color: '#cbd5e1',
                textTransform: 'uppercase',
                marginBottom: 6
              }}
            >
              PLAYER NAME
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={17}
                color="#94a3b8"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="register-name-input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. YESWANTH"
                autoComplete="name"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: 6,
                  color: '#f8fafc',
                  fontSize: 13,
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
                marginBottom: 6
              }}
            >
              EMAIL
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={17}
                color="#94a3b8"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="register-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hunter@example.com"
                autoComplete="email"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: 6,
                  color: '#f8fafc',
                  fontSize: 13,
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
                marginBottom: 6
              }}
            >
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={17}
                color="#94a3b8"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="register-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="new-password"
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: 6,
                  color: '#f8fafc',
                  fontSize: 13,
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

          {/* Confirm Password Field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '2px',
                color: '#cbd5e1',
                textTransform: 'uppercase',
                marginBottom: 6
              }}
            >
              CONFIRM PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={17}
                color="#94a3b8"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="register-confirm-password-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="new-password"
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: 6,
                  color: '#f8fafc',
                  fontSize: 13,
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
            id="register-submit-button"
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 6,
              width: '100%',
              padding: '13px',
              backgroundColor: '#9333ea',
              background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
              border: '1px solid #c084fc',
              borderRadius: 6,
              color: '#ffffff',
              fontSize: 13,
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
            {submitting ? 'AWAKENING SOUL...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* Existing User Login Link */}
        <div style={{ marginTop: 22, textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 18 }}>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>
            Already an awakened hunter?{' '}
          </span>
          <Link
            to="/login"
            style={{
              color: '#38bdf8',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.8px',
              textDecoration: 'none'
            }}
          >
            LOGIN
          </Link>
        </div>

        {/* Back Link */}
        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <Link
            to="/"
            style={{
              color: '#94a3b8',
              fontSize: 11,
              fontWeight: 600,
              textDecoration: 'none',
              letterSpacing: '1px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <ArrowLeft size={13} /> RETURN TO REALM
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

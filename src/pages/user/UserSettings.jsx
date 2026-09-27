// -------------------------------------------------------------
// SHADOW ASCENSION - USER SETTINGS
// Hunter account preferences and self-service password update.
// -------------------------------------------------------------

import React, { useState } from 'react';
import { useCustomAuth } from '../../context/CustomAuthContext';
import { UserNav } from './UserNav';
import { Lock, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';

export const UserSettings = () => {
  const { user, changePassword } = useCustomAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!currentPassword || !newPassword) {
      setError('Please fill out all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setMessage('Your password has been successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#07070b', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <UserNav />

      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 640, width: '100%', margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 28, margin: 0, fontWeight: 900 }}>
            ACCOUNT SETTINGS & SECURITY
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
            Update your authentication credentials and account preferences.
          </p>
        </div>

        {/* Account Details Box */}
        <div
          className="glass-panel"
          style={{
            padding: 20,
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(15, 23, 42, 0.5)',
            marginBottom: 24
          }}
        >
          <div style={{ fontSize: 12, color: '#94a3b8' }}>LOGGED IN AS</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>{user?.displayName}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{user?.email}</div>
        </div>

        {/* Change Password Panel */}
        <div
          className="glass-panel"
          style={{
            padding: 28,
            borderRadius: 12,
            border: '1px solid rgba(168, 85, 247, 0.3)',
            background: 'linear-gradient(135deg, rgba(20, 14, 40, 0.6) 0%, rgba(10, 8, 20, 0.8) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <KeyRound size={20} color="#c084fc" />
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              CHANGE PASSWORD
            </h2>
          </div>

          {message && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 14px',
                borderRadius: 6,
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#4ade80',
                fontSize: 13,
                marginBottom: 16
              }}
            >
              <CheckCircle2 size={16} />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 14px',
                borderRadius: 6,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                fontSize: 13,
                marginBottom: 16
              }}
            >
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#cbd5e1', letterSpacing: '1px', marginBottom: 6 }}>
                CURRENT PASSWORD
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#cbd5e1', letterSpacing: '1px', marginBottom: 6 }}>
                NEW PASSWORD (MIN 6 CHARACTERS)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#cbd5e1', letterSpacing: '1px', marginBottom: 6 }}>
                CONFIRM NEW PASSWORD
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                padding: '12px',
                background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                border: '1px solid #c084fc',
                borderRadius: 6,
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '1px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'UPDATING PASSWORD...' : 'UPDATE PASSWORD'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default UserSettings;

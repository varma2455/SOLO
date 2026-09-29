// -------------------------------------------------------------
// SHADOW ASCENSION - ADMIN USER DETAILS PAGE
// Route: /admin/users/:userId
// Detailed player inspector, game telemetry, status, role control
// -------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authFetch, useAuth } from '../../context/AuthContext';
import {
  User,
  Shield,
  ArrowLeft,
  KeyRound,
  Ban,
  CheckCircle,
  Coins,
  Swords,
  Skull,
  Ghost,
  Trophy,
  Loader2,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  X
} from 'lucide-react';

export const AdminUserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const loadUser = async () => {
    setLoading(true);
    setError('');
    setActionError('');
    try {
      const res = await authFetch(`/api/admin/users/${userId}`);
      if (!res.ok) {
        throw new Error('Player profile not found or access denied.');
      }
      const data = await res.json();
      if (data.success) {
        setUserData(data);
      } else {
        throw new Error(data.message || 'Failed to load profile.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadUser();
  }, [userId]);

  const toggleStatus = async () => {
    if (!userData?.user) return;
    setActionError('');
    setActionMsg('');
    const newStatus = userData.user.status === 'active' ? 'inactive' : 'active';

    try {
      const res = await authFetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMsg(`Account status changed to ${newStatus.toUpperCase()}`);
        setUserData((prev) => ({
          ...prev,
          user: { ...prev.user, status: newStatus }
        }));
        setTimeout(() => setActionMsg(''), 4000);
      } else {
        setActionError(data.message || 'Status update failed.');
      }
    } catch (err) {
      setActionError(err.message || 'Error updating status.');
    }
  };

  const toggleRole = async () => {
    if (!userData?.user) return;
    setActionError('');
    setActionMsg('');
    const newRole = userData.user.role === 'admin' ? 'user' : 'admin';

    try {
      const res = await authFetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMsg(`Account role changed to ${newRole.toUpperCase()}`);
        setUserData((prev) => ({
          ...prev,
          user: { ...prev.user, role: newRole }
        }));
        setTimeout(() => setActionMsg(''), 4000);
      } else {
        setActionError(data.message || 'Role update failed.');
      }
    } catch (err) {
      setActionError(err.message || 'Error updating role.');
    }
  };

  const handleResetPassword = async () => {
    setResetting(true);
    setActionError('');
    try {
      const res = await authFetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.temporaryPassword) {
        setTempPassword(data.temporaryPassword);
        setActionMsg(`Password reset successfully.`);
      } else {
        setActionError(data.message || 'Password reset failed.');
      }
    } catch (err) {
      setActionError(err.message || 'Error resetting password.');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: '#f8fafc' }}>
        <Loader2 className="animate-spin" size={36} color="#ef4444" />
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#f8fafc' }}>
        <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <h2>{error || 'User not found'}</h2>
        <Link to="/admin/users" style={{ color: '#ef4444', textDecoration: 'underline', marginTop: 16, display: 'inline-block' }}>
          Back to User Management
        </Link>
      </div>
    );
  }

  const { user, gameData } = userData;
  const isSelf = user.id === currentUser?.id || user.uid === currentUser?.uid;

  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Back navigation */}
      <Link
        to="/admin/users"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: '#94a3b8',
          textDecoration: 'none',
          fontSize: 13,
          fontWeight: 700,
          transition: 'color 0.2s',
          alignSelf: 'flex-start'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
      >
        <ArrowLeft size={16} /> BACK TO USER MANAGEMENT
      </Link>

      {/* Notifications */}
      {actionError && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 6,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#f87171',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <span>{actionError}</span>
        </div>
      )}

      {actionMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 6,
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid #22c55e',
            color: '#4ade80',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <CheckCircle2 size={18} />
          <span>{actionMsg}</span>
        </div>
      )}

      {tempPassword && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 8,
            background: 'rgba(234, 179, 8, 0.15)',
            border: '1px solid #eab308',
            color: '#fef08a'
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>NEW TEMPORARY PASSWORD GENERATED:</div>
          <div style={{ fontFamily: 'monospace', fontSize: 18, color: '#ffffff', fontWeight: 900, background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: 4, display: 'inline-block' }}>
            {tempPassword}
          </div>
          <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 6 }}>
            Share this temporary password with the user. Passwords are valid for immediate login.
          </div>
        </div>
      )}

      {/* Profile Overview Card */}
      <div
        style={{
          padding: 28,
          borderRadius: 12,
          border: '1px solid rgba(239, 68, 68, 0.35)',
          background: 'linear-gradient(135deg, rgba(30, 10, 15, 0.7) 0%, rgba(15, 6, 8, 0.9) 100%)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(168, 85, 247, 0.25)',
                border: `2px solid ${user.role === 'admin' ? '#ef4444' : '#a855f7'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 22,
                color: user.role === 'admin' ? '#f87171' : '#c084fc'
              }}
            >
              {(user.displayName || user.email || 'P').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 24, fontWeight: 900, margin: 0, color: '#f8fafc' }}>
                {user.displayName || 'Player'}
              </h1>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{user.email}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
                Firebase UID: {user.uid || user.id}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {!isSelf && (
              <button
                onClick={toggleRole}
                style={{
                  padding: '9px 16px',
                  borderRadius: 6,
                  border: user.role === 'admin' ? '1px solid #ef4444' : '1px solid #a855f7',
                  background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                  color: user.role === 'admin' ? '#f87171' : '#c084fc',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  letterSpacing: '1px'
                }}
              >
                {user.role === 'admin' ? 'DEMOTE TO USER' : 'PROMOTE TO ADMIN'}
              </button>
            )}

            {!isSelf && (
              <button
                onClick={toggleStatus}
                style={{
                  padding: '9px 16px',
                  borderRadius: 6,
                  border: user.status === 'active' ? '1px solid #ef4444' : '1px solid #22c55e',
                  background: user.status === 'active' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  color: user.status === 'active' ? '#f87171' : '#4ade80',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  letterSpacing: '1px'
                }}
              >
                {user.status === 'active' ? 'DEACTIVATE USER' : 'ACTIVATE USER'}
              </button>
            )}

            {!isSelf ? (
              <button
                onClick={handleResetPassword}
                disabled={resetting}
                style={{
                  padding: '9px 16px',
                  borderRadius: 6,
                  border: '1px solid #eab308',
                  background: 'rgba(234, 179, 8, 0.15)',
                  color: '#facc15',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: resetting ? 'not-allowed' : 'pointer',
                  letterSpacing: '1px'
                }}
              >
                {resetting ? 'RESETTING...' : 'RESET PASSWORD'}
              </button>
            ) : (
              <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                (CURRENT OVERSEER SESSION)
              </span>
            )}
          </div>
        </div>

        {/* Account Attributes Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <div style={{ padding: 14, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>ROLE</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: user.role === 'admin' ? '#f87171' : '#c084fc', marginTop: 4 }}>
              {(user.role || 'USER').toUpperCase()}
            </div>
          </div>

          <div style={{ padding: 14, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>ACCOUNT STATUS</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: user.status === 'active' ? '#4ade80' : '#f87171', marginTop: 4 }}>
              {(user.status || 'ACTIVE').toUpperCase()}
            </div>
          </div>

          <div style={{ padding: 14, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>MEMBER SINCE</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1', marginTop: 4 }}>
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>

          <div style={{ padding: 14, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>LAST SESSION</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1', marginTop: 4 }}>
              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never recorded'}
            </div>
          </div>
        </div>
      </div>

      {/* Game Information & Telemetry Card */}
      <div
        style={{
          padding: 28,
          borderRadius: 12,
          border: '1px solid rgba(168, 85, 247, 0.35)',
          background: 'linear-gradient(135deg, rgba(20, 14, 40, 0.7) 0%, rgba(10, 8, 20, 0.9) 100%)'
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 18, fontWeight: 800, margin: '0 0 20px 0', letterSpacing: '1px' }}>
          GAME INFORMATION & TELEMETRY
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ padding: 16, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>HUNTER LEVEL</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#c084fc', marginTop: 4 }}>
              LEVEL {gameData?.level || 1}
            </div>
          </div>

          <div style={{ padding: 16, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>EXPERIENCE (XP)</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>
              {gameData?.xp || 0} <span style={{ fontSize: 13, color: '#94a3b8' }}>/ {gameData?.maxXp || 100}</span>
            </div>
          </div>

          <div style={{ padding: 16, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>GOLD BALANCE</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#facc15', marginTop: 4 }}>
              {gameData?.gold || 0} G
            </div>
          </div>

          <div style={{ padding: 16, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>MONSTERS DEFEATED</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#4ade80', marginTop: 4 }}>
              {gameData?.monstersDefeated || 0}
            </div>
          </div>

          <div style={{ padding: 16, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>BOSSES DEFEATED</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#f87171', marginTop: 4 }}>
              {gameData?.bossesDefeated || 0}
            </div>
          </div>

          <div style={{ padding: 16, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>DUNGEONS COMPLETED</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24', marginTop: 4 }}>
              {gameData?.dungeonsCompleted || 0}
            </div>
          </div>

          <div style={{ padding: 16, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>SHADOWS OWNED</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#c084fc', marginTop: 4 }}>
              {gameData?.shadowsCount || 0} SOLDIERS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetails;

// -------------------------------------------------------------
// SHADOW ASCENSION - ADMIN USERS MANAGEMENT PAGE
// Route: /admin/users
// Comprehensive user table, search/filter, role toggle, status toggle,
// reset password modal, and user creation modal.
// -------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../context/AuthContext';
import { getAllHuntersForAdmin } from '../../firebase/userService';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Shield,
  KeyRound,
  Ban,
  CheckCircle,
  AlertTriangle,
  X,
  Crown,
  User,
  CheckCircle2
} from 'lucide-react';

export const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Notifications
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({ displayName: '', email: '', password: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Reset Password Modal
  const [resetTarget, setResetTarget] = useState(null);
  const [customPassword, setCustomPassword] = useState('');
  const [resetResult, setResetResult] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setActionError('');
    try {
      const res = await authFetch('/api/admin/users');
      let combined = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) combined = data.users;
      }

      // Also merge any direct Firestore user records
      try {
        const fsUsers = await getAllHuntersForAdmin();
        if (Array.isArray(fsUsers) && fsUsers.length > 0) {
          const map = new Map();
          combined.forEach((u) => map.set(u.id || u.uid, u));
          fsUsers.forEach((u) => {
            const key = u.uid || u.id;
            if (!map.has(key)) {
              map.set(key, { ...u, id: key });
            } else {
              map.set(key, { ...map.get(key), ...u, id: key });
            }
          });
          combined = Array.from(map.values());
        }
      } catch (fsErr) {
        console.warn('Direct Firestore users merge notice:', fsErr);
      }

      setUsers(combined);
    } catch (err) {
      setActionError(err.message || 'Failed to load user roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showSuccessMsg = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4500);
  };

  // Toggle user role between 'user' and 'admin'
  const handleToggleRole = async (targetUser) => {
    setActionError('');
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';

    // Safety check: protect last remaining active admin
    const isTargetAdmin =
      targetUser.role === 'admin' ||
      targetUser.email?.toLowerCase() === 'pothuri2455@gmail.com';

    if (isTargetAdmin && newRole !== 'admin') {
      const otherAdmins = users.filter(
        (u) =>
          (u.role === 'admin' || u.email?.toLowerCase() === 'pothuri2455@gmail.com') &&
          (u.id || u.uid) !== (targetUser.id || targetUser.uid) &&
          u.status === 'active'
      );
      if (otherAdmins.length === 0) {
        setActionError('At least one active administrator must remain.');
        return;
      }
    }

    try {
      const res = await authFetch(`/api/admin/users/${targetUser.id || targetUser.uid}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update user role.');
      }
      showSuccessMsg(`User ${targetUser.displayName || targetUser.email} role updated to ${newRole.toUpperCase()}`);
      await fetchUsers();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Toggle user status between 'active' and 'inactive'
  const handleToggleStatus = async (targetUser) => {
    setActionError('');
    const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';

    // Safety check: protect last remaining active admin
    const isTargetAdmin =
      targetUser.role === 'admin' ||
      targetUser.email?.toLowerCase() === 'pothuri2455@gmail.com';

    if (isTargetAdmin && newStatus !== 'active') {
      const otherAdmins = users.filter(
        (u) =>
          (u.role === 'admin' || u.email?.toLowerCase() === 'pothuri2455@gmail.com') &&
          (u.id || u.uid) !== (targetUser.id || targetUser.uid) &&
          u.status === 'active'
      );
      if (otherAdmins.length === 0) {
        setActionError('At least one active administrator must remain.');
        return;
      }
    }

    try {
      const res = await authFetch(`/api/admin/users/${targetUser.id || targetUser.uid}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update user status.');
      }
      showSuccessMsg(`Account for ${targetUser.displayName || targetUser.email} is now ${newStatus.toUpperCase()}`);
      await fetchUsers();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Create User Handler
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      const res = await authFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: createData.displayName.trim(),
          email: createData.email.trim(),
          password: createData.password
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create user account.');
      }
      showSuccessMsg(`Account created for ${data.user.displayName || data.user.email}`);
      setShowCreateModal(false);
      setCreateData({ displayName: '', email: '', password: '' });
      await fetchUsers();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  // Reset Password Handler
  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${resetTarget.id || resetTarget.uid}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: customPassword || undefined })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to reset password.');
      }
      setResetResult(data.temporaryPassword);
      showSuccessMsg(`Password reset for ${resetTarget.displayName || resetTarget.email}`);
      await fetchUsers();
    } catch (err) {
      alert('Error resetting password: ' + err.message);
    } finally {
      setResetLoading(false);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      u.email?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q) ||
      (u.id || u.uid || '').toLowerCase().includes(q);

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Title & Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-cinzel, serif)',
              fontSize: 26,
              fontWeight: 900,
              margin: 0,
              color: '#ffffff',
              letterSpacing: '1px'
            }}
          >
            USER MANAGEMENT
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 13, letterSpacing: '0.5px' }}>
            MANAGE HUNTERS AND ADMINISTRATORS &middot; REAL-TIME ROLE & ACCESS CONTROLS
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={fetchUsers}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 14px',
              borderRadius: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              fontSize: 12,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>REFRESH</span>
          </button>

          <button
            id="admin-create-user-modal-btn"
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 6,
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              border: '1px solid #f87171',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.35)'
            }}
          >
            <Plus size={16} /> CREATE USER
          </button>
        </div>
      </div>

      {/* Action Alerts */}
      {actionSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid #22c55e',
            borderRadius: 6,
            color: '#4ade80',
            fontSize: 13,
            fontWeight: 700
          }}
        >
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: 6,
            color: '#fca5a5',
            fontSize: 13
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} color="#ef4444" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError('')}
            style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          padding: '16px',
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <Search
            size={16}
            color="#94a3b8"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            id="admin-search-users-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or UID..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 6,
              color: '#f8fafc',
              fontSize: 12,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Role Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>ROLE:</span>
          <select
            id="admin-filter-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 6,
              color: '#f8fafc',
              fontSize: 12,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all" style={{ background: '#0a0a14' }}>All Roles</option>
            <option value="user" style={{ background: '#0a0a14' }}>User</option>
            <option value="admin" style={{ background: '#0a0a14' }}>Admin</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>STATUS:</span>
          <select
            id="admin-filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 6,
              color: '#f8fafc',
              fontSize: 12,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all" style={{ background: '#0a0a14' }}>All Statuses</option>
            <option value="active" style={{ background: '#0a0a14' }}>Active</option>
            <option value="inactive" style={{ background: '#0a0a14' }}>Inactive</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>
          Showing <strong>{filteredUsers.length}</strong> of {users.length} users
        </div>
      </div>

      {/* Users Table */}
      <div
        style={{
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          overflow: 'hidden'
        }}
      >
        <div className="users-table-container table-container" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
            <thead>
              <tr
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '1px',
                  color: '#cbd5e1'
                }}
              >
                <th style={{ padding: '14px 18px' }}>USER</th>
                <th style={{ padding: '14px 18px' }}>EMAIL</th>
                <th style={{ padding: '14px 18px' }}>ROLE</th>
                <th style={{ padding: '14px 18px' }}>STATUS</th>
                <th style={{ padding: '14px 18px' }}>LEVEL</th>
                <th style={{ padding: '14px 18px' }}>CREATED</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                    <RefreshCw size={24} className="animate-spin" color="#ef4444" style={{ margin: '0 auto 8px' }} />
                    <div>Loading user registry...</div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 36, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdminUser = u.role === 'admin';
                  const isActive = u.status === 'active';
                  const targetId = u.id || u.uid;
                  const creationDate = u.createdAt
                    ? typeof u.createdAt === 'string'
                      ? new Date(u.createdAt).toLocaleDateString()
                      : u.createdAt.seconds
                      ? new Date(u.createdAt.seconds * 1000).toLocaleDateString()
                      : 'N/A'
                    : 'N/A';

                  return (
                    <tr
                      key={targetId}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: 13,
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* USER */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              backgroundColor: isAdminUser ? '#ef4444' : '#9333ea',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              color: '#fff',
                              fontSize: 12,
                              flexShrink: 0
                            }}
                          >
                            {(u.displayName || u.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#f8fafc' }}>
                              {u.displayName || 'Player'}
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                              {targetId.slice(0, 12)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* EMAIL */}
                      <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                        {u.email}
                      </td>

                      {/* ROLE */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            backgroundColor: isAdminUser ? 'rgba(239, 68, 68, 0.18)' : 'rgba(168, 85, 247, 0.18)',
                            color: isAdminUser ? '#f87171' : '#c084fc',
                            border: `1px solid ${isAdminUser ? '#ef4444' : '#a855f7'}`
                          }}
                        >
                          {isAdminUser ? 'ADMIN' : 'USER'}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            backgroundColor: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isActive ? '#4ade80' : '#f87171',
                            border: `1px solid ${isActive ? '#22c55e' : '#ef4444'}`
                          }}
                        >
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>

                      {/* LEVEL */}
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#f8fafc' }}>
                        Lv. {u.stats?.level || u.level || 1}
                      </td>

                      {/* CREATED */}
                      <td style={{ padding: '14px 18px', color: '#94a3b8', fontSize: 12 }}>
                        {creationDate}
                      </td>

                      {/* ACTIONS */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          {/* VIEW PROFILE */}
                          <button
                            onClick={() => navigate(`/admin/users/${targetId}`)}
                            title="View Player Profile"
                            style={{
                              padding: '6px 10px',
                              borderRadius: 4,
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: '#cbd5e1',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <ExternalLink size={12} /> VIEW
                          </button>

                          {/* TOGGLE ROLE */}
                          <button
                            onClick={() => handleToggleRole(u)}
                            title={`Switch to ${isAdminUser ? 'USER' : 'ADMIN'}`}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 4,
                              backgroundColor: isAdminUser ? 'rgba(168, 85, 247, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              border: `1px solid ${isAdminUser ? '#a855f7' : '#ef4444'}`,
                              color: isAdminUser ? '#c084fc' : '#f87171',
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            {isAdminUser ? 'TO USER' : 'TO ADMIN'}
                          </button>

                          {/* ACTIVATE / DEACTIVATE */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            title={isActive ? 'Deactivate account' : 'Activate account'}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 4,
                              backgroundColor: isActive ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                              border: `1px solid ${isActive ? '#ef4444' : '#22c55e'}`,
                              color: isActive ? '#f87171' : '#4ade80',
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            {isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                          </button>

                          {/* RESET PASSWORD */}
                          <button
                            onClick={() => {
                              setResetTarget(u);
                              setResetResult('');
                              setCustomPassword('');
                            }}
                            title="Reset Temporary Password"
                            style={{
                              padding: '6px 8px',
                              borderRadius: 4,
                              backgroundColor: 'rgba(234, 179, 8, 0.12)',
                              border: '1px solid #eab308',
                              color: '#facc15',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <KeyRound size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            overflowY: 'auto',
            zIndex: 100
          }}
        >
          <div
            className="modal"
            style={{
              width: '100%',
              maxWidth: 480,
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto',
              boxSizing: 'border-box',
              padding: 28,
              borderRadius: 12,
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: '#0d0a14',
              boxShadow: '0 0 32px rgba(239, 68, 68, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 18, fontWeight: 900, margin: 0, color: '#f8fafc' }}>
                PROVISION PLAYER ACCOUNT
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: 6, color: '#fca5a5', fontSize: 12, marginBottom: 16 }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#cbd5e1', letterSpacing: '1px', marginBottom: 6 }}>
                  HUNTER NAME
                </label>
                <input
                  id="create-user-name-input"
                  type="text"
                  value={createData.displayName}
                  onChange={(e) => setCreateData({ ...createData, displayName: e.target.value })}
                  placeholder="e.g. SUNG JINWOO"
                  required
                  style={{
                    width: '100%',
                    padding: '11px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#cbd5e1', letterSpacing: '1px', marginBottom: 6 }}>
                  EMAIL
                </label>
                <input
                  id="create-user-email-input"
                  type="email"
                  value={createData.email}
                  onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                  placeholder="hunter@shadowascension.com"
                  required
                  style={{
                    width: '100%',
                    padding: '11px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1', letterSpacing: '1px' }}>
                    TEMPORARY PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCreateData({
                        ...createData,
                        password: `Hunter_${Math.random().toString(36).substring(2, 8)}!`
                      })
                    }
                    style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Generate
                  </button>
                </div>
                <input
                  id="create-user-password-input"
                  type="text"
                  value={createData.password}
                  onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  style={{
                    width: '100%',
                    padding: '11px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontSize: 13,
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>ROLE:</span>
                <span style={{ color: '#c084fc', fontWeight: 800 }}>USER (HUNTER)</span>
              </div>

              <button
                id="create-user-submit-btn"
                type="submit"
                disabled={createLoading}
                style={{
                  marginTop: 6,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  border: '1px solid #f87171',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: '1px',
                  cursor: createLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {createLoading ? 'PROVISIONING...' : 'CREATE ACCOUNT'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetTarget && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            overflowY: 'auto',
            zIndex: 100
          }}
        >
          <div
            className="modal"
            style={{
              width: '100%',
              maxWidth: 440,
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto',
              boxSizing: 'border-box',
              padding: 28,
              borderRadius: 12,
              border: '1px solid rgba(234, 179, 8, 0.4)',
              background: '#0e0b12'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 18, fontWeight: 900, margin: 0, color: '#f8fafc' }}>
                RESET USER PASSWORD
              </h2>
              <button
                onClick={() => setResetTarget(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              Reset credentials for <strong style={{ color: '#f8fafc' }}>{resetTarget.displayName || resetTarget.email}</strong>.
            </p>

            {resetResult ? (
              <div style={{ padding: 16, background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 800, marginBottom: 4 }}>NEW TEMPORARY PASSWORD:</div>
                <div style={{ fontFamily: 'monospace', fontSize: 18, color: '#ffffff', fontWeight: 900, background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: 4 }}>
                  {resetResult}
                </div>
                <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 8 }}>
                  Give this password to the hunter. It has been synced with Firebase Auth.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1', letterSpacing: '1px' }}>
                      NEW PASSWORD (OPTIONAL)
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomPassword(`Hunter_${Math.random().toString(36).substring(2, 8)}!`)}
                      style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Leave empty to auto-generate"
                    style={{
                      width: '100%',
                      padding: '11px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 6,
                      color: '#ffffff',
                      fontSize: 13,
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  style={{
                    marginTop: 6,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                    border: '1px solid #facc15',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: 13,
                    letterSpacing: '1px',
                    cursor: resetLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {resetLoading ? 'UPDATING...' : 'CONFIRM RESET'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

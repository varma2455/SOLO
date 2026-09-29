// -------------------------------------------------------------
// SHADOW ASCENSION - ADMIN CONTROL CENTER
// Protected Overseer dashboard for managing:
// - Users (Creation, Status, Password Reset, Profiles)
// - Monsters, Shadows, Quests, Dungeons, Game Settings, & Stats
// -------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { useCustomAuth, authFetch } from '../context/CustomAuthContext';
import { getAllHuntersForAdmin } from '../firebase/userService';
import {
  Crown,
  LayoutDashboard,
  Users,
  Ghost,
  Skull,
  ScrollText,
  Sliders,
  BarChart3,
  LogOut,
  RefreshCw,
  Plus,
  Save,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Search,
  ExternalLink,
  Shield,
  Zap,
  Swords,
  Castle,
  KeyRound,
  Ban,
  CheckCircle2,
  X
} from 'lucide-react';

export const AdminControlCenter = () => {
  const { user, isAdmin, loading: authLoading, logout } = useCustomAuth();
  const navigate = useNavigate();
  const { tab: urlTab } = useParams();

  // Active Tab
  const validTabs = ['dashboard', 'users', 'players', 'shadows', 'monsters', 'quests', 'dungeons', 'settings', 'statistics'];
  const rawTab = validTabs.includes(urlTab) ? urlTab : 'dashboard';
  // Map 'players' alias to 'users'
  const activeTab = rawTab === 'players' ? 'users' : rawTab;

  // Data states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Repositories
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    disabledUsers: 0,
    totalMonsters: 0,
    totalShadows: 0,
    totalQuests: 0,
    totalDungeons: 0,
    totalMonstersDefeated: 0,
    totalDungeonsCompleted: 0,
    recentActivity: []
  });
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionError, setActionError] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [gameConfig, setGameConfig] = useState(null);
  const [monsters, setMonsters] = useState([]);
  const [shadows, setShadows] = useState([]);
  const [quests, setQuests] = useState([]);
  const [dungeons, setDungeons] = useState([]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Editors
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserData, setCreateUserData] = useState({ displayName: '', email: '', password: '' });
  const [createUserError, setCreateUserError] = useState('');

  const [resetPasswordTarget, setResetPasswordTarget] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPasswordResult, setResetPasswordResult] = useState('');

  const [editingMonster, setEditingMonster] = useState(null);
  const [editingShadow, setEditingShadow] = useState(null);
  const [editingQuest, setEditingQuest] = useState(null);
  const [editingDungeon, setEditingDungeon] = useState(null);

  // Load all admin data via server API
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, monsRes, shadsRes, qstsRes, dungsRes, cfgRes] = await Promise.all([
        authFetch('/api/admin/stats'),
        authFetch('/api/admin/users'),
        authFetch('/api/admin/monsters'),
        authFetch('/api/admin/shadows'),
        authFetch('/api/admin/quests'),
        authFetch('/api/admin/dungeons'),
        authFetch('/api/admin/settings')
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        if (s.stats) setAdminStats(s.stats);
      }
      let combinedUsers = [];
      if (usersRes.ok) {
        const u = await usersRes.json();
        if (Array.isArray(u.users)) combinedUsers = u.users;
      }
      try {
        const fsUsers = await getAllHuntersForAdmin();
        if (Array.isArray(fsUsers) && fsUsers.length > 0) {
          const map = new Map();
          combinedUsers.forEach(usr => map.set(usr.id || usr.uid, usr));
          fsUsers.forEach(usr => {
            const key = usr.uid || usr.id;
            if (!map.has(key)) {
              map.set(key, { ...usr, id: key });
            } else {
              map.set(key, { ...map.get(key), ...usr, id: key });
            }
          });
          combinedUsers = Array.from(map.values());
        }
      } catch (fsErr) {
        console.warn('Direct Firestore users merge notice:', fsErr);
      }
      setUsersList(combinedUsers);
      if (monsRes.ok) {
        const m = await monsRes.json();
        if (Array.isArray(m.monsters)) setMonsters(m.monsters);
      }
      if (shadsRes.ok) {
        const sh = await shadsRes.json();
        if (Array.isArray(sh.shadows)) setShadows(sh.shadows);
      }
      if (qstsRes.ok) {
        const q = await qstsRes.json();
        if (Array.isArray(q.quests)) setQuests(q.quests);
      }
      if (dungsRes.ok) {
        const d = await dungsRes.json();
        if (Array.isArray(d.dungeons)) setDungeons(d.dungeons);
      }
      if (cfgRes.ok) {
        const c = await cfgRes.json();
        if (c.settings) setGameConfig(c.settings);
      }
    } catch (err) {
      console.error('Error loading admin control center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin]);

  const showSuccess = (msg) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Route Guard
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#07070b', color: '#f8fafc' }}>
        <RefreshCw size={36} className="animate-spin" color="#ef4444" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // --- USER ACTIONS ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserError('');

    if (!createUserData.displayName.trim() || !createUserData.email.trim() || !createUserData.password) {
      setCreateUserError('Please provide player name, email, and temporary password.');
      return;
    }

    try {
      const res = await authFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: createUserData.displayName.trim(),
          email: createUserData.email.trim(),
          password: createUserData.password
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create user account.');
      }

      showSuccess(`Player account created for ${data.user.displayName}`);
      setShowCreateUserModal(false);
      setCreateUserData({ displayName: '', email: '', password: '' });
      await loadAllData();
    } catch (err) {
      setCreateUserError(err.message);
    }
  };

  const handleToggleUserRole = async (targetUser) => {
    setActionError('');
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';

    // Safety rule: The final active administrator cannot be demoted or deactivated unless another active administrator exists
    const isTargetAdmin = targetUser.role === 'admin' || targetUser.email?.toLowerCase() === 'shadow.admin@shadowascension.com' || targetUser.email?.toLowerCase() === 'pothuri2455@gmail.com';
    if (isTargetAdmin && newRole !== 'admin') {
      const otherActiveAdmins = usersList.filter(
        (u) => (u.role === 'admin' || u.email?.toLowerCase() === 'shadow.admin@shadowascension.com' || u.email?.toLowerCase() === 'pothuri2455@gmail.com') &&
               (u.id || u.uid) !== (targetUser.id || targetUser.uid) &&
               u.email?.toLowerCase() !== targetUser.email?.toLowerCase() &&
               u.status === 'active'
      );
      if (otherActiveAdmins.length === 0) {
        setActionError('At least one active administrator must remain.');
        return;
      }
    }

    try {
      const res = await authFetch(`/api/admin/users/${targetUser.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update user role.');
      }

      showSuccess(`User ${targetUser.displayName} role changed to ${newRole.toUpperCase()}`);
      await loadAllData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    setActionError('');
    const currentActive = targetUser.status === 'active';
    const newStatus = currentActive ? 'inactive' : 'active';

    // Safety rule: The final active administrator cannot be demoted or deactivated unless another active administrator exists
    const isTargetAdmin = targetUser.role === 'admin' || targetUser.email?.toLowerCase() === 'shadow.admin@shadowascension.com' || targetUser.email?.toLowerCase() === 'pothuri2455@gmail.com';
    if (isTargetAdmin && newStatus !== 'active') {
      const otherActiveAdmins = usersList.filter(
        (u) => (u.role === 'admin' || u.email?.toLowerCase() === 'shadow.admin@shadowascension.com' || u.email?.toLowerCase() === 'pothuri2455@gmail.com') &&
               (u.id || u.uid) !== (targetUser.id || targetUser.uid) &&
               u.email?.toLowerCase() !== targetUser.email?.toLowerCase() &&
               u.status === 'active'
      );
      if (otherActiveAdmins.length === 0) {
        setActionError('At least one active administrator must remain.');
        return;
      }
    }

    try {
      const res = await authFetch(`/api/admin/users/${targetUser.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to change status.');
      }

      showSuccess(`User ${targetUser.displayName} status set to ${newStatus.toUpperCase()}`);
      await loadAllData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleResetPasswordConfirm = async () => {
    if (!resetPasswordTarget) return;
    try {
      const res = await authFetch(`/api/admin/users/${resetPasswordTarget.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: resetPasswordValue || undefined })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      setResetPasswordResult(data.temporaryPassword);
      showSuccess(`Password reset successfully for ${resetPasswordTarget.displayName}`);
      await loadAllData();
    } catch (err) {
      alert('Error resetting password: ' + err.message);
    }
  };

  // --- SAVE SETTINGS ---
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!gameConfig) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameConfig)
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Game balance settings saved successfully!');
      }
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- MONSTERS ---
  const handleSaveMonster = async (e) => {
    e.preventDefault();
    if (!editingMonster) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/monsters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMonster)
      });
      if (res.ok) {
        showSuccess(`Monster "${editingMonster.name}" saved successfully!`);
        setEditingMonster(null);
        await loadAllData();
      }
    } catch (err) {
      alert('Failed to save monster: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMonster = async (id) => {
    if (!window.confirm('Are you sure you want to remove this monster?')) return;
    try {
      await authFetch(`/api/admin/monsters/${id}`, { method: 'DELETE' });
      showSuccess('Monster removed successfully.');
      await loadAllData();
    } catch (err) {
      alert('Failed to delete monster: ' + err.message);
    }
  };

  // --- SHADOWS ---
  const handleSaveShadow = async (e) => {
    e.preventDefault();
    if (!editingShadow) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/shadows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingShadow)
      });
      if (res.ok) {
        showSuccess(`Shadow "${editingShadow.name}" saved successfully!`);
        setEditingShadow(null);
        await loadAllData();
      }
    } catch (err) {
      alert('Failed to save shadow: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- QUESTS ---
  const handleSaveQuest = async (e) => {
    e.preventDefault();
    if (!editingQuest) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingQuest)
      });
      if (res.ok) {
        showSuccess(`Quest "${editingQuest.title}" saved successfully!`);
        setEditingQuest(null);
        await loadAllData();
      }
    } catch (err) {
      alert('Failed to save quest: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- DUNGEONS ---
  const handleSaveDungeon = async (e) => {
    e.preventDefault();
    if (!editingDungeon) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/dungeons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDungeon)
      });
      if (res.ok) {
        showSuccess(`Dungeon "${editingDungeon.name}" updated!`);
        setEditingDungeon(null);
        await loadAllData();
      }
    } catch (err) {
      alert('Failed to save dungeon: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#07070b',
        color: '#f8fafc',
        fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)'
      }}
    >
      {/* SIDEBAR NAVIGATION */}
      <aside
        style={{
          width: 260,
          backgroundColor: '#0a0a14',
          borderRight: '1px solid rgba(239, 68, 68, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}
      >
        {/* Brand Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Crown size={20} color="#f87171" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 900, fontSize: 15, letterSpacing: '1px' }}>
                SHADOW ASCENSION
              </div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#f87171', letterSpacing: '2px' }}>
                OVERSEER PORTAL
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { id: 'dashboard', label: 'ADMIN DASHBOARD', icon: <LayoutDashboard size={18} /> },
            { id: 'users', label: 'USERS', icon: <Users size={18} /> },
            { id: 'monsters', label: 'MONSTERS', icon: <Skull size={18} /> },
            { id: 'shadows', label: 'SHADOWS', icon: <Ghost size={18} /> },
            { id: 'quests', label: 'QUESTS', icon: <ScrollText size={18} /> },
            { id: 'dungeons', label: 'DUNGEONS', icon: <Castle size={18} /> },
            { id: 'statistics', label: 'STATISTICS', icon: <BarChart3 size={18} /> },
            { id: 'settings', label: 'SETTINGS', icon: <Sliders size={18} /> }
          ].map((item) => {
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/admin/${item.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: 6,
                  border: isSelected ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid transparent',
                  background: isSelected ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <span style={{ color: isSelected ? '#ef4444' : '#94a3b8' }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logged in Admin Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.07)', backgroundColor: '#06060c' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', letterSpacing: '1px', marginBottom: 4 }}>
            OVERSEER STATUS
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#cbd5e1',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: 12
            }}
          >
            {user?.email || 'admin@shadowascension.com'}
          </div>

          <button
            id="admin-logout-button"
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

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar with quick links & notifications */}
        <header
          style={{
            height: 64,
            padding: '0 32px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(10, 10, 20, 0.7)',
            backdropFilter: 'blur(8px)',
            position: 'sticky',
            top: 0,
            zIndex: 30
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#f87171', letterSpacing: '1.5px' }}>
              SECTION: {activeTab.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {saveSuccessMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#4ade80',
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'rgba(34, 197, 94, 0.15)',
                  padding: '6px 12px',
                  borderRadius: 4,
                  border: '1px solid #22c55e'
                }}
              >
                <CheckCircle size={14} /> {saveSuccessMsg}
              </div>
            )}

            <button
              onClick={loadAllData}
              disabled={loading}
              title="Refresh Data"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                fontSize: 12,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>REFRESH</span>
            </button>
          </div>
        </header>

        {/* Tab Body */}
        <div style={{ padding: '32px', flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          {/* ========================================================================= */}
          {/* TAB 1: DASHBOARD */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Telemetry Stat Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                {/* Total Users */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    borderRadius: 8,
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    background: 'rgba(168, 85, 247, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#c084fc', letterSpacing: '1px' }}>
                      TOTAL USERS
                    </span>
                    <Users size={18} color="#c084fc" />
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#f8fafc' }}>
                    {adminStats.totalUsers || usersList.length}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Total registered users</div>
                </div>

                {/* Active Users */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    borderRadius: 8,
                    border: '1px solid rgba(34, 197, 94, 0.35)',
                    background: 'rgba(34, 197, 94, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#4ade80', letterSpacing: '1px' }}>
                      ACTIVE USERS
                    </span>
                    <CheckCircle2 size={18} color="#22c55e" />
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#f8fafc' }}>
                    {adminStats.activeUsers || usersList.filter(u => u.status === 'active').length}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Active status users</div>
                </div>

                {/* Admin Users */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    borderRadius: 8,
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    background: 'rgba(239, 68, 68, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#f87171', letterSpacing: '1px' }}>
                      ADMIN USERS
                    </span>
                    <Crown size={18} color="#ef4444" />
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#f8fafc' }}>
                    {adminStats.adminUsers || usersList.filter(u => u.role === 'admin').length}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Overseer administrators</div>
                </div>

                {/* Total Monsters */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    borderRadius: 8,
                    border: '1px solid rgba(234, 179, 8, 0.35)',
                    background: 'rgba(234, 179, 8, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#facc15', letterSpacing: '1px' }}>
                      TOTAL MONSTERS
                    </span>
                    <Skull size={18} color="#eab308" />
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#f8fafc' }}>
                    {adminStats.totalMonsters || monsters.length || 5}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Registered enemy types</div>
                </div>

                {/* Total Shadows */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    borderRadius: 8,
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    background: 'rgba(168, 85, 247, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#c084fc', letterSpacing: '1px' }}>
                      TOTAL SHADOWS
                    </span>
                    <Ghost size={18} color="#a855f7" />
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#f8fafc' }}>
                    {adminStats.totalShadows || shadows.length || 5}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Shadow army definitions</div>
                </div>

                {/* Total Quests */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    borderRadius: 8,
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    background: 'rgba(59, 130, 246, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#60a5fa', letterSpacing: '1px' }}>
                      TOTAL QUESTS
                    </span>
                    <ScrollText size={18} color="#3b82f6" />
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#f8fafc' }}>
                    {adminStats.totalQuests || quests.length || 5}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Active hunter quests</div>
                </div>

                {/* Total Dungeons */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    borderRadius: 8,
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    background: 'rgba(244, 63, 94, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#fb7185', letterSpacing: '1px' }}>
                      TOTAL DUNGEONS
                    </span>
                    <Castle size={18} color="#f43f5e" />
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#f8fafc' }}>
                    {adminStats.totalDungeons || dungeons.length || 1}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Crypt configurations</div>
                </div>
              </div>

              {/* Recent Activity Audit Log */}
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.09)', marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: '1.5px', color: '#f8fafc' }}>
                    RECENT ACTIVITY
                  </h3>
                  <span style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '1px' }}>
                    ADMIN AUDIT LOGS
                  </span>
                </div>

                {adminStats.recentActivity && adminStats.recentActivity.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {adminStats.recentActivity.slice(0, 8).map((log, idx) => {
                      const isRole = log.action === 'ROLE_CHANGED';
                      const isAct = log.action === 'USER_ACTIVATED';
                      const isDeact = log.action === 'USER_DEACTIVATED';
                      const isPwd = log.action === 'PASSWORD_RESET_REQUESTED';
                      const badgeColor = isRole ? '#c084fc' : isAct ? '#4ade80' : isDeact ? '#f87171' : '#facc15';
                      const badgeBg = isRole ? 'rgba(168, 85, 247, 0.15)' : isAct ? 'rgba(34, 197, 94, 0.15)' : isDeact ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)';

                      return (
                        <div
                          key={log.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: 6,
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            fontSize: 12,
                            gap: 12
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                background: badgeBg,
                                color: badgeColor,
                                fontSize: 10,
                                fontWeight: 800,
                                letterSpacing: '1px'
                              }}
                            >
                              {log.action}
                            </span>
                            <span style={{ color: '#cbd5e1' }}>
                              Target: <strong style={{ color: '#f8fafc' }}>{log.targetUserId}</strong>
                              {log.newRole && <span style={{ color: '#94a3b8' }}> → {log.newRole.toUpperCase()}</span>}
                            </span>
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: 11 }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13, background: 'rgba(255, 255, 255, 0.02)', borderRadius: 6 }}>
                    No recent administrative activity recorded. User role transitions and status changes will appear here.
                  </div>
                )}
              </div>

              {/* Overseer Command Shortcuts */}
              <div className="glass-panel" style={{ padding: '28px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.09)', marginBottom: 32 }}>
                <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '1.5px' }}>
                  OVERSEER COMMAND SHORTCUTS
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  <button
                    onClick={() => navigate('/admin/users')}
                    style={{
                      padding: '16px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      color: '#f8fafc',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c084fc', fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
                      <Users size={16} /> MANAGE USER ACCOUNTS
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      Create player accounts, reset passwords, toggle access, and inspect profiles.
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/admin/monsters')}
                    style={{
                      padding: '16px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f8fafc',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
                      <Skull size={16} /> CONFIGURE MONSTERS
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      Modify enemy attack power, health pools, speed, and drop rates.
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/admin/dungeons')}
                    style={{
                      padding: '16px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#f8fafc',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#60a5fa', fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
                      <Castle size={16} /> DUNGEON BALANCING
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      Configure Room 1, Room 2, and Boss room enemy density and boss HP.
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: USERS (USER MANAGEMENT) */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div>
              {/* Action Error Alert */}
              {actionError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: 6,
                    color: '#fca5a5',
                    fontSize: 13,
                    marginBottom: 16
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                    <span>{actionError}</span>
                  </div>
                  <button
                    onClick={() => setActionError('')}
                    style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', display: 'flex' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: '1px' }}>
                    USER MANAGEMENT
                  </h2>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    Administer player accounts, inspect game progress, control access status, and reset passwords.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {/* Search */}
                  <div style={{ position: 'relative', width: 220 }}>
                    <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      id="admin-search-users-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 6,
                        color: '#f8fafc',
                        fontSize: 12,
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Role Filter */}
                  <select
                    id="admin-filter-role"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{
                      padding: '9px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 6,
                      color: '#f8fafc',
                      fontSize: 12,
                      outline: 'none'
                    }}
                  >
                    <option value="all" style={{ backgroundColor: '#0f172a' }}>All Roles</option>
                    <option value="user" style={{ backgroundColor: '#0f172a' }}>USER</option>
                    <option value="admin" style={{ backgroundColor: '#0f172a' }}>ADMIN</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    id="admin-filter-status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      padding: '9px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 6,
                      color: '#f8fafc',
                      fontSize: 12,
                      outline: 'none'
                    }}
                  >
                    <option value="all" style={{ backgroundColor: '#0f172a' }}>All Statuses</option>
                    <option value="active" style={{ backgroundColor: '#0f172a' }}>ACTIVE</option>
                    <option value="inactive" style={{ backgroundColor: '#0f172a' }}>INACTIVE</option>
                  </select>

                  <button
                    id="admin-create-user-btn"
                    onClick={() => {
                      setCreateUserError('');
                      setCreateUserData({
                        displayName: '',
                        email: '',
                        password: `Temp_${Math.random().toString(36).substring(2, 8)}!`
                      });
                      setShowCreateUserModal(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 18px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                      border: '1px solid #f87171',
                      borderRadius: 6,
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      letterSpacing: '1px',
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <Plus size={16} /> + CREATE USER
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="glass-panel" style={{ borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                      <th style={{ padding: '14px 16px' }}>AVATAR</th>
                      <th style={{ padding: '14px 16px' }}>DISPLAY NAME</th>
                      <th style={{ padding: '14px 16px' }}>EMAIL</th>
                      <th style={{ padding: '14px 16px' }}>UID</th>
                      <th style={{ padding: '14px 16px' }}>ROLE</th>
                      <th style={{ padding: '14px 16px' }}>STATUS</th>
                      <th style={{ padding: '14px 16px' }}>CREATED</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList
                      .filter((u) => {
                        const q = searchQuery.toLowerCase();
                        const matchesQuery =
                          !q ||
                          u.displayName?.toLowerCase().includes(q) ||
                          u.email?.toLowerCase().includes(q) ||
                          u.id?.toLowerCase().includes(q) ||
                          u.status?.toLowerCase().includes(q);

                        const matchesRole =
                          roleFilter === 'all' ||
                          (roleFilter === 'admin' ? u.role === 'admin' : u.role !== 'admin');

                        const matchesStatus =
                          statusFilter === 'all' ||
                          (statusFilter === 'active' ? u.status === 'active' : (u.status === 'inactive' || u.status === 'disabled'));

                        return matchesQuery && matchesRole && matchesStatus;
                      })
                      .map((u) => {
                        const isActive = u.status === 'active';
                        const isTargetSelf = u.id === user?.id || u.email === user?.email;
                        const avatarLetter = (u.displayName || u.email || 'U').charAt(0).toUpperCase();

                        return (
                          <tr
                            key={u.id}
                            style={{
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                              transition: 'background 0.15s'
                            }}
                          >
                            <td style={{ padding: '14px 16px' }}>
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(168, 85, 247, 0.25)',
                                  border: u.role === 'admin' ? '1px solid #ef4444' : '1px solid #a855f7',
                                  color: u.role === 'admin' ? '#f87171' : '#c084fc',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: 12
                                }}
                              >
                                {avatarLetter}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', fontWeight: 800, color: '#f8fafc' }}>
                              {u.displayName}
                            </td>
                            <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                              {u.email}
                            </td>
                            <td style={{ padding: '14px 16px', color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>
                              {u.id ? (u.id.length > 14 ? `${u.id.substring(0, 12)}...` : u.id) : 'N/A'}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                                  color: u.role === 'admin' ? '#f87171' : '#c084fc',
                                  fontSize: 10,
                                  fontWeight: 800,
                                  letterSpacing: '1px'
                                }}
                              >
                                {u.role === 'admin' ? 'ADMIN' : 'USER'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  border: isActive ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                                  color: isActive ? '#4ade80' : '#f87171',
                                  fontSize: 10,
                                  fontWeight: 800,
                                  letterSpacing: '1px'
                                }}
                              >
                                {isActive ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: 12 }}>
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                                <Link
                                  to={`/admin/users/${u.id}`}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: 4,
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    border: '1px solid #3b82f6',
                                    color: '#60a5fa',
                                    fontSize: 11,
                                    fontWeight: 800,
                                    textDecoration: 'none',
                                    letterSpacing: '0.8px'
                                  }}
                                >
                                  VIEW
                                </Link>

                                {!isTargetSelf ? (
                                  <>
                                    <button
                                      id={`admin-role-toggle-${u.id}`}
                                      onClick={() => handleToggleUserRole(u)}
                                      title={u.role === 'admin' ? 'DEMOTE TO USER' : 'PROMOTE TO ADMIN'}
                                      style={{
                                        padding: '6px 10px',
                                        borderRadius: 4,
                                        background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                                        border: u.role === 'admin' ? '1px solid #ef4444' : '1px solid #a855f7',
                                        color: u.role === 'admin' ? '#f87171' : '#c084fc',
                                        fontSize: 11,
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        letterSpacing: '0.8px'
                                      }}
                                    >
                                      {u.role === 'admin' ? 'DEMOTE' : 'PROMOTE'}
                                    </button>

                                    <button
                                      onClick={() => handleToggleUserStatus(u)}
                                      style={{
                                        padding: '6px 10px',
                                        borderRadius: 4,
                                        background: isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                        border: isActive ? '1px solid #ef4444' : '1px solid #22c55e',
                                        color: isActive ? '#f87171' : '#4ade80',
                                        fontSize: 11,
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        letterSpacing: '0.8px'
                                      }}
                                    >
                                      {isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                                    </button>

                                    <button
                                      onClick={() => {
                                        setResetPasswordTarget(u);
                                        setResetPasswordValue(`Temp_${Math.random().toString(36).substring(2, 8)}!`);
                                        setResetPasswordResult('');
                                      }}
                                      style={{
                                        padding: '6px 10px',
                                        borderRadius: 4,
                                        background: 'rgba(234, 179, 8, 0.15)',
                                        border: '1px solid #eab308',
                                        color: '#facc15',
                                        fontSize: 11,
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        letterSpacing: '0.8px'
                                      }}
                                    >
                                      RESET PASSWORD
                                    </button>
                                  </>
                                ) : (
                                  <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', padding: '6px 8px' }}>
                                    (CURRENT ADMIN)
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    {usersList.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                          No users created yet. Click "+ CREATE USER" above to provision player accounts.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SHADOWS */}
          {/* ========================================================================= */}
          {activeTab === 'shadows' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 800, margin: 0 }}>
                    SHADOW SOLDIER REGISTRY
                  </h2>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    Configure extractable shadow forms, summon costs, and soldier combat attributes.
                  </div>
                </div>

                <button
                  onClick={() =>
                    setEditingShadow({
                      id: `shadow_${Date.now()}`,
                      name: 'New Shadow',
                      rank: 'B',
                      role: 'Warrior',
                      baseHp: 1200,
                      baseMp: 500,
                      attack: 70,
                      defense: 25,
                      speed: 4.5,
                      summonCost: 60,
                      status: 'active',
                      description: 'Custom shadow soldier extracted from a fallen crypt enemy.'
                    })
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: '#9333ea',
                    border: '1px solid #c084fc',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    letterSpacing: '1px'
                  }}
                >
                  <Plus size={16} /> ADD SHADOW
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
                {shadows.map((shadow) => (
                  <div
                    key={shadow.id}
                    className="glass-panel"
                    style={{
                      padding: '20px',
                      borderRadius: 8,
                      border: '1px solid rgba(168, 85, 247, 0.35)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: 'rgba(168, 85, 247, 0.2)',
                            color: '#c084fc',
                            fontSize: 11,
                            fontWeight: 800
                          }}
                        >
                          RANK {shadow.rank}
                        </span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{shadow.role}</span>
                      </div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#f8fafc' }}>{shadow.name}</h3>
                      <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                        {shadow.description}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, marginBottom: 16 }}>
                        <div>HP: <b style={{ color: '#10b981' }}>{shadow.baseHp || shadow.hp || 1000}</b></div>
                        <div>ATK: <b style={{ color: '#ef4444' }}>{shadow.attack}</b></div>
                        <div>DEF: <b style={{ color: '#38bdf8' }}>{shadow.defense}</b></div>
                        <div>MP COST: <b style={{ color: '#c084fc' }}>{shadow.summonCost || 60}</b></div>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingShadow({ ...shadow })}
                      style={{
                        padding: '8px',
                        borderRadius: 6,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#f8fafc',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      EDIT ATTRIBUTES
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: MONSTERS */}
          {/* ========================================================================= */}
          {activeTab === 'monsters' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 800, margin: 0 }}>
                    MONSTER THREAT DIRECTORY
                  </h2>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    Adjust enemy tier stats, health pools, combat rewards, and danger scaling.
                  </div>
                </div>

                <button
                  onClick={() =>
                    setEditingMonster({
                      id: `monster_${Date.now()}`,
                      name: 'New Monster',
                      tier: 'weak',
                      rank: 'E',
                      hp: 150,
                      attack: 20,
                      defense: 6,
                      speed: 3.2,
                      xpReward: 35,
                      goldReward: 15,
                      status: 'active',
                      description: 'Hostile beast roaming the crypt corridors.'
                    })
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: '#dc2626',
                    border: '1px solid #f87171',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    letterSpacing: '1px'
                  }}
                >
                  <Plus size={16} /> ADD MONSTER
                </button>
              </div>

              <div className="glass-panel" style={{ borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 16px' }}>NAME</th>
                      <th style={{ padding: '12px 16px' }}>TIER</th>
                      <th style={{ padding: '12px 16px' }}>RANK</th>
                      <th style={{ padding: '12px 16px' }}>HP</th>
                      <th style={{ padding: '12px 16px' }}>ATK</th>
                      <th style={{ padding: '12px 16px' }}>DEF</th>
                      <th style={{ padding: '12px 16px' }}>XP</th>
                      <th style={{ padding: '12px 16px' }}>STATUS</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monsters.map((monster) => (
                      <tr key={monster.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: '#f8fafc' }}>{monster.name}</td>
                        <td style={{ padding: '12px 16px', textTransform: 'uppercase', color: '#94a3b8' }}>{monster.tier}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: '#f59e0b' }}>{monster.rank}</td>
                        <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 700 }}>{monster.hp}</td>
                        <td style={{ padding: '12px 16px', color: '#ef4444', fontWeight: 700 }}>{monster.attack}</td>
                        <td style={{ padding: '12px 16px', color: '#38bdf8' }}>{monster.defense}</td>
                        <td style={{ padding: '12px 16px', color: '#c084fc', fontWeight: 700 }}>+{monster.xpReward} XP</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ color: monster.status !== 'disabled' ? '#10b981' : '#94a3b8', fontSize: 11, fontWeight: 700 }}>
                            {monster.status !== 'disabled' ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => setEditingMonster({ ...monster })}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 4,
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#f8fafc',
                              fontSize: 11,
                              cursor: 'pointer',
                              marginRight: 6
                            }}
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => handleDeleteMonster(monster.id)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: 4,
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#f87171',
                              fontSize: 11,
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: QUESTS */}
          {/* ========================================================================= */}
          {activeTab === 'quests' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 800, margin: 0 }}>
                    QUEST & BOUNTY REGISTRY
                  </h2>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    Configure main storyline objectives, daily cleanses, and reward distribution.
                  </div>
                </div>

                <button
                  onClick={() =>
                    setEditingQuest({
                      id: `quest_${Date.now()}`,
                      title: 'NEW BOUNTY',
                      type: 'daily',
                      description: 'Exterminate the lurking shadows within the crypt depths.',
                      objectives: [{ id: 'slay_enemies', text: 'Defeat enemies', current: 0, target: 12 }],
                      rewards: { xp: 400, gold: 120, shadowCores: 2 },
                      status: 'active'
                    })
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: '#0284c7',
                    border: '1px solid #38bdf8',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    letterSpacing: '1px'
                  }}
                >
                  <Plus size={16} /> ADD QUEST
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
                {quests.map((quest) => (
                  <div
                    key={quest.id}
                    className="glass-panel"
                    style={{
                      padding: '20px',
                      borderRadius: 8,
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: 'uppercase'
                          }}
                        >
                          {quest.type || 'MAIN'} QUEST
                        </span>
                      </div>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: 16, color: '#f8fafc' }}>{quest.title}</h3>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                        {quest.description}
                      </p>

                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>OBJECTIVES:</div>
                        {Array.isArray(quest.objectives) &&
                          quest.objectives.map((obj, i) => (
                            <div key={i} style={{ fontSize: 12, color: '#94a3b8' }}>
                              &bull; {obj.text} (Target: {obj.target})
                            </div>
                          ))}
                      </div>

                      <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(255, 255, 255, 0.04)', fontSize: 12, marginBottom: 16 }}>
                        <span style={{ color: '#fbbf24', fontWeight: 700 }}>REWARDS:</span>{' '}
                        +{quest.rewards?.xp || 0} XP, +{quest.rewards?.gold || 0} Gold
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingQuest({ ...quest })}
                      style={{
                        padding: '8px',
                        borderRadius: 6,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#f8fafc',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      EDIT DIRECTIVES
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: DUNGEONS */}
          {/* ========================================================================= */}
          {activeTab === 'dungeons' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 800, margin: 0 }}>
                    DUNGEON ARCHITECTURE & BALANCING
                  </h2>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    Configure room transition triggers, enemy counts, boss scaling, and room clearance rewards.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                {dungeons.map((dung) => (
                  <div
                    key={dung.id}
                    className="glass-panel"
                    style={{
                      padding: 24,
                      borderRadius: 10,
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      background: 'linear-gradient(135deg, rgba(14, 25, 45, 0.7) 0%, rgba(8, 14, 25, 0.85) 100%)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          border: '1px solid #3b82f6',
                          color: '#60a5fa',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 800
                        }}
                      >
                        RANK {dung.rank} &bull; {dung.difficulty}
                      </span>
                      <Castle size={20} color="#60a5fa" />
                    </div>

                    <h3 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 900, color: '#f8fafc' }}>
                      {dung.name}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, fontSize: 12 }}>
                      <div style={{ padding: 8, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
                        <div style={{ color: '#94a3b8' }}>TOTAL ROOMS</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>{dung.totalRooms}</div>
                      </div>
                      <div style={{ padding: 8, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
                        <div style={{ color: '#94a3b8' }}>ROOM 1 ENEMIES</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#f87171' }}>{dung.room1Enemies}</div>
                      </div>
                      <div style={{ padding: 8, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
                        <div style={{ color: '#94a3b8' }}>ROOM 2 ENEMIES</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#f87171' }}>{dung.room2Enemies}</div>
                      </div>
                      <div style={{ padding: 8, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
                        <div style={{ color: '#94a3b8' }}>BOSS HEALTH</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#facc15' }}>{dung.bossHp} HP</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingDungeon({ ...dung })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: 6,
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid #3b82f6',
                        color: '#60a5fa',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        letterSpacing: '1px'
                      }}
                    >
                      EDIT DUNGEON CONFIG
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: SETTINGS */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && gameConfig && (
            <div style={{ maxWidth: 640 }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 800, margin: 0 }}>
                  REALM BALANCE & GAME MULTIPLIERS
                </h2>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  Tweak system drop rates, combat difficulty, and maintenance flags.
                </div>
              </div>

              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* XP Multiplier */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                    <span>XP GAIN MULTIPLIER</span>
                    <span style={{ color: '#c084fc' }}>{gameConfig.xpMultiplier}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={gameConfig.xpMultiplier}
                    onChange={(e) => setGameConfig({ ...gameConfig, xpMultiplier: parseFloat(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Gold Multiplier */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                    <span>GOLD DROP MULTIPLIER</span>
                    <span style={{ color: '#facc15' }}>{gameConfig.goldMultiplier}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={gameConfig.goldMultiplier}
                    onChange={(e) => setGameConfig({ ...gameConfig, goldMultiplier: parseFloat(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Difficulty */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                    COMBAT DIFFICULTY TIER
                  </label>
                  <select
                    value={gameConfig.difficulty}
                    onChange={(e) => setGameConfig({ ...gameConfig, difficulty: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 6,
                      color: '#f8fafc',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  >
                    <option value="Normal" style={{ background: '#0a0a14' }}>Normal - Standard Awakening</option>
                    <option value="Hard" style={{ background: '#0a0a14' }}>Hard - Punishing Lethality</option>
                    <option value="Nightmare" style={{ background: '#0a0a14' }}>Nightmare - Monarch Trial</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '14px',
                    borderRadius: 6,
                    background: '#dc2626',
                    border: '1px solid #f87171',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    letterSpacing: '1px'
                  }}
                >
                  <Save size={16} /> {saving ? 'COMMITTING SETTINGS...' : 'SAVE CONFIGURATION'}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: STATISTICS */}
          {/* ========================================================================= */}
          {activeTab === 'statistics' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 800, margin: 0 }}>
                  TELEMETRY & COMBAT ANALYTICS
                </h2>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  Aggregate system performance and player combat metrics stored in database.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                <div className="glass-panel" style={{ padding: 24, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, marginBottom: 8 }}>USER DISTRIBUTION</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: '#4ade80' }}>Active Accounts</span>
                        <b>{adminStats.activeUsers}</b>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 3 }}>
                        <div style={{ width: `${(adminStats.activeUsers / (adminStats.totalUsers || 1)) * 100}%`, height: '100%', background: '#22c55e', borderRadius: 3 }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: '#f87171' }}>Disabled Accounts</span>
                        <b>{adminStats.disabledUsers}</b>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 3 }}>
                        <div style={{ width: `${(adminStats.disabledUsers / (adminStats.totalUsers || 1)) * 100}%`, height: '100%', background: '#ef4444', borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: 24, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, marginBottom: 8 }}>COMBAT METRICS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ color: '#94a3b8' }}>Total Monsters Slain:</span>
                      <b style={{ color: '#facc15' }}>{adminStats.totalMonstersDefeated}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ color: '#94a3b8' }}>Dungeons Cleared:</span>
                      <b style={{ color: '#38bdf8' }}>{adminStats.totalDungeonsCompleted}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                      <span style={{ color: '#94a3b8' }}>Shadows Commanded:</span>
                      <b style={{ color: '#c084fc' }}>{adminStats.totalShadows}</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE PLAYER ACCOUNT */}
      {/* ========================================================================= */}
      {showCreateUserModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            zIndex: 100
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: 460,
              padding: 32,
              borderRadius: 12,
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: '#0e0814',
              boxShadow: '0 0 40px rgba(239, 68, 68, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 900, margin: 0, color: '#f8fafc' }}>
                CREATE PLAYER ACCOUNT
              </h2>
              <button
                onClick={() => setShowCreateUserModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {createUserError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 6,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#fca5a5',
                  fontSize: 12,
                  marginBottom: 16
                }}
              >
                <AlertTriangle size={16} />
                <span>{createUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#cbd5e1', letterSpacing: '1px', marginBottom: 6 }}>
                  PLAYER NAME
                </label>
                <input
                  id="create-user-name-input"
                  type="text"
                  value={createUserData.displayName}
                  onChange={(e) => setCreateUserData({ ...createUserData, displayName: e.target.value })}
                  placeholder="e.g. YESWANTH"
                  required
                  style={{
                    width: '100%',
                    padding: '11px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none'
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
                  value={createUserData.email}
                  onChange={(e) => setCreateUserData({ ...createUserData, email: e.target.value })}
                  placeholder="hunter@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '11px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none'
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
                      setCreateUserData({
                        ...createUserData,
                        password: `Temp_${Math.random().toString(36).substring(2, 8)}!`
                      })
                    }
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Generate
                  </button>
                </div>
                <input
                  id="create-user-password-input"
                  type="text"
                  value={createUserData.password}
                  onChange={(e) => setCreateUserData({ ...createUserData, password: e.target.value })}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '11px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontSize: 13,
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>ASSIGNED ROLE:</span>
                <span style={{ color: '#c084fc', fontWeight: 800 }}>USER (PLAYER)</span>
              </div>

              <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>STATUS:</span>
                <span style={{ color: '#4ade80', fontWeight: 800 }}>ACTIVE</span>
              </div>

              <button
                id="create-user-submit-btn"
                type="submit"
                style={{
                  marginTop: 8,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  border: '1px solid #f87171',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: '1px',
                  cursor: 'pointer'
                }}
              >
                CREATE USER
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESET PASSWORD */}
      {/* ========================================================================= */}
      {resetPasswordTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            zIndex: 100
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: 440,
              padding: 28,
              borderRadius: 12,
              border: '1px solid rgba(234, 179, 8, 0.4)',
              background: '#0e0b12'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 900, margin: 0, color: '#f8fafc' }}>
                RESET USER PASSWORD
              </h2>
              <button
                onClick={() => setResetPasswordTarget(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              Reset credentials for <strong style={{ color: '#f8fafc' }}>{resetPasswordTarget.displayName}</strong> ({resetPasswordTarget.email}).
            </p>

            {resetPasswordResult ? (
              <div style={{ padding: 16, background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 800, marginBottom: 4 }}>NEW TEMPORARY PASSWORD:</div>
                <div style={{ fontFamily: 'monospace', fontSize: 18, color: '#ffffff', fontWeight: 900, background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: 4 }}>
                  {resetPasswordResult}
                </div>
                <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 8 }}>
                  Give this password to the player. Password has been updated securely.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1', letterSpacing: '1px' }}>
                      NEW TEMPORARY PASSWORD
                    </label>
                    <button
                      type="button"
                      onClick={() => setResetPasswordValue(`Hunt_${Math.random().toString(36).substring(2, 8)}!`)}
                      style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 6,
                      color: '#ffffff',
                      fontSize: 13,
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  onClick={handleResetPasswordConfirm}
                  style={{
                    marginTop: 8,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                    border: '1px solid #facc15',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: 13,
                    letterSpacing: '1px',
                    cursor: 'pointer'
                  }}
                >
                  CONFIRM RESET
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT MONSTER */}
      {/* ========================================================================= */}
      {editingMonster && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 480, padding: 28, borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.4)', background: '#0e0814' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 900, margin: 0 }}>EDIT MONSTER</h2>
              <button onClick={() => setEditingMonster(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMonster} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>NAME</label>
                <input
                  type="text"
                  value={editingMonster.name}
                  onChange={(e) => setEditingMonster({ ...editingMonster, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>HP</label>
                  <input
                    type="number"
                    value={editingMonster.hp}
                    onChange={(e) => setEditingMonster({ ...editingMonster, hp: parseInt(e.target.value) || 100 })}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>ATTACK</label>
                  <input
                    type="number"
                    value={editingMonster.attack}
                    onChange={(e) => setEditingMonster({ ...editingMonster, attack: parseInt(e.target.value) || 10 })}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#fff' }}
                  />
                </div>
              </div>

              <button type="submit" style={{ padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>
                SAVE MONSTER
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EDIT SHADOW */}
      {/* ========================================================================= */}
      {editingShadow && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 480, padding: 28, borderRadius: 12, border: '1px solid rgba(168, 85, 247, 0.4)', background: '#0e0814' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 900, margin: 0 }}>EDIT SHADOW SOLDIER</h2>
              <button onClick={() => setEditingShadow(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveShadow} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>NAME</label>
                <input
                  type="text"
                  value={editingShadow.name}
                  onChange={(e) => setEditingShadow({ ...editingShadow, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>SUMMON MP COST</label>
                  <input
                    type="number"
                    value={editingShadow.summonCost}
                    onChange={(e) => setEditingShadow({ ...editingShadow, summonCost: parseInt(e.target.value) || 50 })}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>ATTACK</label>
                  <input
                    type="number"
                    value={editingShadow.attack}
                    onChange={(e) => setEditingShadow({ ...editingShadow, attack: parseInt(e.target.value) || 50 })}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#fff' }}
                  />
                </div>
              </div>

              <button type="submit" style={{ padding: '10px', background: '#9333ea', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>
                SAVE SHADOW
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT DUNGEON */}
      {/* ========================================================================= */}
      {editingDungeon && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 480, padding: 28, borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.4)', background: '#0e0814' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 900, margin: 0 }}>EDIT DUNGEON CONFIG</h2>
              <button onClick={() => setEditingDungeon(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDungeon} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>DUNGEON NAME</label>
                <input
                  type="text"
                  value={editingDungeon.name}
                  onChange={(e) => setEditingDungeon({ ...editingDungeon, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>ROOM 1 ENEMIES</label>
                  <input
                    type="number"
                    value={editingDungeon.room1Enemies}
                    onChange={(e) => setEditingDungeon({ ...editingDungeon, room1Enemies: parseInt(e.target.value) || 8 })}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>ROOM 2 ENEMIES</label>
                  <input
                    type="number"
                    value={editingDungeon.room2Enemies}
                    onChange={(e) => setEditingDungeon({ ...editingDungeon, room2Enemies: parseInt(e.target.value) || 10 })}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>BOSS HEALTH (HP)</label>
                <input
                  type="number"
                  value={editingDungeon.bossHp}
                  onChange={(e) => setEditingDungeon({ ...editingDungeon, bossHp: parseInt(e.target.value) || 3200 })}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#fff' }}
                />
              </div>

              <button type="submit" style={{ padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>
                SAVE DUNGEON
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminControlCenter;

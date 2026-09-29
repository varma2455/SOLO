// -------------------------------------------------------------
// SHADOW ASCENSION - SHADOW ARMY MANAGEMENT PAGE
// Route: /admin/shadows
// Manage summonable shadow soldiers, stats, summon costs, roles
// -------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authFetch } from '../../context/AuthContext';
import {
  Ghost,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Swords,
  Shield,
  Heart,
  Zap,
  Sparkles,
  Flame
} from 'lucide-react';

const rankColors = {
  E: '#94a3b8',
  D: '#4ade80',
  C: '#38bdf8',
  B: '#c084fc',
  A: '#facc15',
  S: '#f97316',
  SS: '#ef4444',
  General: '#ec4899',
  Marshal: '#dc2626'
};

export const AdminShadows = () => {
  const [searchParams] = useSearchParams();
  const [shadows, setShadows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rankFilter, setRankFilter] = useState('all');

  const [notification, setNotification] = useState({ text: '', type: '' });
  const [editingShadow, setEditingShadow] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('create') === 'true');
  const [saving, setSaving] = useState(false);

  const [newShadow, setNewShadow] = useState({
    id: '',
    name: '',
    rank: 'C',
    role: 'Melee Infantry',
    baseHp: 900,
    baseMp: 500,
    attack: 70,
    defense: 20,
    speed: 4.5,
    summonCost: 55,
    cooldown: 1.0,
    status: 'active',
    description: ''
  });

  const notify = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: '', type: '' }), 4000);
  };

  const loadShadows = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/shadows');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.shadows)) {
          setShadows(data.shadows);
        }
      }
    } catch (err) {
      notify('Failed to load shadow definitions: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShadows();
  }, []);

  const handleSaveShadow = async (shadowToSave) => {
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/shadows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shadowToSave)
      });
      if (!res.ok) throw new Error('Error saving shadow definition.');
      notify(`Shadow soldier "${shadowToSave.name}" successfully registered!`, 'success');
      setEditingShadow(null);
      setShowCreateModal(false);
      await loadShadows();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShadow = async (id, name) => {
    if (!window.confirm(`Are you sure you want to dismiss shadow soldier "${name}" from the army?`)) return;
    try {
      const res = await authFetch(`/api/admin/shadows/${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify(`Shadow "${name}" removed from registry.`, 'success');
        await loadShadows();
      } else {
        throw new Error('Failed to delete.');
      }
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDuplicateShadow = async (s) => {
    const cloneId = `${s.id}_clone_${Date.now().toString().slice(-4)}`;
    const cloned = {
      ...s,
      id: cloneId,
      name: `${s.name} (Copy)`
    };
    await handleSaveShadow(cloned);
  };

  const filteredShadows = shadows.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.role?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q);

    const matchesRank = rankFilter === 'all' || s.rank === rankFilter;
    return matchesSearch && matchesRank;
  });

  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Title Bar */}
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
            SHADOW ARMY
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 13, letterSpacing: '0.5px' }}>
            MANAGE SUMMONABLE SHADOWS &middot; STAT BALANCING & MP INVOCATION COSTS
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={loadShadows}
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
            onClick={() => {
              setNewShadow({
                id: `shadow_${Date.now()}`,
                name: '',
                rank: 'C',
                role: 'Infantry Soldier',
                baseHp: 900,
                baseMp: 500,
                attack: 70,
                defense: 20,
                speed: 4.5,
                summonCost: 55,
                cooldown: 1.0,
                status: 'active',
                description: ''
              });
              setShowCreateModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 6,
              background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
              border: '1px solid #c084fc',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(168, 85, 247, 0.35)'
            }}
          >
            <Plus size={16} /> CREATE SHADOW
          </button>
        </div>
      </div>

      {/* Toast */}
      {notification.text && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 6,
            backgroundColor: notification.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            border: `1px solid ${notification.type === 'error' ? '#ef4444' : '#22c55e'}`,
            color: notification.type === 'error' ? '#fca5a5' : '#4ade80',
            fontSize: 13,
            fontWeight: 700
          }}
        >
          {notification.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{notification.text}</span>
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
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shadow army by name or role..."
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>RANK:</span>
          <select
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 6,
              color: '#f8fafc',
              fontSize: 12,
              outline: 'none'
            }}
          >
            <option value="all" style={{ background: '#0a0a14' }}>All Ranks</option>
            {['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'General', 'Marshal'].map((r) => (
              <option key={r} value={r} style={{ background: '#0a0a14' }}>Rank {r}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>
          Registered Shadows: <strong>{filteredShadows.length}</strong>
        </div>
      </div>

      {/* Shadows Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            <RefreshCw size={24} className="animate-spin" color="#a855f7" style={{ margin: '0 auto 8px' }} />
            <div>Summoning shadow registry...</div>
          </div>
        ) : filteredShadows.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: 36, textAlign: 'center', color: '#94a3b8' }}>
            No shadow soldiers match your search criteria.
          </div>
        ) : (
          filteredShadows.map((s) => {
            const rankColor = rankColors[s.rank] || '#c084fc';
            return (
              <div
                key={s.id}
                style={{
                  padding: 20,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(25, 12, 38, 0.7) 0%, rgba(12, 6, 20, 0.9) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.1)',
                  transition: 'transform 0.15s, border-color 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = rankColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                }}
              >
                <div>
                  {/* Top Bar: Icon, Name, Rank Badge */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: 'rgba(168, 85, 247, 0.25)',
                          border: `1px solid ${rankColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 0 10px ${rankColor}44`
                        }}
                      >
                        <Ghost size={22} color={rankColor} />
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 16, fontWeight: 900, margin: 0, color: '#f8fafc' }}>
                          {s.name}
                        </h3>
                        <div style={{ fontSize: 11, color: '#c084fc', fontWeight: 700 }}>
                          {s.role || 'Shadow Warrior'}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: '1px',
                        backgroundColor: `${rankColor}22`,
                        color: rankColor,
                        border: `1px solid ${rankColor}`
                      }}
                    >
                      RANK {s.rank}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4, margin: '0 0 14px 0', minHeight: 34 }}>
                    {s.description || 'Loyal extract summoned from the abyss under the Monarch.'}
                  </p>

                  {/* Attributes Matrix */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      padding: 12,
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 6,
                      fontSize: 11,
                      marginBottom: 16
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fca5a5' }}>
                      <Heart size={13} color="#ef4444" />
                      <span>HP: <strong>{s.baseHp || 900}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c084fc' }}>
                      <Swords size={13} color="#c084fc" />
                      <span>ATK: <strong>{s.attack}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#93c5fd' }}>
                      <Shield size={13} color="#3b82f6" />
                      <span>DEF: <strong>{s.defense || 15}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8' }}>
                      <Zap size={13} color="#38bdf8" />
                      <span>MP COST: <strong>{s.summonCost || 50}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 12 }}>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: 3,
                      fontSize: 9,
                      fontWeight: 800,
                      backgroundColor: s.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: s.status === 'active' ? '#4ade80' : '#f87171'
                    }}
                  >
                    {(s.status || 'active').toUpperCase()}
                  </span>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setEditingShadow({ ...s })}
                      title="Edit Shadow Soldier"
                      style={{
                        padding: '6px 9px',
                        borderRadius: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Edit size={13} />
                    </button>

                    <button
                      onClick={() => handleDuplicateShadow(s)}
                      title="Duplicate Shadow"
                      style={{
                        padding: '6px 9px',
                        borderRadius: 4,
                        backgroundColor: 'rgba(168, 85, 247, 0.15)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        color: '#c084fc',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Copy size={13} />
                    </button>

                    <button
                      onClick={() => handleDeleteShadow(s.id, s.name)}
                      title="Dismiss Shadow Soldier"
                      style={{
                        padding: '6px 9px',
                        borderRadius: 4,
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT SHADOW MODAL */}
      {(showCreateModal || editingShadow) && (
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
              maxWidth: 520,
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto',
              boxSizing: 'border-box',
              padding: 28,
              borderRadius: 12,
              border: '1px solid rgba(168, 85, 247, 0.4)',
              background: '#0d0918',
              boxShadow: '0 0 36px rgba(168, 85, 247, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 18, fontWeight: 900, margin: 0, color: '#ffffff' }}>
                {editingShadow ? 'EDIT SHADOW SOLDIER' : 'SUMMON NEW SHADOW'}
              </h2>
              <button
                onClick={() => {
                  setEditingShadow(null);
                  setShowCreateModal(false);
                }}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveShadow(editingShadow || newShadow);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>SHADOW NAME</label>
                <input
                  type="text"
                  required
                  value={editingShadow ? editingShadow.name : newShadow.name}
                  onChange={(e) => {
                    if (editingShadow) setEditingShadow({ ...editingShadow, name: e.target.value });
                    else setNewShadow({ ...newShadow, name: e.target.value });
                  }}
                  placeholder="e.g. Igris the Bloodred"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>ROLE / CLASS</label>
                  <input
                    type="text"
                    required
                    value={editingShadow ? editingShadow.role : newShadow.role}
                    onChange={(e) => {
                      if (editingShadow) setEditingShadow({ ...editingShadow, role: e.target.value });
                      else setNewShadow({ ...newShadow, role: e.target.value });
                    }}
                    placeholder="e.g. Commander Knight"
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>RANK</label>
                  <select
                    value={editingShadow ? editingShadow.rank : newShadow.rank}
                    onChange={(e) => {
                      if (editingShadow) setEditingShadow({ ...editingShadow, rank: e.target.value });
                      else setNewShadow({ ...newShadow, rank: e.target.value });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  >
                    {['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'General', 'Marshal'].map((r) => (
                      <option key={r} value={r} style={{ background: '#0a0a14' }}>Rank {r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>BASE HEALTH (HP)</label>
                  <input
                    type="number"
                    required
                    value={editingShadow ? editingShadow.baseHp : newShadow.baseHp}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      if (editingShadow) setEditingShadow({ ...editingShadow, baseHp: val });
                      else setNewShadow({ ...newShadow, baseHp: val });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>ATTACK POWER</label>
                  <input
                    type="number"
                    required
                    value={editingShadow ? editingShadow.attack : newShadow.attack}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      if (editingShadow) setEditingShadow({ ...editingShadow, attack: val });
                      else setNewShadow({ ...newShadow, attack: val });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>SUMMON MP COST</label>
                  <input
                    type="number"
                    required
                    value={editingShadow ? editingShadow.summonCost : newShadow.summonCost}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 10;
                      if (editingShadow) setEditingShadow({ ...editingShadow, summonCost: val });
                      else setNewShadow({ ...newShadow, summonCost: val });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>DEFENSE</label>
                  <input
                    type="number"
                    value={editingShadow ? editingShadow.defense : newShadow.defense}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (editingShadow) setEditingShadow({ ...editingShadow, defense: val });
                      else setNewShadow({ ...newShadow, defense: val });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>DESCRIPTION</label>
                <textarea
                  rows={2}
                  value={editingShadow ? (editingShadow.description || '') : newShadow.description}
                  onChange={(e) => {
                    if (editingShadow) setEditingShadow({ ...editingShadow, description: e.target.value });
                    else setNewShadow({ ...newShadow, description: e.target.value });
                  }}
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  marginTop: 6,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                  border: '1px solid #c084fc',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'SAVING...' : 'SAVE SHADOW SOLDIER'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShadows;

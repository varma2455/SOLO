// -------------------------------------------------------------
// SHADOW ASCENSION - MONSTER DATABASE PAGE
// Route: /admin/monsters
// Manage enemies & bosses, create, edit, duplicate, delete
// -------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authFetch } from '../../context/AuthContext';
import {
  Skull,
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
  Coins,
  Sparkles
} from 'lucide-react';

const rankColors = {
  E: '#94a3b8',
  D: '#4ade80',
  C: '#38bdf8',
  B: '#a855f7',
  A: '#facc15',
  S: '#f97316',
  SS: '#ef4444',
  Boss: '#dc2626'
};

export const AdminMonsters = () => {
  const [searchParams] = useSearchParams();
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rankFilter, setRankFilter] = useState('all');

  const [notification, setNotification] = useState({ text: '', type: '' });
  const [editingMonster, setEditingMonster] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('create') === 'true');
  const [saving, setSaving] = useState(false);

  const [newMonster, setNewMonster] = useState({
    id: '',
    name: '',
    rank: 'E',
    hp: 150,
    attack: 25,
    defense: 8,
    speed: 3.5,
    xpReward: 40,
    goldReward: 20,
    status: 'active',
    description: ''
  });

  const notify = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: '', type: '' }), 4000);
  };

  const loadMonsters = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/monsters');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.monsters)) {
          setMonsters(data.monsters);
        }
      }
    } catch (err) {
      notify('Failed to load monster database: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonsters();
  }, []);

  const handleSaveMonster = async (monsterToSave) => {
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/monsters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monsterToSave)
      });
      if (!res.ok) {
        throw new Error('Server returned error while saving.');
      }
      notify(`Monster "${monsterToSave.name}" successfully saved!`, 'success');
      setEditingMonster(null);
      setShowCreateModal(false);
      await loadMonsters();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMonster = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    try {
      const res = await authFetch(`/api/admin/monsters/${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify(`Monster "${name}" deleted successfully.`, 'success');
        await loadMonsters();
      } else {
        throw new Error('Failed to delete.');
      }
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDuplicateMonster = async (m) => {
    const cloneId = `${m.id}_copy_${Date.now().toString().slice(-4)}`;
    const cloned = {
      ...m,
      id: cloneId,
      name: `${m.name} (Copy)`
    };
    await handleSaveMonster(cloned);
  };

  const filteredMonsters = monsters.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      m.name?.toLowerCase().includes(q) ||
      m.id?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q);

    const matchesRank = rankFilter === 'all' || m.rank === rankFilter;
    return matchesSearch && matchesRank;
  });

  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
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
            MONSTER DATABASE
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 13, letterSpacing: '0.5px' }}>
            MANAGE ENEMIES AND BOSSES &middot; COMBAT BALANCING AND DROP RATES
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={loadMonsters}
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
              setNewMonster({
                id: `monster_${Date.now()}`,
                name: '',
                rank: 'E',
                hp: 150,
                attack: 25,
                defense: 8,
                speed: 3.5,
                xpReward: 40,
                goldReward: 20,
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
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              border: '1px solid #f87171',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.3)'
            }}
          >
            <Plus size={16} /> CREATE MONSTER
          </button>
        </div>
      </div>

      {/* Notification Toast */}
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
            placeholder="Search monsters by name or description..."
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
            {['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'Boss'].map((r) => (
              <option key={r} value={r} style={{ background: '#0a0a14' }}>Rank {r}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>
          Total Enemies: <strong>{filteredMonsters.length}</strong>
        </div>
      </div>

      {/* Monster Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            <RefreshCw size={24} className="animate-spin" color="#ef4444" style={{ margin: '0 auto 8px' }} />
            <div>Loading bestiary...</div>
          </div>
        ) : filteredMonsters.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: 36, textAlign: 'center', color: '#94a3b8' }}>
            No monsters match your search criteria.
          </div>
        ) : (
          filteredMonsters.map((m) => {
            const rankColor = rankColors[m.rank] || '#94a3b8';
            return (
              <div
                key={m.id}
                style={{
                  padding: 20,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(20, 10, 15, 0.6) 0%, rgba(10, 5, 8, 0.8) 100%)',
                  border: `1px solid ${m.rank === 'Boss' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: m.rank === 'Boss' ? '0 0 20px rgba(239, 68, 68, 0.2)' : 'none',
                  transition: 'transform 0.15s, border-color 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = rankColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = m.rank === 'Boss' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.08)';
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
                          background: `rgba(${m.rank === 'Boss' ? '239,68,68' : '168,85,247'}, 0.2)`,
                          border: `1px solid ${rankColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Skull size={22} color={rankColor} />
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 16, fontWeight: 900, margin: 0, color: '#f8fafc' }}>
                          {m.name}
                        </h3>
                        <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                          ID: {m.id}
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
                      RANK {m.rank}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4, margin: '0 0 14px 0', minHeight: 34 }}>
                    {m.description || 'Hostile crypt entity lurking within dungeon gates.'}
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
                      <span>HP: <strong>{m.hp}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fed7aa' }}>
                      <Swords size={13} color="#f97316" />
                      <span>ATK: <strong>{m.attack}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#93c5fd' }}>
                      <Shield size={13} color="#3b82f6" />
                      <span>DEF: <strong>{m.defense || 5}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fef08a' }}>
                      <Coins size={13} color="#eab308" />
                      <span>GOLD: <strong>{m.goldReward || 20}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 3,
                        fontSize: 9,
                        fontWeight: 800,
                        backgroundColor: m.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: m.status === 'active' ? '#4ade80' : '#f87171'
                      }}
                    >
                      {(m.status || 'active').toUpperCase()}
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>
                      +{m.xpReward || 50} XP
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setEditingMonster({ ...m })}
                      title="Edit Monster"
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
                      onClick={() => handleDuplicateMonster(m)}
                      title="Duplicate Monster"
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
                      onClick={() => handleDeleteMonster(m.id, m.name)}
                      title="Delete Monster"
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

      {/* CREATE / EDIT MONSTER MODAL */}
      {(showCreateModal || editingMonster) && (
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
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: '#0e0814',
              boxShadow: '0 0 36px rgba(239, 68, 68, 0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 18, fontWeight: 900, margin: 0, color: '#ffffff' }}>
                {editingMonster ? 'EDIT MONSTER' : 'CREATE NEW MONSTER'}
              </h2>
              <button
                onClick={() => {
                  setEditingMonster(null);
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
                handleSaveMonster(editingMonster || newMonster);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1', letterSpacing: '1px' }}>NAME</label>
                <input
                  type="text"
                  required
                  value={editingMonster ? editingMonster.name : newMonster.name}
                  onChange={(e) => {
                    if (editingMonster) setEditingMonster({ ...editingMonster, name: e.target.value });
                    else setNewMonster({ ...newMonster, name: e.target.value });
                  }}
                  placeholder="e.g. Cerberus Fiend"
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
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>RANK</label>
                  <select
                    value={editingMonster ? editingMonster.rank : newMonster.rank}
                    onChange={(e) => {
                      if (editingMonster) setEditingMonster({ ...editingMonster, rank: e.target.value });
                      else setNewMonster({ ...newMonster, rank: e.target.value });
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 6,
                      color: '#ffffff',
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  >
                    {['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'Boss'].map((r) => (
                      <option key={r} value={r} style={{ background: '#0a0a14' }}>Rank {r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>STATUS</label>
                  <select
                    value={editingMonster ? editingMonster.status : newMonster.status}
                    onChange={(e) => {
                      if (editingMonster) setEditingMonster({ ...editingMonster, status: e.target.value });
                      else setNewMonster({ ...newMonster, status: e.target.value });
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 6,
                      color: '#ffffff',
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="active" style={{ background: '#0a0a14' }}>Active</option>
                    <option value="disabled" style={{ background: '#0a0a14' }}>Disabled</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>HEALTH (HP)</label>
                  <input
                    type="number"
                    required
                    value={editingMonster ? editingMonster.hp : newMonster.hp}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      if (editingMonster) setEditingMonster({ ...editingMonster, hp: val });
                      else setNewMonster({ ...newMonster, hp: val });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>ATTACK POWER</label>
                  <input
                    type="number"
                    required
                    value={editingMonster ? editingMonster.attack : newMonster.attack}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      if (editingMonster) setEditingMonster({ ...editingMonster, attack: val });
                      else setNewMonster({ ...newMonster, attack: val });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>XP REWARD</label>
                  <input
                    type="number"
                    value={editingMonster ? editingMonster.xpReward : newMonster.xpReward}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (editingMonster) setEditingMonster({ ...editingMonster, xpReward: val });
                      else setNewMonster({ ...newMonster, xpReward: val });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>GOLD REWARD</label>
                  <input
                    type="number"
                    value={editingMonster ? editingMonster.goldReward : newMonster.goldReward}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (editingMonster) setEditingMonster({ ...editingMonster, goldReward: val });
                      else setNewMonster({ ...newMonster, goldReward: val });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>DESCRIPTION</label>
                <textarea
                  rows={2}
                  value={editingMonster ? (editingMonster.description || '') : newMonster.description}
                  onChange={(e) => {
                    if (editingMonster) setEditingMonster({ ...editingMonster, description: e.target.value });
                    else setNewMonster({ ...newMonster, description: e.target.value });
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
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  border: '1px solid #f87171',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'SAVING...' : 'SAVE TO BESTIARY'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMonsters;

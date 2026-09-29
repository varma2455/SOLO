// -------------------------------------------------------------
// SHADOW ASCENSION - DUNGEON MANAGEMENT PAGE
// Route: /admin/dungeons
// Manage crypts, gates, floor enemies, and boss stats
// -------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authFetch } from '../../context/AuthContext';
import {
  Castle,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Skull,
  Heart,
  Coins,
  Sparkles,
  Layers
} from 'lucide-react';

const rankColors = {
  E: '#94a3b8',
  D: '#4ade80',
  C: '#38bdf8',
  B: '#c084fc',
  A: '#facc15',
  S: '#f97316',
  SS: '#ef4444',
  'Red Gate': '#dc2626'
};

export const AdminDungeons = () => {
  const [searchParams] = useSearchParams();
  const [dungeons, setDungeons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rankFilter, setRankFilter] = useState('all');

  const [notification, setNotification] = useState({ text: '', type: '' });
  const [editingDungeon, setEditingDungeon] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('create') === 'true');
  const [saving, setSaving] = useState(false);

  const [newDungeon, setNewDungeon] = useState({
    id: '',
    name: '',
    rank: 'E',
    totalRooms: 3,
    room1Enemies: 8,
    room2Enemies: 10,
    room3Enemies: 12,
    bossName: 'Abyss Warden',
    bossHp: 3200,
    difficulty: 'Normal',
    rewards: { xp: 1000, gold: 500 },
    status: 'active'
  });

  const notify = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: '', type: '' }), 4000);
  };

  const loadDungeons = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/dungeons');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.dungeons)) {
          setDungeons(data.dungeons);
        }
      }
    } catch (err) {
      notify('Failed to load dungeon records: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDungeons();
  }, []);

  const handleSaveDungeon = async (dungeonToSave) => {
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/dungeons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dungeonToSave)
      });
      if (!res.ok) throw new Error('Error saving dungeon configuration.');
      notify(`Dungeon "${dungeonToSave.name}" successfully configured!`, 'success');
      setEditingDungeon(null);
      setShowCreateModal(false);
      await loadDungeons();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDungeon = async (id, name) => {
    if (!window.confirm(`Are you sure you want to seal and delete dungeon gate "${name}"?`)) return;
    try {
      const res = await authFetch(`/api/admin/dungeons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify(`Dungeon gate "${name}" deleted.`, 'success');
        await loadDungeons();
      } else {
        throw new Error('Failed to delete dungeon.');
      }
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDuplicateDungeon = async (d) => {
    const cloneId = `${d.id}_copy_${Date.now().toString().slice(-4)}`;
    const cloned = {
      ...d,
      id: cloneId,
      name: `${d.name} (Copy)`
    };
    await handleSaveDungeon(cloned);
  };

  const filteredDungeons = dungeons.filter((d) => {
    const s = searchQuery.toLowerCase();
    const matchesSearch =
      !s ||
      d.name?.toLowerCase().includes(s) ||
      d.bossName?.toLowerCase().includes(s);

    const matchesRank = rankFilter === 'all' || d.rank === rankFilter;
    return matchesSearch && matchesRank;
  });

  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Title Header */}
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
            DUNGEON MANAGEMENT
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 13, letterSpacing: '0.5px' }}>
            GATES, FLOORS, AND BOSS ENCOUNTERS &middot; ENEMY DENSITY AND BOSS HEALTH
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={loadDungeons}
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
              setNewDungeon({
                id: `dungeon_${Date.now()}`,
                name: '',
                rank: 'E',
                totalRooms: 3,
                room1Enemies: 8,
                room2Enemies: 10,
                room3Enemies: 12,
                bossName: 'Abyss Warden',
                bossHp: 3200,
                difficulty: 'Normal',
                rewards: { xp: 1000, gold: 500 },
                status: 'active'
              });
              setShowCreateModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 6,
              background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
              border: '1px solid #fb7185',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(244, 63, 94, 0.35)'
            }}
          >
            <Plus size={16} /> CREATE DUNGEON
          </button>
        </div>
      </div>

      {/* Toast Alert */}
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

      {/* Search and Filter */}
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
            placeholder="Search dungeons by name or boss..."
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
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>GATE RANK:</span>
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
            <option value="all" style={{ background: '#0a0a14' }}>All Gates</option>
            {['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'Red Gate'].map((r) => (
              <option key={r} value={r} style={{ background: '#0a0a14' }}>{r} Rank</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>
          Configured Gates: <strong>{filteredDungeons.length}</strong>
        </div>
      </div>

      {/* Dungeons Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            <RefreshCw size={24} className="animate-spin" color="#f43f5e" style={{ margin: '0 auto 8px' }} />
            <div>Accessing gate dimensions...</div>
          </div>
        ) : filteredDungeons.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: 36, textAlign: 'center', color: '#94a3b8' }}>
            No dungeons match your search filter.
          </div>
        ) : (
          filteredDungeons.map((d) => {
            const rColor = rankColors[d.rank] || '#fb7185';
            return (
              <div
                key={d.id}
                style={{
                  padding: 20,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(30, 12, 20, 0.7) 0%, rgba(12, 6, 10, 0.9) 100%)',
                  border: `1px solid ${rColor}44`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: `0 0 20px ${rColor}15`,
                  transition: 'transform 0.15s, border-color 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = rColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = `${rColor}44`;
                }}
              >
                <div>
                  {/* Top Bar */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 8,
                          background: `${rColor}22`,
                          border: `1px solid ${rColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Castle size={22} color={rColor} />
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 16, fontWeight: 900, margin: 0, color: '#f8fafc' }}>
                          {d.name}
                        </h3>
                        <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                          ID: {d.id}
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
                        backgroundColor: `${rColor}22`,
                        color: rColor,
                        border: `1px solid ${rColor}`
                      }}
                    >
                      {d.rank} GATE
                    </span>
                  </div>

                  {/* Room Config Matrix */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 8,
                      padding: 12,
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 6,
                      fontSize: 11,
                      marginBottom: 14,
                      textAlign: 'center'
                    }}
                  >
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: 10 }}>ROOM 1</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>
                        {d.room1Enemies || 8}
                      </div>
                      <div style={{ fontSize: 9, color: '#64748b' }}>enemies</div>
                    </div>

                    <div>
                      <div style={{ color: '#94a3b8', fontSize: 10 }}>ROOM 2</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>
                        {d.room2Enemies || 10}
                      </div>
                      <div style={{ fontSize: 9, color: '#64748b' }}>enemies</div>
                    </div>

                    <div>
                      <div style={{ color: '#94a3b8', fontSize: 10 }}>ROOM 3</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>
                        {d.room3Enemies || 12}
                      </div>
                      <div style={{ fontSize: 9, color: '#64748b' }}>enemies</div>
                    </div>
                  </div>

                  {/* Boss encounter detail */}
                  <div
                    style={{
                      padding: 12,
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 6,
                      marginBottom: 16
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: '#f87171', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Skull size={14} /> BOSS ENCOUNTER:
                      </span>
                      <strong style={{ color: '#ffffff' }}>{d.bossName || 'Abyss Warden'}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#fca5a5' }}>
                      <Heart size={13} color="#ef4444" />
                      <span>Boss Health: <strong>{d.bossHp || 3200} HP</strong></span>
                    </div>
                  </div>

                  {/* Rewards */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#38bdf8' }}>
                      <Sparkles size={13} />
                      <span>+{d.rewards?.xp || 1000} XP</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#facc15' }}>
                      <Coins size={13} />
                      <span>+{d.rewards?.gold || 500} Gold</span>
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
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      color: '#4ade80'
                    }}
                  >
                    GATE OPEN
                  </span>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setEditingDungeon({ ...d })}
                      title="Edit Dungeon Configuration"
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
                      onClick={() => handleDuplicateDungeon(d)}
                      title="Duplicate Dungeon"
                      style={{
                        padding: '6px 9px',
                        borderRadius: 4,
                        backgroundColor: 'rgba(244, 63, 94, 0.15)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        color: '#fb7185',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Copy size={13} />
                    </button>

                    <button
                      onClick={() => handleDeleteDungeon(d.id, d.name)}
                      title="Seal Dungeon Gate"
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

      {/* CREATE / EDIT DUNGEON MODAL */}
      {(showCreateModal || editingDungeon) && (
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
              border: '1px solid rgba(244, 63, 94, 0.4)',
              background: '#100810',
              boxShadow: '0 0 36px rgba(244, 63, 94, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 18, fontWeight: 900, margin: 0, color: '#ffffff' }}>
                {editingDungeon ? 'EDIT DUNGEON GATE' : 'OPEN NEW GATE'}
              </h2>
              <button
                onClick={() => {
                  setEditingDungeon(null);
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
                handleSaveDungeon(editingDungeon || newDungeon);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>DUNGEON NAME</label>
                <input
                  type="text"
                  required
                  value={editingDungeon ? editingDungeon.name : newDungeon.name}
                  onChange={(e) => {
                    if (editingDungeon) setEditingDungeon({ ...editingDungeon, name: e.target.value });
                    else setNewDungeon({ ...newDungeon, name: e.target.value });
                  }}
                  placeholder="e.g. Catacombs of Despair"
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>GATE RANK</label>
                  <select
                    value={editingDungeon ? editingDungeon.rank : newDungeon.rank}
                    onChange={(e) => {
                      if (editingDungeon) setEditingDungeon({ ...editingDungeon, rank: e.target.value });
                      else setNewDungeon({ ...newDungeon, rank: e.target.value });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  >
                    {['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'Red Gate'].map((r) => (
                      <option key={r} value={r} style={{ background: '#0a0a14' }}>{r} Rank</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>DIFFICULTY</label>
                  <input
                    type="text"
                    value={editingDungeon ? (editingDungeon.difficulty || 'Normal') : newDungeon.difficulty}
                    onChange={(e) => {
                      if (editingDungeon) setEditingDungeon({ ...editingDungeon, difficulty: e.target.value });
                      else setNewDungeon({ ...newDungeon, difficulty: e.target.value });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>ROOM 1 ENEMIES</label>
                  <input
                    type="number"
                    value={editingDungeon ? editingDungeon.room1Enemies : newDungeon.room1Enemies}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 1;
                      if (editingDungeon) setEditingDungeon({ ...editingDungeon, room1Enemies: v });
                      else setNewDungeon({ ...newDungeon, room1Enemies: v });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>ROOM 2 ENEMIES</label>
                  <input
                    type="number"
                    value={editingDungeon ? editingDungeon.room2Enemies : newDungeon.room2Enemies}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 1;
                      if (editingDungeon) setEditingDungeon({ ...editingDungeon, room2Enemies: v });
                      else setNewDungeon({ ...newDungeon, room2Enemies: v });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>BOSS NAME</label>
                  <input
                    type="text"
                    required
                    value={editingDungeon ? editingDungeon.bossName : newDungeon.bossName}
                    onChange={(e) => {
                      if (editingDungeon) setEditingDungeon({ ...editingDungeon, bossName: e.target.value });
                      else setNewDungeon({ ...newDungeon, bossName: e.target.value });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>BOSS HEALTH (HP)</label>
                  <input
                    type="number"
                    required
                    value={editingDungeon ? editingDungeon.bossHp : newDungeon.bossHp}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 1000;
                      if (editingDungeon) setEditingDungeon({ ...editingDungeon, bossHp: v });
                      else setNewDungeon({ ...newDungeon, bossHp: v });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  marginTop: 6,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
                  border: '1px solid #fb7185',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'CONFIGURING GATE...' : 'SAVE DUNGEON'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDungeons;

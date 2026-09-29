// -------------------------------------------------------------
// SHADOW ASCENSION - QUEST MANAGEMENT PAGE
// Route: /admin/quests
// Manage system quests, bounties, trials, objectives, and rewards
// -------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authFetch } from '../../context/AuthContext';
import {
  ScrollText,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Trophy,
  Coins,
  Sparkles,
  Target
} from 'lucide-react';

const typeColors = {
  main: { color: '#facc15', bg: 'rgba(234, 179, 8, 0.15)', border: '#eab308' },
  daily: { color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6' },
  urgent: { color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444' },
  sub: { color: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7' },
  gate: { color: '#fb7185', bg: 'rgba(244, 63, 94, 0.15)', border: '#f43f5e' }
};

export const AdminQuests = () => {
  const [searchParams] = useSearchParams();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [notification, setNotification] = useState({ text: '', type: '' });
  const [editingQuest, setEditingQuest] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('create') === 'true');
  const [saving, setSaving] = useState(false);

  const [newQuest, setNewQuest] = useState({
    id: '',
    title: '',
    type: 'daily',
    difficulty: 'D',
    description: '',
    requiredLevel: 1,
    targetCount: 10,
    objectiveText: 'Defeat monsters in dungeon crypts',
    xpReward: 300,
    goldReward: 100,
    status: 'active'
  });

  const notify = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: '', type: '' }), 4000);
  };

  const loadQuests = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/quests');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.quests)) {
          setQuests(data.quests);
        }
      }
    } catch (err) {
      notify('Failed to load quest registry: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuests();
  }, []);

  const handleSaveQuest = async (questToSave) => {
    setSaving(true);
    try {
      // Normalize payload structure
      const payload = {
        ...questToSave,
        objectives: questToSave.objectives || [
          {
            id: 'obj_main',
            text: questToSave.objectiveText || 'Complete specified task',
            current: 0,
            target: questToSave.targetCount || 10
          }
        ],
        rewards: questToSave.rewards || {
          xp: parseInt(questToSave.xpReward) || 250,
          gold: parseInt(questToSave.goldReward) || 100
        }
      };

      const res = await authFetch('/api/admin/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save quest.');
      notify(`Quest "${questToSave.title}" successfully recorded!`, 'success');
      setEditingQuest(null);
      setShowCreateModal(false);
      await loadQuests();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuest = async (id, title) => {
    if (!window.confirm(`Are you sure you want to cancel and remove quest "${title}"?`)) return;
    try {
      const res = await authFetch(`/api/admin/quests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify(`Quest "${title}" removed successfully.`, 'success');
        await loadQuests();
      } else {
        throw new Error('Failed to delete quest.');
      }
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDuplicateQuest = async (q) => {
    const cloneId = `${q.id}_copy_${Date.now().toString().slice(-4)}`;
    const cloned = {
      ...q,
      id: cloneId,
      title: `${q.title} (Copy)`
    };
    await handleSaveQuest(cloned);
  };

  const filteredQuests = quests.filter((q) => {
    const s = searchQuery.toLowerCase();
    const matchesSearch =
      !s ||
      q.title?.toLowerCase().includes(s) ||
      q.description?.toLowerCase().includes(s) ||
      q.type?.toLowerCase().includes(s);

    const matchesType = typeFilter === 'all' || q.type === typeFilter;
    return matchesSearch && matchesType;
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
            QUEST MANAGEMENT
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 13, letterSpacing: '0.5px' }}>
            SYSTEM QUESTS AND HUNTER TASKS &middot; DAILY TRIALS, BOUNTIES & XP REWARDS
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={loadQuests}
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
              setNewQuest({
                id: `quest_${Date.now()}`,
                title: '',
                type: 'daily',
                difficulty: 'D',
                description: '',
                requiredLevel: 1,
                targetCount: 10,
                objectiveText: 'Defeat monsters in dungeon crypts',
                xpReward: 300,
                goldReward: 100,
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
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: '1px solid #60a5fa',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(59, 130, 246, 0.35)'
            }}
          >
            <Plus size={16} /> CREATE QUEST
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
            placeholder="Search quests by title or objective..."
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
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>TYPE:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
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
            <option value="all" style={{ background: '#0a0a14' }}>All Types</option>
            <option value="main" style={{ background: '#0a0a14' }}>Main Quest</option>
            <option value="daily" style={{ background: '#0a0a14' }}>Daily Quest</option>
            <option value="urgent" style={{ background: '#0a0a14' }}>Urgent Trial</option>
            <option value="sub" style={{ background: '#0a0a14' }}>Sub Quest</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>
          Active Quests: <strong>{filteredQuests.length}</strong>
        </div>
      </div>

      {/* Quests Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            <RefreshCw size={24} className="animate-spin" color="#60a5fa" style={{ margin: '0 auto 8px' }} />
            <div>Loading system quests...</div>
          </div>
        ) : filteredQuests.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: 36, textAlign: 'center', color: '#94a3b8' }}>
            No quests match your search criteria.
          </div>
        ) : (
          filteredQuests.map((q) => {
            const tStyle = typeColors[q.type] || typeColors.daily;
            const xpVal = q.rewards?.xp || q.xpReward || 250;
            const goldVal = q.rewards?.gold || q.goldReward || 100;
            const objectivesList = Array.isArray(q.objectives) ? q.objectives : [];

            return (
              <div
                key={q.id}
                style={{
                  padding: 20,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(15, 20, 35, 0.7) 0%, rgba(8, 10, 20, 0.9) 100%)',
                  border: `1px solid ${tStyle.border}44`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: `0 0 16px ${tStyle.border}15`,
                  transition: 'transform 0.15s, border-color 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = tStyle.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = `${tStyle.border}44`;
                }}
              >
                <div>
                  {/* Top Bar */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: tStyle.bg,
                          border: `1px solid ${tStyle.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <ScrollText size={20} color={tStyle.color} />
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 15, fontWeight: 900, margin: 0, color: '#f8fafc' }}>
                          {q.title}
                        </h3>
                        <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                          ID: {q.id}
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
                        backgroundColor: tStyle.bg,
                        color: tStyle.color,
                        border: `1px solid ${tStyle.border}`,
                        textTransform: 'uppercase'
                      }}
                    >
                      {q.type}
                    </span>
                  </div>

                  <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4, margin: '0 0 14px 0', minHeight: 34 }}>
                    {q.description || 'System mandate assigned to hunters.'}
                  </p>

                  {/* Objectives list */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#cbd5e1', letterSpacing: '1px', marginBottom: 6 }}>
                      OBJECTIVES:
                    </div>
                    {objectivesList.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {objectivesList.map((obj, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 11,
                              color: '#94a3b8',
                              background: 'rgba(255, 255, 255, 0.03)',
                              padding: '5px 8px',
                              borderRadius: 4
                            }}
                          >
                            <Target size={12} color="#60a5fa" />
                            <span>{obj.text} (Target: {obj.target || 1})</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        Target: {q.targetCount || 10} enemies
                      </div>
                    )}
                  </div>

                  {/* Rewards Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: 10,
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 6,
                      fontSize: 11,
                      marginBottom: 16
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8' }}>
                      <Sparkles size={13} color="#38bdf8" />
                      <span>+{xpVal} XP</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#facc15' }}>
                      <Coins size={13} color="#facc15" />
                      <span>+{goldVal} GOLD</span>
                    </div>

                    {q.rewards?.shadowCores && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c084fc' }}>
                        <Trophy size={13} color="#c084fc" />
                        <span>+{q.rewards.shadowCores} CORES</span>
                      </div>
                    )}
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
                      backgroundColor: q.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: q.status === 'active' ? '#4ade80' : '#f87171'
                    }}
                  >
                    {(q.status || 'active').toUpperCase()}
                  </span>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setEditingQuest({ ...q })}
                      title="Edit Quest"
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
                      onClick={() => handleDuplicateQuest(q)}
                      title="Duplicate Quest"
                      style={{
                        padding: '6px 9px',
                        borderRadius: 4,
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60a5fa',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Copy size={13} />
                    </button>

                    <button
                      onClick={() => handleDeleteQuest(q.id, q.title)}
                      title="Delete Quest"
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

      {/* CREATE / EDIT QUEST MODAL */}
      {(showCreateModal || editingQuest) && (
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
              border: '1px solid rgba(59, 130, 246, 0.4)',
              background: '#090d18',
              boxShadow: '0 0 36px rgba(59, 130, 246, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 18, fontWeight: 900, margin: 0, color: '#ffffff' }}>
                {editingQuest ? 'EDIT SYSTEM QUEST' : 'CREATE NEW QUEST'}
              </h2>
              <button
                onClick={() => {
                  setEditingQuest(null);
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
                handleSaveQuest(editingQuest || newQuest);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>QUEST TITLE</label>
                <input
                  type="text"
                  required
                  value={editingQuest ? editingQuest.title : newQuest.title}
                  onChange={(e) => {
                    if (editingQuest) setEditingQuest({ ...editingQuest, title: e.target.value });
                    else setNewQuest({ ...newQuest, title: e.target.value });
                  }}
                  placeholder="e.g. DAILY: Crypt Extermination"
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>TYPE</label>
                  <select
                    value={editingQuest ? editingQuest.type : newQuest.type}
                    onChange={(e) => {
                      if (editingQuest) setEditingQuest({ ...editingQuest, type: e.target.value });
                      else setNewQuest({ ...newQuest, type: e.target.value });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="daily" style={{ background: '#0a0a14' }}>Daily</option>
                    <option value="main" style={{ background: '#0a0a14' }}>Main</option>
                    <option value="urgent" style={{ background: '#0a0a14' }}>Urgent Trial</option>
                    <option value="sub" style={{ background: '#0a0a14' }}>Sub Quest</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>TARGET COUNT</label>
                  <input
                    type="number"
                    value={editingQuest ? (editingQuest.targetCount || 10) : newQuest.targetCount}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 1;
                      if (editingQuest) setEditingQuest({ ...editingQuest, targetCount: v });
                      else setNewQuest({ ...newQuest, targetCount: v });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>DESCRIPTION</label>
                <textarea
                  rows={2}
                  value={editingQuest ? (editingQuest.description || '') : newQuest.description}
                  onChange={(e) => {
                    if (editingQuest) setEditingQuest({ ...editingQuest, description: e.target.value });
                    else setNewQuest({ ...newQuest, description: e.target.value });
                  }}
                  placeholder="Task overview and instructions..."
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>XP REWARD</label>
                  <input
                    type="number"
                    value={editingQuest ? (editingQuest.rewards?.xp || editingQuest.xpReward || 250) : newQuest.xpReward}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      if (editingQuest) setEditingQuest({ ...editingQuest, xpReward: v, rewards: { ...editingQuest.rewards, xp: v } });
                      else setNewQuest({ ...newQuest, xpReward: v });
                    }}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>GOLD REWARD</label>
                  <input
                    type="number"
                    value={editingQuest ? (editingQuest.rewards?.gold || editingQuest.goldReward || 100) : newQuest.goldReward}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      if (editingQuest) setEditingQuest({ ...editingQuest, goldReward: v, rewards: { ...editingQuest.rewards, gold: v } });
                      else setNewQuest({ ...newQuest, goldReward: v });
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
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  border: '1px solid #60a5fa',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'RECORDING...' : 'SAVE QUEST'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuests;

// -------------------------------------------------------------
// SHADOW ASCENSION - USER QUESTS
// Active dungeon objectives and shadow core missions.
// -------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { authFetch } from '../../context/CustomAuthContext';
import { UserNav } from './UserNav';
import { Scroll, Award, CheckCircle2, Circle, Sparkles, Coins } from 'lucide-react';

export const UserQuests = () => {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const res = await authFetch('/api/user/quests');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.quests)) {
            setQuests(data.quests);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuests();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#07070b', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <UserNav />

      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 900, width: '100%', margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 28, margin: 0, fontWeight: 900 }}>
            ASCENSION QUESTS & OBJECTIVES
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
            Directives dictated by the Ascension Core. Complete tasks in the crypt to claim rewards.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {quests.map((quest) => {
            const isCompleted = quest.objectives?.every((obj) => (obj.current || 0) >= (obj.target || 1));

            return (
              <div
                key={quest.id}
                className="glass-panel"
                style={{
                  padding: 24,
                  borderRadius: 10,
                  border: isCompleted ? '1px solid #10b981' : '1px solid rgba(234, 179, 8, 0.3)',
                  background: 'linear-gradient(135deg, rgba(22, 18, 10, 0.7) 0%, rgba(12, 10, 8, 0.85) 100%)',
                  boxShadow: '0 0 25px rgba(234, 179, 8, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span
                      style={{
                        backgroundColor: 'rgba(234, 179, 8, 0.15)',
                        border: '1px solid #eab308',
                        color: '#facc15',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '1px'
                      }}
                    >
                      {quest.type ? quest.type.toUpperCase() : 'MISSION'} &bull; {quest.status ? quest.status.toUpperCase() : 'ACTIVE'}
                    </span>
                    <h3 style={{ margin: '8px 0 4px 0', fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>
                      {quest.title}
                    </h3>
                  </div>

                  {isCompleted && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4ade80', fontSize: 12, fontWeight: 800 }}>
                      <CheckCircle2 size={16} /> COMPLETED
                    </span>
                  )}
                </div>

                <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  {quest.description}
                </p>

                {/* Objectives */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {quest.objectives?.map((obj, i) => {
                    const done = (obj.current || 0) >= (obj.target || 1);
                    return (
                      <div
                        key={obj.id || i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: 6
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          {done ? <CheckCircle2 size={16} color="#4ade80" /> : <Circle size={16} color="#94a3b8" />}
                          <span style={{ color: done ? '#e2e8f0' : '#94a3b8', textDecoration: done ? 'line-through' : 'none' }}>
                            {obj.text}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: done ? '#4ade80' : '#facc15' }}>
                          {obj.current || 0} / {obj.target || 1}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Rewards */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
                  <span style={{ color: '#94a3b8', fontWeight: 700 }}>REWARDS:</span>
                  {quest.rewards?.xp && (
                    <span style={{ color: '#c084fc', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={14} /> +{quest.rewards.xp} XP
                    </span>
                  )}
                  {quest.rewards?.gold && (
                    <span style={{ color: '#facc15', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Coins size={14} /> +{quest.rewards.gold} GOLD
                    </span>
                  )}
                  {quest.rewards?.shadowCores && (
                    <span style={{ color: '#38bdf8', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Award size={14} /> +{quest.rewards.shadowCores} SHADOW CORES
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default UserQuests;

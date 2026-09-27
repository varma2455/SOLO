// -------------------------------------------------------------
// SHADOW ASCENSION - USER PROFILE
// Detailed hunter attributes, status, and rank progression.
// -------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useCustomAuth, authFetch } from '../../context/CustomAuthContext';
import { UserNav } from './UserNav';
import { User, Shield, Zap, Heart, Sword, Award, Calendar, CheckCircle } from 'lucide-react';

export const UserProfile = () => {
  const { user } = useCustomAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.success) setProfile(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const progress = profile?.progress || {};
  const attrs = progress.attributes || { strength: 10, agility: 10, intelligence: 10, vitality: 10 };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#07070b', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <UserNav />

      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 900, width: '100%', margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 28, margin: 0, fontWeight: 900 }}>
            HUNTER PROFILE & ATTRIBUTES
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
            Review your soul core classification, physical traits, and spiritual stats.
          </p>
        </div>

        {/* Identity Card */}
        <div
          className="glass-panel"
          style={{
            padding: 28,
            borderRadius: 12,
            border: '1px solid rgba(168, 85, 247, 0.3)',
            background: 'linear-gradient(135deg, rgba(20, 14, 40, 0.7) 0%, rgba(10, 8, 22, 0.85) 100%)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #a855f7',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
              }}
            >
              <User size={32} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', letterSpacing: '1px' }}>
                {user?.displayName || 'HUNTER'}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{user?.email}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid #22c55e',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#4ade80',
                    letterSpacing: '1px'
                  }}
                >
                  ACTIVE
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid #a855f7',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#c084fc',
                    letterSpacing: '1px'
                  }}
                >
                  ROLE: PLAYER
                </span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '1px' }}>CORE RANK</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#c084fc', textShadow: '0 0 15px rgba(168, 85, 247, 0.5)' }}>
              LEVEL {progress.level || 1}
            </div>
          </div>
        </div>

        {/* Combat Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="glass-panel" style={{ padding: 20, borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(15, 23, 42, 0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontWeight: 800, fontSize: 12 }}>
              <Heart size={16} /> MAXIMUM HEALTH
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 8 }}>{progress.maxHp || 560} HP</div>
          </div>

          <div className="glass-panel" style={{ padding: 20, borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.3)', background: 'rgba(15, 23, 42, 0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#60a5fa', fontWeight: 800, fontSize: 12 }}>
              <Zap size={16} /> MAXIMUM MANA
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 8 }}>{progress.maxMp || 270} MP</div>
          </div>

          <div className="glass-panel" style={{ padding: 20, borderRadius: 8, border: '1px solid rgba(234, 179, 8, 0.3)', background: 'rgba(15, 23, 42, 0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#facc15', fontWeight: 800, fontSize: 12 }}>
              <Award size={16} /> GOLD BALANCE
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 8 }}>{progress.gold || 100} G</div>
          </div>
        </div>

        {/* Attributes Breakdown */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(15, 23, 42, 0.5)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '1px', margin: '0 0 16px 0', color: '#e2e8f0' }}>
            ATTRIBUTE MATRIX
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <div style={{ padding: 14, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>STRENGTH (STR)</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#f87171', marginTop: 4 }}>{attrs.strength}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Increases blade physical damage</div>
            </div>

            <div style={{ padding: 14, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>AGILITY (AGI)</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>{attrs.agility}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Movement speed & evasion velocity</div>
            </div>

            <div style={{ padding: 14, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>INTELLIGENCE (INT)</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#c084fc', marginTop: 4 }}>{attrs.intelligence}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Mana pool & Shadow extraction capacity</div>
            </div>

            <div style={{ padding: 14, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>VITALITY (VIT)</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#4ade80', marginTop: 4 }}>{attrs.vitality}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Maximum health points & armor resilience</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;

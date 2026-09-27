// -------------------------------------------------------------
// SHADOW ASCENSION - USER SHADOW ARMY
// Displays the hunter's personal extracted shadow soldiers.
// -------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authFetch } from '../../context/CustomAuthContext';
import { UserNav } from './UserNav';
import { Ghost, Shield, Zap, Swords, Flame, Sparkles } from 'lucide-react';

export const UserShadows = () => {
  const [shadows, setShadows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShadows = async () => {
      try {
        const res = await authFetch('/api/user/shadows');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.shadows)) {
            setShadows(data.shadows);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShadows();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#07070b', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <UserNav />

      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 28, margin: 0, fontWeight: 900 }}>
              MY SHADOW ARMY
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              Souls extracted from slain monsters who now swear eternal fealty to you.
            </p>
          </div>

          <div
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid #a855f7',
              color: '#c084fc',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '1px'
            }}
          >
            ARMY STRENGTH: {shadows.length} SOLDIERS
          </div>
        </div>

        {shadows.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              borderRadius: 12,
              border: '1px dashed rgba(168, 85, 247, 0.35)',
              background: 'rgba(15, 23, 42, 0.4)'
            }}
          >
            <div style={{ display: 'inline-flex', padding: 16, borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', marginBottom: 16 }}>
              <Ghost size={48} color="#a855f7" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 20, margin: '0 0 8px 0', color: '#f8fafc' }}>
              NO SHADOW SOLDIERS EXTRACTED YET
            </h3>
            <p style={{ color: '#94a3b8', fontSize: 14, maxWidth: 500, margin: '0 auto 24px auto', lineHeight: 1.6 }}>
              Defeat monsters inside the 3D Crypt. When a monster falls, stand near their spirit and trigger the Shadow Extraction core command.
            </p>
            <Link
              to="/user/game"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #9333ea, #6366f1)',
                border: '1px solid #c084fc',
                borderRadius: 6,
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                letterSpacing: '1px'
              }}
            >
              <Swords size={16} /> ENTER 3D DUNGEON
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {shadows.map((sh, idx) => (
              <div
                key={sh.id || idx}
                className="glass-panel"
                style={{
                  padding: 24,
                  borderRadius: 10,
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  background: 'linear-gradient(135deg, rgba(20, 14, 40, 0.7) 0%, rgba(10, 8, 22, 0.85) 100%)',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <span
                        style={{
                          backgroundColor: 'rgba(168, 85, 247, 0.2)',
                          border: '1px solid #a855f7',
                          color: '#c084fc',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: '1px'
                        }}
                      >
                        RANK {sh.rank || 'C'} &bull; {sh.role || 'SOLDIER'}
                      </span>
                      <h3 style={{ margin: '8px 0 0 0', fontSize: 18, fontWeight: 900, color: '#f8fafc' }}>
                        {sh.name}
                      </h3>
                    </div>

                    <div style={{ padding: 10, borderRadius: '50%', background: 'rgba(168, 85, 247, 0.2)' }}>
                      <Ghost size={24} color="#c084fc" />
                    </div>
                  </div>

                  <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                    {sh.description || 'Extracted shadow soldier loyally executing master command.'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
                    <div style={{ padding: 8, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>HEALTH</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#f87171' }}>{sh.hp || sh.baseHp || 1000} HP</div>
                    </div>
                    <div style={{ padding: 8, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>ATTACK</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#facc15' }}>{sh.attack || 65} DMG</div>
                    </div>
                    <div style={{ padding: 8, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>DEFENSE</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#38bdf8' }}>{sh.defense || 25} DEF</div>
                    </div>
                    <div style={{ padding: 8, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>SUMMON COST</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#c084fc' }}>{sh.summonCost || 60} MP</div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 12, fontSize: 11, color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} /> READY FOR DEPLOYMENT IN 3D WORLD
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserShadows;

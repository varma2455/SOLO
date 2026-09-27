// -------------------------------------------------------------
// SHADOW ASCENSION - USER INVENTORY
// Hunter weapons, equipment, potions, and crypt relics.
// -------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { authFetch } from '../../context/CustomAuthContext';
import { UserNav } from './UserNav';
import { Backpack, Sword, Shield, Sparkles, CheckCircle2 } from 'lucide-react';

export const UserInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await authFetch('/api/user/inventory');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.inventory)) {
            setInventory(data.inventory);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#07070b', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <UserNav />

      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 28, margin: 0, fontWeight: 900 }}>
              HUNTER INVENTORY & ARSENAL
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              Equipped blades, defensive gear, and magical crypt relics bound to your soul.
            </p>
          </div>

          <div
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid #3b82f6',
              color: '#60a5fa',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '1px'
            }}
          >
            ITEMS: {inventory.length}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {inventory.map((item, idx) => (
            <div
              key={item.id || idx}
              className="glass-panel"
              style={{
                padding: 24,
                borderRadius: 10,
                border: item.equipped ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                background: item.equipped
                  ? 'linear-gradient(135deg, rgba(14, 30, 55, 0.7) 0%, rgba(10, 16, 30, 0.85) 100%)'
                  : 'rgba(15, 23, 42, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 28 }}>{item.icon || '⚔️'}</div>
                  {item.equipped && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '1px'
                      }}
                    >
                      <CheckCircle2 size={12} /> EQUIPPED
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '1px',
                    color: item.rarity === 'legendary' ? '#f59e0b' : item.rarity === 'rare' ? '#a855f7' : '#94a3b8',
                    textTransform: 'uppercase',
                    marginBottom: 4
                  }}
                >
                  {item.rarity || 'COMMON'} &bull; {item.category || 'WEAPON'}
                </div>

                <h3 style={{ margin: '0 0 8px 0', fontSize: 17, fontWeight: 800, color: '#f8fafc' }}>
                  {item.name}
                </h3>

                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  {item.description || 'Hunter gear that amplifies dungeon battle efficacy.'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#f87171', fontWeight: 800 }}>
                  {item.attack ? `+${item.attack} ATK` : item.defense ? `+${item.defense} DEF` : '+SPECIAL'}
                </span>
                <span style={{ fontSize: 11, color: '#64748b' }}>Item #{item.id}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default UserInventory;

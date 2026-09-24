import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Shield, Zap, Plus, X, Award, Crosshair, Wind, Heart } from 'lucide-react';
import { RARITIES } from '../data/items';

export const CharacterScreen = () => {
  const player = useGameStore((s) => s.player);
  const equipment = useGameStore((s) => s.equipment);
  const allocateStat = useGameStore((s) => s.allocateStat);
  const unequipItem = useGameStore((s) => s.unequipItem);
  const setScreen = useGameStore((s) => s.setScreen);
  const previousScreen = useGameStore((s) => s.previousScreen);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(5, 4, 10, 0.92)',
        backdropFilter: 'blur(16px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 960,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(168, 85, 247, 0.4)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-purple-light)', letterSpacing: '2px' }}>
              ASCENSION CORE INTERFACE
            </div>
            <h2 style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 800, fontSize: 24, margin: 0, color: '#f3f4f6' }}>
              HUNTER STATUS: {player.name}
            </h2>
          </div>
          <button
            onClick={() => setScreen(previousScreen === 'character' ? 'game' : previousScreen)}
            className="btn-rpg btn-rpg-secondary"
            style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <X size={16} /> CLOSE
          </button>
        </div>

        {/* Content Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, padding: 24, overflowY: 'auto' }}>
          {/* Left: Stats & Attributes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Level & XP Overview */}
            <div className="glass-panel" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 26, fontFamily: 'var(--font-cinzel)', fontWeight: 900, color: '#f3f4f6' }}>
                    LEVEL {player.level}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--accent-purple-light)', fontWeight: 600 }}>
                    SHADOW MONARCH INITIATE
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Unspent Stat Points:</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: player.statPoints > 0 ? '#fbbf24' : '#6b7280' }}>
                    {player.statPoints} PTS
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: 8, background: '#111827', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(player.xp / player.maxXp) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #7e22ce, #a855f7)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                <span>EXP</span>
                <span>{player.xp} / {player.maxXp}</span>
              </div>
            </div>

            {/* Combat Attributes (Allocatable) */}
            <div className="glass-panel" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', letterSpacing: '1px', marginBottom: 12 }}>
                CORE ATTRIBUTES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { key: 'strength', name: 'Strength (STR)', desc: '+Attack Power', val: player.attributes.strength },
                  { key: 'agility', name: 'Agility (AGI)', desc: '+Crit Rate & Movement Speed', val: player.attributes.agility },
                  { key: 'intelligence', name: 'Intelligence (INT)', desc: '+Max Mana reservoir', val: player.attributes.intelligence },
                  { key: 'vitality', name: 'Vitality (VIT)', desc: '+Max HP & Defense', val: player.attributes.vitality }
                ].map((attr) => (
                  <div
                    key={attr.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 4
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#f3f4f6' }}>{attr.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{attr.desc}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#e9d5ff', minWidth: 32, textAlign: 'right' }}>
                        {attr.val}
                      </span>
                      {player.statPoints > 0 && (
                        <button
                          onClick={() => allocateStat(attr.key)}
                          className="btn-rpg"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          title="Allocate +1 Point"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculated Combat Stats */}
            <div className="glass-panel" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', letterSpacing: '1px', marginBottom: 12 }}>
                COMBAT SPECIFICATIONS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: 10, borderRadius: 4 }}>
                  <div style={{ fontSize: 11, color: '#f87171' }}>Max Health (HP)</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f3f4f6' }}>{player.maxHp}</div>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: 10, borderRadius: 4 }}>
                  <div style={{ fontSize: 11, color: '#38bdf8' }}>Max Mana (MP)</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f3f4f6' }}>{player.maxMana}</div>
                </div>
                <div style={{ background: 'rgba(168, 85, 247, 0.08)', padding: 10, borderRadius: 4 }}>
                  <div style={{ fontSize: 11, color: '#c084fc' }}>Attack Power</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f3f4f6' }}>{player.attack}</div>
                </div>
                <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: 10, borderRadius: 4 }}>
                  <div style={{ fontSize: 11, color: '#60a5fa' }}>Defense</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f3f4f6' }}>{player.defense}</div>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: 10, borderRadius: 4 }}>
                  <div style={{ fontSize: 11, color: '#fbbf24' }}>Critical Chance</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f3f4f6' }}>{player.critChance}%</div>
                </div>
                <div style={{ background: 'rgba(234, 88, 12, 0.08)', padding: 10, borderRadius: 4 }}>
                  <div style={{ fontSize: 11, color: '#fb923c' }}>Critical Damage</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f3f4f6' }}>{player.critDamage}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Equipment Slots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="glass-panel" style={{ padding: 16, height: '100%' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', letterSpacing: '1px', marginBottom: 14 }}>
                EQUIPPED GEAR
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Weapon Slot */}
                {['weapon', 'armor', 'accessory'].map((slot) => {
                  const item = equipment[slot];
                  const rarity = item ? RARITIES[item.rarity] : null;

                  return (
                    <div
                      key={slot}
                      style={{
                        padding: 14,
                        borderRadius: 6,
                        border: item ? `1px solid ${rarity?.border || '#4b5563'}` : '1px dashed #374151',
                        background: item ? rarity?.bg : 'rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>
                          {slot}
                        </span>
                        {item && (
                          <span style={{ fontSize: 11, fontWeight: 800, color: rarity?.color }}>
                            {rarity?.name}
                          </span>
                        )}
                      </div>

                      {item ? (
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#f3f4f6', marginBottom: 4 }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#d1d5db', marginBottom: 6 }}>
                            {item.description}
                          </div>
                          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#a855f7', fontWeight: 600 }}>
                            {item.attack && <span>ATK +{item.attack}</span>}
                            {item.defense && <span>DEF +{item.defense}</span>}
                            {item.maxHp && <span>HP +{item.maxHp}</span>}
                            {item.critChance && <span>CRIT +{item.critChance}%</span>}
                          </div>
                          <button
                            onClick={() => unequipItem(slot)}
                            className="btn-rpg btn-rpg-secondary"
                            style={{ marginTop: 10, padding: '4px 12px', fontSize: 11 }}
                          >
                            UNEQUIP
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic', padding: '12px 0' }}>
                          No {slot} equipped
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

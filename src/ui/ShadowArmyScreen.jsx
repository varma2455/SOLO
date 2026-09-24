import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { X, Shield, Zap, Sparkles, Check, ArrowUpRight, Flame } from 'lucide-react';

export const ShadowArmyScreen = () => {
  const shadows = useGameStore((s) => s.shadows);
  const player = useGameStore((s) => s.player);
  const maxActive = useGameStore((s) => s.maxActiveShadows);
  const toggleShadowActive = useGameStore((s) => s.toggleShadowActive);
  const upgradeShadow = useGameStore((s) => s.upgradeShadow);
  const setScreen = useGameStore((s) => s.setScreen);
  const previousScreen = useGameStore((s) => s.previousScreen);

  const [selectedShadow, setSelectedShadow] = useState(shadows[0] || null);

  const activeCount = shadows.filter((s) => s.active && s.unlocked).length;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(4, 2, 8, 0.94)',
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
          maxWidth: 980,
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
              MONARCH DOMINION COMMAND
            </div>
            <h2 style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 800, fontSize: 24, margin: 0, color: '#f3f4f6' }}>
              SHADOW ARMY ({activeCount} / {maxActive} ACTIVE)
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c084fc', fontSize: 13, fontWeight: 700 }}>
              <span>ASCENSION ESSENCE:</span> <span>{player.shadowCores}</span>
            </div>
            <button
              onClick={() => setScreen(previousScreen === 'shadows' ? 'game' : previousScreen)}
              className="btn-rpg btn-rpg-secondary"
              style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <X size={16} /> CLOSE
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, padding: 24, overflowY: 'auto' }}>
          {/* Left: List of Shadows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {shadows.map((sh) => {
              const isSelected = selectedShadow?.id === sh.id;
              const isUnlocked = sh.unlocked;

              return (
                <div
                  key={sh.id}
                  onClick={() => setSelectedShadow(sh)}
                  style={{
                    padding: 16,
                    borderRadius: 6,
                    border: `1px solid ${isSelected ? '#a855f7' : isUnlocked ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)'}`,
                    background: isUnlocked
                      ? isSelected
                        ? 'rgba(147, 51, 234, 0.15)'
                        : 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(0, 0, 0, 0.4)',
                    cursor: isUnlocked ? 'pointer' : 'default',
                    opacity: isUnlocked ? 1 : 0.45,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Shadow Avatar circle */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: isUnlocked ? 'radial-gradient(circle, #581c87, #09090b)' : '#1f2937',
                        border: `2px solid ${sh.glowColor || '#9333ea'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: sh.glowColor || '#c084fc',
                        fontWeight: 900,
                        fontSize: 18,
                        fontFamily: 'var(--font-cinzel)'
                      }}
                    >
                      {sh.rank}
                    </div>

                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: isUnlocked ? '#f3f4f6' : '#9ca3af' }}>
                        {sh.name} {!isUnlocked && <span style={{ fontSize: 12, color: '#ef4444' }}>(NOT EXTRACTED)</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#c084fc' }}>
                        Rank {sh.rank} &bull; Level {sh.level} &bull; {sh.role}
                      </div>
                    </div>
                  </div>

                  {/* Active Summon Indicator */}
                  {isUnlocked && (
                    <div>
                      {sh.active ? (
                        <span
                          style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            border: '1px solid #22c55e',
                            color: '#4ade80',
                            fontSize: 11,
                            padding: '4px 10px',
                            borderRadius: 4,
                            fontWeight: 700
                          }}
                        >
                          SUMMONED
                        </span>
                      ) : (
                        <span
                          style={{
                            background: 'rgba(75, 85, 99, 0.2)',
                            border: '1px solid #4b5563',
                            color: '#9ca3af',
                            fontSize: 11,
                            padding: '4px 10px',
                            borderRadius: 4,
                            fontWeight: 600
                          }}
                        >
                          RESTING
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Detailed Shadow Profile */}
          {selectedShadow ? (
            <div className="glass-panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: selectedShadow.glowColor || '#a855f7', letterSpacing: '1.5px' }}>
                    RANK {selectedShadow.rank} &bull; {selectedShadow.role.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 13, color: '#d8b4fe', fontWeight: 700 }}>
                    LEVEL {selectedShadow.level}
                  </span>
                </div>

                <h3 style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 900, fontSize: 22, color: '#f3f4f6', marginBottom: 10 }}>
                  {selectedShadow.name}
                </h3>

                <p style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.5, marginBottom: 20 }}>
                  {selectedShadow.description}
                </p>

                {/* Attributes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: 10, borderRadius: 4 }}>
                    <div style={{ fontSize: 11, color: '#f87171' }}>Shadow Vitality (HP)</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#f3f4f6' }}>{selectedShadow.hp}</div>
                  </div>
                  <div style={{ background: 'rgba(168, 85, 247, 0.08)', padding: 10, borderRadius: 4 }}>
                    <div style={{ fontSize: 11, color: '#c084fc' }}>Shadow Strike (ATK)</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#f3f4f6' }}>{selectedShadow.attack}</div>
                  </div>
                  <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: 10, borderRadius: 4 }}>
                    <div style={{ fontSize: 11, color: '#60a5fa' }}>Shadow Guard (DEF)</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#f3f4f6' }}>{selectedShadow.defense}</div>
                  </div>
                  <div style={{ background: 'rgba(6, 182, 212, 0.08)', padding: 10, borderRadius: 4 }}>
                    <div style={{ fontSize: 11, color: '#22d3ee' }}>Movement Speed</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#f3f4f6' }}>{selectedShadow.speed}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedShadow.unlocked ? (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => toggleShadowActive(selectedShadow.id)}
                    className={selectedShadow.active ? 'btn-rpg btn-rpg-secondary' : 'btn-rpg glow-box-purple'}
                    style={{ flex: 1, padding: '12px 18px', fontSize: 14 }}
                  >
                    {selectedShadow.active ? 'DISMISS FROM PARTY' : 'SUMMON TO WORLD'}
                  </button>

                  <button
                    onClick={() => upgradeShadow(selectedShadow.id)}
                    className="btn-rpg"
                    style={{ padding: '12px 18px', fontSize: 14, background: 'linear-gradient(135deg, #7e22ce, #4c1d95)' }}
                    title="Ascend using 1 Essence Shard"
                  >
                    ASCEND (1 ESSENCE)
                  </button>
                </div>
              ) : (
                <div style={{ padding: 14, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 4, textAlign: 'center', fontSize: 13, color: '#fca5a5' }}>
                  Defeat this monster in the Forgotten Crypt and perform Shadow Extraction to awaken it.
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>
              Select a shadow soldier to view command options.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

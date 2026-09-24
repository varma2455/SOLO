import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { SKILLS } from '../data/skills';
import { Sword, Zap, Wind, Flame, Shield, User, Backpack, Users, Settings, Crosshair } from 'lucide-react';
import { sound } from '../audio/soundManager';

export const HUD = () => {
  const player = useGameStore((s) => s.player);
  const dungeon = useGameStore((s) => s.dungeon);
  const quests = useGameStore((s) => s.quests);
  const skillCooldowns = useGameStore((s) => s.skillCooldowns);
  const setScreen = useGameStore((s) => s.setScreen);
  const tookDamageRecent = useGameStore((s) => s.tookDamageRecent);
  const extractionTarget = useGameStore((s) => s.extractionTarget);
  const executableEnemyId = useGameStore((s) => s.executableEnemyId);
  const shadows = useGameStore((s) => s.shadows);

  // Time ticker for cooldown display
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(timer);
  }, []);

  // Debug FPS Counter when ?debug=true
  const [fps, setFps] = useState(60);
  const isDebug = typeof window !== 'undefined' && window.location.search.includes('debug=true');

  useEffect(() => {
    if (!isDebug) return;
    let frames = 0;
    let lastTime = performance.now();
    const interval = setInterval(() => {
      const nowTime = performance.now();
      const currentFps = Math.round((frames * 1000) / (nowTime - lastTime));
      setFps(currentFps);
      frames = 0;
      lastTime = nowTime;
    }, 1000);

    let animId;
    const countFrame = () => {
      frames++;
      animId = requestAnimationFrame(countFrame);
    };
    animId = requestAnimationFrame(countFrame);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animId);
    };
  }, [isDebug]);

  // Boss Encounter Cinematic Intro
  const [showBossIntro, setShowBossIntro] = useState(false);
  const bossActive = dungeon.bossActive;

  useEffect(() => {
    if (bossActive) {
      setShowBossIntro(true);
      const timer = setTimeout(() => setShowBossIntro(false), 3800);
      return () => clearTimeout(timer);
    }
  }, [bossActive]);

  const now = Date.now() / 1000;

  // Calculate cooldown remaining for each skill
  const getCooldownRemaining = (skillId) => {
    const expiresAt = skillCooldowns[skillId] || 0;
    return Math.max(0, expiresAt - now);
  };

  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const mpPercent = Math.max(0, Math.min(100, (player.mana / player.maxMana) * 100));
  const xpPercent = Math.max(0, Math.min(100, (player.xp / player.maxXp) * 100));

  const activeQuest = quests.find((q) => !q.completed) || quests[0];
  const activeShadowsCount = shadows.filter((s) => s.active && s.unlocked).length;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
      {/* Debug FPS Counter when ?debug=true */}
      {isDebug && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            padding: '4px 8px',
            background: 'rgba(0, 0, 0, 0.75)',
            border: '1px solid #4ade80',
            color: '#4ade80',
            fontFamily: 'monospace',
            fontSize: 12,
            fontWeight: 'bold',
            zIndex: 99
          }}
        >
          FPS: {fps}
        </div>
      )}

      {/* Cinematic Boss Introduction Card */}
      {showBossIntro && (
        <div
          style={{
            position: 'absolute',
            top: '32%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 45
          }}
        >
          <div style={{ fontSize: 13, letterSpacing: '6px', color: '#f87171', fontWeight: 800 }}>
            ANCIENT SOVEREIGN AWAKENS
          </div>
          <div
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontWeight: 900,
              fontSize: 'clamp(32px, 5vw, 48px)',
              color: '#f3f4f6',
              letterSpacing: '4px',
              textShadow: '0 0 30px rgba(168, 85, 247, 0.9), 0 0 60px rgba(147, 51, 234, 0.6)',
              margin: '8px 0'
            }}
          >
            BOSS ENCOUNTER: ABYSS WARDEN
          </div>
          <div style={{ fontSize: 14, color: '#c084fc', letterSpacing: '3px', fontWeight: 700 }}>
            RANK A &bull; MONARCH OF THE FORGOTTEN CRYPT
          </div>
        </div>
      )}

      {/* Red screen flash vignette on taking damage */}
      <div className={`damage-overlay ${tookDamageRecent ? 'active' : ''}`} />

      {/* --- TOP-LEFT: PLAYER STATUS --- */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          padding: '14px 20px',
          minWidth: 280,
          pointerEvents: 'auto',
          borderLeft: '3px solid var(--accent-purple)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #7e22ce, #3b0764)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #c084fc'
              }}
            >
              <User size={20} color="#f3f4f6" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 800, fontSize: 16, color: '#f3f4f6', letterSpacing: '1px' }}>
                {player.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--accent-purple-light)', fontWeight: 600 }}>
                LEVEL {player.level} AWAKENED
              </div>
            </div>
          </div>
          {player.statPoints > 0 && (
            <div
              onClick={() => setScreen('character')}
              style={{
                background: 'rgba(245, 158, 11, 0.25)',
                border: '1px solid #f59e0b',
                color: '#fbbf24',
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              +{player.statPoints} PTS
            </div>
          )}
        </div>

        {/* HP Bar */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#f87171', marginBottom: 2 }}>
            <span>HP</span>
            <span>{Math.round(player.hp)} / {player.maxHp}</span>
          </div>
          <div style={{ width: '100%', height: 10, background: 'rgba(0, 0, 0, 0.7)', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <div
              style={{
                width: `${hpPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #b91c1c, #ef4444)',
                transition: 'width 0.2s ease-out'
              }}
            />
          </div>
        </div>

        {/* MP Bar */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#38bdf8', marginBottom: 2 }}>
            <span>MP</span>
            <span>{Math.round(player.mana)} / {player.maxMana}</span>
          </div>
          <div style={{ width: '100%', height: 8, background: 'rgba(0, 0, 0, 0.7)', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
            <div
              style={{
                width: `${mpPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0369a1, #0284c7)',
                transition: 'width 0.2s ease-out'
              }}
            />
          </div>
        </div>

        {/* XP Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: '#c084fc', marginBottom: 2 }}>
            <span>XP</span>
            <span>{player.xp} / {player.maxXp} ({Math.round(xpPercent)}%)</span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'rgba(0, 0, 0, 0.7)', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <div
              style={{
                width: `${xpPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6b21a8, #a855f7)',
                transition: 'width 0.3s ease-out'
              }}
            />
          </div>
        </div>

        {/* Dynamic Encounter & Danger Rating Card */}
        <div
          style={{
            marginTop: 10,
            padding: '8px 10px',
            background: 'rgba(10, 10, 18, 0.85)',
            borderRadius: 4,
            border: '1px solid rgba(168, 85, 247, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 700, letterSpacing: '1px' }}>
              GATE RANK {dungeon.rank || 'E'} &bull; {dungeon.currentRoom === 4 ? 'BOSS' : `ROOM ${dungeon.currentRoom}`}
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#e5e7eb', fontFamily: 'var(--font-cinzel)', marginTop: 2 }}>
              {dungeon.currentEncounter?.typeName || (dungeon.currentRoom === 4 ? 'Boss Arena' : `Room ${dungeon.currentRoom}`)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 700 }}>DANGER LEVEL</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: (dungeon.dangerRating?.stars || 3) >= 4 ? '#ef4444' : (dungeon.dangerRating?.stars || 3) >= 3 ? '#f59e0b' : '#38bdf8' }}>
              {dungeon.dangerRating?.ratingText || '★★★☆☆'} {dungeon.dangerRating?.label || 'HIGH'}
            </div>
          </div>
        </div>

        {/* Wave indicator if multi-wave encounter */}
        {dungeon.totalWaves > 1 && (
          <div
            style={{
              marginTop: 6,
              padding: '4px 8px',
              background: 'rgba(88, 28, 135, 0.6)',
              borderRadius: 3,
              border: '1px solid #a855f7',
              textAlign: 'center',
              fontSize: 10,
              fontWeight: 800,
              color: '#f5d0fe',
              letterSpacing: '1px'
            }}
          >
            ⚔️ WAVE {dungeon.currentWave} OF {dungeon.totalWaves} ACTIVE
          </div>
        )}
      </div>

      {/* --- TOP-CENTER: BOSS HP BAR (WHEN ACTIVE) --- */}
      {dungeon.bossActive && dungeon.bossHp > 0 && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 28px',
            minWidth: 460,
            border: dungeon.bossRage ? '1px solid #ef4444' : '1px solid rgba(168, 85, 247, 0.5)',
            boxShadow: dungeon.bossRage ? '0 0 25px rgba(239, 68, 68, 0.5)' : '0 0 20px rgba(147, 51, 234, 0.4)',
            textAlign: 'center',
            pointerEvents: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 900, fontSize: 18, color: dungeon.bossRage ? '#f87171' : '#f3f4f6', letterSpacing: '2px' }}>
              ABYSS WARDEN {dungeon.bossRage && <span style={{ color: '#ef4444', fontSize: 13 }}>[RAGE MODE]</span>}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-purple-light)' }}>
              PHASE {dungeon.bossPhase} / 4
            </div>
          </div>
          <div style={{ width: '100%', height: 14, background: 'rgba(0, 0, 0, 0.8)', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <div
              style={{
                width: `${Math.max(0, (dungeon.bossHp / dungeon.bossMaxHp) * 100)}%`,
                height: '100%',
                background: dungeon.bossRage ? 'linear-gradient(90deg, #991b1b, #ef4444)' : 'linear-gradient(90deg, #581c87, #a855f7)',
                transition: 'width 0.15s ease-out'
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, fontWeight: 600 }}>
            HP: {Math.round(dungeon.bossHp)} / {dungeon.bossMaxHp}
          </div>
        </div>
      )}

      {/* --- TOP-RIGHT: CURRENT QUEST & QUICK MENU BUTTONS --- */}
      <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end', pointerEvents: 'auto' }}>
        {/* Navigation Shortcut Bar */}
        <div className="glass-panel" style={{ display: 'flex', gap: 6, padding: 6 }}>
          <button
            onClick={() => setScreen('character')}
            className="btn-rpg btn-rpg-secondary"
            style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            title="Character (C)"
          >
            <User size={14} /> Character
          </button>
          <button
            onClick={() => setScreen('inventory')}
            className="btn-rpg btn-rpg-secondary"
            style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            title="Inventory (I)"
          >
            <Backpack size={14} /> Inventory
          </button>
          <button
            onClick={() => setScreen('shadows')}
            className="btn-rpg"
            style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--accent-purple-light)' }}
            title="Shadow Army (Y)"
          >
            <Users size={14} /> Shadows ({activeShadowsCount}/3)
          </button>
          <button
            onClick={() => setScreen('settings')}
            className="btn-rpg btn-rpg-secondary"
            style={{ padding: '6px 10px', fontSize: 12 }}
            title="Settings (ESC)"
          >
            <Settings size={14} />
          </button>
        </div>

        {/* Quest Panel */}
        {activeQuest && (
          <div
            className="glass-panel"
            style={{
              padding: '14px 18px',
              minWidth: 260,
              maxWidth: 320,
              borderRight: '3px solid var(--accent-gold)'
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-gold)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 2 }}>
              CURRENT QUEST
            </div>
            <div style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 800, fontSize: 15, color: '#f3f4f6', marginBottom: 8 }}>
              {activeQuest.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {activeQuest.objectives.map((obj) => (
                <div key={obj.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: obj.current >= obj.target ? '#4ade80' : '#d1d5db' }}>
                  <span>{obj.text}</span>
                  <span style={{ fontWeight: 700 }}>
                    {obj.current} / {obj.target}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
              <span>Reward:</span>
              <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                +{activeQuest.rewards.xp} XP / +{activeQuest.rewards.gold} Gold
              </span>
            </div>
          </div>
        )}
      </div>

      {/* --- CENTER OVERLAY: SOUL EXTRACTION PROMPT --- */}
      {extractionTarget && (
        <div
          className="glass-panel anim-rune"
          style={{
            position: 'absolute',
            bottom: 140,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '16px 32px',
            textAlign: 'center',
            border: '2px solid #a855f7',
            boxShadow: '0 0 35px rgba(168, 85, 247, 0.7)',
            pointerEvents: 'auto'
          }}
        >
          <div style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 900, fontSize: 20, color: '#c084fc', letterSpacing: '2px', marginBottom: 4 }}>
            SHADOW EXTRACTION
          </div>
          <div style={{ fontSize: 13, color: '#e5e7eb', marginBottom: 12 }}>
            Extract soul essence of <strong style={{ color: '#f59e0b' }}>{extractionTarget.name}</strong> [Rank {extractionTarget.rank}]?
          </div>
          <button
            onClick={() => useGameStore.getState().performExtraction()}
            className="btn-rpg"
            style={{ fontSize: 14, padding: '10px 24px', background: 'linear-gradient(135deg, #581c87, #3b0764)' }}
          >
            [ F ] EXTRACT SHADOW
          </button>
        </div>
      )}

      {/* --- FINISHER / EXECUTION PROMPT BANNER --- */}
      {executableEnemyId && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            bottom: 125,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 28px',
            textAlign: 'center',
            background: 'rgba(127, 29, 29, 0.95)',
            border: '2px solid #ef4444',
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.85)',
            pointerEvents: 'auto',
            cursor: 'pointer',
            zIndex: 40
          }}
          onClick={() => useGameStore.getState().triggerFinisher(executableEnemyId)}
        >
          <div style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 900, fontSize: 16, color: '#fef2f2', letterSpacing: '3px' }}>
            ⚡ SHADOW EXECUTION FINISHER
          </div>
          <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 3 }}>
            Press <strong style={{ color: '#ffffff', background: '#991b1b', padding: '2px 8px', borderRadius: 3, border: '1px solid #f87171' }}>[ F ]</strong> or Click to Execute Target!
          </div>
        </div>
      )}

      {/* --- BOTTOM-CENTER: SKILL BAR --- */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 12,
          pointerEvents: 'auto'
        }}
      >
        {/* LMB: Basic Attack */}
        <div
          className="glass-panel"
          style={{
            width: 68,
            height: 68,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '1px solid rgba(168, 85, 247, 0.4)'
          }}
        >
          <Sword size={22} color="#f3f4f6" />
          <div style={{ fontSize: 10, fontWeight: 700, color: '#c084fc', marginTop: 4 }}>LMB</div>
          <div style={{ fontSize: 9, color: '#9ca3af' }}>Strike</div>
        </div>

        {/* Q: Shadow Slash */}
        {(() => {
          const cd = getCooldownRemaining('shadowSlash');
          const isReady = cd <= 0;
          return (
            <div
              className="glass-panel"
              style={{
                width: 68,
                height: 68,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                border: isReady ? '1px solid #a855f7' : '1px solid #4b5563'
              }}
            >
              <Zap size={22} color={isReady ? '#a855f7' : '#6b7280'} />
              <div style={{ fontSize: 10, fontWeight: 700, color: isReady ? '#c084fc' : '#9ca3af', marginTop: 4 }}>Q</div>
              <div style={{ fontSize: 9, color: '#9ca3af' }}>Slash</div>
              {!isReady && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                    fontWeight: 800,
                    fontSize: 14
                  }}
                >
                  {cd.toFixed(1)}s
                </div>
              )}
            </div>
          );
        })()}

        {/* E: Void Burst */}
        {(() => {
          const cd = getCooldownRemaining('voidBurst');
          const isReady = cd <= 0;
          return (
            <div
              className="glass-panel"
              style={{
                width: 68,
                height: 68,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                border: isReady ? '1px solid #8b5cf6' : '1px solid #4b5563'
              }}
            >
              <Crosshair size={22} color={isReady ? '#8b5cf6' : '#6b7280'} />
              <div style={{ fontSize: 10, fontWeight: 700, color: isReady ? '#c4b5fd' : '#9ca3af', marginTop: 4 }}>E</div>
              <div style={{ fontSize: 9, color: '#9ca3af' }}>Void</div>
              {!isReady && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                    fontWeight: 800,
                    fontSize: 14
                  }}
                >
                  {cd.toFixed(1)}s
                </div>
              )}
            </div>
          );
        })()}

        {/* SPACE: Phantom Step Dash */}
        {(() => {
          const cd = getCooldownRemaining('phantomStep');
          const isReady = cd <= 0;
          return (
            <div
              className="glass-panel"
              style={{
                width: 68,
                height: 68,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                border: isReady ? '1px solid #06b6d4' : '1px solid #4b5563'
              }}
            >
              <Wind size={22} color={isReady ? '#06b6d4' : '#6b7280'} />
              <div style={{ fontSize: 10, fontWeight: 700, color: isReady ? '#a5f3fc' : '#9ca3af', marginTop: 4 }}>SPACE</div>
              <div style={{ fontSize: 9, color: '#9ca3af' }}>Dash</div>
              {!isReady && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                    fontWeight: 800,
                    fontSize: 14
                  }}
                >
                  {cd.toFixed(1)}s
                </div>
              )}
            </div>
          );
        })()}

        {/* R: Eclipse Dominion Ultimate */}
        {(() => {
          const cd = getCooldownRemaining('eclipseDominion');
          const isReady = cd <= 0;
          return (
            <div
              className="glass-panel"
              style={{
                width: 68,
                height: 68,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                border: isReady ? '2px solid #d946ef' : '1px solid #4b5563',
                boxShadow: isReady ? '0 0 15px rgba(217, 70, 239, 0.5)' : 'none'
              }}
            >
              <Flame size={24} color={isReady ? '#d946ef' : '#6b7280'} />
              <div style={{ fontSize: 10, fontWeight: 700, color: isReady ? '#f5d0fe' : '#9ca3af', marginTop: 4 }}>R</div>
              <div style={{ fontSize: 9, color: '#9ca3af' }}>Ultimate</div>
              {!isReady && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                    fontWeight: 800,
                    fontSize: 14
                  }}
                >
                  {cd.toFixed(1)}s
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* --- BOTTOM-RIGHT: RADAR / MINI-MAP --- */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: 24,
          right: 20,
          width: 150,
          height: 150,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid rgba(168, 85, 247, 0.5)',
          background: 'rgba(10, 10, 18, 0.85)',
          pointerEvents: 'auto'
        }}
      >
        {/* Radar crosshairs */}
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(168, 85, 247, 0.2)' }} />
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(168, 85, 247, 0.2)' }} />
        <div style={{ position: 'absolute', inset: 15, borderRadius: '50%', border: '1px solid rgba(168, 85, 247, 0.15)' }} />

        {/* Center: Player dot */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#38bdf8',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 6px #38bdf8'
          }}
        />

        {/* Room Area Label */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 9,
            fontWeight: 700,
            color: '#c084fc',
            letterSpacing: '1px'
          }}
        >
          {dungeon.currentRoom === 4 ? 'BOSS ARENA' : `ROOM ${dungeon.currentRoom}`}
        </div>
      </div>
    </div>
  );
};

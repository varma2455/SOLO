import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { SKILLS } from '../data/skills';
import { Sword, Zap, Wind, Flame, Shield, User, Backpack, Users, Settings, Crosshair, Heart } from 'lucide-react';
import { sound } from '../audio/soundManager';
import { liveDebugMetrics } from '../game/GameCanvas';
import { livePlayerMetrics } from '../game/player/Player';
import { getAllLivingEnemies } from '../game/combat/EnemyPositionTracker';
import { safeVector3, DEFAULT_PLAYER_POSITION } from '../utils/vector3';
import { inputManager } from '../game/player/InputManager';

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
  const graphicsQuality = useGameStore((s) => s.graphicsQuality || 'high');
  const gameFlowState = useGameStore((s) => s.gameFlowState);
  const activeEncounter = useGameStore((s) => s.activeEncounter);
  const lockedTargetId = useGameStore((s) => s.lockedTargetId);

  // Time ticker for cooldown display
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(timer);
  }, []);

  // Real-time input & movement controller panel state
  const [controllerState, setControllerState] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
    pos: [0, 1, 8],
    vel: [0, 0, 0],
    speed: 0,
    collapsed: false
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const keys = inputManager ? inputManager.keys : livePlayerMetrics.keys;
      setControllerState((prev) => ({
        ...prev,
        w: Boolean(keys.forward || livePlayerMetrics.keys.w),
        a: Boolean(keys.left || livePlayerMetrics.keys.a),
        s: Boolean(keys.backward || livePlayerMetrics.keys.s),
        d: Boolean(keys.right || livePlayerMetrics.keys.d),
        pos: [
          Number(livePlayerMetrics.pos[0].toFixed(1)),
          Number(livePlayerMetrics.pos[1].toFixed(1)),
          Number(livePlayerMetrics.pos[2].toFixed(1))
        ],
        vel: [
          Number(livePlayerMetrics.vel[0].toFixed(2)),
          Number(livePlayerMetrics.vel[1].toFixed(2)),
          Number(livePlayerMetrics.vel[2].toFixed(2))
        ],
        speed: Number(livePlayerMetrics.speed.toFixed(1))
      }));
    }, 60);

    return () => clearInterval(interval);
  }, []);

  // Debug Engine Telemetry Monitor (?debug=true)
  const [debugStats, setDebugStats] = useState({
    fps: 60,
    frameTime: 16.6,
    drawCalls: 0,
    triangles: 0,
    textures: 0,
    memMB: null,
    playerPos: [0, 1, 8],
    playerVel: [0, 0, 0],
    playerSpeed: 0,
    camPos: [0, 3.2, 14.5],
    keys: { w: false, a: false, s: false, d: false, lmb: false, space: false },
    isMoving: false,
    isDashing: false,
    target: null,
    livingCount: 0
  });
  const isDebug = typeof window !== 'undefined' && window.location.search.includes('debug=true');

  useEffect(() => {
    let frames = 0;
    let lastTime = performance.now();
    let lowFpsStreak = 0;

    const interval = setInterval(() => {
      const nowTime = performance.now();
      const currentFps = Math.max(1, Math.round((frames * 1000) / (nowTime - lastTime)));

      // Auto FPS Optimization Loop: dynamically steps down quality if framerate struggles
      if (useGameStore.getState().autoFpsOptimization) {
        if (currentFps < 42) {
          lowFpsStreak++;
          if (lowFpsStreak >= 3) {
            lowFpsStreak = 0;
            const curQ = useGameStore.getState().graphicsQuality;
            if (curQ === 'ultra') useGameStore.getState().setGraphicsQuality('high');
            else if (curQ === 'high') useGameStore.getState().setGraphicsQuality('medium');
            else if (curQ === 'medium') useGameStore.getState().setGraphicsQuality('low');
          }
        } else {
          lowFpsStreak = 0;
        }
      }

      if (isDebug) {
        let mem = null;
        if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
          mem = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
        }

        const metrics = (typeof window !== 'undefined' && window.__debugMetrics) || liveDebugMetrics;
        const living = getAllLivingEnemies();
        const curTarget = useGameStore.getState().lockedTargetId;
        const targetEntry = curTarget ? living.find((e) => e.id === curTarget) : null;

        setDebugStats({
          fps: currentFps,
          frameTime: metrics.frameTime || 16.6,
          drawCalls: metrics.drawCalls || 0,
          triangles: metrics.triangles || 0,
          textures: metrics.textures || 0,
          memMB: mem,
          playerPos: [...livePlayerMetrics.pos],
          playerVel: [...livePlayerMetrics.vel],
          playerSpeed: livePlayerMetrics.speed,
          camPos: [...livePlayerMetrics.camPos],
          keys: { ...livePlayerMetrics.keys },
          isMoving: livePlayerMetrics.isMoving,
          isDashing: livePlayerMetrics.isDashing,
          target: targetEntry ? `${targetEntry.name || targetEntry.id} (HP: ${Math.round(targetEntry.hp)})` : (curTarget || null),
          livingCount: living.length
        });
      }

      frames = 0;
      lastTime = nowTime;
    }, 500);

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
      {/* Debug Engine Performance Monitor when ?debug=true */}
      {isDebug && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            padding: '10px 14px',
            background: 'rgba(5, 5, 12, 0.92)',
            border: '1px solid rgba(16, 185, 129, 0.65)',
            borderRadius: '6px',
            color: '#34d399',
            fontFamily: 'monospace',
            fontSize: 11.5,
            lineHeight: 1.5,
            zIndex: 99,
            pointerEvents: 'none',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.85)',
            minWidth: 260
          }}
        >
          <div style={{ fontWeight: 800, color: '#6ee7b7', borderBottom: '1px solid rgba(16,185,129,0.3)', paddingBottom: 3, marginBottom: 5, letterSpacing: '0.5px' }}>
            ENGINE TELEMETRY (?debug=true)
          </div>
          <div>FPS: <span style={{ color: debugStats.fps >= 55 ? '#34d399' : debugStats.fps >= 30 ? '#fbbf24' : '#f87171', fontWeight: 800 }}>{debugStats.fps}</span> <span style={{ color: '#9ca3af' }}>({debugStats.frameTime} ms)</span></div>
          <div>Pos: <span style={{ color: '#f3f4f6' }}>[{debugStats.playerPos.map((n) => Number(n).toFixed(1)).join(', ')}]</span></div>
          <div>Vel: <span style={{ color: '#60a5fa' }}>[{debugStats.playerVel.map((n) => Number(n).toFixed(2)).join(', ')}]</span> <span style={{ color: '#9ca3af' }}>({debugStats.playerSpeed.toFixed(1)} m/s)</span></div>
          <div>Cam: <span style={{ color: '#f3f4f6' }}>[{debugStats.camPos.map((n) => Number(n).toFixed(1)).join(', ')}]</span></div>
          <div>
            Input: <span style={{ color: debugStats.keys.w ? '#34d399' : '#6b7280', fontWeight: 700 }}>W</span>{' '}
            <span style={{ color: debugStats.keys.a ? '#34d399' : '#6b7280', fontWeight: 700 }}>A</span>{' '}
            <span style={{ color: debugStats.keys.s ? '#34d399' : '#6b7280', fontWeight: 700 }}>S</span>{' '}
            <span style={{ color: debugStats.keys.d ? '#34d399' : '#6b7280', fontWeight: 700 }}>D</span> |{' '}
            <span style={{ color: debugStats.keys.lmb ? '#f59e0b' : '#6b7280', fontWeight: 700 }}>LMB</span>{' '}
            <span style={{ color: debugStats.isDashing ? '#a855f7' : '#6b7280', fontWeight: 700 }}>DASH</span>
          </div>
          <div>Target: <span style={{ color: debugStats.target ? '#f59e0b' : '#9ca3af', fontWeight: 700 }}>{debugStats.target || 'NONE'}</span></div>
          <div>Enemies: <span style={{ color: '#38bdf8', fontWeight: 700 }}>{debugStats.livingCount} Active Living</span></div>
          <div>Flow: <span style={{ color: '#38bdf8', fontWeight: 700 }}>{gameFlowState}</span> (Room {dungeon.currentRoom})</div>
          <div>Draw Calls: <span style={{ color: '#f3f4f6' }}>{debugStats.drawCalls}</span> | Tris: <span style={{ color: '#f3f4f6' }}>{debugStats.triangles.toLocaleString()}</span></div>
          <div>Textures: <span style={{ color: '#f3f4f6' }}>{debugStats.textures}</span> {debugStats.memMB && <span>| Mem: {debugStats.memMB}MB</span>}</div>
          <div>Preset: <span style={{ color: '#c084fc', textTransform: 'uppercase', fontWeight: 700 }}>{graphicsQuality}</span></div>
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

      {/* --- TOP-LEFT: INTERACTIVE CONTROLLER STATUS & MANUAL TEST PANEL --- */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          top: 240,
          left: 20,
          padding: '12px 14px',
          width: 280,
          pointerEvents: 'auto',
          borderLeft: '3px solid #38bdf8',
          background: 'rgba(10, 12, 22, 0.94)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.85)',
          zIndex: 35
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, borderBottom: '1px solid rgba(56, 189, 248, 0.25)', paddingBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#38bdf8', letterSpacing: '0.8px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
            CONTROLLER STATUS & TEST
          </div>
          <button
            onClick={() => setControllerState((s) => ({ ...s, collapsed: !s.collapsed }))}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 800
            }}
          >
            {controllerState.collapsed ? '[ + ]' : '[ - ]'}
          </button>
        </div>

        {!controllerState.collapsed && (
          <div>
            {/* WASD Real-Time Physical Key Indicators */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <div
                style={{
                  width: 38,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  background: controllerState.w ? '#10b981' : 'rgba(30, 41, 59, 0.8)',
                  color: controllerState.w ? '#022c22' : '#94a3b8',
                  border: `1px solid ${controllerState.w ? '#34d399' : 'rgba(71, 85, 105, 0.6)'}`,
                  boxShadow: controllerState.w ? '0 0 12px rgba(16, 185, 129, 0.8)' : 'none',
                  transition: 'all 0.08s ease-out'
                }}
              >
                W
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['A', 'S', 'D'].map((key) => {
                  const active =
                    key === 'A' ? controllerState.a :
                    key === 'S' ? controllerState.s : controllerState.d;
                  return (
                    <div
                      key={key}
                      style={{
                        width: 38,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 900,
                        fontFamily: 'monospace',
                        background: active ? '#10b981' : 'rgba(30, 41, 59, 0.8)',
                        color: active ? '#022c22' : '#94a3b8',
                        border: `1px solid ${active ? '#34d399' : 'rgba(71, 85, 105, 0.6)'}`,
                        boxShadow: active ? '0 0 12px rgba(16, 185, 129, 0.8)' : 'none',
                        transition: 'all 0.08s ease-out'
                      }}
                    >
                      {key}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coordinates & Velocity */}
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8', marginBottom: 8, lineHeight: 1.45, background: 'rgba(0,0,0,0.4)', padding: '5px 8px', borderRadius: 4 }}>
              <div>Pos: <span style={{ color: '#f8fafc', fontWeight: 700 }}>[{controllerState.pos.join(', ')}]</span></div>
              <div>Vel: <span style={{ color: '#38bdf8', fontWeight: 700 }}>[{controllerState.vel.join(', ')}]</span> ({controllerState.speed} m/s)</div>
            </div>

            {/* Manual Movement Test Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                className="btn-rpg"
                onMouseDown={() => inputManager?.setKey('forward', true)}
                onMouseUp={() => inputManager?.setKey('forward', false)}
                onClick={() => window.__moveForward?.(450)}
                style={{ padding: '5px 8px', fontSize: 11, width: '100%', fontWeight: 700, borderColor: '#38bdf8', cursor: 'pointer' }}
              >
                [ ▲ MOVE FORWARD ]
              </button>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="btn-rpg"
                  onMouseDown={() => inputManager?.setKey('left', true)}
                  onMouseUp={() => inputManager?.setKey('left', false)}
                  onClick={() => window.__moveLeft?.(450)}
                  style={{ flex: 1, padding: '5px 4px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  [ ◄ LEFT ]
                </button>
                <button
                  className="btn-rpg"
                  onMouseDown={() => inputManager?.setKey('backward', true)}
                  onMouseUp={() => inputManager?.setKey('backward', false)}
                  onClick={() => window.__moveBackward?.(450)}
                  style={{ flex: 1, padding: '5px 4px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  [ ▼ BACK ]
                </button>
                <button
                  className="btn-rpg"
                  onMouseDown={() => inputManager?.setKey('right', true)}
                  onMouseUp={() => inputManager?.setKey('right', false)}
                  onClick={() => window.__moveRight?.(450)}
                  style={{ flex: 1, padding: '5px 4px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  [ ► RIGHT ]
                </button>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                <button
                  className="btn-rpg"
                  onClick={() => window.__resetPlayer?.()}
                  style={{ flex: 1, padding: '4px 3px', fontSize: 10, borderColor: '#f59e0b', color: '#fbbf24', cursor: 'pointer' }}
                >
                  [ ↺ RESET PLAYER ]
                </button>
                <button
                  className="btn-rpg"
                  onClick={() => window.__resetCamera?.()}
                  style={{ flex: 1, padding: '4px 3px', fontSize: 10, borderColor: '#c084fc', color: '#e879f9', cursor: 'pointer' }}
                >
                  [ 🎥 RESET CAM ]
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- TOP-CENTER: EXPLORATION STATUS BANNER --- */}
      {gameFlowState === 'EXPLORING' && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 18px',
            background: 'rgba(10, 10, 20, 0.75)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            boxShadow: '0 0 15px rgba(0, 0, 0, 0.6)',
            borderRadius: 20,
            color: '#c084fc',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '2px',
            pointerEvents: 'none'
          }}
        >
          ✦ EXPLORING {dungeon.name.toUpperCase()} (ROOM {dungeon.currentRoom})
        </div>
      )}

      {/* --- TOP-CENTER: ENCOUNTER COMBAT HP BAR (WHEN IN BATTLE & NON-BOSS) --- */}
      {gameFlowState === 'BATTLE' && activeEncounter && !dungeon.bossActive && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 24px',
            minWidth: 380,
            border: activeEncounter.hasElite ? '1px solid #ef4444' : '1px solid rgba(168, 85, 247, 0.5)',
            boxShadow: activeEncounter.hasElite ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 0 15px rgba(147, 51, 234, 0.3)',
            textAlign: 'center',
            pointerEvents: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 900, fontSize: 16, color: '#f3f4f6', letterSpacing: '1px' }}>
              {activeEncounter.primaryEnemy?.name || activeEncounter.typeName}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: activeEncounter.hasElite ? '#ef4444' : '#fbbf24' }}>
              {activeEncounter.primaryEnemy?.starsText || '★★★'} {activeEncounter.primaryEnemy?.tierLabel || 'COMBAT'}
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
            {dungeon.roomEnemiesRemaining} hostile{dungeon.roomEnemiesRemaining > 1 ? 's' : ''} remaining
          </div>
        </div>
      )}

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

      {/* --- TOP-CENTER: TARGET LOCK NOTIFICATION --- */}
      {lockedTargetId && (
        <div
          style={{
            position: 'absolute',
            top: 76,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 16px',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid #38bdf8',
            borderRadius: 20,
            fontSize: 12,
            color: '#38bdf8',
            fontWeight: 800,
            letterSpacing: '1.2px',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.45)',
            zIndex: 35
          }}
        >
          <span style={{ fontSize: 14 }}>◎</span>
          <span>TARGET LOCKED</span>
          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>[TAB to cycle/unlock]</span>
        </div>
      )}

      {/* --- BOTTOM-CENTER: SKILL BAR --- */}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 12,
          pointerEvents: 'auto'
        }}
      >
        {/* LMB: Basic Attack (3-Hit Combo) */}
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
          <div style={{ fontSize: 9, color: '#9ca3af' }}>3-Hit Combo</div>
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
              <div style={{ fontSize: 9, color: '#9ca3af' }}>Shadow Slash</div>
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

        {/* E: Phantom Dash */}
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
              <div style={{ fontSize: 10, fontWeight: 700, color: isReady ? '#a5f3fc' : '#9ca3af', marginTop: 4 }}>E</div>
              <div style={{ fontSize: 9, color: '#9ca3af' }}>Phantom Dash</div>
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

        {/* F: Context Interact / Recovery Potion */}
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
            border: player.hp < player.maxHp ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)',
            background: player.hp < player.maxHp ? 'rgba(16, 185, 129, 0.12)' : undefined
          }}
          onClick={() => {
            const store = useGameStore.getState();
            if (store.executableEnemyId) store.triggerFinisher(store.executableEnemyId);
            else if (store.extractionTarget) store.performExtraction();
            else store.useHealthPotion();
          }}
        >
          <Heart size={20} color={player.hp < player.maxHp ? '#34d399' : '#9ca3af'} />
          <div style={{ fontSize: 10, fontWeight: 700, color: player.hp < player.maxHp ? '#34d399' : '#e2e8f0', marginTop: 4 }}>F</div>
          <div style={{ fontSize: 9, color: '#9ca3af' }}>{player.hp < player.maxHp ? 'Heal/Use' : 'Interact'}</div>
        </div>
      </div>

      {/* --- DESKTOP CONTROLS GUIDE STRIP --- */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '3px 14px',
          background: 'rgba(5, 5, 10, 0.82)',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: 11,
          color: '#94a3b8',
          letterSpacing: '0.4px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 20
        }}
      >
        <span><strong style={{ color: '#c084fc' }}>WASD</strong> Move</span>
        <span>&bull;</span>
        <span><strong style={{ color: '#c084fc' }}>Mouse</strong> Look</span>
        <span>&bull;</span>
        <span><strong style={{ color: '#c084fc' }}>LMB</strong> 3-Hit Combo</span>
        <span>&bull;</span>
        <span><strong style={{ color: '#c084fc' }}>Q</strong> Skill</span>
        <span>&bull;</span>
        <span><strong style={{ color: '#c084fc' }}>E</strong> Dash</span>
        <span>&bull;</span>
        <span><strong style={{ color: '#c084fc' }}>R</strong> Ultimate</span>
        <span>&bull;</span>
        <span><strong style={{ color: '#c084fc' }}>F</strong> Interact</span>
        <span>&bull;</span>
        <span><strong style={{ color: '#c084fc' }}>TAB</strong> Lock</span>
      </div>


      {/* --- BOTTOM-RIGHT: RADAR / MINI-MAP WITH FOG OF EXPLORATION --- */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: 24,
          right: 20,
          width: 160,
          height: 160,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid rgba(168, 85, 247, 0.5)',
          background: 'radial-gradient(circle, #0e0d18 30%, #06050b 90%)',
          boxShadow: '0 0 25px rgba(0, 0, 0, 0.8), inset 0 0 15px rgba(147, 51, 234, 0.15)',
          pointerEvents: 'auto'
        }}
      >
        {/* Radar crosshairs & distance circles */}
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(168, 85, 247, 0.15)' }} />
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(168, 85, 247, 0.15)' }} />
        <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', border: '1px dashed rgba(168, 85, 247, 0.12)' }} />
        <div style={{ position: 'absolute', inset: 45, borderRadius: '50%', border: '1px solid rgba(168, 85, 247, 0.18)' }} />

        {/* Dynamic Map Elements based on player offset */}
        {(() => {
          const liveP = typeof window !== 'undefined' && window.__playerPos ? window.__playerPos : player.position;
          const [px, , pz] = safeVector3(liveP, DEFAULT_PLAYER_POSITION, 'HUD:miniMapPlayer');
          const scale = 2.2; // pixels per world meter

          // Explored Rooms / Sectors
          const fog = dungeon.fogExplored || [1];
          const rooms = [
            { id: 1, label: 'R1', z: -10 },
            { id: 2, label: 'R2', z: -56.5 },
            { id: 3, label: 'R3', z: -90.5 },
            { id: 4, label: 'Boss', z: -136 }
          ];

          // Safe Points
          const shrines = [
            { id: 's1', room: 1, x: 4.6, z: 23.5 },
            { id: 's2', room: 2, x: 0, z: -42 },
            { id: 's3', room: 3, x: 10.5, z: -75 }
          ];

          // Discovered Monsters
          const encMap = dungeon.encounters || {};
          const encState = dungeon.encountersState || {};
          const discoveredMonsters = Object.values(encMap).filter(
            (e) => (e.discovered || encState[e.id]?.discovered) && !encState[e.id]?.defeated && !e.defeated
          );

          return (
            <>
              {/* Room Zone Markers */}
              {rooms.map((r) => {
                const isRevealed = fog.includes(r.id);
                const relZ = (r.z - pz) * scale;
                const top = 80 - relZ;
                if (top < -20 || top > 180) return null;

                return (
                  <div
                    key={r.id}
                    style={{
                      position: 'absolute',
                      top,
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      padding: '2px 6px',
                      borderRadius: 3,
                      background: isRevealed ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 27, 75, 0.35)',
                      border: isRevealed ? '1px solid rgba(59, 130, 246, 0.4)' : '1px dashed rgba(100, 116, 139, 0.3)',
                      color: isRevealed ? '#93c5fd' : '#475569',
                      fontSize: 8,
                      fontWeight: 800,
                      letterSpacing: '0.5px'
                    }}
                  >
                    {isRevealed ? r.label : '?'}
                  </div>
                );
              })}

              {/* Safe Points (Shrines) on Minimap */}
              {shrines.map((s) => {
                const relX = (s.x - px) * scale;
                const relZ = (s.z - pz) * scale;
                const left = 80 + relX;
                const top = 80 - relZ;
                if (left < 5 || left > 155 || top < 5 || top > 155) return null;

                return (
                  <div
                    key={s.id}
                    title="Safe Point Altar"
                    style={{
                      position: 'absolute',
                      left,
                      top,
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#38bdf8',
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 0 6px #38bdf8'
                    }}
                  />
                );
              })}

              {/* Discovered Monsters on Minimap (Only shown AFTER discovery!) */}
              {discoveredMonsters.map((m) => {
                const [mx, , mz] = safeVector3(m.encounterCenter, [0, 0, 0], 'HUD:miniMapMonster');
                const relX = (mx - px) * scale;
                const relZ = (mz - pz) * scale;
                const left = 80 + relX;
                const top = 80 - relZ;
                if (left < 5 || left > 155 || top < 5 || top > 155) return null;

                return (
                  <div
                    key={m.id}
                    title={m.primaryEnemy?.name || 'Discovered Monster'}
                    style={{
                      position: 'absolute',
                      left,
                      top,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: m.hasElite ? '#ef4444' : '#f59e0b',
                      border: '1px solid #ffffff',
                      transform: 'translate(-50%, -50%)',
                      boxShadow: m.hasElite ? '0 0 8px #ef4444' : '0 0 6px #f59e0b'
                    }}
                  />
                );
              })}
            </>
          );
        })()}

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
            boxShadow: '0 0 8px #38bdf8',
            border: '1px solid #ffffff'
          }}
        />

        {/* Room Area Label & Exploration State */}
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 9,
            fontWeight: 800,
            color: '#c084fc',
            letterSpacing: '0.5px'
          }}
        >
          {dungeon.currentRoom === 4 ? 'BOSS ARENA' : `ROOM ${dungeon.currentRoom}`}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SHADOW ASCENSION - DEFEAT / GAME OVER SCREEN
// Allows loading the latest checkpoint or last save without losing progress
// -------------------------------------------------------------

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { RotateCcw, Home, ShieldCheck } from 'lucide-react';

export const GameOverScreen = () => {
  const loadLastSave = useGameStore((s) => s.loadBattleCheckpoint || s.continueGame);
  const setScreen = useGameStore((s) => s.setScreen);
  const dungeon = useGameStore((s) => s.dungeon);

  const roomName = dungeon.currentRoom === 4 ? 'Boss Chamber' : `Room ${dungeon.currentRoom}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(69, 10, 10, 0.92) 0%, rgba(10, 2, 2, 0.98) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 90,
        padding: 24
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '36px 36px',
          border: '2px solid rgba(239, 68, 68, 0.6)',
          boxShadow: '0 0 45px rgba(239, 68, 68, 0.4), inset 0 0 20px rgba(239, 68, 68, 0.2)',
          borderRadius: 8,
          textAlign: 'center',
          animation: 'modalSlideUp 0.3s ease-out'
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: '4px', color: '#f87171', fontWeight: 700, marginBottom: 8 }}>
          MORTAL FORM SUCCUMBED
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-cinzel)',
            fontWeight: 900,
            fontSize: 'clamp(34px, 5vw, 48px)',
            color: '#ef4444',
            margin: '0 0 12px 0',
            letterSpacing: '3px',
            textShadow: '0 0 30px rgba(239, 68, 68, 0.8)'
          }}
        >
          DEFEATED
        </h1>

        <p style={{ color: '#d1d5db', fontSize: 15, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          The dungeon has claimed you. But shadows never truly die.
        </p>

        {/* Last Safe Point Card */}
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: 6,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10
          }}
        >
          <ShieldCheck size={18} color="#38bdf8" />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '1px' }}>
              LAST SAFE POINT
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>
              {dungeon.name} &bull; {roomName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => loadLastSave()}
            className="btn-rpg glow-box-purple"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '13px 24px',
              fontSize: 15,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #7e22ce, #a855f7)',
              borderColor: '#c084fc',
              color: '#ffffff'
            }}
          >
            <RotateCcw size={18} /> LOAD LAST SAVE / CHECKPOINT
          </button>

          <button
            onClick={() => setScreen('menu')}
            className="btn-rpg btn-rpg-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '12px 24px',
              fontSize: 14
            }}
          >
            <Home size={18} /> RETURN TO MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};

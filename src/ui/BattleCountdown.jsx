// -------------------------------------------------------------
// SHADOW ASCENSION - BATTLE CINEMATIC COUNTDOWN TRANSITION
// Renders 1-3s transition before combat begins
// -------------------------------------------------------------

import React from 'react';
import { useGameStore } from '../store/gameStore';

export const BattleCountdown = () => {
  const battleTransition = useGameStore((s) => s.battleTransition);
  const gameFlowState = useGameStore((s) => s.gameFlowState);

  if (gameFlowState !== 'BATTLE_LOADING' || !battleTransition.active) {
    return null;
  }

  const { monsterName, countdown } = battleTransition;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 2, 8, 0.72)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 85,
        pointerEvents: 'none'
      }}
    >
      {/* Cinematic Letterboxing bars */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 75, background: '#020106' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 75, background: '#020106' }} />

      <div style={{ textAlign: 'center', maxWidth: 600, padding: 20 }}>
        {/* Top line banner */}
        <div style={{ width: 320, height: 2, background: 'linear-gradient(90deg, transparent, #c084fc, transparent)', margin: '0 auto 16px auto' }} />

        <div style={{ fontSize: 13, letterSpacing: '6px', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
          COMMENCING ARENA COMBAT
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-cinzel)',
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 900,
            color: '#f8fafc',
            letterSpacing: '3px',
            margin: '0 0 16px 0',
            textShadow: '0 0 25px rgba(168, 85, 247, 0.8)'
          }}
        >
          {monsterName || 'HOSTILE ENTITY'}
        </h1>

        <div style={{ width: 320, height: 2, background: 'linear-gradient(90deg, transparent, #c084fc, transparent)', margin: '0 auto 28px auto' }} />

        {/* Big Countdown Number */}
        <div
          key={countdown}
          style={{
            fontFamily: 'var(--font-cinzel)',
            fontSize: 72,
            fontWeight: 900,
            color: countdown <= 1 ? '#ef4444' : '#f59e0b',
            textShadow: '0 0 35px rgba(245, 158, 11, 0.9)',
            lineHeight: 1,
            animation: 'pulseGlow 0.5s ease-out'
          }}
        >
          {countdown > 0 ? countdown : 'BEGIN'}
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '5px',
            color: '#e2e8f0',
            marginTop: 12
          }}
        >
          {countdown > 0 ? 'PREPARE TO STRIKE' : 'BEGIN!'}
        </div>
      </div>
    </div>
  );
};

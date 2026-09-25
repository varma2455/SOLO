// -------------------------------------------------------------
// SHADOW ASCENSION - SAVE & PREPARE MODAL
// Confirms game saved and provides preparation shortcuts (Inventory, Stats, Shadows)
// -------------------------------------------------------------

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { CheckCircle2, Swords, Compass, User, Backpack, Users } from 'lucide-react';

export const SavePrepareModal = () => {
  const gameFlowState = useGameStore((s) => s.gameFlowState);
  const decideEnterBattle = useGameStore((s) => s.decideEnterBattle);
  const returnToExploration = useGameStore((s) => s.returnToExploration);
  const setScreen = useGameStore((s) => s.setScreen);
  const player = useGameStore((s) => s.player);

  if (gameFlowState !== 'PREPARING') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 12, 0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 80,
        padding: 20
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '32px 36px',
          border: '2px solid rgba(52, 211, 153, 0.5)',
          boxShadow: '0 0 35px rgba(52, 211, 153, 0.3), inset 0 0 20px rgba(52, 211, 153, 0.1)',
          borderRadius: 8,
          textAlign: 'center',
          animation: 'modalSlideUp 0.25s ease-out'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(6, 78, 59, 0.6)',
              border: '2px solid #34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CheckCircle2 size={30} color="#34d399" />
          </div>
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-cinzel)',
            fontSize: 26,
            fontWeight: 900,
            color: '#f8fafc',
            margin: '0 0 8px 0',
            letterSpacing: '2px'
          }}
        >
          GAME SAVED
        </h2>

        <p style={{ color: '#cbd5e1', fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Your progress has been saved to your local storage and automatic backup.
          <br />
          You can now prepare before entering the encounter.
        </p>

        {/* Quick Preparation Shortcuts */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: 24,
            padding: 12,
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 6,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <button
            onClick={() => setScreen('character')}
            className="btn-rpg btn-rpg-secondary"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: '10px 4px',
              fontSize: 11
            }}
          >
            <User size={18} color="#38bdf8" />
            <span>STATS {player.statPoints > 0 ? `(+${player.statPoints})` : ''}</span>
          </button>
          <button
            onClick={() => setScreen('inventory')}
            className="btn-rpg btn-rpg-secondary"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: '10px 4px',
              fontSize: 11
            }}
          >
            <Backpack size={18} color="#f59e0b" />
            <span>POTIONS / GEAR</span>
          </button>
          <button
            onClick={() => setScreen('shadows')}
            className="btn-rpg btn-rpg-secondary"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: '10px 4px',
              fontSize: 11
            }}
          >
            <Users size={18} color="#c084fc" />
            <span>SHADOW ARMY</span>
          </button>
        </div>

        {/* Main Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={decideEnterBattle}
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
            <Swords size={18} /> CONTINUE TO BATTLE
          </button>

          <button
            onClick={returnToExploration}
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
            <Compass size={16} /> RETURN TO EXPLORATION
          </button>
        </div>
      </div>
    </div>
  );
};

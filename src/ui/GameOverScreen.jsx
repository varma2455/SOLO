import React from 'react';
import { useGameStore } from '../store/gameStore';
import { RotateCcw, Home } from 'lucide-react';

export const GameOverScreen = () => {
  const startNewGame = useGameStore((s) => s.startNewGame);
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(69, 10, 10, 0.9) 0%, rgba(10, 2, 2, 0.96) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: 24
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 13, letterSpacing: '4px', color: '#f87171', fontWeight: 700, marginBottom: 12 }}>
          ASCENSION CORE DESTABILIZED
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-cinzel)',
            fontWeight: 900,
            fontSize: 'clamp(36px, 5vw, 64px)',
            color: '#ef4444',
            margin: 0,
            letterSpacing: '4px',
            textShadow: '0 0 30px rgba(239, 68, 68, 0.8)'
          }}
        >
          YOU HAVE FALLEN
        </h1>
        <p style={{ color: '#d1d5db', fontSize: 15, margin: '18px 0 36px 0', lineHeight: 1.6 }}>
          The darkness of the Forgotten Crypt consumed your mortal form. But death is only another shadow to conquer.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button
            onClick={() => startNewGame()}
            className="btn-rpg glow-box-purple"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', fontSize: 14 }}
          >
            <RotateCcw size={18} /> RESURRECT (RETRY)
          </button>
          <button
            onClick={() => setScreen('menu')}
            className="btn-rpg btn-rpg-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', fontSize: 14 }}
          >
            <Home size={18} /> MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};

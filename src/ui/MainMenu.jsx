import React from 'react';
import { useGameStore } from '../store/gameStore';
import { sound } from '../audio/soundManager';
import { Play, RotateCcw, User, Backpack, Users, Settings } from 'lucide-react';

export const MainMenu = () => {
  const startNewGame = useGameStore((s) => s.startNewGame);
  const continueGame = useGameStore((s) => s.continueGame);
  const setScreen = useGameStore((s) => s.setScreen);
  const [selectedRank, setSelectedRank] = React.useState('E');

  const hasSave = Boolean(localStorage.getItem('shadow_ascension_save_v1'));
  const ranks = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, #170928 0%, #0a0512 60%, #030106 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        overflow: 'hidden'
      }}
    >
      {/* Decorative Runic Rings in background */}
      <div
        className="anim-rune"
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          border: '1px dashed rgba(168, 85, 247, 0.2)',
          pointerEvents: 'none'
        }}
      />
      <div
        className="anim-rune"
        style={{
          position: 'absolute',
          width: 850,
          height: 850,
          borderRadius: '50%',
          border: '1px solid rgba(147, 51, 234, 0.1)',
          pointerEvents: 'none'
        }}
      />

      {/* Main Title */}
      <div style={{ textAlign: 'center', marginBottom: 40, zIndex: 10 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.4em',
            color: 'var(--accent-purple-light)',
            textTransform: 'uppercase',
            marginBottom: 8
          }}
        >
          THE ASCENSION CORE AWAKENING
        </div>
        <h1
          className="game-title"
          style={{
            fontSize: 'clamp(42px, 6vw, 76px)',
            lineHeight: 1.1,
            margin: 0
          }}
        >
          SHADOW ASCENSION
        </h1>
        <div
          style={{
            fontSize: 15,
            color: 'var(--text-secondary)',
            letterSpacing: '0.2em',
            marginTop: 10,
            fontWeight: 500
          }}
        >
          RISE FROM WEAKNESS. COMMAND THE FALLEN.
        </div>
      </div>

      {/* Menu Options Button Group */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: '100%',
          maxWidth: 320,
          zIndex: 10
        }}
      >
        {/* Gate Rank Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 }}>
          <div style={{ fontSize: 11, color: '#c084fc', fontWeight: 700, textAlign: 'center', letterSpacing: '1px' }}>
            GATE DIFFICULTY: RANK {selectedRank}
          </div>
          <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
            {ranks.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRank(r)}
                style={{
                  width: 38,
                  height: 32,
                  background: selectedRank === r ? 'linear-gradient(135deg, #7e22ce, #a855f7)' : 'rgba(24, 24, 37, 0.8)',
                  border: selectedRank === r ? '1px solid #c084fc' : '1px solid rgba(168, 85, 247, 0.25)',
                  borderRadius: 4,
                  color: selectedRank === r ? '#ffffff' : '#9ca3af',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => startNewGame(selectedRank)}
          className="btn-rpg glow-box-purple"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            fontSize: 16,
            padding: '14px 28px',
            borderColor: 'var(--accent-purple)'
          }}
        >
          <Play size={18} /> PLAY NEW GAME
        </button>

        {hasSave && (
          <button
            onClick={() => continueGame()}
            className="btn-rpg"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              fontSize: 16,
              padding: '14px 28px'
            }}
          >
            <RotateCcw size={18} /> CONTINUE
          </button>
        )}

        <button
          onClick={() => setScreen('character')}
          className="btn-rpg btn-rpg-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            fontSize: 15
          }}
        >
          <User size={16} /> CHARACTER
        </button>

        <button
          onClick={() => setScreen('inventory')}
          className="btn-rpg btn-rpg-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            fontSize: 15
          }}
        >
          <Backpack size={16} /> INVENTORY
        </button>

        <button
          onClick={() => setScreen('shadows')}
          className="btn-rpg btn-rpg-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            fontSize: 15
          }}
        >
          <Users size={16} /> SHADOW ARMY
        </button>

        <button
          onClick={() => setScreen('settings')}
          className="btn-rpg btn-rpg-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            fontSize: 15
          }}
        >
          <Settings size={16} /> SETTINGS
        </button>
      </div>

      {/* Footer Info */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          color: 'var(--text-muted)',
          fontSize: 12,
          letterSpacing: '1px'
        }}
      >
        ORIGINAL 3D ACTION RPG &bull; POWERED BY THREE.JS & REACT
      </div>
    </div>
  );
};

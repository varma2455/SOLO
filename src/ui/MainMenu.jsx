// -------------------------------------------------------------
// SHADOW ASCENSION - MAIN MENU WITH SAVE SUMMARY & CONFIRMATION
// -------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { SaveManager } from '../utils/SaveManager';
import { Play, RotateCcw, User, Backpack, Users, Settings, AlertTriangle, ShieldCheck } from 'lucide-react';

export const MainMenu = () => {
  const startNewGame = useGameStore((s) => s.startNewGame);
  const continueGame = useGameStore((s) => s.continueGame);
  const setScreen = useGameStore((s) => s.setScreen);
  const [selectedRank, setSelectedRank] = useState('E');
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [saveSummary, setSaveSummary] = useState(null);

  useEffect(() => {
    const summary = SaveManager.getSaveSummary();
    setSaveSummary(summary);
  }, []);

  const hasSave = Boolean(saveSummary);
  const ranks = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];

  const handleNewGameClick = () => {
    if (hasSave) {
      setShowNewGameConfirm(true);
    } else {
      startNewGame(selectedRank);
    }
  };

  const confirmStartNewGame = () => {
    setShowNewGameConfirm(false);
    startNewGame(selectedRank);
  };

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
      <div style={{ textAlign: 'center', marginBottom: 28, zIndex: 10 }}>
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
          EXPLORE &bull; DISCOVER &bull; PREPARE &bull; CONQUER
        </div>
      </div>

      {/* Menu Options Button Group */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: '100%',
          maxWidth: 340,
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

        {/* NEW GAME BUTTON */}
        <button
          onClick={handleNewGameClick}
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
          <Play size={18} /> NEW GAME
        </button>

        {/* CONTINUE BUTTON */}
        <button
          onClick={() => hasSave && continueGame()}
          disabled={!hasSave}
          className="btn-rpg"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            fontSize: 16,
            padding: '14px 28px',
            opacity: hasSave ? 1.0 : 0.45,
            cursor: hasSave ? 'pointer' : 'not-allowed',
            borderColor: hasSave ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <RotateCcw size={18} /> CONTINUE
        </button>

        {/* LAST SAVE CARD SUMMARY */}
        {hasSave && saveSummary && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(15, 23, 42, 0.75)',
              borderRadius: 6,
              border: '1px solid rgba(56, 189, 248, 0.35)',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <ShieldCheck size={20} color="#38bdf8" />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#38bdf8', fontWeight: 800, letterSpacing: '1px' }}>
                <span>LAST SAVE</span>
                <span>{saveSummary.timeAgo}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                Level {saveSummary.level} &bull; {saveSummary.dungeonName}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                Room {saveSummary.currentRoom} &bull; HP {saveSummary.hp} / {saveSummary.maxHp}
              </div>
            </div>
          </div>
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

      {/* NEW GAME CONFIRMATION MODAL */}
      {showNewGameConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 5, 12, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
            padding: 20
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: 440,
              padding: '28px 32px',
              border: '2px solid rgba(245, 158, 11, 0.6)',
              boxShadow: '0 0 35px rgba(245, 158, 11, 0.3)',
              borderRadius: 8,
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <AlertTriangle size={36} color="#fbbf24" />
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: 22,
                fontWeight: 900,
                color: '#f8fafc',
                margin: '0 0 10px 0',
                letterSpacing: '1px'
              }}
            >
              START NEW ADVENTURE?
            </h2>

            <p style={{ color: '#cbd5e1', fontSize: 14, margin: '0 0 24px 0', lineHeight: 1.6 }}>
              Your current save will be preserved unless you choose to overwrite it.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={confirmStartNewGame}
                className="btn-rpg glow-box-purple"
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  fontSize: 14,
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #7e22ce, #a855f7)',
                  borderColor: '#c084fc'
                }}
              >
                START
              </button>

              <button
                onClick={() => setShowNewGameConfirm(false)}
                className="btn-rpg btn-rpg-secondary"
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  fontSize: 14
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

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

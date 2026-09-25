// -------------------------------------------------------------
// SHADOW ASCENSION - SAFE POINT DISCOVERY MODAL (Ancient Shrine)
// -------------------------------------------------------------

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Sparkles, Save, ArrowRight } from 'lucide-react';

export const SafePointModal = () => {
  const safePointPrompt = useGameStore((s) => s.safePointPrompt);
  const confirmSafePointSave = useGameStore((s) => s.confirmSafePointSave);
  const closeSafePointPrompt = useGameStore((s) => s.closeSafePointPrompt);

  if (!safePointPrompt) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 12, 0.7)',
        backdropFilter: 'blur(5px)',
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
          maxWidth: 440,
          padding: '28px 32px',
          border: '2px solid rgba(56, 189, 248, 0.5)',
          boxShadow: '0 0 35px rgba(56, 189, 248, 0.3)',
          borderRadius: 8,
          textAlign: 'center',
          animation: 'modalSlideUp 0.25s ease-out'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'rgba(12, 74, 110, 0.5)',
              border: '2px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={24} color="#38bdf8" />
          </div>
        </div>

        <div style={{ fontSize: 11, letterSpacing: '3px', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
          SANCTUARY RESTING POINT
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-cinzel)',
            fontSize: 24,
            fontWeight: 900,
            color: '#f8fafc',
            margin: '0 0 10px 0',
            letterSpacing: '1px'
          }}
        >
          {safePointPrompt.name || 'SAFE POINT DISCOVERED'}
        </h2>

        <p style={{ color: '#cbd5e1', fontSize: 14, margin: '0 0 24px 0', lineHeight: 1.5 }}>
          Ancient essence radiates from this sanctuary. Save your progress and fully replenish your vital reserves?
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={confirmSafePointSave}
            className="btn-rpg glow-box-purple"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 18px',
              fontSize: 14,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              borderColor: '#38bdf8'
            }}
          >
            <Save size={16} /> SAVE
          </button>

          <button
            onClick={closeSafePointPrompt}
            className="btn-rpg btn-rpg-secondary"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 18px',
              fontSize: 14
            }}
          >
            <ArrowRight size={16} /> CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
};

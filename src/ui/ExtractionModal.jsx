import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Sparkles, X } from 'lucide-react';

export const ExtractionModal = () => {
  const show = useGameStore((s) => s.showExtractionModal);
  const target = useGameStore((s) => s.extractionTarget);
  const performExtraction = useGameStore((s) => s.performExtraction);
  const closeExtractionModal = useGameStore((s) => s.closeExtractionModal);

  if (!show || !target) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(5, 2, 10, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 55,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}
    >
      <div
        className="glass-panel anim-rune"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: 32,
          textAlign: 'center',
          border: '2px solid #a855f7',
          boxShadow: '0 0 40px rgba(168, 85, 247, 0.6)'
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-purple-light)', letterSpacing: '3px', marginBottom: 8 }}>
          ASCENSION CORE RITUAL
        </div>

        <h2 style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 900, fontSize: 28, color: '#f3f4f6', margin: '0 0 16px 0' }}>
          SHADOW EXTRACTION
        </h2>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 18, borderRadius: 6, marginBottom: 24, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 4 }}>Target Soul:</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-cinzel)' }}>
            {target.name}
          </div>
          <div style={{ fontSize: 12, color: '#c084fc', marginTop: 4 }}>
            Rank {target.rank} Essence
          </div>
        </div>

        <p style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.5, marginBottom: 24 }}>
          Channel the Ascension Core to extract this defeated enemy and bind their shadow soul into your army.
        </p>

        <div style={{ display: 'flex', gap: 14 }}>
          <button
            onClick={performExtraction}
            className="btn-rpg glow-box-purple"
            style={{ flex: 1, padding: '12px 20px', fontSize: 15, background: 'linear-gradient(135deg, #7e22ce, #3b0764)' }}
          >
            [ EXTRACT ]
          </button>
          <button
            onClick={closeExtractionModal}
            className="btn-rpg btn-rpg-secondary"
            style={{ flex: 1, padding: '12px 20px', fontSize: 15 }}
          >
            [ CANCEL ]
          </button>
        </div>
      </div>
    </div>
  );
};

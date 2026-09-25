// -------------------------------------------------------------
// SHADOW ASCENSION - SAVE INDICATOR (Non-intrusive feedback)
// -------------------------------------------------------------

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { CheckCircle2, Loader2 } from 'lucide-react';

export const SaveIndicator = () => {
  const saveIndicator = useGameStore((s) => s.saveIndicator);

  if (!saveIndicator || !saveIndicator.visible) return null;

  const isSaving = saveIndicator.status === 'saving';
  const isSaved = saveIndicator.status === 'saved';

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderRadius: 20,
        background: isSaving
          ? 'rgba(15, 23, 42, 0.85)'
          : 'rgba(6, 78, 59, 0.85)',
        border: isSaving
          ? '1px solid rgba(168, 85, 247, 0.5)'
          : '1px solid rgba(52, 211, 153, 0.6)',
        boxShadow: isSaving
          ? '0 0 15px rgba(168, 85, 247, 0.3)'
          : '0 0 15px rgba(52, 211, 153, 0.3)',
        color: isSaving ? '#c084fc' : '#6ee7b7',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '1px',
        pointerEvents: 'none',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      {isSaving && <Loader2 size={15} className="anim-spin" />}
      {isSaved && <CheckCircle2 size={15} color="#34d399" />}
      <span>{saveIndicator.text || (isSaving ? '● SAVING...' : '✓ SAVED')}</span>
    </div>
  );
};

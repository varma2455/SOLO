// -------------------------------------------------------------
// SHADOW ASCENSION - VICTORY REWARD MODAL
// Displays rewards (XP, Gold, Loot) and returns to exploration
// -------------------------------------------------------------

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Trophy, Compass, Coins, Sparkles, Package } from 'lucide-react';

export const VictoryModal = () => {
  const gameFlowState = useGameStore((s) => s.gameFlowState);
  const victoryData = useGameStore((s) => s.victoryData);
  const continueExploringAfterVictory = useGameStore((s) => s.continueExploringAfterVictory);

  if (gameFlowState !== 'VICTORY' || !victoryData) return null;

  const { encounterName, xp, gold, item } = victoryData;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 12, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 85,
        padding: 20
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '36px 36px',
          border: '2px solid rgba(245, 158, 11, 0.6)',
          boxShadow: '0 0 50px rgba(245, 158, 11, 0.35), inset 0 0 25px rgba(245, 158, 11, 0.15)',
          borderRadius: 8,
          textAlign: 'center',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'rgba(120, 53, 15, 0.6)',
              border: '2px solid #f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Trophy size={30} color="#fbbf24" />
          </div>
        </div>

        <div style={{ fontSize: 13, letterSpacing: '4px', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
          VICTORY ACHIEVED
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-cinzel)',
            fontSize: 'clamp(28px, 4vw, 36px)',
            fontWeight: 900,
            color: '#f8fafc',
            letterSpacing: '2px',
            margin: '0 0 18px 0',
            textShadow: '0 0 20px rgba(245, 158, 11, 0.5)'
          }}
        >
          {encounterName || 'MONSTER'} DEFEATED
        </h1>

        {/* Rewards Box */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            padding: '14px 20px',
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: 6,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: 20
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="#c084fc" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>EXPERIENCE</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#e9d5ff' }}>+{xp} XP</div>
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Coins size={18} color="#fbbf24" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>GOLD LOOT</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#fef08a' }}>+{gold} Gold</div>
            </div>
          </div>
        </div>

        {/* Item Found */}
        {item && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(88, 28, 135, 0.3)',
              borderRadius: 6,
              border: '1px solid rgba(168, 85, 247, 0.35)',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              textAlign: 'left'
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 4,
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid #c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Package size={20} color="#c084fc" />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#c084fc', fontWeight: 800, letterSpacing: '1px' }}>
                ITEM REWARD FOUND
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', marginTop: 1 }}>
                {item.name}
              </div>
              <div style={{ fontSize: 11, color: '#fbbf24', textTransform: 'capitalize', fontWeight: 600 }}>
                {item.rarity} {item.category}
              </div>
            </div>
          </div>
        )}

        {/* Return Button */}
        <button
          onClick={continueExploringAfterVictory}
          className="btn-rpg glow-box-purple"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '14px 24px',
            fontSize: 15,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #7e22ce, #a855f7)',
            borderColor: '#c084fc',
            color: '#ffffff'
          }}
        >
          <Compass size={18} /> CONTINUE EXPLORING
        </button>
      </div>
    </div>
  );
};

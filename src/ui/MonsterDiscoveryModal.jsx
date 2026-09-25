// -------------------------------------------------------------
// SHADOW ASCENSION - MONSTER DISCOVERY MODAL
// Explore-first decision modal: Enter Battle, Save & Prepare, or Back Away
// -------------------------------------------------------------

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Swords, Save, Undo2, Skull, ShieldAlert, AlertTriangle } from 'lucide-react';

export const MonsterDiscoveryModal = () => {
  const gameFlowState = useGameStore((s) => s.gameFlowState);
  const activeEncounter = useGameStore((s) => s.activeEncounter);
  const decideEnterBattle = useGameStore((s) => s.decideEnterBattle);
  const decideSaveAndPrepare = useGameStore((s) => s.decideSaveAndPrepare);
  const decideBackAway = useGameStore((s) => s.decideBackAway);

  if (gameFlowState !== 'MONSTER_DISCOVERED' || !activeEncounter) {
    return null;
  }

  const primary = activeEncounter.primaryEnemy || {};
  const isElite = activeEncounter.hasElite || primary.tier === 'elite';
  const isCommander = activeEncounter.hasCommander || primary.tier === 'commander';
  const isBoss = activeEncounter.type === 'BOSS' || primary.tier === 'boss';
  const isSwarm = activeEncounter.isSwarm;
  const isAmbush = activeEncounter.isAmbush;

  let title = 'MONSTER DISCOVERED';
  let titleColor = '#f59e0b';
  if (isBoss) {
    title = 'ANCIENT SOVEREIGN AWAKENED';
    titleColor = '#ef4444';
  } else if (isElite) {
    title = 'DANGER — ELITE MONSTER DETECTED';
    titleColor = '#ef4444';
  } else if (isCommander) {
    title = 'HOSTILE LEGION COMMANDER DETECTED';
    titleColor = '#f97316';
  } else if (isSwarm) {
    title = 'MONSTER GROUP DISCOVERED';
    titleColor = '#38bdf8';
  } else if (isAmbush) {
    title = 'SUBTERRANEAN AMBUSH DETECTED';
    titleColor = '#ef4444';
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 12, 0.75)',
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
          maxWidth: 520,
          padding: '32px 36px',
          border: isBoss || isElite
            ? '2px solid rgba(239, 68, 68, 0.6)'
            : '2px solid rgba(168, 85, 247, 0.5)',
          boxShadow: isBoss || isElite
            ? '0 0 45px rgba(239, 68, 68, 0.4), inset 0 0 25px rgba(239, 68, 68, 0.2)'
            : '0 0 40px rgba(168, 85, 247, 0.35), inset 0 0 20px rgba(147, 51, 234, 0.15)',
          borderRadius: 8,
          textAlign: 'center',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Header Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '3px',
            color: titleColor,
            textTransform: 'uppercase',
            marginBottom: 10,
            padding: '4px 12px',
            borderRadius: 4,
            background: 'rgba(0, 0, 0, 0.4)'
          }}
        >
          {isElite || isBoss ? <Skull size={15} /> : <ShieldAlert size={15} />}
          {title}
        </div>

        {/* Monster Name */}
        <h2
          style={{
            fontFamily: 'var(--font-cinzel)',
            fontSize: 'clamp(28px, 4vw, 38px)',
            fontWeight: 900,
            letterSpacing: '2px',
            color: '#f8fafc',
            margin: '6px 0 12px 0',
            textShadow: '0 2px 14px rgba(0, 0, 0, 0.9)'
          }}
        >
          {primary.name || activeEncounter.typeName}
        </h2>

        {/* Tier & Level Ribbon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            marginBottom: 20
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '1px',
              color: isElite ? '#f87171' : isBoss ? '#c084fc' : '#fbbf24'
            }}
          >
            {primary.starsText || '★★★★'} {primary.tierLabel || 'ELITE'}
          </div>
          <div style={{ color: '#64748b' }}>&bull;</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', letterSpacing: '1px' }}>
            LEVEL {primary.level || 12}
          </div>
          {primary.enemyCount && (
            <>
              <div style={{ color: '#64748b' }}>&bull;</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>
                {primary.enemyCount} ENEMIES
              </div>
            </>
          )}
        </div>

        {/* Description / Lore */}
        <p
          style={{
            fontSize: 15,
            color: '#cbd5e1',
            lineHeight: 1.6,
            margin: '0 auto 20px auto',
            maxWidth: 420
          }}
        >
          {primary.description || 'A powerful hostile entity is guarding the ancient chamber ahead.'}
        </p>

        {/* Stats & Danger Rating Card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            padding: '12px 16px',
            background: 'rgba(10, 10, 20, 0.7)',
            borderRadius: 6,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: 24,
            textAlign: 'left'
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '1px' }}>
              HOSTILE ENTITY HP
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f87171', marginTop: 2 }}>
              {primary.maxHp ? primary.maxHp.toLocaleString() : '8,500'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '1px' }}>
              DANGER RATING
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 900,
                color: activeEncounter.dangerRating?.stars >= 4 ? '#ef4444' : '#f59e0b',
                marginTop: 2
              }}
            >
              {activeEncounter.dangerRating?.ratingText || '★★★★☆'}{' '}
              <span style={{ fontSize: 12 }}>{activeEncounter.dangerRating?.label || 'EXTREME'}</span>
            </div>
          </div>
        </div>

        {/* Environmental Clues (if discovered nearby) */}
        {activeEncounter.clues && activeEncounter.clues.length > 0 && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderLeft: '3px solid #ef4444',
              borderRadius: 4,
              marginBottom: 24,
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: '#f87171', letterSpacing: '1px', textTransform: 'uppercase' }}>
              ENVIRONMENTAL CLUE
            </div>
            <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 3 }}>
              &ldquo;{activeEncounter.clues?.[0] || 'Dark energy hums through the stone.'}&rdquo;
            </div>
          </div>
        )}

        {/* Three Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* OPTION 1: ENTER BATTLE */}
          <button
            onClick={decideEnterBattle}
            className="btn-rpg glow-box-purple"
            style={{
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
            <Swords size={18} /> ENTER BATTLE
          </button>

          {/* OPTION 2: SAVE & PREPARE */}
          <button
            onClick={decideSaveAndPrepare}
            className="btn-rpg btn-rpg-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700
            }}
          >
            <Save size={16} /> SAVE & PREPARE
          </button>

          {/* OPTION 3: BACK AWAY */}
          <button
            onClick={decideBackAway}
            className="btn-rpg btn-rpg-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: '#94a3b8'
            }}
          >
            <Undo2 size={16} /> BACK AWAY
          </button>
        </div>
      </div>
    </div>
  );
};

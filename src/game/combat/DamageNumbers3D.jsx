// -------------------------------------------------------------
// SHADOW ASCENSION - 3D FLOATING COMBAT DAMAGE NUMBERS
// Displays high-contrast anime RPG damage numbers:
// - Normal Hits: Crisp white/cyan with subtle cyan glow
// - Critical Strikes: Fierce gold/amber with orange outer bloom
// - Player Damage: Crimson with red warning glow
// Staggered positioning to prevent text overlap.
// -------------------------------------------------------------

import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';
import { safeVector3 } from '../../utils/vector3';

const SingleDamageNumber = React.memo(({ item }) => {
  const isCrit = item.isCrit;
  const isPlayer = item.color === '#ef4444';
  const pos = safeVector3(item.position, [0, 1.5, 0], 'DamageNumbers3D');

  // Slight pseudo-random horizontal jitter based on id to prevent overlapping blobs
  const jitterX = useMemo(() => {
    let hash = 0;
    const str = item.id || 'dmg_0';
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
    return ((hash % 10) / 10 - 0.5) * 0.6;
  }, [item.id]);

  const textColor = isCrit
    ? '#fbbf24'
    : isPlayer
    ? '#ef4444'
    : item.color || '#38bdf8';

  const textShadow = isCrit
    ? '0 0 12px #f59e0b, 0 0 24px #ea580c, 2px 2px 4px #000000'
    : isPlayer
    ? '0 0 10px #dc2626, 2px 2px 4px #000000'
    : '0 0 10px rgba(56, 189, 248, 0.8), 2px 2px 4px #000000';

  return (
    <Html
      position={[pos[0] + jitterX, pos[1] + (isCrit ? 1.4 : 1.2), pos[2]]}
      center
      style={{
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          fontFamily: "'Cinzel', 'Cinzel Decorative', serif",
          fontWeight: 900,
          fontSize: isCrit ? '26px' : '18px',
          color: textColor,
          textShadow,
          whiteSpace: 'pre-line',
          textAlign: 'center',
          letterSpacing: isCrit ? '2px' : '1px',
          animation: 'floatDamage 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
          willChange: 'transform, opacity',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px'
        }}
      >
        {isCrit && (
          <span
            style={{
              fontSize: '11px',
              padding: '1px 5px',
              background: '#b45309',
              borderRadius: '2px',
              color: '#fef3c7',
              letterSpacing: '1px'
            }}
          >
            CRIT
          </span>
        )}
        <span>{item.text}</span>
      </div>
    </Html>
  );
});

export const DamageNumbers3D = () => {
  const damageNumbers = useGameStore((s) => s.damageNumbers);
  const visibleNumbers = damageNumbers.slice(-14);

  return (
    <group>
      {visibleNumbers.map((item) => (
        <SingleDamageNumber key={item.id} item={item} />
      ))}
    </group>
  );
};

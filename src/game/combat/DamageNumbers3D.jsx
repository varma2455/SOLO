import React from 'react';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';

const SingleDamageNumber = React.memo(({ item }) => {
  const isCrit = item.isCrit;

  return (
    <Html
      position={[item.position[0], item.position[1] + 1.2, item.position[2]]}
      center
      style={{
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 900,
          fontSize: isCrit ? '26px' : '18px',
          color: item.color,
          textShadow: isCrit
            ? '0 0 10px #f59e0b, 0 0 20px #d97706, 2px 2px 4px #000000'
            : '0 0 8px #000000, 1px 1px 3px #000000',
          whiteSpace: 'nowrap',
          letterSpacing: '1px',
          animation: 'floatDamage 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
          willChange: 'transform, opacity'
        }}
      >
        {isCrit ? `CRIT! ${item.text}` : item.text}
      </div>
    </Html>
  );
});

export const DamageNumbers3D = () => {
  const damageNumbers = useGameStore((s) => s.damageNumbers);
  const visibleNumbers = damageNumbers.slice(-12);

  return (
    <group>
      {visibleNumbers.map((item) => (
        <SingleDamageNumber key={item.id} item={item} />
      ))}
    </group>
  );
};


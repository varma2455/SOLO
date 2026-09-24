import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';

const SingleDamageNumber = ({ item }) => {
  const [offsetY, setOffsetY] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useFrame((_, delta) => {
    setOffsetY((prev) => prev + delta * 1.8);
    setOpacity((prev) => Math.max(0, prev - delta * 1.2));
  });

  const isCrit = item.isCrit;

  return (
    <Html
      position={[item.position[0], item.position[1] + offsetY + 1.2, item.position[2]]}
      center
      style={{
        pointerEvents: 'none',
        opacity: opacity,
        transform: `scale(${isCrit ? 1.4 : 1.0})`,
        transition: 'transform 0.1s ease-out'
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
          letterSpacing: '1px'
        }}
      >
        {isCrit ? `CRIT! ${item.text}` : item.text}
      </div>
    </Html>
  );
};

export const DamageNumbers3D = () => {
  const damageNumbers = useGameStore((s) => s.damageNumbers);

  return (
    <group>
      {damageNumbers.map((item) => (
        <SingleDamageNumber key={item.id} item={item} />
      ))}
    </group>
  );
};

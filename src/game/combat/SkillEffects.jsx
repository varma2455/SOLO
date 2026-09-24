import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Single Shadow Slash Projectile Wave
const SlashWave = ({ effect, onComplete }) => {
  const meshRef = useRef();
  const dir = useRef(new THREE.Vector3(Math.sin(effect.angle), 0, Math.cos(effect.angle)).normalize());

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.x += dir.current.x * 24 * delta;
    meshRef.current.position.z += dir.current.z * 24 * delta;
    meshRef.current.scale.x += delta * 4;
    meshRef.current.material.opacity -= delta * 1.8;

    if (meshRef.current.material.opacity <= 0) {
      onComplete(effect.id);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[effect.position[0], 0.8, effect.position[2]]}
      rotation={[-Math.PI / 2, 0, effect.angle + Math.PI / 2]}
    >
      <ringGeometry args={[1.2, 1.8, 24, 1, 0, Math.PI]} />
      <meshBasicMaterial color="#c084fc" side={THREE.DoubleSide} transparent opacity={0.9} />
    </mesh>
  );
};

// Void Burst Area of Effect Shockwave
const VoidBurstShockwave = ({ effect, onComplete }) => {
  const ringRef = useRef();
  const sphereRef = useRef();

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    ringRef.current.scale.x += delta * 14;
    ringRef.current.scale.y += delta * 14;
    ringRef.current.material.opacity -= delta * 1.6;

    if (sphereRef.current) {
      sphereRef.current.scale.addScalar(delta * 12);
      sphereRef.current.material.opacity -= delta * 1.8;
    }

    if (ringRef.current.material.opacity <= 0) {
      onComplete(effect.id);
    }
  });

  return (
    <group position={effect.position}>
      {/* Ground runic shockwave */}
      <mesh ref={ringRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 1.2, 32]} />
        <meshBasicMaterial color="#9333ea" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Expanding dark dome */}
      <mesh ref={sphereRef} position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#3b0764" transparent opacity={0.6} wireframe />
      </mesh>
    </group>
  );
};

// Eclipse Dominion Ultimate Cataclysm
const EclipseDominionVFX = ({ effect, onComplete }) => {
  const pillarRef = useRef();
  const ringRef = useRef();

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    ringRef.current.scale.addScalar(delta * 18);
    ringRef.current.material.opacity -= delta * 0.8;

    if (pillarRef.current) {
      pillarRef.current.scale.y = Math.max(0.1, pillarRef.current.scale.y - delta * 2);
      pillarRef.current.material.opacity -= delta * 0.9;
    }

    if (ringRef.current.material.opacity <= 0) {
      onComplete(effect.id);
    }
  });

  return (
    <group position={effect.position}>
      {/* Massive Dark Energy Pillar */}
      <mesh ref={pillarRef} position={[0, 6, 0]}>
        <cylinderGeometry args={[2.5, 3.5, 14, 24]} />
        <meshBasicMaterial color="#7e22ce" transparent opacity={0.8} />
      </mesh>
      {/* Grand Runic Circle */}
      <mesh ref={ringRef} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.0, 3.0, 36]} />
        <meshBasicMaterial color="#f43f5e" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const SkillEffects = ({ activeEffects, onEffectEnd }) => {
  return (
    <group>
      {activeEffects.map((effect) => {
        if (effect.type === 'shadowSlash') {
          return <SlashWave key={effect.id} effect={effect} onComplete={onEffectEnd} />;
        }
        if (effect.type === 'voidBurst') {
          return <VoidBurstShockwave key={effect.id} effect={effect} onComplete={onEffectEnd} />;
        }
        if (effect.type === 'eclipseDominion') {
          return <EclipseDominionVFX key={effect.id} effect={effect} onComplete={onEffectEnd} />;
        }
        return null;
      })}
    </group>
  );
};

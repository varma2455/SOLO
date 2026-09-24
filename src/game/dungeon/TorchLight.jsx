import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWoodMaterials, getIronMaterials } from './DungeonTextures';

// Single Realistic Dungeon Wall Torch
export const DungeonTorch = ({ position, rotation = [0, 0, 0], lightColor = '#f59e0b', intensity = 2.0 }) => {
  const lightRef = useRef();
  const flameCoreRef = useRef();
  const flameOuterRef = useRef();
  const sparksRef = useRef();

  const woodTexture = useMemo(() => getWoodMaterials(), []);
  const ironTexture = useMemo(() => getIronMaterials(), []);

  // Unique phase offset per torch so they don't flicker in sync
  const phase = useMemo(() => position[0] * 3.7 + position[2] * 5.1, [position]);

  // Spark / ember particle buffer (6 embers ascending)
  const emberCount = 6;
  const emberPositions = useMemo(() => {
    const arr = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.15;
      arr[i * 3 + 1] = 0.5 + Math.random() * 0.8;
      arr[i * 3 + 2] = 0.28 + (Math.random() - 0.5) * 0.15;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Fluctuating torch flame light
    if (lightRef.current) {
      const flicker =
        Math.sin(t * 11 + phase) * 0.22 +
        Math.sin(t * 23 + phase * 1.5) * 0.12 +
        (Math.random() - 0.5) * 0.08;
      lightRef.current.intensity = Math.max(0.6, intensity + flicker);
    }

    // Flame scale / flutter
    if (flameCoreRef.current) {
      flameCoreRef.current.scale.y = 1.0 + Math.sin(t * 16 + phase) * 0.2;
      flameCoreRef.current.scale.x = 1.0 + Math.cos(t * 14 + phase) * 0.15;
    }
    if (flameOuterRef.current) {
      flameOuterRef.current.scale.y = 1.0 + Math.sin(t * 14 + phase) * 0.25;
      flameOuterRef.current.rotation.y += delta * 2.0;
    }

    // Gently rotate ember points group on GPU rather than mutating buffer on CPU
    if (sparksRef.current) {
      sparksRef.current.rotation.y += delta * 1.2;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Wall Mounting Plate */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.22, 0.35, 0.06]} />
        <meshStandardMaterial map={ironTexture} metalness={0.9} roughness={0.35} />
      </mesh>

      {/* Angled Bracket Arm */}
      <mesh position={[0, 0.12, 0.16]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.36, 8]} />
        <meshStandardMaterial map={ironTexture} metalness={0.9} roughness={0.35} />
      </mesh>

      {/* Iron Ring Sconce Cup */}
      <mesh position={[0, 0.26, 0.28]}>
        <cylinderGeometry args={[0.11, 0.07, 0.16, 10]} />
        <meshStandardMaterial map={ironTexture} metalness={0.9} roughness={0.35} />
      </mesh>

      {/* Wooden Torch Shaft */}
      <mesh position={[0, 0.18, 0.28]}>
        <cylinderGeometry args={[0.045, 0.04, 0.45, 8]} />
        <meshStandardMaterial map={woodTexture} roughness={0.8} />
      </mesh>

      {/* Outer Flame (Orange/Red) */}
      <mesh ref={flameOuterRef} position={[0, 0.42, 0.28]}>
        <coneGeometry args={[0.13, 0.32, 8]} />
        <meshBasicMaterial color="#ea580c" transparent opacity={0.85} />
      </mesh>

      {/* Inner White-Hot Flame Core */}
      <mesh ref={flameCoreRef} position={[0, 0.38, 0.28]}>
        <coneGeometry args={[0.07, 0.22, 8]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>

      {/* Fire Glow Halo */}
      <mesh position={[0, 0.42, 0.28]}>
        <sphereGeometry args={[0.26, 8, 8]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.16} />
      </mesh>

      {/* Ember Spark Points */}
      <points ref={sparksRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={emberCount}
            array={emberPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.04} color="#fdba74" transparent opacity={0.9} />
      </points>

      {/* Dynamic Flickering Warm PointLight with Falloff (Illuminates without expensive multi-pass shadows) */}
      <pointLight
        ref={lightRef}
        position={[0, 0.48, 0.32]}
        color={lightColor}
        intensity={intensity}
        distance={14}
        decay={2}
      />
    </group>
  );
};

// Atmospheric Underground Dust Motes floating in the air (GPU animated)
export const DungeonDustMotes = ({ count = 100, bounds = [30, 8, 160] }) => {
  const pointsRef = useRef();

  const particleData = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * bounds[0];
      positions[i * 3 + 1] = 0.5 + Math.random() * bounds[1];
      positions[i * 3 + 2] = -bounds[2] * Math.random() + 20;
    }
    return { positions };
  }, [count, bounds]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.position.y += delta * 0.15;
    if (pointsRef.current.position.y > 1.5) pointsRef.current.position.y = 0;
    pointsRef.current.rotation.y += delta * 0.03;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particleData.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#c084fc"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

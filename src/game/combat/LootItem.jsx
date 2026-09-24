import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

export const LootItem = ({ loot, playerPos, onCollect }) => {
  const meshRef = useRef();
  const pos = useRef(new THREE.Vector3(...loot.position));

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();

    // Floating and spinning animation
    meshRef.current.position.y = loot.position[1] + Math.sin(t * 4 + loot.position[0]) * 0.15;
    meshRef.current.rotation.y += delta * 2.5;

    // Check distance to player for auto-pickup
    const pPos = new THREE.Vector3(...playerPos);
    const dist = pos.current.distanceTo(pPos);

    if (dist <= 2.2) {
      onCollect(loot);
    } else if (dist <= 5.0) {
      // Magnetic pull towards player
      const pullDir = new THREE.Vector3().subVectors(pPos, pos.current).normalize();
      pos.current.addScaledVector(pullDir, 8.0 * delta);
      meshRef.current.position.copy(pos.current);
    }
  });

  const color = loot.rarityColor || '#fbbf24';

  return (
    <group ref={meshRef} position={loot.position}>
      {/* Glowing Loot Crystal */}
      <mesh>
        <octahedronGeometry args={[0.25]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Glow Halo */}
      <mesh>
        <sphereGeometry args={[0.38, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} wireframe />
      </mesh>
      {/* Ground light beam */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.04, 0.15, 1.2, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>
    </group>
  );
};

// Soul Extraction Essence Beacon
export const ExtractionBeacon = ({ beacon, playerPos, onTriggerExtract }) => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y += delta * 1.5;

    // Distance check to activate interaction prompt
    const pPos = new THREE.Vector3(...playerPos);
    const dist = new THREE.Vector3(...beacon.position).distanceTo(pPos);
    if (dist <= 3.5) {
      useGameStore.setState({
        extractionTarget: beacon
      });
    } else if (useGameStore.getState().extractionTarget?.id === beacon.id) {
      useGameStore.setState({
        extractionTarget: null
      });
    }
  });

  return (
    <group ref={meshRef} position={beacon.position}>
      {/* Swirling Soul Vortex */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 1.6, 24]} />
        <meshBasicMaterial color="#9333ea" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* Soul Core */}
      <mesh position={[0, 0.8, 0]}>
        <dodecahedronGeometry args={[0.35]} />
        <meshBasicMaterial color="#c084fc" />
      </mesh>
      {/* Rising dark mist light */}
      <pointLight position={[0, 1.0, 0]} color="#a855f7" distance={6} intensity={2} />
    </group>
  );
};

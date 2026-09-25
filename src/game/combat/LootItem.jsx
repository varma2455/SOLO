// -------------------------------------------------------------
// SHADOW ASCENSION - 3D LOOT ITEMS & SOUL EXTRACTION BEACONS
// Crash-safe vector validation, magnetic pickup, and soul interaction
// -------------------------------------------------------------

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { globalPlayerState } from '../player/Player';
import { safeVector3, DEFAULT_PLAYER_POSITION } from '../../utils/vector3';

const _lootPlayerPos = new THREE.Vector3();
const _lootPullDir = new THREE.Vector3();
const _beaconPlayerPos = new THREE.Vector3();
const _beaconPos = new THREE.Vector3();

export const LootItem = ({ loot, playerPos, onCollect }) => {
  const meshRef = useRef();
  const safeLootPos = safeVector3(loot?.position, [0, 0.5, 0], 'LootItem:pos');
  const pos = useRef(new THREE.Vector3(safeLootPos[0], safeLootPos[1], safeLootPos[2]));

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();

    // Floating and spinning animation
    meshRef.current.position.y = safeLootPos[1] + Math.sin(t * 4 + safeLootPos[0]) * 0.15;
    meshRef.current.rotation.y += delta * 2.5;

    // Check distance to player for auto-pickup
    if (globalPlayerState && (globalPlayerState.pos || globalPlayerState.posVec)) {
      _lootPlayerPos.copy(globalPlayerState.pos || globalPlayerState.posVec);
    } else {
      const p = safeVector3(playerPos, DEFAULT_PLAYER_POSITION, 'LootItem:playerPos');
      _lootPlayerPos.set(p[0], p[1], p[2]);
    }

    const dist = pos.current.distanceTo(_lootPlayerPos);

    if (dist <= 2.2) {
      if (onCollect && loot) onCollect(loot);
    } else if (dist <= 5.5) {
      // Magnetic pull towards player
      _lootPullDir.subVectors(_lootPlayerPos, pos.current).normalize();
      pos.current.addScaledVector(_lootPullDir, 8.5 * delta);
      meshRef.current.position.copy(pos.current);
    }
  });

  const color = loot?.rarityColor || '#fbbf24';

  return (
    <group ref={meshRef} position={safeLootPos}>
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
export const ExtractionBeacon = ({ beacon, playerPos }) => {
  const meshRef = useRef();
  const safeBeaconPos = safeVector3(beacon?.position, [0, 0.1, 0], 'ExtractionBeacon:pos');

  useFrame((state, delta) => {
    if (!meshRef.current || !beacon) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y += delta * 1.5;

    // Distance check to activate interaction prompt
    if (globalPlayerState && (globalPlayerState.pos || globalPlayerState.posVec)) {
      _beaconPlayerPos.copy(globalPlayerState.pos || globalPlayerState.posVec);
    } else {
      const p = safeVector3(playerPos, DEFAULT_PLAYER_POSITION, 'ExtractionBeacon:playerPos');
      _beaconPlayerPos.set(p[0], p[1], p[2]);
    }

    _beaconPos.set(safeBeaconPos[0], safeBeaconPos[1], safeBeaconPos[2]);
    const dist = _beaconPos.distanceTo(_beaconPlayerPos);

    if (dist <= 3.8) {
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
    <group ref={meshRef} position={safeBeaconPos}>
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

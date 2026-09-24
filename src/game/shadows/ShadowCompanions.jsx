import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { globalPlayerState } from '../player/Player';
import { sound } from '../../audio/soundManager';

const _sPPos = new THREE.Vector3();
const _sIdleTarget = new THREE.Vector3();
const _sEnPos = new THREE.Vector3();
const _sDir = new THREE.Vector3();

const formationOffsets = [
  [-2.2, 0, 2.4],
  [2.2, 0, 2.4],
  [0, 0, 3.4]
];

const SingleShadow = React.memo(({ shadow, index, playerPos, enemies, onShadowAttackEnemy }) => {
  const meshRef = useRef();
  const bladeRef = useRef();
  const initialX = playerPos ? playerPos[0] + (index === 0 ? -2.2 : index === 1 ? 2.2 : 0) : 0;
  const initialZ = playerPos ? playerPos[2] + 2.5 : 22.5;
  const pos = useRef(new THREE.Vector3(initialX, 0, initialZ));
  const rotation = useRef(0);
  const attackTimer = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.1);
    const t = state.clock.getElapsedTime();

    if (attackTimer.current > 0) attackTimer.current -= dt;

    if (globalPlayerState) {
      _sPPos.copy(globalPlayerState.pos);
    } else if (playerPos) {
      _sPPos.set(playerPos[0], playerPos[1], playerPos[2]);
    }

    const offset = formationOffsets[index % formationOffsets.length];
    _sIdleTarget.set(_sPPos.x + offset[0], 0, _sPPos.z + offset[2]);

    // Check for nearby living enemies to attack
    let targetEnemy = null;
    let closestDist = 12.0;

    if (enemies && enemies.length > 0) {
      for (let i = 0; i < enemies.length; i++) {
        const en = enemies[i];
        if (en.hp > 0 && en.position) {
          _sEnPos.set(en.position[0], en.position[1], en.position[2]);
          const dist = pos.current.distanceTo(_sEnPos);
          if (dist < closestDist) {
            closestDist = dist;
            targetEnemy = en;
          }
        }
      }
    }

    if (targetEnemy && targetEnemy.position) {
      _sEnPos.set(targetEnemy.position[0], targetEnemy.position[1], targetEnemy.position[2]);
      const distToEnemy = pos.current.distanceTo(_sEnPos);

      if (distToEnemy <= (shadow.attackRange || 2.2)) {
        // Attack enemy
        if (attackTimer.current <= 0) {
          attackTimer.current = shadow.attackCooldown || 1.4;
          sound.playSlash();

          if (bladeRef.current) {
            bladeRef.current.rotation.x = -1.6;
            setTimeout(() => {
              if (bladeRef.current) bladeRef.current.rotation.x = 0;
            }, 200);
          }

          if (onShadowAttackEnemy) {
            onShadowAttackEnemy(shadow, targetEnemy.id, shadow.attack);
          }
        }
        // Face enemy
        _sDir.subVectors(_sEnPos, pos.current).normalize();
        rotation.current = Math.atan2(_sDir.x, _sDir.z);
      } else {
        // Run towards enemy
        _sDir.subVectors(_sEnPos, pos.current).normalize();
        pos.current.addScaledVector(_sDir, (shadow.speed || 4.0) * dt);
        rotation.current = Math.atan2(_sDir.x, _sDir.z);
      }
    } else {
      // Follow Kael in formation
      const distToFormation = pos.current.distanceTo(_sIdleTarget);
      if (distToFormation > 1.0) {
        _sDir.subVectors(_sIdleTarget, pos.current).normalize();
        const followSpeed = distToFormation > 6 ? 9.0 : 5.0;
        pos.current.addScaledVector(_sDir, followSpeed * dt);
        rotation.current = Math.atan2(_sDir.x, _sDir.z);
      } else {
        // Face player direction
        const targetRot = globalPlayerState ? globalPlayerState.rotation : 0;
        rotation.current = THREE.MathUtils.lerp(rotation.current, targetRot, 0.1);
      }
    }

    // Apply pos and rotation
    meshRef.current.position.copy(pos.current);
    meshRef.current.rotation.y = rotation.current;

    // Subtle floating shadow bobbing
    meshRef.current.position.y = 0.1 + Math.sin(t * 3 + index) * 0.05;
  });

  const scale = shadow.scale || 1.1;

  return (
    <group ref={meshRef} position={pos.current.toArray()}>
      {/* Dark ground smoke ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.65 * scale, 16]} />
        <meshBasicMaterial color="#9333ea" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      <group scale={scale}>
        {/* Translucent Shadowy Torso */}
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[0.5, 0.75, 0.35]} />
          <meshStandardMaterial
            color="#09090b"
            roughness={0.2}
            metalness={0.1}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[0.35, 0.35, 0.35]} />
          <meshStandardMaterial
            color="#050508"
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* Glowing Shadow Eyes */}
        <mesh position={[-0.09, 1.42, 0.19]}>
          <boxGeometry args={[0.07, 0.05, 0.04]} />
          <meshBasicMaterial color={shadow.glowColor || '#a855f7'} />
        </mesh>
        <mesh position={[0.09, 1.42, 0.19]}>
          <boxGeometry args={[0.07, 0.05, 0.04]} />
          <meshBasicMaterial color={shadow.glowColor || '#a855f7'} />
        </mesh>

        {/* Shadow Arm & Weapon */}
        <group position={[0.38, 0.85, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[0.16, 0.45, 0.16]} />
            <meshStandardMaterial color="#09090b" transparent opacity={0.85} />
          </mesh>
          <group ref={bladeRef} position={[0, -0.4, 0.15]}>
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[0.05, shadow.id === 'umbral_general' ? 1.2 : 0.7, 0.15]} />
              <meshBasicMaterial color={shadow.glowColor || '#c084fc'} />
            </mesh>
          </group>
        </group>

        {/* Left Arm (Shield for Dusk Knight, Claw for others) */}
        <group position={[-0.38, 0.85, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[0.16, 0.45, 0.16]} />
            <meshStandardMaterial color="#09090b" transparent opacity={0.85} />
          </mesh>
          {shadow.id === 'dusk_knight' && (
            <mesh position={[-0.1, -0.1, 0.2]}>
              <boxGeometry args={[0.08, 0.85, 0.5]} />
              <meshBasicMaterial color="#581c87" transparent opacity={0.8} />
            </mesh>
          )}
        </group>

        {/* Horns for Umbral General */}
        {shadow.id === 'umbral_general' && (
          <group position={[0, 1.6, 0]}>
            <mesh position={[-0.2, 0.2, 0]} rotation={[0, 0, 0.5]}>
              <coneGeometry args={[0.08, 0.5, 5]} />
              <meshBasicMaterial color="#f43f5e" />
            </mesh>
            <mesh position={[0.2, 0.2, 0]} rotation={[0, 0, -0.5]}>
              <coneGeometry args={[0.08, 0.5, 5]} />
              <meshBasicMaterial color="#f43f5e" />
            </mesh>
          </group>
        )}

        {/* Shadow Legs */}
        <mesh position={[-0.14, 0.25, 0]}>
          <boxGeometry args={[0.16, 0.5, 0.2]} />
          <meshStandardMaterial color="#030712" transparent opacity={0.85} />
        </mesh>
        <mesh position={[0.14, 0.25, 0]}>
          <boxGeometry args={[0.16, 0.5, 0.2]} />
          <meshStandardMaterial color="#030712" transparent opacity={0.85} />
        </mesh>
      </group>
    </group>
  );
});


export const ShadowCompanions = ({ playerPos, enemies, onShadowAttackEnemy }) => {
  const shadows = useGameStore((s) => s.shadows);
  const activeShadows = shadows.filter((s) => s.active && s.unlocked);

  return (
    <group>
      {activeShadows.map((sh, idx) => (
        <SingleShadow
          key={sh.id}
          shadow={sh}
          index={idx}
          playerPos={playerPos}
          enemies={enemies}
          onShadowAttackEnemy={onShadowAttackEnemy}
        />
      ))}
    </group>
  );
};

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { globalPlayerState } from '../player/Player';
import { sound } from '../../audio/soundManager';
import { safeVector3, DEFAULT_PLAYER_POSITION } from '../../utils/vector3';
import {
  buildShadowSoldierModel,
  buildShadowKnightModel,
  buildAbyssAssassinModel
} from '../enemies/MonsterModelBuilder';
import { MonsterAnimationController } from '../enemies/MonsterAnimationController';

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
  const baseP = safeVector3(playerPos || globalPlayerState?.position, DEFAULT_PLAYER_POSITION, 'SingleShadow:initial');
  const initialX = baseP[0] + (index === 0 ? -2.2 : index === 1 ? 2.2 : 0);
  const initialZ = baseP[2] + 2.5;
  const pos = useRef(new THREE.Vector3(initialX, 0, initialZ));
  const rotation = useRef(0);
  const attackTimer = useRef(0);

  // Procedural 3D Humanoid Shadow Warrior model & skeletal animation controller
  const { rootModel, nodes, animController } = useMemo(() => {
    let res;
    let type = 'soldier';
    if (shadow.id === 'umbral_general') {
      res = buildShadowKnightModel();
      type = 'knight';
    } else if (shadow.id === 'nightfang') {
      res = buildAbyssAssassinModel();
      type = 'assassin';
    } else {
      res = buildShadowSoldierModel();
      type = 'soldier';
    }
    const ctrl = new MonsterAnimationController(res.nodes, type);
    return { rootModel: res.root, nodes: res.nodes, animController: ctrl };
  }, [shadow.id]);

  // Clean up geometry & material memory on unmount
  useEffect(() => {
    return () => {
      if (rootModel) {
        rootModel.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
              else child.material.dispose();
            }
          }
        });
      }
    };
  }, [rootModel]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.1);
    const t = state.clock.getElapsedTime();

    if (attackTimer.current > 0) attackTimer.current -= dt;

    if (globalPlayerState && (globalPlayerState.pos || globalPlayerState.posVec)) {
      _sPPos.copy(globalPlayerState.pos || globalPlayerState.posVec);
    } else {
      const curP = safeVector3(playerPos, DEFAULT_PLAYER_POSITION, 'SingleShadow:frame');
      _sPPos.set(curP[0], curP[1], curP[2]);
    }

    const offset = formationOffsets[index % formationOffsets.length];
    _sIdleTarget.set(_sPPos.x + offset[0], 0, _sPPos.z + offset[2]);

    // Check for nearby living enemies to attack
    let targetEnemy = null;
    let closestDist = 12.0;

    if (enemies && enemies.length > 0) {
      for (let i = 0; i < enemies.length; i++) {
        const en = enemies[i];
        if (en && en.hp > 0 && en.position) {
          const enP = safeVector3(en.position, null);
          if (enP) {
            _sEnPos.set(enP[0], enP[1], enP[2]);
            const dist = pos.current.distanceTo(_sEnPos);
            if (dist < closestDist) {
              closestDist = dist;
              targetEnemy = en;
            }
          }
        }
      }
    }

    let isMoving = false;

    if (targetEnemy && targetEnemy.position) {
      const enP = safeVector3(targetEnemy.position, [0, 0, 0], 'SingleShadow:targetEnemy');
      _sEnPos.set(enP[0], enP[1], enP[2]);
      const distToEnemy = pos.current.distanceTo(_sEnPos);

      if (distToEnemy <= (shadow.attackRange || 2.2)) {
        // Attack enemy
        if (attackTimer.current <= 0) {
          attackTimer.current = shadow.attackCooldown || 1.4;
          sound.playSlash();
          animController?.triggerAttack();

          if (onShadowAttackEnemy) {
            onShadowAttackEnemy(shadow, targetEnemy.id, shadow.attack);
          }
        }
        // Face enemy
        _sDir.subVectors(_sEnPos, pos.current).normalize();
        rotation.current = Math.atan2(_sDir.x, _sDir.z);
      } else {
        // Run towards enemy
        isMoving = true;
        _sDir.subVectors(_sEnPos, pos.current).normalize();
        pos.current.addScaledVector(_sDir, (shadow.speed || 4.0) * dt);
        rotation.current = Math.atan2(_sDir.x, _sDir.z);
      }
    } else {
      // Follow Kael in formation
      const distToFormation = pos.current.distanceTo(_sIdleTarget);
      if (distToFormation > 1.0) {
        isMoving = true;
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

    // Update procedural skeletal animation controller
    animController?.update(dt, isMoving, false, false, false);
  });

  const scale = shadow.scale || 1.05;

  return (
    <group ref={meshRef} position={pos.current.toArray()}>
      {/* Subtle localized shadow ground disc */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55 * scale, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.65} />
      </mesh>
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.52 * scale, 0.68 * scale, 24]} />
        <meshBasicMaterial
          color={shadow.glowColor || '#9333ea'}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      <group scale={scale}>
        <primitive object={rootModel} />
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

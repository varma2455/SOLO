import React, { useRef, useMemo, useEffect, useState } from 'react';
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
import { getAllLivingEnemies, getEnemyPosition } from '../combat/EnemyPositionTracker';

// Shared global state for live 60fps Three.js reading across modules
export const globalShadowState = {
  pos: new THREE.Vector3(DEFAULT_PLAYER_POSITION[0] - 2.0, 0, DEFAULT_PLAYER_POSITION[2] + 2.2),
  position: [DEFAULT_PLAYER_POSITION[0] - 2.0, 0, DEFAULT_PLAYER_POSITION[2] + 2.2],
  active: false,
  isDead: false,
  hp: 1000,
  maxHp: 1000,
  mp: 500,
  maxMp: 500,
  status: 'UNSUMMONED',
  targetId: null,
  targetName: null,
  guardActive: false
};

if (typeof window !== 'undefined') {
  window.__shadowState = globalShadowState;
}

const _sPPos = new THREE.Vector3();
const _sIdleTarget = new THREE.Vector3();
const _sEnPos = new THREE.Vector3();
const _sDir = new THREE.Vector3();
const _scratchVec = new THREE.Vector3();

const formationOffsets = [
  [-2.2, 0, 2.4],
  [2.2, 0, 2.4],
  [0, 0, 3.4]
];

const SingleShadow = React.memo(({ shadow, index, playerPos, enemies, onShadowAttackEnemy, onShadowAttack }) => {
  const meshRef = useRef();
  const baseP = safeVector3(globalPlayerState?.position || playerPos, DEFAULT_PLAYER_POSITION, 'SingleShadow:initial');
  const initialX = baseP[0] + (index === 0 ? -2.2 : index === 1 ? 2.2 : 0);
  const initialZ = baseP[2] + 2.4;
  const pos = useRef(new THREE.Vector3(initialX, 0, initialZ));
  const rotation = useRef(0);
  const attackTimer = useRef(0);
  const deathStartedRef = useRef(false);
  const critNextRef = useRef(false);

  const lockedTargetId = useGameStore((s) => s.lockedTargetId);
  const shadowAbilityEvent = useGameStore((s) => s.shadowAbilityEvent);
  const shadowHitEvent = useGameStore((s) => s.shadowHitEvent);
  const setShadowStatus = useGameStore((s) => s.setShadowStatus);

  // Procedural 3D Humanoid Shadow Warrior model & skeletal animation controller
  const { rootModel, nodes, animController } = useMemo(() => {
    let res;
    let type = 'soldier';
    if (shadow.id === 'umbral_general') {
      res = buildShadowKnightModel(0);
      type = 'knight';
    } else if (shadow.id === 'nightfang') {
      res = buildAbyssAssassinModel(0);
      type = 'assassin';
    } else {
      res = buildShadowSoldierModel(0, false); // false = Allied cyan/violet
      type = 'soldier';
    }
    const ctrl = new MonsterAnimationController(res.nodes, type);
    return { rootModel: res.root, nodes: res.nodes, animController: ctrl };
  }, [shadow.id]);

  // Safe cleanup on unmount: detach model references without destroying shared geometries or materials
  useEffect(() => {
    return () => {
      if (rootModel) {
        if (rootModel.parent) {
          rootModel.parent.remove(rootModel);
        }
      }
    };
  }, [rootModel]);

  // Listen for Shadow Abilities triggered via 1, 2, 3, 4
  useEffect(() => {
    if (!shadowAbilityEvent || !shadowAbilityEvent.slot) return;
    const { slot, ability } = shadowAbilityEvent;

    if (slot === 1) {
      // 1 = Shadow Slash (MP 30) - Heavy strike dealing bonus damage
      animController?.triggerAttack();
      const currentTarget = globalShadowState.targetId;
      if (currentTarget) {
        const attackCb = onShadowAttackEnemy || onShadowAttack;
        if (attackCb) {
          attackCb(shadow, currentTarget, ability.dmg || 180, 'SHADOW SLASH');
        }
      }
    } else if (slot === 2) {
      // 2 = Shadow Guard (MP 50) - Defensive barrier
      animController?.triggerBlock?.(ability.duration || 6);
    } else if (slot === 3) {
      // 3 = Shadow Step (MP 40) - Swift dash behind target, guarantees crit
      critNextRef.current = true;
      const targetPos = globalShadowState.targetId ? getEnemyPosition(globalShadowState.targetId) : null;
      if (targetPos) {
        // Dash 1.8m behind target
        pos.current.set(targetPos[0], 0, targetPos[2] + 1.8);
      }
    } else if (slot === 4) {
      // 4 = Dark Strike (MP 80) - Devastating dark energy shockwave
      animController?.triggerAttack();
      const currentTarget = globalShadowState.targetId;
      const attackCb = onShadowAttackEnemy || onShadowAttack;
      if (currentTarget && attackCb) {
        attackCb(shadow, currentTarget, ability.dmg || 320, 'DARK STRIKE');
      }
    }
  }, [shadowAbilityEvent, shadow, onShadowAttackEnemy, onShadowAttack, animController]);

  // Listen for hit reaction events on Shadow
  useEffect(() => {
    if (!shadowHitEvent) return;
    animController?.triggerHit(0.35, 'stagger');
  }, [shadowHitEvent, animController]);

  // 60fps authoritative physics and AI update loop
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.1);

    // Sync global shadow telemetry
    globalShadowState.pos.copy(pos.current);
    globalShadowState.position[0] = pos.current.x;
    globalShadowState.position[1] = pos.current.y;
    globalShadowState.position[2] = pos.current.z;
    globalShadowState.active = Boolean(shadow.active);
    globalShadowState.isDead = Boolean(shadow.isDead || shadow.hp <= 0);
    globalShadowState.hp = shadow.hp !== undefined ? shadow.hp : 1000;
    globalShadowState.maxHp = shadow.maxHp || 1000;
    globalShadowState.mp = shadow.mp !== undefined ? shadow.mp : 500;
    globalShadowState.maxMp = shadow.maxMp || 500;
    globalShadowState.guardActive = Boolean(shadow.guardActive);

    // -------------------------------------------------------------
    // SHADOW DEATH HANDLER (Requirement 8)
    // -------------------------------------------------------------
    if ((shadow.hp <= 0 || shadow.isDead) && !deathStartedRef.current) {
      deathStartedRef.current = true;
      globalShadowState.status = 'DEFEATED';
      setShadowStatus?.('DEFEATED');
      animController?.triggerDeath();

      setTimeout(() => {
        useGameStore.setState((s) => ({
          shadows: s.shadows.map((sh) =>
            sh.id === shadow.id
              ? { ...sh, active: false, isDead: true, status: 'UNSUMMONED' }
              : sh
          )
        }));
        globalShadowState.status = 'UNSUMMONED';
        globalShadowState.active = false;
        deathStartedRef.current = false;
      }, 1600);
      return;
    }

    if (shadow.hp <= 0 || shadow.isDead) {
      animController?.update(dt, false, false, false, false);
      return;
    }

    if (attackTimer.current > 0) attackTimer.current -= dt;

    // Get current authoritative player position
    if (globalPlayerState && (globalPlayerState.pos || globalPlayerState.posVec)) {
      _sPPos.copy(globalPlayerState.pos || globalPlayerState.posVec);
    } else {
      const curP = safeVector3(playerPos, DEFAULT_PLAYER_POSITION, 'SingleShadow:frame');
      _sPPos.set(curP[0], curP[1], curP[2]);
    }

    const offset = formationOffsets[index % formationOffsets.length];
    _sIdleTarget.set(_sPPos.x + offset[0], 0, _sPPos.z + offset[2]);

    // Check if currently in recall state
    const isRecalling = shadow.status === 'RECALLING';

    // -------------------------------------------------------------
    // SHADOW TARGET PRIORITY (Requirement 5)
    // 1. Commanded Target (player pressed Z)
    // 2. Player's Locked Target (player pressed X or TAB)
    // 3. Nearest Hostile within 16m
    // 4. Return to Player
    // -------------------------------------------------------------
    let targetEnemy = null;
    const living = getAllLivingEnemies();

    if (!isRecalling) {
      // 1. Commanded Target
      if (shadow.commandedTargetId) {
        const commanded = living.find((e) => e.id === shadow.commandedTargetId && e.hp > 0);
        if (commanded) {
          targetEnemy = commanded;
        } else {
          // Commanded enemy died -> clear command
          useGameStore.setState((s) => ({
            shadows: s.shadows.map((sh) =>
              sh.id === shadow.id ? { ...sh, commandedTargetId: null } : sh
            )
          }));
        }
      }

      // 2. Player's Locked Target
      if (!targetEnemy && lockedTargetId) {
        const locked = living.find((e) => e.id === lockedTargetId && e.hp > 0);
        if (locked) {
          targetEnemy = locked;
        }
      }

      // 3. Nearest Hostile within 16m
      if (!targetEnemy && living.length > 0) {
        let closestDist = 16.0;
        for (let i = 0; i < living.length; i++) {
          const en = living[i];
          if (en && en.hp > 0 && en.pos) {
            _sEnPos.set(en.pos[0], en.pos[1], en.pos[2]);
            const dist = pos.current.distanceTo(_sEnPos);
            if (dist < closestDist) {
              closestDist = dist;
              targetEnemy = en;
            }
          }
        }
      }
    }

    globalShadowState.targetId = targetEnemy ? targetEnemy.id : null;
    globalShadowState.targetName = targetEnemy ? (targetEnemy.name || targetEnemy.id) : null;

    let isMoving = false;

    if (targetEnemy && targetEnemy.pos) {
      _sEnPos.set(targetEnemy.pos[0], targetEnemy.pos[1], targetEnemy.pos[2]);
      const distToEnemy = pos.current.distanceTo(_sEnPos);
      const attackRange = shadow.attackRange || 2.4;

      if (distToEnemy <= attackRange) {
        // ---------------------------------------------------------
        // ATTACK STATE
        // ---------------------------------------------------------
        globalShadowState.status = 'ATTACKING';
        if (shadow.status !== 'ATTACKING') {
          setShadowStatus?.('ATTACKING');
        }

        // Face enemy directly
        _sDir.subVectors(_sEnPos, pos.current).normalize();
        rotation.current = Math.atan2(_sDir.x, _sDir.z);

        if (attackTimer.current <= 0) {
          attackTimer.current = shadow.attackCooldown || 1.2;
          sound.playSlash();
          animController?.triggerAttack();

          // Calculate damage
          let baseDamage = shadow.attack || 60;
          if (critNextRef.current) {
            baseDamage = Math.round(baseDamage * 2.0);
            critNextRef.current = false;
          }
          const damage = Math.round(baseDamage * (0.9 + Math.random() * 0.2));

          const attackCb = onShadowAttackEnemy || onShadowAttack;
          if (attackCb) {
            attackCb(shadow, targetEnemy.id, damage, 'SHADOW SLASH');
          }
        }
      } else {
        // ---------------------------------------------------------
        // CHASE STATE: Physically run toward enemy (Requirement 3)
        // ---------------------------------------------------------
        globalShadowState.status = 'CHASE';
        if (shadow.status !== 'CHASE') {
          setShadowStatus?.('CHASE');
        }

        isMoving = true;
        _sDir.subVectors(_sEnPos, pos.current).normalize();
        const moveSpeed = shadow.speed || 4.8;
        pos.current.addScaledVector(_sDir, moveSpeed * dt);
        rotation.current = Math.atan2(_sDir.x, _sDir.z);
      }
    } else {
      // -----------------------------------------------------------
      // FOLLOWING / RECALLING STATE (Requirement 9 & 10)
      // Follows player formation offset at a reasonable distance.
      // -----------------------------------------------------------
      const distToFormation = pos.current.distanceTo(_sIdleTarget);
      const distToPlayer = pos.current.distanceTo(_sPPos);

      if (isRecalling && distToFormation <= 2.0) {
        // Arrived at formation -> transition to FOLLOWING
        useGameStore.setState((s) => ({
          shadows: s.shadows.map((sh) =>
            sh.id === shadow.id ? { ...sh, status: 'FOLLOWING' } : sh
          )
        }));
      }

      const currentStatus = isRecalling ? 'RECALLING' : 'FOLLOWING';
      globalShadowState.status = currentStatus;
      if (shadow.status !== currentStatus && shadow.status !== 'RECALLING') {
        setShadowStatus?.(currentStatus);
      }

      if (distToFormation > 1.2) {
        isMoving = true;
        _sDir.subVectors(_sIdleTarget, pos.current).normalize();

        // Controlled catch-up: if far (> 14m), use swift catch-up sprint (NO instant teleport)
        const followSpeed = distToPlayer > 14 ? 11.0 : (distToFormation > 6 ? 7.5 : 5.0);
        pos.current.addScaledVector(_sDir, followSpeed * dt);
        rotation.current = Math.atan2(_sDir.x, _sDir.z);
      } else {
        // Stand in formation and face player facing direction
        const targetRot = globalPlayerState ? globalPlayerState.rotation : 0;
        rotation.current = THREE.MathUtils.lerp(rotation.current, targetRot, 0.1);
      }
    }

    // Ensure shadow position is finite (Requirement 5)
    if (
      !Number.isFinite(pos.current.x) ||
      !Number.isFinite(pos.current.y) ||
      !Number.isFinite(pos.current.z)
    ) {
      pos.current.set(_sPPos.x - 2.0, 0, _sPPos.z + 2.0);
    }

    // Apply 3D transform
    meshRef.current.position.copy(pos.current);
    meshRef.current.rotation.y = rotation.current;

    // Update procedural skeletal animation controller
    animController?.update(dt, isMoving, false, false, false);
  });

  const scale = shadow.scale || 1.15;
  const isGuardActive = Boolean(shadow.guardActive);

  return (
    <group ref={meshRef} position={pos.current.toArray()}>
      {/* Visual Indicator: Allied Cyan/Violet Aura Disc (Requirement 12) */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.65 * scale, 24]} />
        <meshBasicMaterial color="#050811" transparent opacity={0.7} />
      </mesh>
      {/* Cyan Swirling Allied Inner Ring */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55 * scale, 0.72 * scale, 24]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Violet Allied Outer Ring */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.74 * scale, 0.86 * scale, 24]} />
        <meshBasicMaterial
          color="#9333ea"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Shadow Guard Bubble (Visual for Ability 2) */}
      {isGuardActive && (
        <mesh position={[0, 1.1, 0]}>
          <sphereGeometry args={[1.3 * scale, 16, 16]} />
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={0.25}
            wireframe
          />
        </mesh>
      )}

      {/* 3D Humanoid Model */}
      <group scale={scale}>
        <primitive object={rootModel} />
      </group>
    </group>
  );
});

export const ShadowCompanions = ({
  playerPos,
  livingEnemies,
  enemies,
  onShadowAttack,
  onShadowAttackEnemy
}) => {
  const shadows = useGameStore((s) => s.shadows);
  const activeShadows = shadows.filter((s) => s.active && s.unlocked && !s.isDead);

  const actualEnemies = enemies || livingEnemies || [];
  const handleAttack = onShadowAttackEnemy || onShadowAttack;

  return (
    <group>
      {activeShadows.map((sh, idx) => (
        <SingleShadow
          key={sh.id}
          shadow={sh}
          index={idx}
          playerPos={playerPos}
          enemies={actualEnemies}
          onShadowAttackEnemy={handleAttack}
          onShadowAttack={handleAttack}
        />
      ))}
    </group>
  );
};

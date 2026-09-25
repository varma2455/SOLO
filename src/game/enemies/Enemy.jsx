// -------------------------------------------------------------
// SHADOW ASCENSION - 3D ENEMY ENTITY & SPECIALIZED GROUP AI
// Supports: Swarm, Ranged, Tank, Assassin, Elite, Commander
// Features realistic anatomical 3D models and procedural skeletal animation.
// -------------------------------------------------------------

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { globalPlayerState } from '../player/Player';
import { sound } from '../../audio/soundManager';
import { safeVector3, DEFAULT_PLAYER_POSITION } from '../../utils/vector3';
import { registerEnemyPosition, unregisterEnemyPosition } from '../combat/EnemyPositionTracker';
import {
  buildAshGoblinModel,
  buildGraveSoldierModel,
  buildVoidArcherModel,
  buildBloodKnightModel,
  buildGraveWarlordModel
} from './MonsterModelBuilder';
import { MonsterAnimationController } from './MonsterAnimationController';

// Module-level reusable scratch vectors to eliminate garbage collection pauses
const _scratchPPos = new THREE.Vector3();
const _scratchMoveDir = new THREE.Vector3();
const _scratchFlank = new THREE.Vector3();
const _scratchSurround = new THREE.Vector3();
const _scratchKb = new THREE.Vector3();

// -------------------------------------------------------------
// MAIN ENEMY COMPONENT WITH COMPREHENSIVE AI & COMBAT STATE
// -------------------------------------------------------------
const EnemyComponent = ({
  enemyData,
  playerPos,
  onEnemyDeath,
  onEnemyAttackPlayer,
  commanderAlive = false,
  onNearExecutable,
  isDormant = false
}) => {
  const meshRef = useRef();
  const hpBarRef = useRef();
  const weaponRef = useRef();
  const finisherTagRef = useRef();
  const targetLockRef = useRef();

  const lockedTargetId = useGameStore((s) => s.lockedTargetId);
  const isLockedTarget = lockedTargetId === enemyData.id;

  const [currentHp, setCurrentHp] = useState(enemyData.hp || enemyData.maxHp);
  const [aiState, setAiState] = useState('IDLE');
  const [isHit, setIsHit] = useState(false);

  const isCommander = Boolean(commanderAlive && enemyData.isCommander) || enemyData.tier === 'commander' || enemyData.isCommander;

  // Procedural anatomical 3D dark fantasy monster model & animation controller
  const { rootModel, nodes, animController } = useMemo(() => {
    let res;
    let type = 'humanoid';
    if (isCommander) {
      res = buildGraveWarlordModel();
      type = 'commander';
    } else if (enemyData.id?.includes('bloodKnight') || enemyData.tier === 'elite' || enemyData.isApex) {
      res = buildBloodKnightModel();
      type = 'elite';
    } else if (enemyData.role === 'ranged' || enemyData.id?.includes('voidArcher') || enemyData.id?.includes('archer')) {
      res = buildVoidArcherModel();
      type = 'archer';
    } else if (
      enemyData.id?.includes('graveSoldier') ||
      enemyData.id?.includes('skeleton') ||
      enemyData.id?.includes('rottingSkeleton') ||
      enemyData.id?.includes('boneReaver')
    ) {
      res = buildGraveSoldierModel();
      type = 'soldier';
    } else {
      res = buildAshGoblinModel();
      type = 'goblin';
    }
    const ctrl = new MonsterAnimationController(res.nodes, type);
    return { rootModel: res.root, nodes: res.nodes, animController: ctrl };
  }, [enemyData.id, enemyData.tier, enemyData.role, isCommander]);

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

  // Material hit flash effect
  useEffect(() => {
    if (!rootModel) return;
    rootModel.traverse((child) => {
      if (child.isMesh && child.material) {
        const mat = child.material;
        if (mat.emissive) {
          if (isHit) {
            if (!child.userData.origEmissive) {
              child.userData.origEmissive = mat.emissive.clone();
            }
            mat.emissive.set('#ffffff');
          } else if (child.userData.origEmissive) {
            mat.emissive.copy(child.userData.origEmissive);
          }
        }
      }
    });
  }, [isHit, rootModel]);

  const safeSpawn = safeVector3(enemyData.spawnPosition, [0, 0.5, 0], 'Enemy:spawnPosition');
  const pos = useRef(new THREE.Vector3(safeSpawn[0], safeSpawn[1], safeSpawn[2]));
  const spawnPos = useRef(new THREE.Vector3(safeSpawn[0], safeSpawn[1], safeSpawn[2]));
  const rotation = useRef(0);
  const attackTimer = useRef(Math.random() * 1.5);
  const patrolTimer = useRef(Math.random() * 3);
  const patrolDir = useRef(new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize());
  const frameTick = useRef(Math.floor(Math.random() * 16));

  // Deterministic radial offset for swarming entities to surround player cleanly
  const swarmAngleOffset = useMemo(() => {
    let hash = 0;
    const str = enemyData.id || 'swarm_0';
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
    return Math.abs(hash % 360) * (Math.PI / 180);
  }, [enemyData.id]);

  // Commander buff modifier
  const hasCommanderBuff = Boolean(commanderAlive && enemyData.commanderId && !enemyData.isCommander);

  // Sync external hit registrations
  useEffect(() => {
    if (enemyData.hp !== undefined && enemyData.hp !== currentHp) {
      setCurrentHp(enemyData.hp);
      setIsHit(true);
      animController?.triggerHit(0.2);
      setTimeout(() => setIsHit(false), 140);

      // Knockback away from player
      const pCurrent = globalPlayerState?.pos || (playerPos ? safeVector3(playerPos, DEFAULT_PLAYER_POSITION) : null);
      if (pCurrent) {
        const px = pCurrent.x ?? pCurrent[0] ?? 0;
        const pz = pCurrent.z ?? pCurrent[2] ?? 0;
        const kbStrength = enemyData.tier === 'weak' ? 1.0 : enemyData.tier === 'elite' ? 0.35 : 0.6;
        _scratchKb.set(pos.current.x - px, 0, pos.current.z - pz).normalize();
        pos.current.addScaledVector(_scratchKb, kbStrength);
      }

      if (enemyData.hp <= 0 && aiState !== 'DEAD') {
        setAiState('DEAD');
        unregisterEnemyPosition(enemyData.id);
        onEnemyDeath(enemyData, [pos.current.x, 0.5, pos.current.z]);
      }
    }
  }, [enemyData.hp]);

  // Clean up position tracking on unmount
  useEffect(() => {
    return () => {
      unregisterEnemyPosition(enemyData.id);
    };
  }, [enemyData.id]);

  // Notify parent if executable
  const isExecutable = currentHp > 0 && currentHp / enemyData.maxHp <= 0.15;
  useEffect(() => {
    if (!onNearExecutable) return;
    const pCurrent = globalPlayerState?.pos || (playerPos ? safeVector3(playerPos, DEFAULT_PLAYER_POSITION) : null);
    const px = pCurrent ? (pCurrent.x ?? pCurrent[0] ?? 0) : 0;
    const py = pCurrent ? (pCurrent.y ?? pCurrent[1] ?? 0.5) : 0.5;
    const pz = pCurrent ? (pCurrent.z ?? pCurrent[2] ?? 0) : 0;
    _scratchPPos.set(px, py, pz);
    const dist = pos.current.distanceTo(_scratchPPos);
    if (isExecutable && dist <= 5.0) {
      onNearExecutable(enemyData.id, true);
    } else {
      onNearExecutable(enemyData.id, false);
    }
  }, [isExecutable, playerPos, onNearExecutable]);

  // AI Frame Loop with Distance-Based Throttling (30-60 FPS Target)
  useFrame((state, delta) => {
    if (!meshRef.current || aiState === 'DEAD') return;

    if (isDormant) {
      frameTick.current++;
      if (frameTick.current % 4 !== 0) return;
      const t = state.clock.getElapsedTime();
      meshRef.current.position.y = 0.05 * Math.sin(t * 1.8 + (enemyData.id?.charCodeAt(0) || 0));
      return;
    }

    const dt = Math.min(delta, 0.1);

    frameTick.current++;

    if (globalPlayerState && (globalPlayerState.pos || globalPlayerState.posVec)) {
      _scratchPPos.copy(globalPlayerState.pos || globalPlayerState.posVec);
    } else {
      const p = safeVector3(playerPos, DEFAULT_PLAYER_POSITION, 'Enemy:playerPos');
      _scratchPPos.set(p[0], p[1], p[2]);
    }

    const distToPlayer = pos.current.distanceTo(_scratchPPos);

    // AI Distance LOD optimization
    // Distant > 45m: update every 16 frames (~4 Hz)
    if (distToPlayer > 45 && frameTick.current % 16 !== 0) return;
    // Medium 20m–45m: update every 4 frames (~15 Hz)
    if (distToPlayer > 20 && frameTick.current % 4 !== 0) return;

    if (attackTimer.current > 0) attackTimer.current -= dt;

    // Buffed stats
    const effectiveSpeed = enemyData.speed * (hasCommanderBuff ? 1.15 : 1.0);
    const effectiveAttack = Math.round(enemyData.attack * (hasCommanderBuff ? 1.35 : 1.0));

    if (distToPlayer <= enemyData.detectionRange) {
      // -------------------------------------------------------------
      // SPECIALIZED BEHAVIOR BY ENEMY ROLE
      // -------------------------------------------------------------
      if (enemyData.role === 'ranged') {
        // RANGED ARCHER: Backs away if player is too close, shoots from distance
        if (distToPlayer < 6.0) {
          // Kite backward away from player
          setAiState('KITE');
          _scratchMoveDir.subVectors(pos.current, _scratchPPos).normalize();
          pos.current.addScaledVector(_scratchMoveDir, effectiveSpeed * dt);
          rotation.current = Math.atan2(-_scratchMoveDir.x, -_scratchMoveDir.z);
        } else if (distToPlayer <= enemyData.attackRange) {
          // In firing range
          rotation.current = Math.atan2(_scratchPPos.x - pos.current.x, _scratchPPos.z - pos.current.z);
          if (attackTimer.current <= 0) {
            attackTimer.current = enemyData.attackCooldown;
            setAiState('ATTACK');
            animController?.triggerAttack();
            sound.playShadowSlash();
            setTimeout(() => {
              if (aiState !== 'DEAD') {
                const pCur = globalPlayerState ? (globalPlayerState.pos || globalPlayerState.posVec || _scratchPPos) : _scratchPPos;
                const curDist = pos.current.distanceTo(pCur);
                if (curDist <= enemyData.attackRange + 2.0) {
                  onEnemyAttackPlayer(effectiveAttack);
                }
              }
            }, 300);
          }
        } else {
          // Move into range
          setAiState('CHASE');
          _scratchMoveDir.subVectors(_scratchPPos, pos.current).normalize();
          pos.current.addScaledVector(_scratchMoveDir, effectiveSpeed * dt);
          rotation.current = Math.atan2(_scratchMoveDir.x, _scratchMoveDir.z);
        }

      } else if (enemyData.role === 'assassin') {
        // ASSASSIN: Flanks around to player's sides / rear
        if (distToPlayer <= enemyData.attackRange) {
          if (attackTimer.current <= 0) {
            attackTimer.current = enemyData.attackCooldown;
            setAiState('ATTACK');
            animController?.triggerAttack();
            if (weaponRef.current) {
              weaponRef.current.rotation.x = -1.5;
              setTimeout(() => {
                if (weaponRef.current) weaponRef.current.rotation.x = 0;
              }, 220);
            }
            setTimeout(() => {
              if (aiState !== 'DEAD') {
                const curDist = pos.current.distanceTo(_scratchPPos);
                if (curDist <= enemyData.attackRange + 1.2) {
                  onEnemyAttackPlayer(effectiveAttack);
                }
              }
            }, 180);
          }
        } else {
          setAiState('CHASE');
          _scratchFlank.set(
            _scratchPPos.x + Math.sin(swarmAngleOffset) * 2.5,
            _scratchPPos.y,
            _scratchPPos.z + Math.cos(swarmAngleOffset) * 2.5
          );
          _scratchMoveDir.subVectors(_scratchFlank, pos.current).normalize();
          pos.current.addScaledVector(_scratchMoveDir, effectiveSpeed * dt);
          rotation.current = Math.atan2(_scratchMoveDir.x, _scratchMoveDir.z);
        }

      } else if (enemyData.role === 'swarm') {
        // SWARM: Spreads radially around player to surround without overlapping
        _scratchSurround.set(
          _scratchPPos.x + Math.sin(swarmAngleOffset) * 1.8,
          _scratchPPos.y,
          _scratchPPos.z + Math.cos(swarmAngleOffset) * 1.8
        );

        if (distToPlayer <= enemyData.attackRange + 0.5) {
          if (attackTimer.current <= 0) {
            attackTimer.current = enemyData.attackCooldown;
            setAiState('ATTACK');
            animController?.triggerAttack();
            setTimeout(() => {
              if (aiState !== 'DEAD') {
                const curDist = pos.current.distanceTo(_scratchPPos);
                if (curDist <= enemyData.attackRange + 0.8) {
                  onEnemyAttackPlayer(effectiveAttack);
                }
              }
            }, 200);
          }
        } else {
          setAiState('CHASE');
          _scratchMoveDir.subVectors(_scratchSurround, pos.current).normalize();
          pos.current.addScaledVector(_scratchMoveDir, effectiveSpeed * dt);
          rotation.current = Math.atan2(_scratchPPos.x - pos.current.x, _scratchPPos.z - pos.current.z);
        }

      } else {
        // MELEE / TANK / COMMANDER: Direct advance and strikes
        if (distToPlayer <= enemyData.attackRange) {
          if (attackTimer.current <= 0) {
            attackTimer.current = enemyData.attackCooldown;
            setAiState('ATTACK');
            animController?.triggerAttack();
            if (weaponRef.current) {
              weaponRef.current.rotation.x = -1.6;
              setTimeout(() => {
                if (weaponRef.current) weaponRef.current.rotation.x = 0;
              }, 280);
            }
            setTimeout(() => {
              if (aiState !== 'DEAD') {
                const curDist = pos.current.distanceTo(_scratchPPos);
                if (curDist <= enemyData.attackRange + 1.2) {
                  onEnemyAttackPlayer(effectiveAttack);
                }
              }
            }, 220);
          }
        } else {
          setAiState('CHASE');
          _scratchMoveDir.subVectors(_scratchPPos, pos.current).normalize();
          pos.current.addScaledVector(_scratchMoveDir, effectiveSpeed * dt);
          rotation.current = Math.atan2(_scratchMoveDir.x, _scratchMoveDir.z);
        }
      }

    } else {
      // Out of detection range -> Patrol near spawn position
      patrolTimer.current -= dt;
      if (patrolTimer.current <= 0) {
        patrolTimer.current = 2.5 + Math.random() * 3;
        patrolDir.current.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      }

      const distFromSpawn = pos.current.distanceTo(spawnPos.current);
      if (distFromSpawn > 5.5) {
        _scratchMoveDir.subVectors(spawnPos.current, pos.current).normalize();
        pos.current.addScaledVector(_scratchMoveDir, effectiveSpeed * 0.5 * dt);
        rotation.current = Math.atan2(_scratchMoveDir.x, _scratchMoveDir.z);
      } else {
        pos.current.addScaledVector(patrolDir.current, effectiveSpeed * 0.3 * dt);
        rotation.current = Math.atan2(patrolDir.current.x, patrolDir.current.z);
      }
      setAiState('PATROL');
    }

    meshRef.current.position.copy(pos.current);
    meshRef.current.rotation.y = rotation.current;

    // Update procedural skeletal animation state machine
    const isMoving = (aiState === 'CHASE' || aiState === 'PATROL' || aiState === 'KITE');
    const isDead = aiState === 'DEAD' || currentHp <= 0;
    animController?.update(dt, isMoving, isDead, isCommander, false);

    // Continuously publish live position for soft auto-aim & accurate melee hit registration
    registerEnemyPosition(enemyData.id, [pos.current.x, pos.current.y, pos.current.z], currentHp, enemyData.maxHp, {
      role: enemyData.role,
      tier: enemyData.tier,
      name: enemyData.name
    });

    // Billboard health bar, execution tag, and target lock reticle to camera only when reasonably close
    if (distToPlayer < 35) {
      if (hpBarRef.current) hpBarRef.current.quaternion.copy(state.camera.quaternion);
      if (finisherTagRef.current) finisherTagRef.current.quaternion.copy(state.camera.quaternion);
      if (targetLockRef.current) targetLockRef.current.quaternion.copy(state.camera.quaternion);
    }
  });

  if (aiState === 'DEAD') return null;

  const hpRatio = Math.max(0, currentHp / enemyData.maxHp);
  const scale = enemyData.scale || 1.0;
  const isElite = enemyData.tier === 'elite' || enemyData.isApex;

  return (
    <group ref={meshRef} position={enemyData.spawnPosition}>
      {/* ------------------------------------------------------------- */}
      {/* TARGET LOCK RETICLE (TAB Auto/Manual Target Lock)             */}
      {/* ------------------------------------------------------------- */}
      {isLockedTarget && (
        <group ref={targetLockRef} position={[0, scale * (isCommander ? 3.3 : isElite ? 3.0 : 2.6), 0]}>
          {/* Target Reticle Outer Ring */}
          <mesh>
            <ringGeometry args={[0.34, 0.42, 24]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.92} side={THREE.DoubleSide} />
          </mesh>
          {/* Target Center Pip */}
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <ringGeometry args={[0.10, 0.16, 4]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.95} side={THREE.DoubleSide} />
          </mesh>
          {/* Crosshair Brackets */}
          <mesh position={[0, 0.48, 0]}>
            <planeGeometry args={[0.26, 0.05]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh position={[0, -0.48, 0]}>
            <planeGeometry args={[0.26, 0.05]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh position={[-0.48, 0, 0]}>
            <planeGeometry args={[0.05, 0.26]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh position={[0.48, 0, 0]}>
            <planeGeometry args={[0.05, 0.26]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FLOATING HEALTH BAR & BADGES                                  */}
      {/* ------------------------------------------------------------- */}
      <group ref={hpBarRef} position={[0, scale * (isCommander ? 2.6 : isElite ? 2.4 : 2.0), 0]}>
        {/* Tier / Commander / Elite Title Badge */}
        {(isElite || isCommander) && (
          <group position={[0, 0.32, 0]}>
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[1.8, 0.22]} />
              <meshBasicMaterial color={isCommander ? '#7c2d12' : '#0c4a6e'} />
            </mesh>
            <mesh position={[0, 0, 0.01]}>
              <planeGeometry args={[1.74, 0.18]} />
              <meshBasicMaterial color={isCommander ? '#ea580c' : '#0284c7'} />
            </mesh>
          </group>
        )}

        {/* Health Bar Background */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[isCommander ? 2.0 : isElite ? 1.6 : 1.1, 0.16]} />
          <meshBasicMaterial color="#09090b" />
        </mesh>

        {/* Dynamic Health Bar Fill */}
        <mesh position={[((hpRatio - 1) * (isCommander ? 2.0 : isElite ? 1.6 : 1.1)) / 2, 0, 0.01]}>
          <planeGeometry args={[(isCommander ? 2.0 : isElite ? 1.6 : 1.1) * hpRatio, 0.13]} />
          <meshBasicMaterial color={isCommander ? '#f97316' : isElite ? '#38bdf8' : '#ef4444'} />
        </mesh>

        {/* Level Tag Pip */}
        <mesh position={[-(isCommander ? 1.1 : isElite ? 0.9 : 0.65), 0, 0.02]}>
          <circleGeometry args={[0.12, 12]} />
          <meshBasicMaterial color={isCommander ? '#f59e0b' : '#38bdf8'} />
        </mesh>
      </group>

      {/* ------------------------------------------------------------- */}
      {/* [F] EXECUTION / FINISHER PROMPT BANNER                        */}
      {/* ------------------------------------------------------------- */}
      {isExecutable && (
        <group ref={finisherTagRef} position={[0, scale * 2.8, 0]}>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1.6, 0.38]} />
            <meshBasicMaterial color="#dc2626" />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[1.5, 0.3]} />
            <meshBasicMaterial color="#7f1d1d" />
          </mesh>
        </group>
      )}

      {/* ------------------------------------------------------------- */}
      {/* COMMANDER BUFF AURA PARTICLES (if active)                     */}
      {/* ------------------------------------------------------------- */}
      {hasCommanderBuff && (
        <group position={[0, 0.05, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.7, 0.9, 16]} />
            <meshBasicMaterial color="#f97316" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* ------------------------------------------------------------- */}
      {/* RENDER MODEL BY TYPE                                          */}
      {/* ------------------------------------------------------------- */}
      <group scale={scale}>
        {/* Dynamic Ground Shadow */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.65 * scale, 16]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.6} />
        </mesh>

        <primitive object={rootModel} />
      </group>
    </group>
  );
};

export const Enemy = React.memo(EnemyComponent);


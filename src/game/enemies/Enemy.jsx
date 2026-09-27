// -------------------------------------------------------------
// SHADOW ASCENSION - 3D ENEMY ENTITY & ADVANCED LIVING AI
// Complete overhaul:
// 1. Detailed Original Humanoid Goblin Creatures (Warrior, Scout, Brute, Archer, Elite)
// 2. Full Skeletal Procedural Animation (true foot grounding, walk cycles, breathing, turns)
// 3. Realistic Perception System (Vision Cone, Hearing Range, Behind Check, Alert !)
// 4. Realistic Room Patrol (50-70% independent movement during exploration)
// 5. Group Behavior (Shout alert propagation, surrounding, shared attack tokens)
// 6. Multi-phase Attacks with delayed impact, hit reactions, coward fleeing, death collapse
// -------------------------------------------------------------

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { globalPlayerState } from '../player/Player';
import { sound } from '../../audio/soundManager';
import { safeVector3, DEFAULT_PLAYER_POSITION } from '../../utils/vector3';
import { registerEnemyPosition, unregisterEnemyPosition } from '../combat/EnemyPositionTracker';
import {
  buildGoblinModel,
  buildShadowSoldierModel,
  buildHostileShadowSoldierModel,
  buildShadowKnightModel,
  buildAbyssAssassinModel,
  buildAbyssBruteModel,
  buildAbyssWardenModel,
  buildGraveSoldierModel,
  buildVoidArcherModel
} from './MonsterModelBuilder';
import { MonsterAnimationController } from './MonsterAnimationController';
import {
  GroupCombatCoordinator,
  checkPerception,
  createPatrolRoutine,
  updatePhysicalSteering
} from './EnemyAI';

// Module-level reusable scratch vectors to eliminate garbage collection pauses
const _scratchPPos = new THREE.Vector3();
const _scratchTargetPos = new THREE.Vector3();
const _scratchKb = new THREE.Vector3();
const _scratchHeading = new THREE.Vector3();

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
  const finisherTagRef = useRef();
  const targetLockRef = useRef();
  const alertBillboardRef = useRef();

  const lockedTargetId = useGameStore((s) => s.lockedTargetId);
  const isLockedTarget = lockedTargetId === enemyData.id;
  const gameFlowState = useGameStore((s) => s.gameFlowState);

  const [currentHp, setCurrentHp] = useState(enemyData.hp || enemyData.maxHp);
  const [aiState, setAiState] = useState('IDLE'); // IDLE, PATROL, INVESTIGATE, ALERT, CHASE, ATTACK, HIT, STAGGER, FLEE, DEAD
  const [isHit, setIsHit] = useState(false);
  const [showAlertMark, setShowAlertMark] = useState(false);
  const [isDissolved, setIsDissolved] = useState(false);
  const deathStartedRef = useRef(false);

  const isCommander = Boolean(commanderAlive && enemyData.isCommander) || enemyData.tier === 'commander' || enemyData.isCommander;
  const isGoblin = Boolean(
    enemyData.id?.toLowerCase().includes('goblin') ||
    enemyData.name?.toLowerCase().includes('goblin') ||
    enemyData.id?.includes('ashGoblin') ||
    (!enemyData.id?.includes('skeleton') &&
      !enemyData.id?.includes('knight') &&
      !enemyData.id?.includes('archer') &&
      !enemyData.id?.includes('warden') &&
      !enemyData.id?.includes('shadow') &&
      !enemyData.id?.includes('soldier') &&
      !enemyData.id?.includes('brute') &&
      !enemyData.id?.includes('assassin') &&
      enemyData.tier === 'weak')
  );

  // Determine personality
  const personality = useMemo(() => {
    if (!isGoblin) return 'standard';
    if (enemyData.role === 'assassin' || enemyData.id?.includes('scout')) return 'scout';
    if (enemyData.id?.includes('brute') || (enemyData.tier === 'tank' && (enemyData.scale || 1) > 1.15)) return 'brute';
    if (enemyData.role === 'ranged' || enemyData.id?.includes('archer')) return 'archer';
    if (enemyData.tier === 'elite' || enemyData.isApex) return 'elite';
    return 'warrior';
  }, [isGoblin, enemyData.role, enemyData.tier, enemyData.id, enemyData.scale, enemyData.isApex]);

  // Deterministic seed for visual color & material variations across monster instances
  const variantSeed = useMemo(() => {
    const raw = String(enemyData.id || '0');
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash * 31 + raw.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }, [enemyData.id]);

  // Procedural anatomical 3D dark fantasy monster model & animation controller
  const { rootModel, nodes, animController } = useMemo(() => {
    let res;
    let animType = 'soldier';

    if (
      enemyData.id?.includes('warden') ||
      enemyData.type === 'abyssWarden' ||
      enemyData.name?.toLowerCase().includes('warden')
    ) {
      res = buildAbyssWardenModel();
      animType = 'boss';
    } else if (
      enemyData.id?.includes('shadow') ||
      enemyData.type === 'shadowSoldier'
    ) {
      res = buildHostileShadowSoldierModel(variantSeed);
      animType = 'soldier';
    } else if (isGoblin) {
      res = buildGoblinModel(personality, variantSeed);
      animType = `goblin_${personality}`;
    } else if (
      isCommander ||
      enemyData.tier === 'commander' ||
      enemyData.id?.includes('warlord') ||
      enemyData.id?.includes('brute')
    ) {
      res = buildAbyssBruteModel(variantSeed);
      animType = 'brute';
    } else if (
      enemyData.id?.includes('bloodKnight') ||
      enemyData.id?.includes('shadowKnight') ||
      enemyData.id?.includes('knight') ||
      enemyData.tier === 'elite' ||
      enemyData.isApex
    ) {
      res = buildShadowKnightModel(variantSeed);
      animType = 'knight';
    } else if (
      enemyData.role === 'assassin' ||
      enemyData.id?.includes('assassin') ||
      enemyData.id?.includes('boneReaver') ||
      enemyData.id?.includes('darkBeast') ||
      enemyData.id?.includes('cryptHunter') ||
      enemyData.id?.includes('cryptReaper')
    ) {
      res = buildAbyssAssassinModel(variantSeed);
      animType = 'assassin';
    } else if (enemyData.role === 'ranged' || enemyData.id?.includes('voidArcher') || enemyData.id?.includes('archer')) {
      res = buildVoidArcherModel(variantSeed);
      animType = 'archer';
    } else if (
      enemyData.id?.includes('graveSoldier') ||
      enemyData.id?.includes('skeleton') ||
      enemyData.id?.includes('rottingSkeleton') ||
      enemyData.id?.includes('soldier')
    ) {
      res = buildGraveSoldierModel(variantSeed);
      animType = 'soldier';
    } else {
      res = buildGoblinModel('warrior', variantSeed);
      animType = 'goblin_warrior';
    }

    const ctrl = new MonsterAnimationController(res.nodes, animType);
    return { rootModel: res.root, nodes: res.nodes, animController: ctrl };
  }, [isGoblin, personality, variantSeed, enemyData.id, enemyData.tier, enemyData.role, enemyData.type, enemyData.name, isCommander]);

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
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const rotation = useRef(Math.random() * Math.PI * 2); // Natural random facing on spawn

  // AI & Perception configuration
  const perceptionConfig = useMemo(() => {
    const baseRange = enemyData.detectionRange || 12.0;
    if (personality === 'scout') return { visionRange: baseRange + 4.0, visionAngleDeg: 120, hearingRange: 7.0 };
    if (personality === 'archer') return { visionRange: baseRange + 3.0, visionAngleDeg: 115, hearingRange: 6.5 };
    if (personality === 'brute') return { visionRange: baseRange - 2.0, visionAngleDeg: 100, hearingRange: 5.0 };
    if (personality === 'elite') return { visionRange: baseRange + 2.0, visionAngleDeg: 115, hearingRange: 6.5 };
    return { visionRange: baseRange, visionAngleDeg: 110, hearingRange: 6.0 };
  }, [enemyData.detectionRange, personality]);

  const patrolRoutine = useRef(
    createPatrolRoutine(
      enemyData.room || 1,
      parseInt(enemyData.id?.replace(/\D/g, '') || '0', 10),
      safeSpawn
    )
  );

  const attackTimer = useRef(Math.random() * 1.5);
  const alertTimer = useRef(0);
  const fleeTimer = useRef(0);
  const frameTick = useRef(Math.floor(Math.random() * 16));
  const ghostHp = useRef(1.0);
  const hasShouted = useRef(false);

  // Deterministic radial offset for swarming entities to surround player cleanly
  const swarmAngleOffset = useMemo(() => {
    let hash = 0;
    const str = enemyData.id || 'swarm_0';
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
    return Math.abs(hash % 360) * (Math.PI / 180);
  }, [enemyData.id]);

  // Commander buff modifier
  const hasCommanderBuff = Boolean(commanderAlive && enemyData.commanderId && !enemyData.isCommander);

  // Listen for group alert shouts from nearby allies
  useEffect(() => {
    const unsub = GroupCombatCoordinator.subscribeShout((originId, roomIdx, originPos, radius) => {
      if (originId === enemyData.id) return;
      if (roomIdx !== (enemyData.room || 1)) return;
      if (aiState === 'DEAD' || aiState === 'CHASE' || aiState === 'ATTACK') return;

      const dist = pos.current.distanceTo(originPos);
      if (dist <= radius) {
        // Ally alerted us!
        setAiState('ALERT');
        alertTimer.current = 0.8;
        setShowAlertMark(true);
        animController?.triggerAlert(0.8);
        rotation.current = Math.atan2(originPos.x - pos.current.x, originPos.z - pos.current.z);
      }
    });
    return unsub;
  }, [enemyData.id, enemyData.room, aiState, animController]);

  // Sync external hit registrations
  useEffect(() => {
    if (enemyData.hp !== undefined && enemyData.hp !== currentHp) {
      const prev = currentHp;
      setCurrentHp(enemyData.hp);
      setIsHit(true);

      const isHeavy = prev - enemyData.hp > 90;
      const isStagger = prev - enemyData.hp > 180;
      const intensity = isStagger ? 'stagger' : isHeavy ? 'heavy' : 'normal';

      animController?.triggerHit(isStagger ? 0.6 : isHeavy ? 0.45 : 0.22, intensity);
      setTimeout(() => setIsHit(false), 140);

      // Knockback away from player
      const pCurrent = globalPlayerState?.pos || (playerPos ? safeVector3(playerPos, DEFAULT_PLAYER_POSITION) : null);
      if (pCurrent) {
        const px = pCurrent.x ?? pCurrent[0] ?? 0;
        const pz = pCurrent.z ?? pCurrent[2] ?? 0;
        const kbStrength = isStagger ? 1.4 : enemyData.tier === 'weak' ? 0.9 : enemyData.tier === 'elite' ? 0.35 : 0.6;
        _scratchKb.set(pos.current.x - px, 0, pos.current.z - pz).normalize();
        pos.current.addScaledVector(_scratchKb, kbStrength);
      }

      // Check Coward Flee trigger (Low HP weak goblin or scout)
      const hpRatio = enemyData.hp / (enemyData.maxHp || 100);
      if (hpRatio > 0 && hpRatio <= 0.25 && (isGoblin && (personality === 'scout' || personality === 'warrior')) && aiState !== 'FLEE') {
        setAiState('FLEE');
        fleeTimer.current = 3.5;
        animController?.triggerFlee(3.5);
      } else if (aiState !== 'ALERT' && aiState !== 'CHASE' && aiState !== 'ATTACK' && enemyData.hp > 0) {
        setAiState('CHASE');
      }

      if (enemyData.hp <= 0 && !deathStartedRef.current) {
        deathStartedRef.current = true;
        setAiState('DEAD');
        GroupCombatCoordinator.releaseAttackToken(enemyData.room || 1, enemyData.id);
        unregisterEnemyPosition(enemyData.id);
        animController?.triggerDeath();

        // Let full death collapse animation play before dissolving & reporting death
        setTimeout(() => {
          setIsDissolved(true);
          onEnemyDeath(enemyData, [pos.current.x, 0.5, pos.current.z]);
        }, 1600);
      }
    }
  }, [enemyData.hp]);

  // Register position immediately on mount and clean up on unmount
  useEffect(() => {
    registerEnemyPosition(enemyData.id, [safeSpawn[0], safeSpawn[1], safeSpawn[2]], currentHp, enemyData.maxHp, {
      role: enemyData.role,
      tier: enemyData.tier,
      name: enemyData.name
    });
    return () => {
      GroupCombatCoordinator.unregister(enemyData.id);
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

  // AI & Animation Frame Loop
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const dt = Math.min(delta, 0.1);

    if (aiState === 'DEAD') {
      animController?.update(dt);
      if (meshRef.current) {
        meshRef.current.position.set(pos.current.x, pos.current.y, pos.current.z);
      }
      return;
    }

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

    // Movement speeds
    const baseSpeed = enemyData.speed || (personality === 'scout' ? 4.2 : personality === 'brute' ? 2.4 : 3.4);
    const effectiveSpeed = baseSpeed * (hasCommanderBuff ? 1.15 : 1.0);
    const effectiveAttack = Math.round(enemyData.attack * (hasCommanderBuff ? 1.35 : 1.0));

    // Player activity for hearing check (dashing, attacking)
    const isPlayerAudible = Boolean(globalPlayerState?.isDashing || globalPlayerState?.isAttacking);

    // -------------------------------------------------------------
    // PERCEPTION CHECK: Vision Cone & Hearing Range
    // -------------------------------------------------------------
    const perception = checkPerception(
      pos.current,
      rotation.current,
      _scratchPPos,
      isPlayerAudible,
      perceptionConfig
    );

    // Alert sequence if not in combat yet
    if (perception.detected && (aiState === 'IDLE' || aiState === 'PATROL' || aiState === 'INVESTIGATE')) {
      setAiState('ALERT');
      alertTimer.current = 0.85;
      setShowAlertMark(true);
      animController?.triggerAlert(0.85);

      // Turn head and body toward player
      rotation.current = perception.angleToPlayer;

      // Broadcast alert shout to nearby group allies once
      if (!hasShouted.current) {
        hasShouted.current = true;
        GroupCombatCoordinator.shoutAlert(enemyData.id, enemyData.room || 1, pos.current, 14.0);
        sound.playShadowSlash();
      }
    }

    // -------------------------------------------------------------
    // AI STATE MACHINE IMPLEMENTATION
    // -------------------------------------------------------------
    let moveTarget = null;
    let targetSpeed = 0;

    if (aiState === 'ALERT') {
      alertTimer.current -= dt;
      // Head and body face player
      rotation.current = Math.atan2(_scratchPPos.x - pos.current.x, _scratchPPos.z - pos.current.z);
      if (alertTimer.current <= 0) {
        setShowAlertMark(false);
        setAiState('CHASE');
      }

    } else if (aiState === 'FLEE') {
      // PANICKED COWARD FLEE: Runs in opposite direction from player
      fleeTimer.current -= dt;
      if (fleeTimer.current <= 0) {
        setAiState('CHASE');
      } else {
        _scratchTargetPos.set(
          pos.current.x + (pos.current.x - _scratchPPos.x) * 2.0,
          pos.current.y,
          pos.current.z + (pos.current.z - _scratchPPos.z) * 2.0
        );
        moveTarget = _scratchTargetPos;
        targetSpeed = effectiveSpeed * 1.35; // Sprint speed
      }

    } else if (aiState === 'CHASE' || aiState === 'ATTACK') {
      // -----------------------------------------------------------
      // COMBAT ENGAGEMENT (CHASE / SURROUND / ATTACK)
      // -----------------------------------------------------------
      const attackRange = enemyData.attackRange || (personality === 'archer' ? 10.0 : 2.0);

      if (personality === 'archer') {
        // Archer behavior: Kites backward if player gets too close (< 5.5m)
        if (distToPlayer < 5.5) {
          _scratchTargetPos.set(
            pos.current.x + (pos.current.x - _scratchPPos.x) * 1.5,
            pos.current.y,
            pos.current.z + (pos.current.z - _scratchPPos.z) * 1.5
          );
          moveTarget = _scratchTargetPos;
          targetSpeed = effectiveSpeed;
        } else if (distToPlayer <= attackRange) {
          // In firing range
          rotation.current = Math.atan2(_scratchPPos.x - pos.current.x, _scratchPPos.z - pos.current.z);
          if (attackTimer.current <= 0) {
            const hasToken = GroupCombatCoordinator.requestAttackToken(enemyData.room || 1, enemyData.id);
            if (hasToken) {
              attackTimer.current = enemyData.attackCooldown || 2.2;
              setAiState('ATTACK');
              animController?.triggerAttack('archer');
              sound.playShadowSlash();

              setTimeout(() => {
                if (aiState !== 'DEAD') {
                  const pCur = globalPlayerState ? (globalPlayerState.pos || globalPlayerState.posVec || _scratchPPos) : _scratchPPos;
                  if (pos.current.distanceTo(pCur) <= attackRange + 2.0) {
                    onEnemyAttackPlayer(effectiveAttack);
                  }
                  GroupCombatCoordinator.releaseAttackToken(enemyData.room || 1, enemyData.id);
                  setAiState('CHASE');
                }
              }, 450);
            }
          }
        } else {
          // Close in to attack range
          moveTarget = _scratchPPos;
          targetSpeed = effectiveSpeed;
        }

      } else {
        // Melee / Warrior / Scout / Brute / Elite Behavior
        // Tactical surrounding: calculate assigned radial slot around player
        const surroundRadius = personality === 'brute' ? 2.8 : 2.2;
        _scratchTargetPos.set(
          _scratchPPos.x + Math.sin(swarmAngleOffset) * surroundRadius,
          _scratchPPos.y,
          _scratchPPos.z + Math.cos(swarmAngleOffset) * surroundRadius
        );

        const distToSurround = pos.current.distanceTo(_scratchTargetPos);

        if (distToPlayer <= attackRange + 0.6) {
          // Face player directly during combat
          rotation.current = Math.atan2(_scratchPPos.x - pos.current.x, _scratchPPos.z - pos.current.z);

          if (attackTimer.current <= 0 && aiState !== 'ATTACK') {
            const hasToken = GroupCombatCoordinator.requestAttackToken(enemyData.room || 1, enemyData.id);
            if (hasToken) {
              attackTimer.current = enemyData.attackCooldown || (personality === 'scout' ? 1.2 : 1.7);
              setAiState('ATTACK');
              animController?.triggerAttack(personality);

              // Sound cue for weapon swing
              sound.playShadowSlash();

              // Delayed impact check (Windup -> Strike -> Impact window)
              const impactDelay = personality === 'scout' ? 220 : personality === 'brute' ? 420 : 310;
              setTimeout(() => {
                if (aiState !== 'DEAD') {
                  const pCur = globalPlayerState ? (globalPlayerState.pos || globalPlayerState.posVec || _scratchPPos) : _scratchPPos;
                  if (pos.current.distanceTo(pCur) <= attackRange + 1.2) {
                    sound.playHit(false);
                    onEnemyAttackPlayer(effectiveAttack);
                  }
                  GroupCombatCoordinator.releaseAttackToken(enemyData.room || 1, enemyData.id);
                  setAiState('CHASE');
                }
              }, impactDelay);
            }
          }
        } else {
          // Approach surround position
          moveTarget = _scratchTargetPos;
          targetSpeed = effectiveSpeed;
        }
      }

    } else {
      // -----------------------------------------------------------
      // PATROL / IDLE ROUTINE (REALISTIC INDEPENDENT MOVEMENT)
      // -----------------------------------------------------------
      const pRoutine = patrolRoutine.current;
      if (pRoutine.isPaused) {
        pRoutine.pauseTimer -= dt;
        if (pRoutine.pauseTimer <= 0) {
          pRoutine.isPaused = false;
          pRoutine.currentWaypointIndex = (pRoutine.currentWaypointIndex + 1) % pRoutine.waypoints.length;
        }
        setAiState('IDLE');
      } else {
        const wp = pRoutine.waypoints[pRoutine.currentWaypointIndex];
        const distToWp = pos.current.distanceTo(wp);

        if (distToWp < 0.8) {
          pRoutine.isPaused = true;
          pRoutine.pauseTimer = 2.0 + Math.random() * 3.5;
          setAiState('IDLE');
        } else {
          moveTarget = wp;
          targetSpeed = effectiveSpeed * 0.45; // Natural patrol walking pace
          setAiState('PATROL');
        }
      }
    }

    // -------------------------------------------------------------
    // PHYSICAL MOVEMENT & OBSTACLE AVOIDANCE STEERING
    // -------------------------------------------------------------
    if (moveTarget && targetSpeed > 0) {
      const result = updatePhysicalSteering(
        pos.current,
        moveTarget,
        velocity.current,
        rotation.current,
        targetSpeed,
        dt,
        enemyData.room || 1,
        []
      );
      rotation.current = result.yaw;
    } else {
      // Decelerate smoothly to complete stop
      velocity.current.lerp(new THREE.Vector3(0, 0, 0), Math.min(1.0, dt * 8.0));
      pos.current.x += velocity.current.x * dt;
      pos.current.z += velocity.current.z * dt;
    }

    // Apply transform to 3D mesh
    meshRef.current.position.copy(pos.current);
    meshRef.current.rotation.y = rotation.current;

    // Update procedural animation state machine
    const speedMagnitude = velocity.current.length();
    const isMoving = speedMagnitude > 0.08;
    animController?.update(dt, {
      isMoving,
      isDead: aiState === 'DEAD' || currentHp <= 0,
      isBoss: false,
      isRage: false,
      speed: speedMagnitude,
      dist: distToPlayer
    });

    // Dynamic Eye Glow Modulation based on AI state (Section 15 / Combat expressions)
    const eyeMat = nodes?.Materials?.eyeMat;
    if (eyeMat && eyeMat.emissiveIntensity !== undefined) {
      let targetIntensity = 2.4;
      if (aiState === 'DEAD' || currentHp <= 0) {
        targetIntensity = 0.0;
      } else if (aiState === 'ALERT') {
        targetIntensity = 4.6;
      } else if (aiState === 'CHASE') {
        targetIntensity = 5.2;
      } else if (aiState === 'ATTACK') {
        targetIntensity = 5.8;
      } else if (aiState === 'HIT') {
        targetIntensity = 1.0;
      } else if (aiState === 'STAGGER') {
        targetIntensity = 1.8;
      }
      eyeMat.emissiveIntensity = THREE.MathUtils.lerp(eyeMat.emissiveIntensity, targetIntensity, Math.min(1.0, dt * 7.5));
    }

    // Publish live position for soft auto-aim & accurate hit registration
    registerEnemyPosition(enemyData.id, [pos.current.x, pos.current.y, pos.current.z], currentHp, enemyData.maxHp, {
      role: enemyData.role,
      tier: enemyData.tier,
      name: enemyData.name
    });

    GroupCombatCoordinator.registerPosition(
      enemyData.id,
      pos.current,
      enemyData.room || 1,
      currentHp,
      enemyData.maxHp
    );

    // Billboard UI badges
    if (distToPlayer < 35) {
      if (hpBarRef.current) hpBarRef.current.quaternion.copy(state.camera.quaternion);
      if (finisherTagRef.current) finisherTagRef.current.quaternion.copy(state.camera.quaternion);
      if (targetLockRef.current) targetLockRef.current.quaternion.copy(state.camera.quaternion);
      if (alertBillboardRef.current) alertBillboardRef.current.quaternion.copy(state.camera.quaternion);
    }

    // Smoothly drain ghost HP towards real HP
    const currentHpRatio = Math.max(0, currentHp / enemyData.maxHp);
    if (ghostHp.current > currentHpRatio) {
      ghostHp.current = Math.max(currentHpRatio, ghostHp.current - dt * 0.65);
    } else {
      ghostHp.current = currentHpRatio;
    }
  });

  if (isDissolved) {
    return null;
  }

  const hpRatio = Math.max(0, currentHp / enemyData.maxHp);
  const scale = enemyData.scale || 1.0;
  const isElite = enemyData.tier === 'elite' || enemyData.isApex || personality === 'elite';
  const barWidth = isCommander ? 2.2 : isElite ? 1.7 : 1.2;

  const isAssassin = Boolean(
    enemyData.role === 'assassin' ||
    enemyData.id?.includes('assassin') ||
    enemyData.id?.includes('boneReaver') ||
    enemyData.id?.includes('darkBeast') ||
    enemyData.id?.includes('cryptHunter') ||
    enemyData.id?.includes('cryptReaper')
  );

  const lightingConfig = useMemo(() => {
    if (isGoblin) {
      return {
        rimColor: '#ca8a04',
        fillColor: '#fef3c7',
        rimIntensity: 1.4,
        fillIntensity: 0.9,
      };
    }
    if (isCommander) {
      return {
        rimColor: '#f97316',
        fillColor: '#fed7aa',
        rimIntensity: 2.2,
        fillIntensity: 1.2,
      };
    }
    if (isElite) {
      return {
        rimColor: '#2563eb',
        fillColor: '#e2e8f0',
        rimIntensity: 1.8,
        fillIntensity: 1.0,
      };
    }
    if (isAssassin) {
      return {
        rimColor: '#c084fc',
        fillColor: '#ede9fe',
        rimIntensity: 1.5,
        fillIntensity: 0.85,
      };
    }
    return {
      rimColor: '#38bdf8',
      fillColor: '#e0f2fe',
      rimIntensity: 1.4,
      fillIntensity: 0.8,
    };
  }, [isGoblin, isCommander, isElite, isAssassin]);

  const showHpBar =
    isLockedTarget ||
    isHit ||
    currentHp < enemyData.maxHp ||
    ['ALERT', 'CHASE', 'ATTACK', 'STAGGER', 'HIT', 'FLEE'].includes(aiState);

  return (
    <group ref={meshRef} position={enemyData.spawnPosition}>
      {/* ------------------------------------------------------------- */}
      {/* FLOATING UI: ALERT, TARGET LOCK, HP BAR, FINISHER PROMPT      */}
      {/* ------------------------------------------------------------- */}
      {aiState !== 'DEAD' && currentHp > 0 && (
        <>
          {/* ALERT EXCLAMATION MARK (!) BILLBOARD */}
          {showAlertMark && (
            <group ref={alertBillboardRef} position={[0, scale * 2.2, 0]}>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[0.35, 0.55]} />
                <meshBasicMaterial color="#f59e0b" transparent opacity={0.95} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[0.3, 0.5]} />
                <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}

          {/* TARGET LOCK RETICLE (TAB Auto/Manual Target Lock) */}
          {isLockedTarget && (
            <group ref={targetLockRef} position={[0, scale * (isCommander ? 3.3 : isElite ? 3.0 : 2.6), 0]}>
              <mesh>
                <ringGeometry args={[0.34, 0.42, 24]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.92} side={THREE.DoubleSide} />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 4]}>
                <ringGeometry args={[0.10, 0.16, 4]} />
                <meshBasicMaterial color="#f59e0b" transparent opacity={0.95} side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}

          {/* GOTHIC FLOATING HEALTH BAR & BADGES (Clean UI: only when engaged or damaged) */}
          {showHpBar && (
            <group ref={hpBarRef} position={[0, scale * (isCommander ? 2.6 : isElite ? 2.4 : 1.95), 0]}>
              {(isElite || isCommander) && (
                <group position={[0, 0.34, 0]}>
                  <mesh position={[0, 0, 0]}>
                    <planeGeometry args={[barWidth, 0.22]} />
                    <meshBasicMaterial color="#09090f" />
                  </mesh>
                  <mesh position={[0, 0, 0.01]}>
                    <planeGeometry args={[barWidth - 0.04, 0.18]} />
                    <meshBasicMaterial color={isCommander ? '#ea580c' : '#0284c7'} />
                  </mesh>
                </group>
              )}

              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[barWidth + 0.08, 0.2]} />
                <meshBasicMaterial color="#050508" />
              </mesh>
              <mesh position={[0, 0, 0.003]}>
                <planeGeometry args={[barWidth, 0.14]} />
                <meshBasicMaterial color="#18181b" />
              </mesh>
              <mesh position={[((ghostHp.current - 1) * barWidth) / 2, 0, 0.006]}>
                <planeGeometry args={[Math.max(0.001, barWidth * ghostHp.current), 0.13]} />
                <meshBasicMaterial color="#fef08a" />
              </mesh>
              <mesh position={[((hpRatio - 1) * barWidth) / 2, 0, 0.01]}>
                <planeGeometry args={[Math.max(0.001, barWidth * hpRatio), 0.13]} />
                <meshBasicMaterial color={isCommander ? '#ea580c' : isElite ? '#38bdf8' : '#ef4444'} />
              </mesh>
            </group>
          )}

          {/* [F] EXECUTION / FINISHER PROMPT BANNER */}
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
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* RENDER MODEL BY TYPE & LOCALIZED SHADOW AURA                  */}
      {/* ------------------------------------------------------------- */}
      <group scale={scale}>
        {/* Subtle Localized Ground Shadow (Section 20) */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[isGoblin ? 0.55 : 0.75, 24]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.65} />
        </mesh>

        {/* Subtle Dark Fantasy Rim Light (Behind Monster) */}
        <pointLight
          position={[0, 1.6, -1.2]}
          color={lightingConfig.rimColor}
          distance={5.0}
          intensity={lightingConfig.rimIntensity}
        />

        {/* Soft Front Fill Light (In Front of Monster - Prevents Black Silhouettes) */}
        <pointLight
          position={[0, 1.2, 1.4]}
          color={lightingConfig.fillColor}
          distance={4.5}
          intensity={lightingConfig.fillIntensity}
        />

        <primitive object={rootModel} />
      </group>
    </group>
  );
};

function deathTimerFinished(hp) {
  return hp <= 0;
}

export const Enemy = React.memo(EnemyComponent);

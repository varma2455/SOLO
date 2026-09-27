import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { globalPlayerState, triggerCameraShake } from '../player/Player';
import { sound } from '../../audio/soundManager';
import { safeVector3, DEFAULT_PLAYER_POSITION } from '../../utils/vector3';
import { registerEnemyPosition, unregisterEnemyPosition } from '../combat/EnemyPositionTracker';
import { buildAbyssWardenModel } from '../enemies/MonsterModelBuilder';
import { MonsterAnimationController } from '../enemies/MonsterAnimationController';

const _bossPPos = new THREE.Vector3();
const _bossDir = new THREE.Vector3();
const _smashTarget = new THREE.Vector3();
const _areaTarget = new THREE.Vector3();

export const AbyssWardenBoss = ({ playerPos, onBossAttackPlayer, onBossDefeated, onSpawnMinions }) => {
  const meshRef = useRef();
  const auraRef = useRef();
  const wispsRef = useRef();
  const smokeRef = useRef();

  const bossHp = useGameStore((s) => s.dungeon.bossHp);
  const bossMaxHp = useGameStore((s) => s.dungeon.bossMaxHp || 5000);
  const bossPhase = useGameStore((s) => s.dungeon.bossPhase);
  const bossRage = useGameStore((s) => s.dungeon.bossRage);
  const updateBossHp = useGameStore((s) => s.updateBossHp);
  const setDungeonState = useGameStore((s) => s.setDungeonState);

  // Boss AI States:
  // IDLE, PATROL, INTRO, CHASE, BASIC_SLASH, HEAVY_SMASH, SHADOW_PROJECTILE, AREA_ATTACK, PHASE2_COMBO, STAGGER, DEAD
  const [aiState, setAiState] = useState('IDLE');

  // Visual Telegraphs in 3D
  const [smashTelegraph, setSmashTelegraph] = useState({ active: false, pos: [0, 0, 0], angle: 0 });
  const [areaTelegraph, setAreaTelegraph] = useState({ active: false, pos: [0, 0, 0], radius: 8.5, progress: 0 });
  const [projWarning, setProjWarning] = useState({ active: false, targetPos: [0, 0, 0], chargeRatio: 0 });
  const [activeProjectiles, setActiveProjectiles] = useState([]);
  const [impactRing, setImpactRing] = useState({ active: false, pos: [0, 0, 0], radius: 0, opacity: 0 });
  const [swordTrailActive, setSwordTrailActive] = useState(false);
  const [isDissolving, setIsDissolving] = useState(false);
  const [dissolveProgress, setDissolveProgress] = useState(0);

  // Procedural anatomical 3D Abyss Warden titan model (~5.4m) & animation controller
  const { rootModel, nodes, animController } = useMemo(() => {
    const res = buildAbyssWardenModel();
    const anim = new MonsterAnimationController(res.nodes, 'boss');
    return { rootModel: res.root, nodes: res.nodes, animController: anim };
  }, []);

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

  // Boss position in Room 4 Hypostyle Arena
  const pos = useRef(new THREE.Vector3(0, 0, -140));
  const rotation = useRef(0);

  // Action Cooldown Timers
  const basicSlashCooldown = useRef(2.2);
  const heavySmashCooldown = useRef(6.0);
  const shadowProjCooldown = useRef(5.0);
  const areaAttackCooldown = useRef(9.0);
  const phase2ComboCooldown = useRef(11.0);
  const busyActionTimer = useRef(0); // If > 0, boss is locked in an attack windup/recovery

  const hasTriggeredIntro = useRef(false);
  const hasTriggeredPhase2 = useRef(false);
  const deathResolved = useRef(false);
  const prevHp = useRef(bossHp);

  const bossPatrolWaypoints = useRef(null);
  const bossPatrolIndex = useRef(0);
  const bossPatrolTimer = useRef(3.0);

  // Monitor Boss HP, Stagger Reactions & Phase Transitions
  useEffect(() => {
    if (bossHp < prevHp.current && bossHp > 0) {
      // Trigger stagger flinch if not currently executing heavy smash or area cataclysm
      if (aiState !== 'HEAVY_SMASH' && aiState !== 'AREA_ATTACK' && aiState !== 'DEAD') {
        animController?.triggerHit(0.24, 'normal');
      }
    }
    prevHp.current = bossHp;

    // Phase 2 at 40% HP (2000 HP / 5000)
    const hpRatio = bossHp / bossMaxHp;
    if (hpRatio <= 0.40 && !hasTriggeredPhase2.current && bossHp > 0) {
      hasTriggeredPhase2.current = true;
      sound.playBossRoar();
      triggerCameraShake(0.5, 0.6);
      animController?.triggerRoar(2.4);

      useGameStore.getState().addNotification(
        'PHASE II — ABYSS UNLEASHED',
        'The Sovereign of the Abyss awakens dormant cataclysmic fury!',
        'danger'
      );

      // Flash emissives immediately
      if (nodes && nodes.Materials) {
        if (nodes.Materials.sovereignEyeMat) nodes.Materials.sovereignEyeMat.emissiveIntensity = 6.5;
        if (nodes.Materials.veinCrackMat) nodes.Materials.veinCrackMat.emissiveIntensity = 4.2;
      }
    }

    // Death Trigger when HP reaches 0
    if (bossHp <= 0 && !deathResolved.current) {
      deathResolved.current = true;
      setAiState('DEAD');
      setIsDissolving(true);
      unregisterEnemyPosition('abyssWarden');

      // Stop attack states & clear active telegraphs
      setSmashTelegraph({ active: false, pos: [0, 0, 0], angle: 0 });
      setAreaTelegraph({ active: false, pos: [0, 0, 0], radius: 8.5, progress: 0 });
      setProjWarning({ active: false, targetPos: [0, 0, 0], chargeRatio: 0 });
      setSwordTrailActive(false);

      // 1. Play death collapse animation (greatsword drops, knees buckle, body collapses)
      animController?.triggerDeath();
      sound.playBossRoar();

      // 2. Play defeat sound & notification
      setTimeout(() => {
        sound.playLevelUp();
        useGameStore.getState().addNotification(
          'ABYSS WARDEN DEFEATED',
          'Level 1 Complete — Forgotten Crypt Purged!',
          'success'
        );
      }, 600);

      // 3. Complete death dissolve and trigger victory resolution after 2.2s
      setTimeout(() => {
        if (onBossDefeated) {
          onBossDefeated([pos.current.x, 0.5, pos.current.z]);
        }
      }, 2200);
    }
  }, [bossHp, bossMaxHp, aiState, onBossDefeated, animController, nodes]);

  // Clean up enemy tracker on unmount
  useEffect(() => {
    return () => {
      unregisterEnemyPosition('abyssWarden');
      useGameStore.setState((s) => ({
        dungeon: { ...s.dungeon, bossIntroActive: false }
      }));
    };
  }, []);

  // Frame Loop & AI State Machine
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.1);
    const t = state.clock.getElapsedTime();

    // -----------------------------------------------------------
    // DEATH DISSOLVE SEQUENCE (When HP <= 0)
    // -----------------------------------------------------------
    if (aiState === 'DEAD') {
      if (dissolveProgress < 1.0) {
        setDissolveProgress((prev) => Math.min(1.0, prev + dt * 0.45));
        // Sink fallen body into the floor shadow pool
        pos.current.y = -dissolveProgress * 0.8;
        meshRef.current.position.copy(pos.current);
      }
      animController?.update(dt, { isDead: true, isBoss: true, speed: 0 });
      return;
    }

    // Tick cooldowns
    if (basicSlashCooldown.current > 0) basicSlashCooldown.current -= dt;
    if (heavySmashCooldown.current > 0) heavySmashCooldown.current -= dt;
    if (shadowProjCooldown.current > 0) shadowProjCooldown.current -= dt;
    if (areaAttackCooldown.current > 0) areaAttackCooldown.current -= dt;
    if (phase2ComboCooldown.current > 0) phase2ComboCooldown.current -= dt;
    if (busyActionTimer.current > 0) busyActionTimer.current -= dt;

    // Update active projectiles flying across the arena
    if (activeProjectiles.length > 0) {
      setActiveProjectiles((prev) => {
        const nextList = [];
        for (const p of prev) {
          p.pos.addScaledVector(p.dir, p.speed * dt);
          p.life -= dt;

          // Check collision with player
          const pPlayer = globalPlayerState?.pos || _bossPPos;
          const distToPlayer = p.pos.distanceTo(pPlayer);

          if (distToPlayer <= 1.6) {
            // Hit player!
            sound.playVoidBurst();
            triggerCameraShake(0.2, 0.2);
            onBossAttackPlayer(p.damage);
            continue; // despawn on hit
          }

          if (p.life > 0 && Math.abs(p.pos.z) < 200 && Math.abs(p.pos.x) < 25) {
            nextList.push(p);
          }
        }
        return nextList;
      });
    }

    // Update impact shockwave ring expansion
    if (impactRing.active) {
      setImpactRing((prev) => {
        const nextRad = prev.radius + dt * 14.0;
        const nextOp = Math.max(0, prev.opacity - dt * 1.8);
        if (nextOp <= 0) return { active: false, pos: prev.pos, radius: 0, opacity: 0 };
        return { active: true, pos: prev.pos, radius: nextRad, opacity: nextOp };
      });
    }

    // Retrieve real-time player position
    if (globalPlayerState && (globalPlayerState.pos || globalPlayerState.posVec)) {
      _bossPPos.copy(globalPlayerState.pos || globalPlayerState.posVec);
    } else {
      const curP = safeVector3(playerPos, DEFAULT_PLAYER_POSITION, 'AbyssWardenBoss:playerPos');
      _bossPPos.set(curP[0], curP[1], curP[2]);
    }

    const distToPlayer = pos.current.distanceTo(_bossPPos);
    const isPhase2 = (bossHp / bossMaxHp) <= 0.40 || bossRage || bossPhase >= 2;

    // -----------------------------------------------------------
    // CINEMATIC INTRO TRIGGER (Sections 12 & 13)
    // -----------------------------------------------------------
    if (!hasTriggeredIntro.current && (distToPlayer <= 32 || _bossPPos.z <= -115)) {
      hasTriggeredIntro.current = true;
      setAiState('INTRO');

      _bossDir.subVectors(_bossPPos, pos.current).normalize();
      rotation.current = Math.atan2(_bossDir.x, _bossDir.z);

      animController?.triggerRoar(3.4);
      sound.playBossRoar();
      triggerCameraShake(0.4, 0.5);

      useGameStore.setState((s) => ({
        dungeon: {
          ...s.dungeon,
          bossActive: true,
          bossIntroActive: true
        }
      }));

      setTimeout(() => {
        useGameStore.setState((s) => ({
          dungeon: { ...s.dungeon, bossIntroActive: false }
        }));
        if (aiState !== 'DEAD') {
          setAiState('CHASE');
        }
      }, 3400);
      return;
    }

    if (aiState === 'INTRO') {
      meshRef.current.position.copy(pos.current);
      meshRef.current.rotation.y = rotation.current;
      animController?.update(dt, { isMoving: false, isBoss: true, speed: 0 });
      return;
    }

    // Movement speed: 3.8 m/s in Phase 1, 5.4 m/s in Phase 2
    const speed = isPhase2 ? 5.4 : 3.8;

    // -----------------------------------------------------------
    // ATTACK DECISION MACHINE (Priority Order)
    // -----------------------------------------------------------
    if (busyActionTimer.current <= 0 && aiState !== 'DEAD') {
      // 5. PHASE II NEW COMBO ATTACK: ABYSSAL ONSLAUGHT
      if (isPhase2 && phase2ComboCooldown.current <= 0 && distToPlayer <= 18) {
        phase2ComboCooldown.current = 10.0;
        busyActionTimer.current = 2.4;
        setAiState('PHASE2_COMBO');

        // Step 1: Swift Slash
        _bossDir.subVectors(_bossPPos, pos.current).normalize();
        rotation.current = Math.atan2(_bossDir.x, _bossDir.z);
        animController?.triggerAttack('flurry');
        setSwordTrailActive(true);
        sound.playSlash();

        setTimeout(() => {
          if (aiState === 'DEAD') return;
          const pCur = globalPlayerState ? (globalPlayerState.pos || _bossPPos) : _bossPPos;
          if (pos.current.distanceTo(pCur) <= 6.5) {
            sound.playHit(false);
            triggerCameraShake(0.18, 0.15);
            onBossAttackPlayer(55);
          }

          // Step 2: Shadow Step Forward + Heavy Smash Windup
          setTimeout(() => {
            if (aiState === 'DEAD') return;
            pos.current.addScaledVector(_bossDir, 3.2); // Swift gap close
            animController?.triggerHeavyAttack();
            setSmashTelegraph({
              active: true,
              pos: [pos.current.x, 0.04, pos.current.z],
              angle: rotation.current
            });

            setTimeout(() => {
              if (aiState === 'DEAD') return;
              setSmashTelegraph({ active: false, pos: [0, 0, 0], angle: 0 });
              setSwordTrailActive(false);
              sound.playVoidBurst();
              triggerCameraShake(0.38, 0.35);

              setImpactRing({
                active: true,
                pos: [pos.current.x + _bossDir.x * 3.5, 0.05, pos.current.z + _bossDir.z * 3.5],
                radius: 1.0,
                opacity: 0.85
              });

              const pImpact = globalPlayerState ? (globalPlayerState.pos || _bossPPos) : _bossPPos;
              const slamPoint = new THREE.Vector3(pos.current.x + _bossDir.x * 3.5, 0, pos.current.z + _bossDir.z * 3.5);
              if (pImpact.distanceTo(slamPoint) <= 5.8) {
                onBossAttackPlayer(100);
              }
              setAiState('CHASE');
            }, 850);
          }, 450);
        }, 320);
      }
      // 4. AREA ATTACK: ABYSSAL CATACLYSM (Circular danger zone, dmg 100)
      else if (areaAttackCooldown.current <= 0 && distToPlayer <= 22) {
        areaAttackCooldown.current = isPhase2 ? 8.0 : 11.5;
        busyActionTimer.current = 2.4;
        setAiState('AREA_ATTACK');

        animController?.triggerCast(1.8);
        sound.playBossRoar();

        const dangerCenter = [pos.current.x, 0.05, pos.current.z];
        setAreaTelegraph({ active: true, pos: dangerCenter, radius: 8.5, progress: 0 });

        // 1.8s telegraph time: Player has clear time to leave the area!
        setTimeout(() => {
          setAreaTelegraph({ active: false, pos: [0, 0, 0], radius: 8.5, progress: 0 });
          if (aiState !== 'DEAD') {
            sound.playVoidBurst();
            triggerCameraShake(0.45, 0.45);

            setImpactRing({
              active: true,
              pos: dangerCenter,
              radius: 2.0,
              opacity: 0.95
            });

            const pCur = globalPlayerState ? (globalPlayerState.pos || _bossPPos) : _bossPPos;
            _areaTarget.set(dangerCenter[0], 0, dangerCenter[2]);
            if (pCur.distanceTo(_areaTarget) <= 8.5) {
              onBossAttackPlayer(isPhase2 ? 125 : 100);
            }

            setTimeout(() => {
              if (aiState !== 'DEAD') setAiState('CHASE');
            }, 600);
          }
        }, 1800);
      }
      // 3. SHADOW PROJECTILE (Ranged dark projectile, dmg 60)
      else if (shadowProjCooldown.current <= 0 && distToPlayer >= 7.5 && distToPlayer <= 32) {
        shadowProjCooldown.current = isPhase2 ? 4.5 : 6.5;
        busyActionTimer.current = 1.3;
        setAiState('SHADOW_PROJECTILE');

        _bossDir.subVectors(_bossPPos, pos.current).normalize();
        rotation.current = Math.atan2(_bossDir.x, _bossDir.z);

        animController?.triggerCast(0.85);
        sound.playExtraction?.();

        setProjWarning({
          active: true,
          targetPos: [_bossPPos.x, 0.5, _bossPPos.z],
          chargeRatio: 1.0
        });

        // Launch after 0.85s visible charge warning
        setTimeout(() => {
          setProjWarning({ active: false, targetPos: [0, 0, 0], chargeRatio: 0 });
          if (aiState !== 'DEAD') {
            sound.playSlash();

            const spawnOrigin = pos.current.clone().add(new THREE.Vector3(-0.9, 3.2, 0.8));
            const baseDir = _bossDir.clone();

            const count = isPhase2 ? 3 : 1;
            const newProj = [];
            for (let i = 0; i < count; i++) {
              const spreadAngle = count === 1 ? 0 : (i - 1) * 0.22;
              const dir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);
              newProj.push({
                id: `proj_${Date.now()}_${i}`,
                pos: spawnOrigin.clone(),
                dir,
                speed: 18.0,
                life: 3.0,
                damage: isPhase2 ? 75 : 60
              });
            }
            setActiveProjectiles((prev) => [...prev, ...newProj]);

            setTimeout(() => {
              if (aiState !== 'DEAD') setAiState('CHASE');
            }, 450);
          }
        }, 850);
      }
      // 2. HEAVY SMASH (Overhead slam, red rectangular indicator, dmg 90, dodge with E)
      else if (heavySmashCooldown.current <= 0 && distToPlayer <= 10.5) {
        heavySmashCooldown.current = isPhase2 ? 5.5 : 8.0;
        busyActionTimer.current = 1.95;
        setAiState('HEAVY_SMASH');

        _bossDir.subVectors(_bossPPos, pos.current).normalize();
        rotation.current = Math.atan2(_bossDir.x, _bossDir.z);

        animController?.triggerHeavyAttack();
        sound.playBossRoar();

        setSmashTelegraph({
          active: true,
          pos: [pos.current.x, 0.04, pos.current.z],
          angle: rotation.current
        });

        // 1.25s telegraph window: Player has time to dodge with E (Phantom Dash)
        setTimeout(() => {
          setSmashTelegraph({ active: false, pos: [0, 0, 0], angle: 0 });
          if (aiState !== 'DEAD') {
            sound.playVoidBurst();
            triggerCameraShake(0.35, 0.35);

            const slamPos = [pos.current.x + _bossDir.x * 4.2, 0.05, pos.current.z + _bossDir.z * 4.2];
            setImpactRing({
              active: true,
              pos: slamPos,
              radius: 1.0,
              opacity: 0.9
            });

            const pCur = globalPlayerState ? (globalPlayerState.pos || _bossPPos) : _bossPPos;
            _smashTarget.set(slamPos[0], 0, slamPos[2]);
            if (pCur.distanceTo(_smashTarget) <= 5.5) {
              onBossAttackPlayer(isPhase2 ? 110 : 90);
            }

            setTimeout(() => {
              if (aiState !== 'DEAD') setAiState('CHASE');
            }, 700);
          }
        }, 1250);
      }
      // 1. BASIC SLASH (Horizontal cleave, telegraphed animation, dmg 45, short recovery)
      else if (distToPlayer <= 5.8) {
        if (basicSlashCooldown.current <= 0) {
          basicSlashCooldown.current = isPhase2 ? 1.5 : 2.2;
          busyActionTimer.current = 0.85;
          setAiState('BASIC_SLASH');

          _bossDir.subVectors(_bossPPos, pos.current).normalize();
          rotation.current = Math.atan2(_bossDir.x, _bossDir.z);

          animController?.triggerAttack('default');
          setSwordTrailActive(true);

          setTimeout(() => {
            if (aiState !== 'DEAD') {
              sound.playSlash();
              const pCur = globalPlayerState ? (globalPlayerState.pos || _bossPPos) : _bossPPos;
              const curDist = pos.current.distanceTo(pCur);

              if (curDist <= 6.2) {
                // Check cone collision in front of boss
                const toPlayer = new THREE.Vector3().subVectors(pCur, pos.current).normalize();
                const forward = new THREE.Vector3(Math.sin(rotation.current), 0, Math.cos(rotation.current));
                const dot = forward.dot(toPlayer);

                if (dot >= 0.35) { // ~70 degree frontal cone
                  sound.playHit(false);
                  triggerCameraShake(0.15, 0.15);
                  onBossAttackPlayer(isPhase2 ? 55 : 45);
                }
              }

              setTimeout(() => {
                setSwordTrailActive(false);
                if (aiState !== 'DEAD') setAiState('CHASE');
              }, 350);
            }
          }, 320);
        }
      }
      // CHASE OR PATROL
      else if (distToPlayer < 45) {
        setAiState('CHASE');
        _bossDir.subVectors(_bossPPos, pos.current).normalize();
        pos.current.addScaledVector(_bossDir, speed * dt);
        rotation.current = Math.atan2(_bossDir.x, _bossDir.z);
      } else {
        // Pacing patrol around throne arena when player is far away
        if (!bossPatrolWaypoints.current) {
          bossPatrolWaypoints.current = [
            new THREE.Vector3(0, 0, -142),
            new THREE.Vector3(-4.5, 0, -148),
            new THREE.Vector3(0, 0, -154),
            new THREE.Vector3(4.5, 0, -148)
          ];
          bossPatrolIndex.current = 0;
          bossPatrolTimer.current = 3.0;
        }
        bossPatrolTimer.current -= dt;
        if (bossPatrolTimer.current <= 0) {
          const wp = bossPatrolWaypoints.current[bossPatrolIndex.current];
          const distToWp = pos.current.distanceTo(wp);
          if (distToWp < 0.6) {
            bossPatrolIndex.current = (bossPatrolIndex.current + 1) % bossPatrolWaypoints.current.length;
            bossPatrolTimer.current = 3.5 + Math.random() * 2.0;
            setAiState('IDLE');
          } else {
            setAiState('PATROL');
            _bossDir.subVectors(wp, pos.current).normalize();
            pos.current.addScaledVector(_bossDir, 1.8 * dt);
            rotation.current = Math.atan2(_bossDir.x, _bossDir.z);
          }
        } else {
          setAiState('IDLE');
        }
      }
    }

    // Apply translation & heading
    meshRef.current.position.copy(pos.current);
    meshRef.current.rotation.y = rotation.current;

    // Update procedural animation machine
    const isMoving = (aiState === 'CHASE' || aiState === 'PATROL') && busyActionTimer.current <= 0;
    animController?.update(dt, {
      isMoving,
      isDead: false,
      isBoss: true,
      isRage: isPhase2,
      speed: isMoving ? (aiState === 'CHASE' ? speed : 1.8) : 0,
      dist: distToPlayer
    });

    // Register active coordinates for auto-aim and player skill detection
    registerEnemyPosition('abyssWarden', [pos.current.x, pos.current.y, pos.current.z], bossHp, bossMaxHp, {
      isBoss: true,
      name: 'Abyss Warden',
      role: 'boss',
      tier: 'boss'
    });

    // Dynamic emissive glow kinetics
    if (nodes && nodes.Materials) {
      const pulseSpeed = isPhase2 ? 6.0 : 2.8;
      const pulse = 1.0 + Math.sin(t * pulseSpeed) * 0.4;
      if (nodes.Materials.veinCrackMat) {
        nodes.Materials.veinCrackMat.emissiveIntensity = (isPhase2 ? 3.8 : 1.8) * pulse;
      }
      if (nodes.Materials.sovereignEyeMat) {
        nodes.Materials.sovereignEyeMat.emissiveIntensity = isPhase2 ? 6.5 : 3.5;
      }
      if (nodes.Materials.abyssCoreGlow) {
        nodes.Materials.abyssCoreGlow.emissiveIntensity = (isPhase2 ? 4.2 : 2.2) * pulse;
      }
      if (nodes.Materials.runeFullerMat) {
        nodes.Materials.runeFullerMat.emissiveIntensity = (isPhase2 ? 4.5 : 2.5) * pulse;
      }
    }

    // Orbiting wisps & rising smoke
    if (wispsRef.current) {
      wispsRef.current.rotation.y += dt * (isPhase2 ? 3.5 : 1.5);
    }
    if (smokeRef.current) {
      smokeRef.current.rotation.y -= dt * (isPhase2 ? 2.5 : 1.0);
    }
  });

  const isPhase2 = (bossHp / bossMaxHp) <= 0.40 || bossRage || bossPhase >= 2;

  return (
    <>
      {/* ========================================================= */}
      {/* 1. HEAVY SMASH TELEGRAPH (Red rectangular strike zone)    */}
      {/* ========================================================= */}
      {smashTelegraph.active && (
        <group position={smashTelegraph.pos} rotation={[0, smashTelegraph.angle, 0]}>
          <mesh position={[0, 0.05, 4.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4.5, 8.4]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.42} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.06, 4.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4.2, 4.5, 4]} />
            <meshBasicMaterial color="#dc2626" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.07, 8.4]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[2.2, 24]} />
            <meshBasicMaterial color="#b91c1c" transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* ========================================================= */}
      {/* 2. AREA ATTACK TELEGRAPH (Circular danger zone, r = 8.5m) */}
      {/* ========================================================= */}
      {areaTelegraph.active && (
        <group position={areaTelegraph.pos}>
          {/* Danger circle fill */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[8.5, 48]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.35} side={THREE.DoubleSide} />
          </mesh>
          {/* Outer Warning Border Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[8.25, 8.5, 48]} />
            <meshBasicMaterial color="#dc2626" side={THREE.DoubleSide} />
          </mesh>
          {/* Pulsing inner warning ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4.0, 4.3, 36]} />
            <meshBasicMaterial color="#f87171" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* ========================================================= */}
      {/* 3. SHADOW PROJECTILE CHARGE WARNING BEAM                   */}
      {/* ========================================================= */}
      {projWarning.active && (
        <group position={[pos.current.x, 0.1, pos.current.z]}>
          <mesh
            position={[
              (projWarning.targetPos[0] - pos.current.x) * 0.5,
              0.05,
              (projWarning.targetPos[2] - pos.current.z) * 0.5
            ]}
            rotation={[
              -Math.PI / 2,
              0,
              Math.atan2(projWarning.targetPos[0] - pos.current.x, projWarning.targetPos[2] - pos.current.z)
            ]}
          >
            <planeGeometry args={[0.3, 16.0]} />
            <meshBasicMaterial color="#a855f7" transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* ========================================================= */}
      {/* 4. ACTIVE 3D SHADOW PROJECTILES                           */}
      {/* ========================================================= */}
      {activeProjectiles.map((p) => (
        <group key={p.id} position={[p.pos.x, p.pos.y, p.pos.z]}>
          <mesh>
            <sphereGeometry args={[0.36, 16, 16]} />
            <meshStandardMaterial color="#c084fc" emissive="#9333ea" emissiveIntensity={5.0} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.55, 12, 12]} />
            <meshBasicMaterial color="#7e22ce" transparent opacity={0.45} />
          </mesh>
          <pointLight color="#a855f7" distance={8} intensity={4} />
        </group>
      ))}

      {/* ========================================================= */}
      {/* 5. IMPACT SHOCKWAVE RING ON FLOOR                         */}
      {/* ========================================================= */}
      {impactRing.active && (
        <mesh position={impactRing.pos} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[impactRing.radius * 0.88, impactRing.radius, 40]} />
          <meshBasicMaterial
            color={isPhase2 ? '#ef4444' : '#a855f7'}
            transparent
            opacity={impactRing.opacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* ========================================================= */}
      {/* 6. COLOSSAL 5.4m BOSS MODEL CONTAINER                     */}
      {/* ========================================================= */}
      <group ref={meshRef} position={[0, 0, -140]}>
        {/* Localized Floor Shadow */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.2, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.78 * (1.0 - dissolveProgress)} />
        </mesh>

        {/* Phase-Dependent Rim Energy Edge */}
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.0, 2.4, 32]} />
          <meshBasicMaterial
            color={isPhase2 ? '#ef4444' : '#a855f7'}
            transparent
            opacity={(isPhase2 ? 0.6 : 0.35) * (1.0 - dissolveProgress)}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Orbiting Shadow Wisps Ring (Mid-body) */}
        <group ref={wispsRef} position={[0, 2.6, 0]}>
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const angle = (idx * Math.PI * 2) / 6;
            const radius = 2.4;
            return (
              <mesh
                key={idx}
                position={[
                  Math.cos(angle) * radius,
                  Math.sin(idx * 1.5) * 0.6,
                  Math.sin(angle) * radius
                ]}
              >
                <sphereGeometry args={[0.15, 8, 8]} />
                <meshStandardMaterial
                  color={isPhase2 ? '#ef4444' : '#c084fc'}
                  emissive={isPhase2 ? '#dc2626' : '#9333ea'}
                  emissiveIntensity={3.0}
                  transparent
                  opacity={1.0 - dissolveProgress}
                />
              </mesh>
            );
          })}
        </group>

        {/* Orbiting Shadow Wisps Ring (Ground level) */}
        <group ref={smokeRef} position={[0, 1.2, 0]}>
          {[0, 1, 2, 3].map((idx) => {
            const angle = (idx * Math.PI * 2) / 4 + Math.PI / 4;
            const radius = 1.9;
            return (
              <mesh
                key={idx}
                position={[
                  Math.cos(angle) * radius,
                  Math.sin(idx * 2) * 0.4,
                  Math.sin(angle) * radius
                ]}
              >
                <octahedronGeometry args={[0.13]} />
                <meshStandardMaterial
                  color={isPhase2 ? '#f97316' : '#38bdf8'}
                  emissive={isPhase2 ? '#ea580c' : '#0284c7'}
                  emissiveIntensity={2.5}
                  transparent
                  opacity={1.0 - dissolveProgress}
                />
              </mesh>
            );
          })}
        </group>

        {/* Dynamic Sword Trail Arc during slashes */}
        {swordTrailActive && (
          <group position={[0.7, 3.2, 1.8]} rotation={[0.4, 0.6, -0.8]}>
            <mesh>
              <ringGeometry args={[1.8, 2.4, 16, 1, 0, Math.PI * 0.8]} />
              <meshBasicMaterial
                color={isPhase2 ? '#ef4444' : '#c084fc'}
                transparent
                opacity={0.65}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        )}

        {/* Dissolve Rising Shadow Smoke Particles on Death */}
        {isDissolving && (
          <group position={[0, 1.0, 0]}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <mesh
                key={i}
                position={[
                  Math.sin(i * 1.1) * (1.2 + dissolveProgress * 0.8),
                  dissolveProgress * 3.5 + (i * 0.2),
                  Math.cos(i * 1.1) * (1.2 + dissolveProgress * 0.8)
                ]}
              >
                <sphereGeometry args={[0.18 + dissolveProgress * 0.1, 8, 8]} />
                <meshStandardMaterial
                  color="#9333ea"
                  emissive="#7e22ce"
                  emissiveIntensity={3.0}
                  transparent
                  opacity={Math.max(0, 0.9 - dissolveProgress)}
                />
              </mesh>
            ))}
          </group>
        )}

        {/* Cinematic Rim Lighting */}
        <pointLight
          position={[0, 4.8, -2.6]}
          color={isPhase2 ? '#f43f5e' : '#a855f7'}
          distance={16}
          intensity={(isPhase2 ? 6.5 : 4.5) * (1.0 - dissolveProgress)}
        />
        <pointLight
          position={[0, 2.2, 2.6]}
          color={isPhase2 ? '#f97316' : '#38bdf8'}
          distance={10}
          intensity={(isPhase2 ? 4.0 : 2.5) * (1.0 - dissolveProgress)}
        />

        {/* 3D Anatomical Titan Model */}
        <primitive object={rootModel} />
      </group>
    </>
  );
};

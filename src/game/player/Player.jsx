// -------------------------------------------------------------
// SHADOW ASCENSION - PLAYER CONTROLLER & REALISTIC HUMAN CHARACTER (KAEL)
// Ultra-responsive movement, beginner-friendly combat, soft auto-aim,
// 3-hit combo system, direction-aware Phantom Dash on E, and camera controller.
// Decoupled architecture: InputManager -> PlayerController -> CameraController
// -------------------------------------------------------------

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { sound } from '../../audio/soundManager';
import { SKILLS } from '../../data/skills';
import { safeVector3, DEFAULT_PLAYER_POSITION } from '../../utils/vector3';
import { inputManager } from './InputManager';
import { KaelHumanoidModel } from './KaelHumanoidModel';
import { getNearestEnemyInCone, getEnemyPosition, getAllLivingEnemies } from '../combat/EnemyPositionTracker';

// High-performance shared player state for 60fps Three.js reading without React re-renders
export const globalPlayerState = {
  position: [DEFAULT_PLAYER_POSITION[0], DEFAULT_PLAYER_POSITION[1], DEFAULT_PLAYER_POSITION[2]],
  pos: new THREE.Vector3(DEFAULT_PLAYER_POSITION[0], DEFAULT_PLAYER_POSITION[1], DEFAULT_PLAYER_POSITION[2]),
  posVec: new THREE.Vector3(DEFAULT_PLAYER_POSITION[0], DEFAULT_PLAYER_POSITION[1], DEFAULT_PLAYER_POSITION[2]),
  rotation: 0,
  speed: 6.5
};

// Real-time telemetry metrics for HUD overlay without re-renders
export const livePlayerMetrics = {
  pos: [DEFAULT_PLAYER_POSITION[0], DEFAULT_PLAYER_POSITION[1], DEFAULT_PLAYER_POSITION[2]],
  vel: [0, 0, 0],
  speed: 0,
  camPos: [0, 3.2, 14.5],
  keys: { w: false, a: false, s: false, d: false, lmb: false, space: false },
  isMoving: false,
  isDashing: false,
  lockedTarget: null
};

export const Player = ({ onAttackHit, onSkillTrigger }) => {
  const groupRef = useRef();
  const kaelRef = useRef();
  const { camera } = useThree();

  // Store state hooks
  const speed = useGameStore((s) => s.player.speed);
  const playerHp = useGameStore((s) => s.player.hp);
  const isInvulnerable = useGameStore((s) => s.player.isInvulnerable);
  const roomsUnlocked = useGameStore((s) => s.dungeon.roomsUnlocked);
  const currentRoom = useGameStore((s) => s.dungeon.currentRoom);
  const advanceRoom = useGameStore((s) => s.advanceRoom);
  const rawPosition = useGameStore((s) => s.player.position);
  const initialPosition = useMemo(() => safeVector3(rawPosition, DEFAULT_PLAYER_POSITION, 'Player:initPos'), [rawPosition]);
  const gameFlowState = useGameStore((s) => s.gameFlowState);
  const currentScreen = useGameStore((s) => s.currentScreen);

  // Persistent camera targets
  const camTarget = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());

  // Player transform refs (Authoritative Three.js state)
  const playerPos = useRef(new THREE.Vector3(initialPosition[0], 1.0, initialPosition[2]));
  const playerVelocity = useRef(new THREE.Vector3());
  const targetVelocity = useRef(new THREE.Vector3());
  const playerRotation = useRef(0);
  const distanceMoved = useRef(0);

  // Attack animation state
  const attackAnim = useRef({
    isAttacking: false,
    combo: 1,
    progress: 0,
    activeSkill: null
  });

  // Dash state
  const dashState = useRef({
    isDashing: false,
    timer: 0,
    dir: new THREE.Vector3()
  });

  // Camera Shake Engine
  const cameraShake = useRef({
    intensity: 0,
    timer: 0
  });

  const triggerCameraShake = (intensity = 0.25, duration = 0.25) => {
    const store = useGameStore.getState();
    if (store.cameraSettings && store.cameraSettings.cameraShake === false) return;
    cameraShake.current.intensity = intensity;
    cameraShake.current.timer = duration;
  };

  // -------------------------------------------------------------
  // GLOBAL CONTROLLER HELPERS (For Automated & Interactive Testing)
  // -------------------------------------------------------------
  useEffect(() => {
    window.__setPlayerPosition = (x, y, z) => {
      const [sx, sy, sz] = safeVector3([x, y, z], DEFAULT_PLAYER_POSITION, '__setPlayerPosition');
      playerPos.current.set(sx, 1.0, sz);
      playerVelocity.current.set(0, 0, 0);
      targetVelocity.current.set(0, 0, 0);
      globalPlayerState.pos.set(sx, 1.0, sz);
      globalPlayerState.posVec.set(sx, 1.0, sz);
      globalPlayerState.position[0] = sx;
      globalPlayerState.position[1] = 1.0;
      globalPlayerState.position[2] = sz;
      if (typeof window !== 'undefined') {
        window.__playerPos = [sx, 1.0, sz];
      }
      if (groupRef.current) {
        groupRef.current.position.set(sx, 0, sz);
      }
    };

    window.__resetPlayer = () => {
      window.__setPlayerPosition(DEFAULT_PLAYER_POSITION[0], 1.0, DEFAULT_PLAYER_POSITION[2]);
    };

    window.__resetCamera = () => {
      inputManager.resetCamera();
    };

    window.__moveForward = (duration = 400) => {
      inputManager.pulseKey('forward', duration);
    };

    window.__moveBackward = (duration = 400) => {
      inputManager.pulseKey('backward', duration);
    };

    window.__moveLeft = (duration = 400) => {
      inputManager.pulseKey('left', duration);
    };

    window.__moveRight = (duration = 400) => {
      inputManager.pulseKey('right', duration);
    };
  }, []);

  // Synchronize player position on external teleport (e.g. battle arena transition or save reload)
  useEffect(() => {
    if (rawPosition) {
      const [sx, sy, sz] = safeVector3(rawPosition, DEFAULT_PLAYER_POSITION, 'Player:rawPosSync');
      const distSq = (playerPos.current.x - sx) ** 2 + (playerPos.current.z - sz) ** 2;
      if (distSq > 1.0) {
        playerPos.current.set(sx, 1.0, sz);
        playerVelocity.current.set(0, 0, 0);
        targetVelocity.current.set(0, 0, 0);
        globalPlayerState.pos.set(sx, 1.0, sz);
        globalPlayerState.posVec.set(sx, 1.0, sz);
        globalPlayerState.position[0] = sx;
        globalPlayerState.position[1] = 1.0;
        globalPlayerState.position[2] = sz;
        if (groupRef.current) {
          groupRef.current.position.set(sx, 0, sz);
        }
      }
    }
  }, [rawPosition]);

  // Universal Context Interact (F Key)
  const handleInteract = () => {
    const store = useGameStore.getState();
    // 1. Shadow Execution Finisher
    if (store.executableEnemyId) {
      store.triggerFinisher(store.executableEnemyId);
      kaelRef.current?.triggerUltimate();
      return;
    }
    // 2. Soul Extraction
    if (store.extractionTarget) {
      store.performExtraction();
      return;
    }
    // 3. Safe Point Shrine Activation
    if (store.safePointPrompt) {
      store.confirmSafePointSave();
      return;
    }
    // 4. Beginner Health Recovery Potion
    const healed = store.useHealthPotion();
    if (healed) {
      sound.playRuneAcquire?.();
    }
  };

  // Direction-Aware Dash (E Key / Space)
  const handleDash = () => {
    const store = useGameStore.getState();
    const currentFlow = store.gameFlowState;
    if (['MONSTER_DISCOVERED', 'ENCOUNTER_DECISION', 'PREPARING', 'BATTLE_LOADING', 'DEFEAT'].includes(currentFlow)) return;
    if (dashState.current.isDashing) return;

    if (!store.canUseSkill('phantomStep')) return;
    const success = store.triggerSkill('phantomStep');
    if (!success) return;

    dashState.current.isDashing = true;
    dashState.current.timer = 0.35;
    triggerCameraShake(0.14, 0.2);
    kaelRef.current?.triggerDash(0.35);

    // Direction-aware vector resolution from InputManager
    const keys = inputManager.keys;
    const moveX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const moveZ = (keys.backward ? 1 : 0) - (keys.forward ? 1 : 0);

    if (moveX !== 0 || moveZ !== 0) {
      const dashDir = new THREE.Vector3(moveX, 0, moveZ).normalize();
      dashDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), inputManager.mouse.yaw);
      dashState.current.dir.copy(dashDir);
      playerRotation.current = Math.atan2(dashDir.x, dashDir.z);
    } else {
      // Evasive back-hop if stationary
      const backHop = new THREE.Vector3(-Math.sin(playerRotation.current), 0, -Math.cos(playerRotation.current)).normalize();
      dashState.current.dir.copy(backHop);
    }
  };

  // Beginner-Friendly 3-Hit Combo Combat with Soft Auto-Aim
  const handleBasicAttack = () => {
    const store = useGameStore.getState();
    const currentFlow = store.gameFlowState;
    if (currentFlow !== 'BATTLE') return;
    if (attackAnim.current.isAttacking) return;

    // Advance combo (1 -> 2 -> 3)
    const nextCombo = (attackAnim.current.combo % 3) + 1;
    attackAnim.current.isAttacking = true;
    attackAnim.current.progress = 0;
    attackAnim.current.activeSkill = 'basic';
    attackAnim.current.combo = nextCombo;

    // Soft Auto-Aim: Check for nearest enemy in front of player
    const pPos = [playerPos.current.x, playerPos.current.y, playerPos.current.z];
    const autoTarget = getNearestEnemyInCone(pPos, playerRotation.current, 5.5, 80);
    if (autoTarget) {
      playerRotation.current = autoTarget.angleToTarget;
    } else if (store.lockedTargetId) {
      const lockedPos = getEnemyPosition(store.lockedTargetId);
      if (lockedPos) {
        playerRotation.current = Math.atan2(lockedPos[0] - pPos[0], lockedPos[2] - pPos[2]);
      }
    }

    sound.playSlash();
    triggerCameraShake(nextCombo === 3 ? 0.22 : 0.08, nextCombo === 3 ? 0.22 : 0.14);
    kaelRef.current?.triggerAttack(nextCombo);

    const multiplier = nextCombo === 1 ? 1.0 : (nextCombo === 2 ? 1.2 : 1.8);
    const range = nextCombo === 3 ? 4.2 : 3.6;

    setTimeout(() => {
      if (onAttackHit) {
        onAttackHit({
          type: 'basic',
          combo: nextCombo,
          position: [playerPos.current.x, playerPos.current.y, playerPos.current.z],
          angle: playerRotation.current,
          multiplier,
          range
        });
      }
    }, 110);

    setTimeout(() => {
      attackAnim.current.isAttacking = false;
    }, nextCombo === 3 ? 380 : 310);
  };

  // Skill Activator (Q = Shadow Slash, R = Eclipse Dominion)
  const handleSkillPress = (skillId) => {
    const currentFlow = useGameStore.getState().gameFlowState;
    if (currentFlow !== 'BATTLE') return;

    const store = useGameStore.getState();
    if (!store.canUseSkill(skillId)) return;

    const success = store.triggerSkill(skillId);
    if (!success) return;

    const skill = SKILLS[skillId];

    attackAnim.current.isAttacking = true;
    attackAnim.current.progress = 0;
    attackAnim.current.activeSkill = skillId;

    if (skillId === 'shadowSlash') {
      sound.playShadowSlash?.();
      triggerCameraShake(0.2, 0.25);
      kaelRef.current?.triggerSkill();
    } else if (skillId === 'eclipseDominion') {
      sound.playBossRoar?.();
      triggerCameraShake(0.45, 0.4);
      kaelRef.current?.triggerUltimate();
    }

    setTimeout(() => {
      if (onSkillTrigger) {
        onSkillTrigger({
          skillId,
          position: [playerPos.current.x, playerPos.current.y, playerPos.current.z],
          angle: playerRotation.current,
          range: skill.range || skill.radius || 5.5,
          multiplier: skill.damageMultiplier
        });
      }
    }, 150);

    setTimeout(() => {
      attackAnim.current.isAttacking = false;
    }, 450);
  };

  // Keyboard action trigger listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      const key = e.key?.toLowerCase();
      const code = e.code;
      const currentFlow = useGameStore.getState().gameFlowState;
      const curScreen = useGameStore.getState().currentScreen;

      if (curScreen !== 'game') return;
      const isLocked = ['MONSTER_DISCOVERED', 'ENCOUNTER_DECISION', 'PREPARING', 'BATTLE_LOADING', 'DEFEAT'].includes(currentFlow);
      if (isLocked) return;

      if (key === 'tab') {
        e.preventDefault();
        const store = useGameStore.getState();
        const living = getAllLivingEnemies();
        store.toggleTargetLock(living);
        sound.playRuneAcquire?.();
        return;
      }

      if (code === 'KeyQ' || key === 'q') {
        handleSkillPress('shadowSlash');
      } else if (code === 'KeyE' || key === 'e') {
        handleDash();
      } else if (code === 'KeyR' || key === 'r') {
        handleSkillPress('eclipseDominion');
      } else if (code === 'Space' || key === ' ') {
        if (!dashState.current.isDashing) handleDash();
      } else if (code === 'KeyF' || key === 'f') {
        handleInteract();
      }
    };

    const handleMouseDown = (e) => {
      const curScreen = useGameStore.getState().currentScreen;
      const currentFlow = useGameStore.getState().gameFlowState;
      if (curScreen !== 'game') return;

      // Pointer lock request on canvas click
      if (e.button === 0 && !document.pointerLockElement) {
        const canvasEl = document.querySelector('canvas');
        if (canvasEl && (e.target === canvasEl || canvasEl.contains(e.target))) {
          try {
            canvasEl.requestPointerLock?.();
          } catch (_) {}
        }
      }

      if (['MONSTER_DISCOVERED', 'ENCOUNTER_DECISION', 'PREPARING', 'BATTLE_LOADING', 'DEFEAT'].includes(currentFlow)) return;

      if (e.button === 0 && currentFlow === 'BATTLE') {
        handleBasicAttack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // -------------------------------------------------------------
  // MAIN FRAME LOOP: Physics, Player Movement, Camera Controller
  // -------------------------------------------------------------
  useFrame((state, delta) => {
    if (typeof window !== 'undefined') {
      window.__frameCount = (window.__frameCount || 0) + 1;
    }
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.1);

    // Out-of-combat health regeneration
    useGameStore.getState().regenerateOutOfCombat(dt);
    useGameStore.getState().regenTick(dt);

    const currentFlow = useGameStore.getState().gameFlowState;
    const isLocked = ['MONSTER_DISCOVERED', 'ENCOUNTER_DECISION', 'PREPARING', 'BATTLE_LOADING', 'DEFEAT'].includes(currentFlow);

    // -----------------------------------------------------------
    // 1. INPUT MANAGER & PLAYER CONTROLLER
    // -----------------------------------------------------------
    const keys = inputManager.keys;
    const forward = isLocked ? 0 : (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0);
    const right = isLocked ? 0 : (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const isMoving = !isLocked && (forward !== 0 || right !== 0);
    const moveSpeed = speed || 6.5;

    if (!isLocked && dashState.current.isDashing) {
      dashState.current.timer -= dt;
      const dashSpeed = moveSpeed * 3.4;
      playerPos.current.x += dashState.current.dir.x * dashSpeed * dt;
      playerPos.current.z += dashState.current.dir.z * dashSpeed * dt;
      if (dashState.current.timer <= 0) {
        dashState.current.isDashing = false;
      }
    } else if (isMoving) {
      // In Three.js: -Z is forward, +X is right
      const moveDir = new THREE.Vector3(right, 0, -forward).normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), inputManager.mouse.yaw);

      // Instant, responsive velocity acceleration
      targetVelocity.current.copy(moveDir).multiplyScalar(moveSpeed);
      playerVelocity.current.lerp(targetVelocity.current, 1 - Math.exp(-24 * dt));

      const stepDist = playerVelocity.current.length() * dt;
      playerPos.current.x += playerVelocity.current.x * dt;
      playerPos.current.z += playerVelocity.current.z * dt;
      distanceMoved.current += stepDist;

      // Surface-aware Footstep audio
      if (distanceMoved.current >= 1.8) {
        distanceMoved.current = 0;
        const inWater =
          (playerPos.current.z > -11 && playerPos.current.z < -6 && Math.abs(playerPos.current.x) < 3.5) ||
          (playerPos.current.z > -94 && playerPos.current.z < -86 && Math.abs(playerPos.current.x) < 4.5);
        sound.playFootstep(inWater ? 'water' : 'stone');
      }

      // Smooth rotate player facing movement direction
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      let diff = targetAngle - playerRotation.current;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      playerRotation.current += diff * 16 * dt;
    } else {
      // Smooth responsive deceleration to stop
      targetVelocity.current.set(0, 0, 0);
      playerVelocity.current.lerp(targetVelocity.current, 1 - Math.exp(-26 * dt));
      if (playerVelocity.current.lengthSq() > 0.0001) {
        playerPos.current.x += playerVelocity.current.x * dt;
        playerPos.current.z += playerVelocity.current.z * dt;
      }
    }

    // Outer boundary limits (generous, crash-free, no artificial gating)
    playerPos.current.x = Math.max(-20, Math.min(20, playerPos.current.x));
    playerPos.current.z = Math.max(-160, Math.min(27, playerPos.current.z));
    playerPos.current.y = 1.0;

    // Apply player position & rotation directly to Three.js Object3D ref
    groupRef.current.position.set(playerPos.current.x, 0, playerPos.current.z);
    groupRef.current.rotation.y = playerRotation.current;

    // Update global player state
    globalPlayerState.position[0] = playerPos.current.x;
    globalPlayerState.position[1] = 1.0;
    globalPlayerState.position[2] = playerPos.current.z;
    globalPlayerState.pos.set(playerPos.current.x, 1.0, playerPos.current.z);
    globalPlayerState.posVec.set(playerPos.current.x, 1.0, playerPos.current.z);
    globalPlayerState.rotation = playerRotation.current;
    if (typeof window !== 'undefined') {
      window.__playerPos = [playerPos.current.x, 1.0, playerPos.current.z];
    }

    // Real-time telemetry metrics for HUD overlay without re-renders
    livePlayerMetrics.pos[0] = playerPos.current.x;
    livePlayerMetrics.pos[1] = 1.0;
    livePlayerMetrics.pos[2] = playerPos.current.z;
    livePlayerMetrics.vel[0] = playerVelocity.current.x;
    livePlayerMetrics.vel[1] = playerVelocity.current.y;
    livePlayerMetrics.vel[2] = playerVelocity.current.z;
    livePlayerMetrics.speed = playerVelocity.current.length();
    livePlayerMetrics.camPos[0] = camera.position.x;
    livePlayerMetrics.camPos[1] = camera.position.y;
    livePlayerMetrics.camPos[2] = camera.position.z;
    livePlayerMetrics.keys.w = inputManager.keys.forward;
    livePlayerMetrics.keys.a = inputManager.keys.left;
    livePlayerMetrics.keys.s = inputManager.keys.backward;
    livePlayerMetrics.keys.d = inputManager.keys.right;
    livePlayerMetrics.keys.space = inputManager.keys.dash;
    livePlayerMetrics.keys.lmb = inputManager.mouse.isDragging || attackAnim.current.isAttacking;
    livePlayerMetrics.isMoving = isMoving;
    livePlayerMetrics.isDashing = dashState.current.isDashing;
    livePlayerMetrics.lockedTarget = useGameStore.getState().lockedTargetId;

    // Safe Point Shrines proximity in exploration mode
    if (currentFlow === 'EXPLORING') {
      const shrines = [
        { id: 'shrine_entrance', name: 'Entrance Shrine', pos: [4.6, 0, 23.5] },
        { id: 'shrine_chasm', name: 'Chasm Bridge Shrine', pos: [0, 0, -42] },
        { id: 'shrine_catacomb', name: 'Catacomb Safe Shrine', pos: [10.5, 0, -75] }
      ];
      for (const s of shrines) {
        const dx = playerPos.current.x - s.pos[0];
        const dz = playerPos.current.z - s.pos[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= 3.0) {
          const curPrompt = useGameStore.getState().safePointPrompt;
          if (!curPrompt || curPrompt.id !== s.id) {
            useGameStore.getState().promptSafePoint(s);
          }
          break;
        }
      }
    }

    // Room progression trigger
    if (playerPos.current.z >= 8) {
      if (currentRoom !== 1) advanceRoom(1);
    } else if (playerPos.current.z >= -26) {
      if (currentRoom !== 1) advanceRoom(1);
    } else if (playerPos.current.z >= -72) {
      if (currentRoom !== 2) advanceRoom(2);
    } else if (playerPos.current.z >= -108) {
      if (currentRoom !== 3) advanceRoom(3);
    } else {
      if (currentRoom !== 4) advanceRoom(4);
    }

    // -----------------------------------------------------------
    // 2. CAMERA CONTROLLER (Smooth Third-Person Follow)
    // -----------------------------------------------------------
    let shakeX = 0;
    let shakeY = 0;
    if (cameraShake.current.timer > 0) {
      cameraShake.current.timer -= dt;
      const intensity = cameraShake.current.intensity;
      shakeX = (Math.random() - 0.5) * intensity;
      shakeY = (Math.random() - 0.5) * intensity;
    }

    const camDist = dashState.current.isDashing ? 5.4 : 6.4;
    const camHeight = 2.6;
    const camYaw = inputManager.mouse.yaw;
    const camPitch = inputManager.mouse.pitch;

    const camX = playerPos.current.x + Math.sin(camYaw) * Math.cos(camPitch) * camDist + shakeX;
    const camY = playerPos.current.y + camHeight + Math.sin(camPitch) * camDist * 0.6 + shakeY;
    const camZ = playerPos.current.z + Math.cos(camYaw) * Math.cos(camPitch) * camDist;

    camTarget.current.set(camX, Math.max(0.6, camY), camZ);
    const damp = 1 - Math.exp(-20 * dt);
    camera.position.lerp(camTarget.current, damp);
    lookTarget.current.set(playerPos.current.x, playerPos.current.y + 1.2, playerPos.current.z);
    camera.lookAt(lookTarget.current);
  });

  return (
    <group ref={groupRef} position={[initialPosition[0], 0, initialPosition[2]]}>
      {/* High-fidelity original humanoid character model (Kael) */}
      <KaelHumanoidModel
        ref={kaelRef}
        speedRatio={livePlayerMetrics.isMoving ? 1.0 : 0}
        isMoving={livePlayerMetrics.isMoving}
        isDashing={dashState.current.isDashing}
        isInvulnerable={isInvulnerable}
        isDead={playerHp <= 0}
        swingTrailActive={attackAnim.current.isAttacking}
      />
    </group>
  );
};

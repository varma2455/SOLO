import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { sound } from '../../audio/soundManager';
import { SKILLS } from '../../data/skills';

// High-performance shared player state for 60fps Three.js reading without React re-renders
export const globalPlayerState = {
  position: [0, 0.5, 20],
  posVec: new THREE.Vector3(0, 0.5, 20),
  rotation: 0,
  speed: 6.5
};

// Stylized Crafted Dark Fantasy Shadow Blade
const ShadowBlade = ({ bladeRef, swingTrailActive }) => {
  return (
    <group ref={bladeRef} position={[0, -0.38, 0.18]}>
      {/* Octagonal Steel Pommel */}
      <mesh position={[0, -0.22, 0]}>
        <octahedronGeometry args={[0.045]} />
        <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* Leather Wrapped Grip Handle */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.026, 0.03, 0.22, 8]} />
        <meshStandardMaterial color="#1f1815" roughness={0.9} />
      </mesh>
      {/* Winged Iron Crossguard */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.26, 0.04, 0.07]} />
        <meshStandardMaterial color="#1e1b4b" metalness={0.8} roughness={0.35} />
      </mesh>
      {/* Double-Edged Runic Blade */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.065, 0.76, 0.018]} />
        <meshStandardMaterial color="#334155" metalness={0.92} roughness={0.25} />
      </mesh>
      {/* Glowing Edge Runes */}
      <mesh position={[0, 0.42, 0.012]}>
        <boxGeometry args={[0.02, 0.65, 0.005]} />
        <meshBasicMaterial color="#c084fc" />
      </mesh>

      {/* Dynamic Attack Arc Trail Ribbon */}
      {swingTrailActive && (
        <mesh position={[0.2, 0.45, -0.1]} rotation={[0, -0.4, 0]}>
          <planeGeometry args={[0.6, 0.7]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

export const Player = ({ onAttackHit, onSkillTrigger }) => {
  const groupRef = useRef();
  const bodyRef = useRef();
  const leftBladeRef = useRef();
  const rightBladeRef = useRef();
  const cloakLeftRef = useRef();
  const cloakRightRef = useRef();
  const auraRef = useRef();

  const { camera } = useThree();

  // Store state - decoupled from frequent player state changes
  const speed = useGameStore((s) => s.player.speed);
  const isInvulnerable = useGameStore((s) => s.player.isInvulnerable);
  const roomsUnlocked = useGameStore((s) => s.dungeon.roomsUnlocked);
  const currentRoom = useGameStore((s) => s.dungeon.currentRoom);
  const advanceRoom = useGameStore((s) => s.advanceRoom);

  // Persistent camera targets to avoid allocating vectors each frame
  const camTarget = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());

  // Local movement & animation states
  const [keys, setKeys] = useState({
    w: false,
    s: false,
    a: false,
    d: false,
    space: false,
    shift: false
  });

  const mouseRef = useRef({ yaw: 0, pitch: 0.35, isDragging: false });
  const playerPos = useRef(new THREE.Vector3(0, 0, 20));
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
    cameraShake.current.intensity = intensity;
    cameraShake.current.timer = duration;
  };

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', ' ', 'shift'].includes(key)) {
        setKeys((prev) => ({
          ...prev,
          [key === ' ' ? 'space' : key]: true
        }));
      }

      // Action hotkeys
      if (key === 'q') {
        handleSkillPress('shadowSlash');
      } else if (key === 'e') {
        handleSkillPress('voidBurst');
      } else if (key === 'r') {
        handleSkillPress('eclipseDominion');
      } else if (key === ' ' && !dashState.current.isDashing) {
        handleSkillPress('phantomStep');
      } else if (key === 'f') {
        const store = useGameStore.getState();
        if (store.executableEnemyId) {
          store.triggerFinisher(store.executableEnemyId);
        } else if (store.extractionTarget) {
          store.performExtraction();
        }
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', ' ', 'shift'].includes(key)) {
        setKeys((prev) => ({
          ...prev,
          [key === ' ' ? 'space' : key]: false
        }));
      }
    };

    const handleMouseDown = (e) => {
      if (e.button === 0) {
        handleBasicAttack();
      }
      mouseRef.current.isDragging = true;
    };

    const handleMouseUp = () => {
      mouseRef.current.isDragging = false;
    };

    let lastX = 0;
    let lastY = 0;
    const handleMouseMove = (e) => {
      let dx = e.movementX;
      let dy = e.movementY;
      if (dx === undefined || (dx === 0 && dy === 0 && mouseRef.current.isDragging)) {
        dx = lastX ? e.clientX - lastX : 0;
        dy = lastY ? e.clientY - lastY : 0;
      }
      lastX = e.clientX;
      lastY = e.clientY;

      const sens = 0.0035;
      mouseRef.current.yaw -= dx * sens;
      mouseRef.current.pitch = Math.max(0.1, Math.min(1.2, mouseRef.current.pitch + dy * sens));
    };

    const handleContextMenu = (e) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const handleBasicAttack = () => {
    if (attackAnim.current.isAttacking) return;

    sound.playSlash();
    triggerCameraShake(0.08, 0.15);
    attackAnim.current.isAttacking = true;
    attackAnim.current.progress = 0;
    attackAnim.current.activeSkill = 'basic';
    attackAnim.current.combo = (attackAnim.current.combo % 3) + 1;

    setTimeout(() => {
      if (onAttackHit) {
        onAttackHit({
          type: 'basic',
          combo: attackAnim.current.combo,
          position: [playerPos.current.x, playerPos.current.y, playerPos.current.z],
          angle: playerRotation.current,
          multiplier: 1.0 + (attackAnim.current.combo - 1) * 0.25,
          range: 3.4
        });
      }
    }, 110);

    setTimeout(() => {
      attackAnim.current.isAttacking = false;
    }, 310);
  };

  const handleSkillPress = (skillId) => {
    const store = useGameStore.getState();
    if (!store.canUseSkill(skillId)) return;

    const success = store.triggerSkill(skillId);
    if (!success) return;

    const skill = SKILLS[skillId];

    if (skillId === 'phantomStep') {
      dashState.current.isDashing = true;
      dashState.current.timer = 0.35;
      triggerCameraShake(0.12, 0.2);
      const forward = new THREE.Vector3(Math.sin(playerRotation.current), 0, Math.cos(playerRotation.current)).normalize();
      dashState.current.dir.copy(forward);
    } else {
      attackAnim.current.isAttacking = true;
      attackAnim.current.progress = 0;
      attackAnim.current.activeSkill = skillId;

      triggerCameraShake(skillId === 'eclipseDominion' ? 0.45 : 0.2, 0.35);

      setTimeout(() => {
        if (onSkillTrigger) {
          onSkillTrigger({
            skillId,
            position: [playerPos.current.x, playerPos.current.y, playerPos.current.z],
            angle: playerRotation.current,
            range: skill.range || skill.radius || 5.0,
            multiplier: skill.damageMultiplier
          });
        }
      }, 150);

      setTimeout(() => {
        attackAnim.current.isAttacking = false;
      }, 450);
    }
  };

  // Main frame loop: physics, camera follow, footstep triggers, animations
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.1);
    const t = state.clock.getElapsedTime();

    useGameStore.getState().regenTick(dt);

    // Movement calculation
    const moveX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    const moveZ = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
    const isMoving = moveX !== 0 || moveZ !== 0;
    const speed = player.speed || 6.5;

    if (dashState.current.isDashing) {
      dashState.current.timer -= dt;
      const dashSpeed = speed * 3.4;
      playerPos.current.x += dashState.current.dir.x * dashSpeed * dt;
      playerPos.current.z += dashState.current.dir.z * dashSpeed * dt;
      if (dashState.current.timer <= 0) {
        dashState.current.isDashing = false;
      }
    } else if (isMoving) {
      const moveDir = new THREE.Vector3(moveX, 0, moveZ).normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), mouseRef.current.yaw);

      const stepDist = speed * dt;
      playerPos.current.x += moveDir.x * stepDist;
      playerPos.current.z += moveDir.z * stepDist;
      distanceMoved.current += stepDist;

      // Surface-aware Footstep audio
      if (distanceMoved.current >= 1.9) {
        distanceMoved.current = 0;
        // Check if standing in water puddles (Z near -8, -19, -90)
        const inWater =
          (playerPos.current.z > -11 && playerPos.current.z < -6 && Math.abs(playerPos.current.x) < 3.5) ||
          (playerPos.current.z > -94 && playerPos.current.z < -86 && Math.abs(playerPos.current.x) < 4.5);
        sound.playFootstep(inWater ? 'water' : 'stone');
      }

      // Smooth rotate player towards movement direction
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      let diff = targetAngle - playerRotation.current;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      playerRotation.current += diff * 14 * dt;
    }

    // Dungeon room boundaries & gates collision
    // Gate 1 check at Z = -25.5
    if (!roomsUnlocked[1] && playerPos.current.z < -24.5) {
      playerPos.current.z = -24.5;
    }
    // Gate 2 check at Z = -71.5
    if (!roomsUnlocked[2] && playerPos.current.z < -70.5) {
      playerPos.current.z = -70.5;
    }
    // Gate 3 check at Z = -107.5
    if (!roomsUnlocked[3] && playerPos.current.z < -106.5) {
      playerPos.current.z = -106.5;
    }

    // Outer boundary limits
    if (playerPos.current.z > 27) playerPos.current.z = 27;
    if (playerPos.current.z < -160) playerPos.current.z = -160;

    // Room X limits based on layout Z
    if (playerPos.current.z >= 8) {
      // Entrance Corridor
      playerPos.current.x = Math.max(-6, Math.min(6, playerPos.current.x));
    } else if (playerPos.current.z >= -26) {
      // Room 1: Crypt
      playerPos.current.x = Math.max(-12.5, Math.min(12.5, playerPos.current.x));
      if (currentRoom !== 1) advanceRoom(1);
    } else if (playerPos.current.z >= -40) {
      // Chasm Stone Bridge
      playerPos.current.x = Math.max(-3.0, Math.min(3.0, playerPos.current.x));
    } else if (playerPos.current.z >= -72) {
      // Room 2: Elite Sanctum
      playerPos.current.x = Math.max(-11.5, Math.min(11.5, playerPos.current.x));
      if (currentRoom !== 2) advanceRoom(2);
    } else if (playerPos.current.z >= -108) {
      // Room 3: Flooded Catacombs
      playerPos.current.x = Math.max(-13.5, Math.min(13.5, playerPos.current.x));
      if (currentRoom !== 3) advanceRoom(3);
    } else {
      // Boss Room circular boundary (radius 25 around [0, 0, -136])
      const bossDist = Math.sqrt(playerPos.current.x * playerPos.current.x + Math.pow(playerPos.current.z - (-136), 2));
      if (bossDist > 25) {
        const factor = 25 / bossDist;
        playerPos.current.x *= factor;
        playerPos.current.z = -136 + (playerPos.current.z - (-136)) * factor;
      }
      if (currentRoom !== 4) advanceRoom(4);
    }

    // Apply player position & rotation
    groupRef.current.position.set(playerPos.current.x, 0, playerPos.current.z);
    groupRef.current.rotation.y = playerRotation.current;

    // Update high-performance global player position without React re-renders
    globalPlayerState.position[0] = playerPos.current.x;
    globalPlayerState.position[1] = 0.5;
    globalPlayerState.position[2] = playerPos.current.z;
    globalPlayerState.posVec.set(playerPos.current.x, 0.5, playerPos.current.z);
    globalPlayerState.rotation = playerRotation.current;

    // Body animations
    if (bodyRef.current) {
      if (dashState.current.isDashing) {
        bodyRef.current.position.y = 0.65;
        bodyRef.current.rotation.x = 0.5;
      } else if (isMoving) {
        bodyRef.current.position.y = 0.95 + Math.abs(Math.sin(t * 12)) * 0.12;
        bodyRef.current.rotation.x = 0.18;
        bodyRef.current.rotation.z = Math.sin(t * 12) * 0.08;
      } else {
        bodyRef.current.position.y = 0.95 + Math.sin(t * 2.5) * 0.03;
        bodyRef.current.rotation.x = 0;
        bodyRef.current.rotation.z = 0;
      }
    }

    // Dual tail cloak flutter
    if (cloakLeftRef.current && cloakRightRef.current) {
      const cloakWave = isMoving ? Math.sin(t * 14) * 0.18 + 0.45 : Math.sin(t * 3) * 0.06 + 0.15;
      cloakLeftRef.current.rotation.x = cloakWave;
      cloakRightRef.current.rotation.x = cloakWave * 1.05;
    }

    // Dual Blade Combat swings
    if (attackAnim.current.isAttacking) {
      attackAnim.current.progress += dt * 5.5;
      const prog = Math.min(1, attackAnim.current.progress);
      const swingAngle = Math.sin(prog * Math.PI) * 1.9;

      if (attackAnim.current.combo === 1) {
        if (rightBladeRef.current) rightBladeRef.current.rotation.set(-swingAngle, 0, -swingAngle * 0.8);
        if (leftBladeRef.current) leftBladeRef.current.rotation.set(0.2, 0, 0.2);
      } else if (attackAnim.current.combo === 2) {
        if (leftBladeRef.current) leftBladeRef.current.rotation.set(-swingAngle, 0, swingAngle * 0.8);
        if (rightBladeRef.current) rightBladeRef.current.rotation.set(0.2, 0, -0.2);
      } else {
        if (rightBladeRef.current) rightBladeRef.current.rotation.set(-swingAngle * 1.2, 0, -swingAngle);
        if (leftBladeRef.current) leftBladeRef.current.rotation.set(-swingAngle * 1.2, 0, swingAngle);
      }
    } else {
      if (rightBladeRef.current) rightBladeRef.current.rotation.set(0.3 + Math.sin(t * 2) * 0.05, 0, -0.2);
      if (leftBladeRef.current) leftBladeRef.current.rotation.set(0.3 - Math.sin(t * 2) * 0.05, 0, 0.2);
    }

    // Aura pulsation
    if (auraRef.current) {
      auraRef.current.material.opacity = isInvulnerable ? 0.85 : 0.25 + Math.sin(t * 5) * 0.12;
      auraRef.current.scale.setScalar(isInvulnerable ? 1.4 : 1.0 + Math.sin(t * 4) * 0.08);
    }

    // Advanced Action RPG Camera with Shake and Dampened Spring Lerp
    let shakeX = 0;
    let shakeY = 0;
    if (cameraShake.current.timer > 0) {
      cameraShake.current.timer -= dt;
      const intensity = cameraShake.current.intensity;
      shakeX = (Math.random() - 0.5) * intensity;
      shakeY = (Math.random() - 0.5) * intensity;
    }

    const camDist = dashState.current.isDashing ? 5.2 : 6.4;
    const camHeight = 2.4;
    const camYaw = mouseRef.current.yaw;
    const camPitch = mouseRef.current.pitch;

    const camX = playerPos.current.x + Math.sin(camYaw) * Math.cos(camPitch) * camDist + shakeX;
    const camY = playerPos.current.y + camHeight + Math.sin(camPitch) * camDist * 0.65 + shakeY;
    const camZ = playerPos.current.z + Math.cos(camYaw) * Math.cos(camPitch) * camDist;

    camTarget.current.set(camX, camY, camZ);
    const damp = 1 - Math.exp(-14 * dt);
    camera.position.lerp(camTarget.current, damp);
    lookTarget.current.set(playerPos.current.x, playerPos.current.y + 1.4, playerPos.current.z);
    camera.lookAt(lookTarget.current);
  });

  return (
    <group ref={groupRef} position={[0, 0, 20]}>
      {/* Ground Shadow Ring */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.75, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.65} />
      </mesh>

      {/* Shadow Aura Mesh */}
      <mesh ref={auraRef} position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.95, 16, 16]} />
        <meshBasicMaterial
          color={isInvulnerable ? '#38bdf8' : '#9333ea'}
          transparent
          opacity={0.25}
          wireframe
        />
      </mesh>

      {/* Stylized Humanoid Kael Body */}
      <group ref={bodyRef} position={[0, 0.95, 0]}>
        {/* Head */}
        <mesh position={[0, 0.68, 0]}>
          <boxGeometry args={[0.32, 0.35, 0.32]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.7} />
        </mesh>
        {/* Anime Spiked Hair Tufts */}
        <group position={[0, 0.82, -0.02]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.36, 0.22, 0.36]} />
            <meshStandardMaterial color="#09090b" roughness={0.4} />
          </mesh>
          <mesh position={[0.1, 0.12, 0.08]} rotation={[0.2, 0.3, -0.4]}>
            <coneGeometry args={[0.07, 0.24, 4]} />
            <meshStandardMaterial color="#09090b" />
          </mesh>
          <mesh position={[-0.1, 0.12, 0.08]} rotation={[0.2, -0.3, 0.4]}>
            <coneGeometry args={[0.07, 0.24, 4]} />
            <meshStandardMaterial color="#09090b" />
          </mesh>
          <mesh position={[0, 0.14, -0.1]} rotation={[-0.3, 0, 0]}>
            <coneGeometry args={[0.08, 0.26, 4]} />
            <meshStandardMaterial color="#09090b" />
          </mesh>
        </group>

        {/* Luminous Purple Hunter Eyes */}
        <mesh position={[0, 0.7, 0.17]}>
          <boxGeometry args={[0.24, 0.06, 0.03]} />
          <meshBasicMaterial color="#c084fc" />
        </mesh>

        {/* Armored Trenchcoat Torso */}
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.56, 0.72, 0.38]} />
          <meshStandardMaterial color="#0f172a" metalness={0.25} roughness={0.7} />
        </mesh>

        {/* Demonic Shoulder Pauldrons */}
        <mesh position={[0.35, 0.48, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.22, 0.12, 0.34]} />
          <meshStandardMaterial color="#1e1b4b" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[-0.35, 0.48, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.22, 0.12, 0.34]} />
          <meshStandardMaterial color="#1e1b4b" metalness={0.8} roughness={0.35} />
        </mesh>

        {/* Ascension Core Chest Medallion */}
        <mesh position={[0, 0.28, 0.2]}>
          <octahedronGeometry args={[0.09]} />
          <meshBasicMaterial color="#d946ef" />
        </mesh>

        {/* Animated Dual-Tail Dark Cloak */}
        <mesh ref={cloakLeftRef} position={[-0.14, 0.12, -0.22]} rotation={[0.2, 0.08, 0]}>
          <planeGeometry args={[0.28, 1.15]} />
          <meshStandardMaterial color="#030712" side={THREE.DoubleSide} roughness={0.85} />
        </mesh>
        <mesh ref={cloakRightRef} position={[0.14, 0.12, -0.22]} rotation={[0.2, -0.08, 0]}>
          <planeGeometry args={[0.28, 1.15]} />
          <meshStandardMaterial color="#030712" side={THREE.DoubleSide} roughness={0.85} />
        </mesh>

        {/* Right Arm & Crafted Blade */}
        <group position={[0.38, 0.32, 0]}>
          <mesh position={[0, -0.18, 0]}>
            <boxGeometry args={[0.16, 0.42, 0.16]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <ShadowBlade bladeRef={rightBladeRef} swingTrailActive={attackAnim.current.isAttacking} />
        </group>

        {/* Left Arm & Crafted Blade */}
        <group position={[-0.38, 0.32, 0]}>
          <mesh position={[0, -0.18, 0]}>
            <boxGeometry args={[0.16, 0.42, 0.16]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <ShadowBlade bladeRef={leftBladeRef} swingTrailActive={attackAnim.current.isAttacking} />
        </group>

        {/* Segmented Boots & Greaves */}
        <mesh position={[-0.16, -0.56, 0]}>
          <boxGeometry args={[0.18, 0.72, 0.22]} />
          <meshStandardMaterial color="#09090b" roughness={0.8} />
        </mesh>
        <mesh position={[0.16, -0.56, 0]}>
          <boxGeometry args={[0.18, 0.72, 0.22]} />
          <meshStandardMaterial color="#09090b" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
};

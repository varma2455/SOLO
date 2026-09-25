// -------------------------------------------------------------
// SHADOW ASCENSION - KAEL HUMANOID 3D MODEL & ANIMATION RENDERER
// Integrates the high-poly humanoid hunter character with the
// procedural skeletal animation state machine and dynamic weapon VFX.
// -------------------------------------------------------------

import React, { useMemo, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildKaelCharacterModel } from './KaelModelBuilder';
import { KaelAnimationController } from './KaelAnimationController';

export const KaelHumanoidModel = forwardRef(({
  speedRatio = 0,
  isMoving = false,
  isDashing = false,
  isInvulnerable = false,
  isDead = false,
  swingTrailActive = false
}, ref) => {
  const modelData = useMemo(() => buildKaelCharacterModel(), []);
  const animController = useMemo(() => new KaelAnimationController(modelData.nodes), [modelData]);
  const trailRef = useRef();
  const auraRef = useRef();

  // Expose imperative triggers to Player controller
  useImperativeHandle(ref, () => ({
    triggerAttack: (comboIndex) => animController.triggerAttack(comboIndex),
    triggerSkill: () => animController.triggerSkill(),
    triggerUltimate: () => animController.triggerUltimate(),
    triggerDash: (duration) => animController.triggerDash(duration),
    triggerHit: (duration) => animController.triggerHit(duration)
  }), [animController]);

  // Frame update loop
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = state.clock.getElapsedTime();

    // Update skeletal bone transforms
    animController.update(dt, speedRatio, isMoving, isDead);

    // Dynamic sword swing ribbon trail
    if (trailRef.current) {
      if (swingTrailActive) {
        trailRef.current.visible = true;
        trailRef.current.material.opacity = Math.max(0.2, 0.85 + Math.sin(t * 30) * 0.15);
        trailRef.current.rotation.y += dt * 4;
      } else {
        trailRef.current.visible = false;
      }
    }

    // Shadow Aura pulsing
    if (auraRef.current) {
      auraRef.current.rotation.y += dt * 1.5;
      auraRef.current.material.opacity = isInvulnerable ? 0.45 : (isDashing ? 0.35 : 0.08 + Math.sin(t * 4) * 0.04);
      auraRef.current.scale.setScalar(isDashing ? 1.25 : (isInvulnerable ? 1.35 : 1.05 + Math.sin(t * 3) * 0.05));
    }
  });

  return (
    <group name="Kael_Humanoid_Container">
      {/* High-Visibility Ground Contact Shadow & Cyan Hunter Beacon */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.8, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.65} />
      </mesh>

      {/* Glowing Player Beacon Floor Ring (Unmistakable in Dark Dungeons) */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.72, 0.86, 36]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.88} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 36]} />
        <meshBasicMaterial color="#0369a1" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Bright Character Key/Fill Light (Ensures Face, Armor & Skin POP against dark stone) */}
      <pointLight
        position={[0, 2.2, 1.8]}
        color="#ffffff"
        intensity={2.2}
        distance={6.5}
        decay={1.5}
      />

      {/* Vibrant Purple/Indigo Rim Light (Sharp Silhouette Edge) */}
      <pointLight
        position={[0, 2.4, -1.8]}
        color="#a78bfa"
        intensity={2.4}
        distance={6.0}
        decay={1.5}
      />

      {/* Top Fill Light */}
      <pointLight
        position={[0, 3.2, 0.4]}
        color="#f8fafc"
        intensity={1.6}
        distance={5.0}
        decay={1.5}
      />

      {/* Shadow Conduit Aura (Clean Transparent Pulsing Field, no wireframe grid) */}
      {(isInvulnerable || isDashing) && (
        <mesh ref={auraRef} position={[0, 1.05, 0]}>
          <sphereGeometry args={[0.92, 24, 24]} />
          <meshBasicMaterial
            color={isInvulnerable ? '#38bdf8' : '#a855f7'}
            transparent
            opacity={isInvulnerable ? 0.35 : 0.22}
          />
        </mesh>
      )}

      {/* Dynamic Attack Arc Trail attached near weapon */}
      <mesh ref={trailRef} position={[0.35, 1.05, 0.3]} rotation={[0, -0.4, 0]} visible={false}>
        <ringGeometry args={[0.4, 0.95, 24, 1, 0, Math.PI * 0.85]} />
        <meshBasicMaterial
          color="#d946ef"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Full Humanoid 3D Character Model Instance */}
      <primitive object={modelData.root} />
    </group>
  );
});

KaelHumanoidModel.displayName = 'KaelHumanoidModel';

import React, { useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { ForgottenCrypt } from './dungeon/ForgottenCrypt';
import { Player } from './player/Player';
import { ShadowCompanions } from './shadows/ShadowCompanions';
import { EnemyManager } from './enemies/EnemyManager';
import { SkillEffects } from './combat/SkillEffects';
import { DamageNumbers3D } from './combat/DamageNumbers3D';
import { checkWebGLSupport } from '../utils/checkWebGL';
import { ErrorBoundary } from '../ui/ErrorBoundary';

// Guaranteed Fallback Dungeon Scene in case complex shaders/textures fail
const FallbackDungeon = () => (
  <group>
    {/* Visible Dark Stone Floor */}
    <mesh position={[0, -0.05, -20]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[40, 100]} />
      <meshStandardMaterial color="#22232a" roughness={0.8} />
    </mesh>
    {/* Left & Right Stone Walls */}
    <mesh position={[-16, 4, -20]}>
      <boxGeometry args={[1, 8, 100]} />
      <meshStandardMaterial color="#1a1a24" roughness={0.9} />
    </mesh>
    <mesh position={[16, 4, -20]}>
      <boxGeometry args={[1, 8, 100]} />
      <meshStandardMaterial color="#1a1a24" roughness={0.9} />
    </mesh>
    {/* Fallback Torches */}
    {[-15, 0, 15].map((z, i) => (
      <group key={i}>
        <pointLight position={[-14, 3, z]} color="#f59e0b" distance={15} intensity={2} />
        <pointLight position={[14, 3, z]} color="#f59e0b" distance={15} intensity={2} />
      </group>
    ))}
  </group>
);

export const GameCanvas = () => {
  const playerPos = useGameStore((s) => s.player.position);
  const setScreen = useGameStore((s) => s.setScreen);

  // Check WebGL availability
  const webglSupport = useMemo(() => checkWebGLSupport(), []);

  // Combat attack events passed down from Player
  const [combatAttackEvent, setCombatAttackEvent] = useState(null);
  const [skillEvent, setSkillEvent] = useState(null);

  // Active 3D visual FX
  const [activeEffects, setActiveEffects] = useState([]);
  const [livingEnemies, setLivingEnemies] = useState([]);
  const [shadowAttackEvent, setShadowAttackEvent] = useState(null);
  const [useFallbackScene, setUseFallbackScene] = useState(false);

  const handleAttackHit = useCallback((event) => {
    setCombatAttackEvent({ ...event, id: Date.now() });
  }, []);

  const handleSkillTrigger = useCallback((event) => {
    setSkillEvent({ ...event, id: Date.now() });

    setActiveEffects((prev) => [
      ...prev,
      {
        id: `fx_${Date.now()}_${Math.random()}`,
        type: event.skillId,
        position: event.position,
        angle: event.angle
      }
    ]);
  }, []);

  const handleEffectEnd = useCallback((id) => {
    setActiveEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleShadowAttack = useCallback((shadow, enemyId, power) => {
    setShadowAttackEvent({ shadow, enemyId, power, id: Date.now() });
  }, []);

  // If WebGL is not available on this browser/machine
  if (!webglSupport.supported) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          background: 'radial-gradient(circle at center, #1e112a 0%, #0a0512 80%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          color: '#f3f4f6',
          textAlign: 'center',
          zIndex: 50
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: '36px 48px',
            maxWidth: 580,
            border: '2px solid #ef4444',
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.4)'
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontWeight: 900,
              fontSize: 28,
              color: '#ef4444',
              marginBottom: 12
            }}
          >
            WebGL COULD NOT BE INITIALIZED
          </h2>
          <p style={{ fontSize: 15, color: '#e5e7eb', marginBottom: 20 }}>
            Please enable hardware acceleration or use a modern browser to run the 3D graphics.
          </p>
          <button
            onClick={() => setScreen('menu')}
            className="btn-rpg"
            style={{ padding: '10px 24px', fontSize: 14 }}
          >
            [ RETURN TO MENU ]
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="game-container"
      style={{
        width: '100vw',
        height: '100vh',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden'
      }}
    >
      <ErrorBoundary
        onRetry={() => setUseFallbackScene(true)}
        onReturnToMenu={() => setScreen('menu')}
      >
        <Canvas
          shadows
          camera={{ position: [0, 6, 26], fov: 60, near: 0.1, far: 500 }}
          gl={{
            antialias: false,
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: false,
            alpha: false,
            depth: true
          }}
          onCreated={({ scene }) => {
            // Visible dark-gray background color (never pure pitch black)
            scene.background = new THREE.Color('#15171c');
            // Atmospheric dungeon fog
            scene.fog = new THREE.Fog('#15171c', 10, 95);
          }}
        >
          {/* Guaranteed lighting */}
          <ambientLight intensity={0.4} color="#6d28d9" />
          <directionalLight position={[10, 25, 10]} intensity={0.8} color="#e0e7ff" />

          {/* 3D Dungeon Environment (or Fallback if requested) */}
          {!useFallbackScene ? <ForgottenCrypt /> : <FallbackDungeon />}

          {/* Player Kael */}
          <Player onAttackHit={handleAttackHit} onSkillTrigger={handleSkillTrigger} />

          {/* Shadow Army Companions */}
          <ShadowCompanions
            playerPos={playerPos}
            enemies={livingEnemies}
            onShadowAttackEnemy={handleShadowAttack}
          />

          {/* Enemies, Boss, Loot & Extraction Beacons */}
          <EnemyManager
            playerPos={playerPos}
            combatAttackEvent={combatAttackEvent}
            skillEvent={skillEvent}
            shadowAttackEvent={shadowAttackEvent}
            onLivingEnemiesChange={setLivingEnemies}
          />

          {/* 3D Skill Visual FX */}
          <SkillEffects activeEffects={activeEffects} onEffectEnd={handleEffectEnd} />

          {/* 3D Floating Combat Damage Numbers */}
          <DamageNumbers3D />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
};

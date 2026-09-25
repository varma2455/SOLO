import React, { useState, useCallback, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
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
import { ThreeErrorBoundary } from '../utils/ThreeErrorBoundary';

// Engine telemetry metrics exported for HUD performance monitor
export const liveDebugMetrics = {
  frameTime: 16.6,
  drawCalls: 0,
  triangles: 0,
  textures: 0,
  geometries: 0
};
if (typeof window !== 'undefined') {
  window.__debugMetrics = liveDebugMetrics;
}

const CanvasMetricsCollector = () => {
  const { gl } = useThree();
  useFrame((_, delta) => {
    liveDebugMetrics.frameTime = Number((delta * 1000).toFixed(1));
    if (gl && gl.info) {
      liveDebugMetrics.drawCalls = gl.info.render.calls;
      liveDebugMetrics.triangles = gl.info.render.triangles;
      if (gl.info.memory) {
        liveDebugMetrics.textures = gl.info.memory.textures;
        liveDebugMetrics.geometries = gl.info.memory.geometries;
      }
    }
  });
  return null;
};

// Simple Test Scene as requested in Step 3
const SimpleTestScene = () => (
  <group>
    <ambientLight intensity={1.0} />
    <directionalLight position={[5, 10, 5]} intensity={2.0} />
    {/* Large Plane */}
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#55505a" roughness={0.85} />
    </mesh>
    {/* Red Cube */}
    <mesh position={[0, 1, 0]}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#ef4444" roughness={0.3} />
    </mesh>
  </group>
);

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
  const setScreen = useGameStore((s) => s.setScreen);
  const graphicsQuality = useGameStore((s) => s.graphicsQuality || 'high');
  const playerPos = useMemo(() => [0, 0.5, 20], []);


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

  const dpr = useMemo(() => {
    const device = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
    if (graphicsQuality === 'low') return 1.0;
    if (graphicsQuality === 'medium') return Math.min(device, 1.25);
    if (graphicsQuality === 'high') return Math.min(device, 1.5);
    return Math.min(device, 2.0);
  }, [graphicsQuality]);

  const isDebug = typeof window !== 'undefined' && window.location.search.includes('debug=true');

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
          shadows={graphicsQuality !== 'low'}
          dpr={dpr}
          camera={{ position: [0, 3.2, 9.5], fov: 60, near: 0.1, far: 500 }}
          gl={{
            antialias: false,
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: false,
            alpha: false,
            depth: true
          }}
          onCreated={({ scene }) => {
            // Visible dark-gray background color (never pure pitch black)
            scene.background = new THREE.Color('#15131c');
            // Atmospheric dungeon fog
            scene.fog = new THREE.Fog('#15131c', 25, 110);
          }}
        >
          {/* Engine metrics collector for HUD performance overlay */}
          <CanvasMetricsCollector />

          {/* Development Axis Helper when ?debug=true */}
          {isDebug && <axesHelper args={[2]} />}

          {/* 3D Realistic Dungeon Environment with Fallback Protection */}
          <ThreeErrorBoundary name="Dungeon" fallback={<FallbackDungeon />}>
            {typeof window !== 'undefined' && window.location.search.includes('simple=true') ? (
              <SimpleTestScene />
            ) : useFallbackScene ? (
              <FallbackDungeon />
            ) : (
              <ForgottenCrypt quality={graphicsQuality} />
            )}
          </ThreeErrorBoundary>

          {/* Summoned Shadows Following Player */}
          <ThreeErrorBoundary name="ShadowCompanions">
            <ShadowCompanions playerPos={playerPos} onShadowAttack={handleShadowAttack} livingEnemies={livingEnemies} />
          </ThreeErrorBoundary>

          {/* Dynamic Dungeon Encounters & Enemies */}
          <ThreeErrorBoundary name="EnemyManager">
            <EnemyManager
              playerPos={playerPos}
              combatAttackEvent={combatAttackEvent}
              skillEvent={skillEvent}
              shadowAttackEvent={shadowAttackEvent}
              onLivingEnemiesChange={setLivingEnemies}
            />
          </ThreeErrorBoundary>

          {/* Player Kael */}
          <ThreeErrorBoundary name="Player">
            <Player onAttackHit={handleAttackHit} onSkillTrigger={handleSkillTrigger} />
          </ThreeErrorBoundary>

          {/* Combat FX & Slashes */}
          <ThreeErrorBoundary name="SkillEffects">
            <SkillEffects activeEffects={activeEffects} onEffectEnd={handleEffectEnd} />
          </ThreeErrorBoundary>

          {/* 3D Floating Combat Text */}
          <ThreeErrorBoundary name="DamageNumbers3D">
            <DamageNumbers3D />
          </ThreeErrorBoundary>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
};

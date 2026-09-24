import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { sound } from '../../audio/soundManager';

export const AbyssWardenBoss = ({ playerPos, onBossAttackPlayer, onBossDefeated, onSpawnMinions }) => {
  const meshRef = useRef();
  const swordRef = useRef();
  const auraRef = useRef();

  const bossHp = useGameStore((s) => s.dungeon.bossHp);
  const bossMaxHp = useGameStore((s) => s.dungeon.bossMaxHp);
  const bossPhase = useGameStore((s) => s.dungeon.bossPhase);
  const bossRage = useGameStore((s) => s.dungeon.bossRage);

  const [aiState, setAiState] = useState('IDLE'); // IDLE, CHASE, ATTACK, TELEGRAPH, DEAD
  const [showTelegraph, setShowTelegraph] = useState(false);
  const [telegraphPos, setTelegraphPos] = useState([0, 0, 0]);

  // Boss location centered in the grand hypostyle arena
  const pos = useRef(new THREE.Vector3(0, 0, -140));
  const rotation = useRef(0);
  const attackTimer = useRef(2.0);
  const specialTimer = useRef(7.0);
  const hasSummonedAdds = useRef(false);
  const hasRoaredAwakening = useRef(false);

  // Awakening roar on first load
  useEffect(() => {
    if (!hasRoaredAwakening.current) {
      hasRoaredAwakening.current = true;
      sound.playBossRoar();
    }
  }, []);

  // Monitor Boss HP
  useEffect(() => {
    if (bossHp <= 0 && aiState !== 'DEAD') {
      setAiState('DEAD');
      sound.playBossRoar();
      if (onBossDefeated) {
        onBossDefeated([pos.current.x, 0.5, pos.current.z]);
      }
    }
  }, [bossHp]);

  // Phase 2 Minion summoning trigger
  useEffect(() => {
    if (bossPhase >= 2 && !hasSummonedAdds.current) {
      hasSummonedAdds.current = true;
      if (onSpawnMinions) {
        onSpawnMinions([
          [pos.current.x - 5, 0, pos.current.z - 3],
          [pos.current.x + 5, 0, pos.current.z - 3]
        ]);
      }
    }
  }, [bossPhase]);

  // Frame Loop & AI
  useFrame((state, delta) => {
    if (!meshRef.current || aiState === 'DEAD') return;
    const dt = Math.min(delta, 0.1);
    const t = state.clock.getElapsedTime();

    if (attackTimer.current > 0) attackTimer.current -= dt;
    if (specialTimer.current > 0) specialTimer.current -= dt;

    const pPos = new THREE.Vector3(...playerPos);
    const distToPlayer = pos.current.distanceTo(pPos);

    // Speed bonus if enraged
    const speed = bossRage ? 5.5 : 3.6;

    // Telegraph area attack in Phase 3 or Phase 4
    if (bossPhase >= 3 && specialTimer.current <= 0 && distToPlayer < 24) {
      specialTimer.current = bossRage ? 5.5 : 9.0;
      setAiState('TELEGRAPH');
      setShowTelegraph(true);
      setTelegraphPos([pPos.x, 0.05, pPos.z]);
      sound.playBossRoar();

      setTimeout(() => {
        setShowTelegraph(false);
        if (aiState !== 'DEAD') {
          sound.playVoidBurst();
          const currentPPos = new THREE.Vector3(...useGameStore.getState().player.position);
          const slamDist = currentPPos.distanceTo(new THREE.Vector3(telegraphPos[0], 0, telegraphPos[2]));
          if (slamDist <= 7.5) {
            onBossAttackPlayer(bossRage ? 65 : 45);
          }
          setAiState('CHASE');
        }
      }, 1400);
    }

    if (aiState !== 'TELEGRAPH') {
      if (distToPlayer <= 4.8) {
        // Normal Cleave Attack
        if (attackTimer.current <= 0) {
          attackTimer.current = bossRage ? 1.1 : 1.9;
          setAiState('ATTACK');

          if (swordRef.current) {
            swordRef.current.rotation.x = -2.2;
            setTimeout(() => {
              if (swordRef.current) swordRef.current.rotation.x = 0.2;
            }, 360);
          }

          setTimeout(() => {
            if (aiState !== 'DEAD') {
              const currentPPos = new THREE.Vector3(...useGameStore.getState().player.position);
              if (pos.current.distanceTo(currentPPos) <= 6.0) {
                sound.playHit(true);
                onBossAttackPlayer(bossRage ? 48 : 36);
              }
              setAiState('CHASE');
            }
          }, 240);
        }
      } else if (distToPlayer < 40) {
        // Chase player inside boss arena
        setAiState('CHASE');
        const dir = new THREE.Vector3().subVectors(pPos, pos.current).normalize();
        pos.current.addScaledVector(dir, speed * dt);
        rotation.current = Math.atan2(dir.x, dir.z);
      }
    }

    // Apply movement
    meshRef.current.position.copy(pos.current);
    meshRef.current.rotation.y = rotation.current;

    // Rage aura pulse
    if (auraRef.current) {
      auraRef.current.scale.setScalar(1.0 + Math.sin(t * 8) * 0.15);
      auraRef.current.material.opacity = bossRage ? 0.75 : 0.35;
    }
  });

  if (aiState === 'DEAD') {
    return null;
  }

  return (
    <>
      {/* Telegraph Warning Circle on Ground */}
      {showTelegraph && (
        <group position={telegraphPos}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[7.2, 32]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[6.9, 7.2, 32]} />
            <meshBasicMaterial color="#dc2626" side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* 3D Boss Model - 4.2m Imposing Titan */}
      <group ref={meshRef} position={[0, 0, -140]}>
        {/* Massive Ground shadow */}
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.8, 24]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.7} />
        </mesh>

        {/* Aura (Red if enraged, Purple normally) */}
        <mesh ref={auraRef} position={[0, 3.0, 0]}>
          <sphereGeometry args={[3.2, 16, 16]} />
          <meshBasicMaterial
            color={bossRage ? '#ef4444' : '#9333ea'}
            transparent
            opacity={0.35}
            wireframe
          />
        </mesh>

        {/* Boss Scale 2.5 */}
        <group scale={2.5}>
          {/* Spiked Obsidian Armored Torso */}
          <mesh position={[0, 1.25, 0]}>
            <boxGeometry args={[0.95, 1.4, 0.65]} />
            <meshStandardMaterial
              color={bossRage ? '#450a0a' : '#0b0b12'}
              metalness={0.92}
              roughness={0.35}
            />
          </mesh>

          {/* Glowing Abyssal Void Core in Chest */}
          <mesh position={[0, 1.42, 0.35]}>
            <octahedronGeometry args={[0.22]} />
            <meshBasicMaterial color={bossRage ? '#f43f5e' : '#c084fc'} />
          </mesh>

          {/* Demonic Horned Greathelm Crown */}
          <group position={[0, 2.2, 0.05]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.58, 0.58, 0.58]} />
              <meshStandardMaterial color="#050508" metalness={0.9} roughness={0.3} />
            </mesh>
            {/* Crown Spikes */}
            {[-0.2, 0, 0.2].map((x, i) => (
              <mesh key={i} position={[x, 0.38, 0]}>
                <coneGeometry args={[0.07, 0.35, 4]} />
                <meshStandardMaterial color="#1e1b4b" metalness={0.8} />
              </mesh>
            ))}
            {/* Colossal Sweeping Horns */}
            <mesh position={[-0.45, 0.45, 0]} rotation={[0, 0, 0.65]}>
              <coneGeometry args={[0.16, 1.1, 8]} />
              <meshStandardMaterial color="#1e1b4b" metalness={0.7} />
            </mesh>
            <mesh position={[0.45, 0.45, 0]} rotation={[0, 0, -0.65]}>
              <coneGeometry args={[0.16, 1.1, 8]} />
              <meshStandardMaterial color="#1e1b4b" metalness={0.7} />
            </mesh>
            {/* Demon Visor Glowing Eyes */}
            <mesh position={[-0.15, 0.06, 0.32]}>
              <boxGeometry args={[0.11, 0.06, 0.04]} />
              <meshBasicMaterial color={bossRage ? '#ff0000' : '#d946ef'} />
            </mesh>
            <mesh position={[0.15, 0.06, 0.32]}>
              <boxGeometry args={[0.11, 0.06, 0.04]} />
              <meshBasicMaterial color={bossRage ? '#ff0000' : '#d946ef'} />
            </mesh>
          </group>

          {/* Right Arm & Colossal Abyssal Cleaver */}
          <group position={[0.7, 1.35, 0]}>
            <mesh position={[0, -0.4, 0]}>
              <boxGeometry args={[0.32, 0.95, 0.32]} />
              <meshStandardMaterial color="#0b0b12" metalness={0.85} />
            </mesh>
            {/* Cleaver Greatblade */}
            <group ref={swordRef} position={[0, -0.85, 0.4]}>
              <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[0.14, 2.1, 0.42]} />
                <meshStandardMaterial
                  color="#1e1b4b"
                  metalness={0.92}
                  roughness={0.25}
                />
              </mesh>
              {/* Glowing Runic Edge */}
              <mesh position={[0, 0.8, 0.22]}>
                <boxGeometry args={[0.07, 2.05, 0.06]} />
                <meshBasicMaterial color={bossRage ? '#ef4444' : '#c084fc'} />
              </mesh>
            </group>
          </group>

          {/* Left Arm & Heavy Pauldron */}
          <group position={[-0.7, 1.35, 0]}>
            <mesh position={[0, -0.4, 0]}>
              <boxGeometry args={[0.32, 0.95, 0.32]} />
              <meshStandardMaterial color="#0b0b12" metalness={0.85} />
            </mesh>
            <mesh position={[-0.12, 0.25, 0]}>
              <boxGeometry args={[0.5, 0.45, 0.5]} />
              <meshStandardMaterial color="#2e1065" metalness={0.8} />
            </mesh>
          </group>

          {/* Armored Heavy Greaves */}
          <mesh position={[-0.26, 0.32, 0]}>
            <boxGeometry args={[0.32, 0.85, 0.38]} />
            <meshStandardMaterial color="#050508" roughness={0.8} />
          </mesh>
          <mesh position={[0.26, 0.32, 0]}>
            <boxGeometry args={[0.32, 0.85, 0.38]} />
            <meshStandardMaterial color="#050508" roughness={0.8} />
          </mesh>
        </group>
      </group>
    </>
  );
};

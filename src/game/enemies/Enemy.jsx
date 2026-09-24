// -------------------------------------------------------------
// SHADOW ASCENSION - 3D ENEMY ENTITY & SPECIALIZED GROUP AI
// Supports: Swarm, Ranged, Tank, Assassin, Elite, Commander
// -------------------------------------------------------------

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { globalPlayerState } from '../player/Player';
import { sound } from '../../audio/soundManager';

// -------------------------------------------------------------
// 1. TIER 1 - WEAK MESHES (Lightweight, high-performance)
// -------------------------------------------------------------

// Ash Goblin: Hunched, crooked cleaver, tusks, glowing eyes
const AshGoblinMesh = ({ isHit, weaponRef }) => (
  <group>
    <mesh position={[0, 0.7, 0]} rotation={[0.22, 0, 0]}>
      <boxGeometry args={[0.55, 0.65, 0.42]} />
      <meshStandardMaterial color={isHit ? '#ffffff' : '#3f3f46'} roughness={0.75} />
    </mesh>
    <group position={[0, 1.15, 0.22]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.38, 0.34, 0.38]} />
        <meshStandardMaterial color={isHit ? '#ffffff' : '#52525b'} roughness={0.8} />
      </mesh>
      {/* Lower Tusks */}
      <mesh position={[-0.09, -0.12, 0.2]} rotation={[-0.4, 0, 0]}>
        <coneGeometry args={[0.03, 0.12, 4]} />
        <meshStandardMaterial color="#fef08a" />
      </mesh>
      <mesh position={[0.09, -0.12, 0.2]} rotation={[-0.4, 0, 0]}>
        <coneGeometry args={[0.03, 0.12, 4]} />
        <meshStandardMaterial color="#fef08a" />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.1, 0.06, 0.2]}>
        <boxGeometry args={[0.07, 0.05, 0.03]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[0.1, 0.06, 0.2]}>
        <boxGeometry args={[0.07, 0.05, 0.03]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
    </group>
    {/* Cleaver */}
    <group position={[0.38, 0.72, 0.05]}>
      <group ref={weaponRef} position={[0, -0.42, 0.15]}>
        <mesh position={[0, 0.32, 0.08]}>
          <boxGeometry args={[0.04, 0.45, 0.2]} />
          <meshStandardMaterial color="#71717a" metalness={0.8} roughness={0.35} />
        </mesh>
      </group>
    </group>
    {/* Legs */}
    <mesh position={[-0.16, 0.22, 0]}>
      <boxGeometry args={[0.18, 0.46, 0.2]} />
      <meshStandardMaterial color="#18181b" />
    </mesh>
    <mesh position={[0.16, 0.22, 0]}>
      <boxGeometry args={[0.18, 0.46, 0.2]} />
      <meshStandardMaterial color="#18181b" />
    </mesh>
  </group>
);

// Cave Crawler: Multi-legged shadow arachnid / insectoid
const CaveCrawlerMesh = ({ isHit }) => (
  <group position={[0, 0.35, 0]}>
    {/* Carapace Body */}
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[0.42, 10, 8]} />
      <meshStandardMaterial color={isHit ? '#ffffff' : '#3b0764'} roughness={0.6} />
    </mesh>
    {/* Glowing Compound Eyes */}
    <mesh position={[0, 0.15, 0.35]}>
      <boxGeometry args={[0.25, 0.08, 0.08]} />
      <meshBasicMaterial color="#c084fc" />
    </mesh>
    {/* Mandibles */}
    <mesh position={[-0.12, -0.08, 0.42]} rotation={[0, 0.3, 0]}>
      <coneGeometry args={[0.04, 0.2, 4]} />
      <meshStandardMaterial color="#a855f7" />
    </mesh>
    <mesh position={[0.12, -0.08, 0.42]} rotation={[0, -0.3, 0]}>
      <coneGeometry args={[0.04, 0.2, 4]} />
      <meshStandardMaterial color="#a855f7" />
    </mesh>
    {/* Spindly Legs */}
    {[-0.35, 0, 0.35].map((z, i) => (
      <group key={i}>
        <mesh position={[-0.45, -0.15, z]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.35, 0.05, 0.05]} />
          <meshStandardMaterial color="#18181b" />
        </mesh>
        <mesh position={[0.45, -0.15, z]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.35, 0.05, 0.05]} />
          <meshStandardMaterial color="#18181b" />
        </mesh>
      </group>
    ))}
  </group>
);

// Rotting Skeleton: Skeletal torso, bone skull, rusty sword
const RottingSkeletonMesh = ({ isHit, weaponRef }) => (
  <group>
    {/* Ribcage */}
    <mesh position={[0, 0.8, 0]}>
      <boxGeometry args={[0.45, 0.6, 0.25]} />
      <meshStandardMaterial color={isHit ? '#ffffff' : '#d4d4d8'} roughness={0.7} />
    </mesh>
    {/* Skull */}
    <group position={[0, 1.25, 0]}>
      <mesh>
        <boxGeometry args={[0.3, 0.32, 0.3]} />
        <meshStandardMaterial color={isHit ? '#ffffff' : '#e4e4e7'} roughness={0.7} />
      </mesh>
      <mesh position={[-0.07, 0.02, 0.16]}>
        <boxGeometry args={[0.05, 0.04, 0.02]} />
        <meshBasicMaterial color="#a1a1aa" />
      </mesh>
      <mesh position={[0.07, 0.02, 0.16]}>
        <boxGeometry args={[0.05, 0.04, 0.02]} />
        <meshBasicMaterial color="#a1a1aa" />
      </mesh>
    </group>
    {/* Rusty Blade */}
    <group position={[0.38, 0.75, 0]}>
      <group ref={weaponRef} position={[0, -0.35, 0.2]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.04, 0.6, 0.1]} />
          <meshStandardMaterial color="#78350f" metalness={0.7} roughness={0.6} />
        </mesh>
      </group>
    </group>
    {/* Legs */}
    <mesh position={[-0.14, 0.25, 0]}>
      <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
      <meshStandardMaterial color="#d4d4d8" />
    </mesh>
    <mesh position={[0.14, 0.25, 0]}>
      <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
      <meshStandardMaterial color="#d4d4d8" />
    </mesh>
  </group>
);

// -------------------------------------------------------------
// 2. TIER 2 - NORMAL MESHES
// -------------------------------------------------------------

// Bone Reaver: Horned raptor-fiend, spinal sickles
const BoneReaverMesh = ({ isHit, weaponRef }) => (
  <group>
    <mesh position={[0, 0.85, 0]}>
      <boxGeometry args={[0.5, 0.75, 0.32]} />
      <meshStandardMaterial color={isHit ? '#ffffff' : '#e4e4e7'} roughness={0.7} />
    </mesh>
    <group position={[0, 1.35, 0.08]}>
      <mesh>
        <boxGeometry args={[0.34, 0.36, 0.34]} />
        <meshStandardMaterial color={isHit ? '#ffffff' : '#f4f4f5'} roughness={0.65} />
      </mesh>
      <mesh position={[-0.09, 0.04, 0.18]}>
        <boxGeometry args={[0.07, 0.05, 0.03]} />
        <meshBasicMaterial color="#a855f7" />
      </mesh>
      <mesh position={[0.09, 0.04, 0.18]}>
        <boxGeometry args={[0.07, 0.05, 0.03]} />
        <meshBasicMaterial color="#a855f7" />
      </mesh>
    </group>
    {/* Twin Bone Sickles */}
    <group position={[0.42, 0.85, 0]}>
      <group ref={weaponRef} position={[0, -0.45, 0.2]}>
        <mesh position={[0, 0.28, 0.1]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.04, 0.6, 0.14]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.4} roughness={0.4} />
        </mesh>
      </group>
    </group>
    <mesh position={[-0.16, 0.25, 0]}>
      <boxGeometry args={[0.16, 0.55, 0.18]} />
      <meshStandardMaterial color="#71717a" />
    </mesh>
    <mesh position={[0.16, 0.25, 0]}>
      <boxGeometry args={[0.16, 0.55, 0.18]} />
      <meshStandardMaterial color="#71717a" />
    </mesh>
  </group>
);

// Void Archer: Hooded cowl, dark robes, void recurve bow
const VoidArcherMesh = ({ isHit, weaponRef }) => (
  <group>
    <mesh position={[0, 0.75, 0]}>
      <cylinderGeometry args={[0.28, 0.55, 1.2, 10]} />
      <meshStandardMaterial color={isHit ? '#ffffff' : '#1e1b4b'} roughness={0.8} />
    </mesh>
    <group position={[0, 1.45, 0.05]}>
      <mesh>
        <sphereGeometry args={[0.26, 12, 12]} />
        <meshStandardMaterial color={isHit ? '#ffffff' : '#0f172a'} roughness={0.7} />
      </mesh>
      <mesh position={[-0.07, 0.04, 0.23]}>
        <boxGeometry args={[0.06, 0.03, 0.02]} />
        <meshBasicMaterial color="#c084fc" />
      </mesh>
      <mesh position={[0.07, 0.04, 0.23]}>
        <boxGeometry args={[0.06, 0.03, 0.02]} />
        <meshBasicMaterial color="#c084fc" />
      </mesh>
    </group>
    <group position={[-0.38, 0.9, 0.15]}>
      <group ref={weaponRef} position={[0, 0, 0.35]}>
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, 1.3, 8]} />
          <meshStandardMaterial color="#312e81" metalness={0.6} />
        </mesh>
        <mesh position={[0.08, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.8, 6]} />
          <meshBasicMaterial color="#d946ef" />
        </mesh>
      </group>
    </group>
  </group>
);

// Grave Soldier: Armored guard with iron tower shield and broadsword
const GraveSoldierMesh = ({ isHit, weaponRef }) => (
  <group>
    <mesh position={[0, 0.85, 0]}>
      <boxGeometry args={[0.65, 0.8, 0.4]} />
      <meshStandardMaterial color={isHit ? '#ffffff' : '#374151'} metalness={0.75} roughness={0.4} />
    </mesh>
    <group position={[0, 1.4, 0]}>
      <mesh>
        <boxGeometry args={[0.38, 0.38, 0.38]} />
        <meshStandardMaterial color={isHit ? '#ffffff' : '#1f2937'} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.04, 0.2]}>
        <boxGeometry args={[0.22, 0.05, 0.03]} />
        <meshBasicMaterial color="#60a5fa" />
      </mesh>
    </group>
    {/* Tower Shield */}
    <mesh position={[-0.45, 0.8, 0.25]}>
      <boxGeometry args={[0.08, 1.1, 0.6]} />
      <meshStandardMaterial color="#1e3a8a" metalness={0.8} roughness={0.3} />
    </mesh>
    {/* Broadsword */}
    <group position={[0.45, 0.8, 0]}>
      <group ref={weaponRef} position={[0, -0.3, 0.2]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.05, 0.75, 0.12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
    </group>
    <mesh position={[-0.18, 0.25, 0]}>
      <boxGeometry args={[0.2, 0.55, 0.22]} />
      <meshStandardMaterial color="#111827" />
    </mesh>
    <mesh position={[0.18, 0.25, 0]}>
      <boxGeometry args={[0.2, 0.55, 0.22]} />
      <meshStandardMaterial color="#111827" />
    </mesh>
  </group>
);

// -------------------------------------------------------------
// 3. TIER 3 - ELITE MESHES (Auras, massive weapons, crests)
// -------------------------------------------------------------

// Blood Knight: Crimson battle plate, horned greathelm, blood halberd
const BloodKnightMesh = ({ isHit, weaponRef }) => (
  <group scale={1.5}>
    <mesh position={[0, 0.9, 0]}>
      <boxGeometry args={[0.75, 0.9, 0.5]} />
      <meshStandardMaterial color={isHit ? '#ffffff' : '#881337'} metalness={0.85} roughness={0.3} />
    </mesh>
    {/* Great Horned Helm */}
    <group position={[0, 1.5, 0]}>
      <mesh>
        <boxGeometry args={[0.42, 0.44, 0.42]} />
        <meshStandardMaterial color={isHit ? '#ffffff' : '#4c0519'} metalness={0.9} />
      </mesh>
      <mesh position={[-0.26, 0.18, 0]} rotation={[0, 0, 0.6]}>
        <coneGeometry args={[0.08, 0.5, 5]} />
        <meshStandardMaterial color="#991b1b" />
      </mesh>
      <mesh position={[0.26, 0.18, 0]} rotation={[0, 0, -0.6]}>
        <coneGeometry args={[0.08, 0.5, 5]} />
        <meshStandardMaterial color="#991b1b" />
      </mesh>
      <mesh position={[0, 0.05, 0.22]}>
        <boxGeometry args={[0.24, 0.05, 0.03]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
    {/* Blood Halberd */}
    <group position={[0.55, 0.9, 0]}>
      <group ref={weaponRef} position={[0, -0.6, 0.2]}>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 1.9, 8]} />
          <meshStandardMaterial color="#292524" metalness={0.8} />
        </mesh>
        <mesh position={[0.15, 1.3, 0]}>
          <boxGeometry args={[0.06, 0.7, 0.35]} />
          <meshStandardMaterial color="#dc2626" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
    {/* Crimson Aura Shield */}
    <mesh position={[0, 0.9, 0]}>
      <sphereGeometry args={[1.2, 16, 12]} />
      <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.22} />
    </mesh>
  </group>
);

// Crypt Guardian: 2.6m colossal stony iron sentinel, heavy double-bitted axe
const CryptGuardianMesh = ({ isHit, weaponRef }) => (
  <group scale={1.4}>
    <mesh position={[0, 0.9, 0]}>
      <boxGeometry args={[0.75, 0.95, 0.52]} />
      <meshStandardMaterial color={isHit ? '#ffffff' : '#1e293b'} metalness={0.88} roughness={0.35} />
    </mesh>
    <group position={[0, 1.55, 0.05]}>
      <mesh>
        <boxGeometry args={[0.44, 0.48, 0.44]} />
        <meshStandardMaterial color={isHit ? '#ffffff' : '#0f172a'} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.05, 0.23]}>
        <boxGeometry args={[0.26, 0.06, 0.04]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
    </group>
    {/* Heavy Battleaxe */}
    <group position={[0.55, 0.95, 0]}>
      <group ref={weaponRef} position={[0, -0.7, 0.25]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 1.6, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        <mesh position={[0, 1.15, 0.15]}>
          <boxGeometry args={[0.08, 0.65, 0.45]} />
          <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
    </group>
    {/* Blue Sentinel Aura */}
    <mesh position={[0, 0.9, 0]}>
      <sphereGeometry args={[1.25, 16, 12]} />
      <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.22} />
    </mesh>
  </group>
);

// -------------------------------------------------------------
// 4. TIER 4 - COMMANDER MESH (Grave Warlord with aura & banner)
// -------------------------------------------------------------
const GraveWarlordMesh = ({ isHit, weaponRef }) => (
  <group scale={1.8}>
    {/* Massive Obsidian Torso */}
    <mesh position={[0, 0.95, 0]}>
      <boxGeometry args={[0.9, 1.1, 0.6]} />
      <meshStandardMaterial color={isHit ? '#ffffff' : '#271106'} metalness={0.9} roughness={0.3} />
    </mesh>
    {/* Spiked Shoulders */}
    <mesh position={[-0.6, 1.35, 0]} rotation={[0, 0, 0.4]}>
      <boxGeometry args={[0.42, 0.35, 0.55]} />
      <meshStandardMaterial color="#7c2d12" metalness={0.85} />
    </mesh>
    <mesh position={[0.6, 1.35, 0]} rotation={[0, 0, -0.4]}>
      <boxGeometry args={[0.42, 0.35, 0.55]} />
      <meshStandardMaterial color="#7c2d12" metalness={0.85} />
    </mesh>
    {/* Crown of Horns */}
    <group position={[0, 1.65, 0.08]}>
      <mesh>
        <boxGeometry args={[0.5, 0.52, 0.5]} />
        <meshStandardMaterial color={isHit ? '#ffffff' : '#1c1917'} metalness={0.95} />
      </mesh>
      {/* Crown Horns */}
      {[-0.2, 0, 0.2].map((x, i) => (
        <mesh key={i} position={[x, 0.36, 0.1]} rotation={[-0.2, 0, x * 0.8]}>
          <coneGeometry args={[0.07, 0.45, 5]} />
          <meshStandardMaterial color="#ea580c" />
        </mesh>
      ))}
      <mesh position={[0, 0.06, 0.26]}>
        <boxGeometry args={[0.3, 0.08, 0.04]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
    </group>
    {/* Crimson Commander War Banner mounted on back */}
    <group position={[0, 1.8, -0.38]}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 2.2, 8]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      <mesh position={[0.45, 1.1, 0]}>
        <boxGeometry args={[0.85, 0.9, 0.03]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.7} />
      </mesh>
    </group>
    {/* Colossal War-Glaive */}
    <group position={[0.65, 0.95, 0]}>
      <group ref={weaponRef} position={[0, -0.7, 0.3]}>
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 2.2, 8]} />
          <meshStandardMaterial color="#44403c" metalness={0.9} />
        </mesh>
        <mesh position={[0, 1.6, 0.15]}>
          <boxGeometry args={[0.1, 0.9, 0.45]} />
          <meshStandardMaterial color="#f97316" metalness={0.95} roughness={0.2} />
        </mesh>
      </group>
    </group>
    {/* Pulsing Commander Command Aura Ring on Floor */}
    <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[6.0, 6.8, 36]} />
      <meshBasicMaterial color="#f97316" transparent opacity={0.65} side={THREE.DoubleSide} />
    </mesh>
  </group>
);

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
  onNearExecutable
}) => {
  const meshRef = useRef();
  const hpBarRef = useRef();
  const weaponRef = useRef();
  const finisherTagRef = useRef();

  const [currentHp, setCurrentHp] = useState(enemyData.hp || enemyData.maxHp);
  const [aiState, setAiState] = useState('IDLE');
  const [isHit, setIsHit] = useState(false);

  const pos = useRef(new THREE.Vector3(...enemyData.spawnPosition));
  const spawnPos = useRef(new THREE.Vector3(...enemyData.spawnPosition));
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
      setTimeout(() => setIsHit(false), 140);

      // Knockback away from player
      if (playerPos) {
        const kbStrength = enemyData.tier === 'weak' ? 1.0 : enemyData.tier === 'elite' ? 0.35 : 0.6;
        _scratchKb.set(pos.current.x - playerPos[0], 0, pos.current.z - playerPos[2]).normalize();
        pos.current.addScaledVector(_scratchKb, kbStrength);
      }

      if (enemyData.hp <= 0 && aiState !== 'DEAD') {
        setAiState('DEAD');
        onEnemyDeath(enemyData, [pos.current.x, 0.5, pos.current.z]);
      }
    }
  }, [enemyData.hp]);

  // Notify parent if executable
  const isExecutable = currentHp > 0 && currentHp / enemyData.maxHp <= 0.15;
  useEffect(() => {
    if (!onNearExecutable) return;
    const px = playerPos ? playerPos[0] : 0;
    const py = playerPos ? playerPos[1] : 0.5;
    const pz = playerPos ? playerPos[2] : 0;
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
    const dt = Math.min(delta, 0.1);

    frameTick.current++;

    if (globalPlayerState && (globalPlayerState.pos || globalPlayerState.posVec)) {
      _scratchPPos.copy(globalPlayerState.pos || globalPlayerState.posVec);
    } else if (playerPos) {
      _scratchPPos.set(playerPos[0], playerPos[1], playerPos[2]);
    } else {
      _scratchPPos.set(0, 0.5, 4);
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

    // Billboard health bar and execution tag to camera only when reasonably close
    if (distToPlayer < 35) {
      if (hpBarRef.current) hpBarRef.current.quaternion.copy(state.camera.quaternion);
      if (finisherTagRef.current) finisherTagRef.current.quaternion.copy(state.camera.quaternion);
    }
  });

  if (aiState === 'DEAD') return null;

  const hpRatio = Math.max(0, currentHp / enemyData.maxHp);
  const scale = enemyData.scale || 1.0;
  const isElite = enemyData.tier === 'elite' || enemyData.isApex;
  const isCommander = enemyData.tier === 'commander' || enemyData.isCommander;

  return (
    <group ref={meshRef} position={enemyData.spawnPosition}>
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

        {isCommander ? (
          <GraveWarlordMesh isHit={isHit} weaponRef={weaponRef} />
        ) : enemyData.id?.includes('bloodKnight') ? (
          <BloodKnightMesh isHit={isHit} weaponRef={weaponRef} />
        ) : enemyData.id?.includes('cryptGuardian') || enemyData.isApex ? (
          <CryptGuardianMesh isHit={isHit} weaponRef={weaponRef} />
        ) : enemyData.role === 'ranged' || enemyData.id?.includes('voidArcher') ? (
          <VoidArcherMesh isHit={isHit} weaponRef={weaponRef} />
        ) : enemyData.id?.includes('graveSoldier') ? (
          <GraveSoldierMesh isHit={isHit} weaponRef={weaponRef} />
        ) : enemyData.id?.includes('boneReaver') ? (
          <BoneReaverMesh isHit={isHit} weaponRef={weaponRef} />
        ) : enemyData.id?.includes('rottingSkeleton') ? (
          <RottingSkeletonMesh isHit={isHit} weaponRef={weaponRef} />
        ) : enemyData.id?.includes('caveCrawler') || enemyData.id?.includes('shadowRat') ? (
          <CaveCrawlerMesh isHit={isHit} />
        ) : (
          <AshGoblinMesh isHit={isHit} weaponRef={weaponRef} />
        )}
      </group>
    </group>
  );
};

export const Enemy = React.memo(EnemyComponent);


import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { getFlagstoneMaterials, getWallMaterials, getIronMaterials } from './DungeonTextures';
import {
  WoodBarrel,
  DungeonCrate,
  HangingCage,
  SkeletonRemains,
  DiscardedShieldAndSword,
  WaterPuddle,
  DrippingCeilingWater,
  AncientStatue,
  StoneArch,
  IronPortcullis
} from './DungeonProps';
import { DungeonTorch, DungeonDustMotes } from './TorchLight';

// Detailed Multi-tiered Classical Dungeon Column
const GrandColumn = ({ position, height = 7.5, broken = false }) => {
  const actualHeight = broken ? height * 0.55 : height;

  return (
    <group position={position}>
      {/* Heavy Plinth / Pedestal */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.6, 0.9, 1.6]} />
        <meshStandardMaterial color="#1a1924" roughness={0.9} />
      </mesh>
      {/* Stepped Torus Base */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.95, 1.15, 0.35, 16]} />
        <meshStandardMaterial color="#1f1e2b" roughness={0.88} />
      </mesh>
      {/* Column Shaft */}
      <mesh position={[0, actualHeight / 2 + 1.2, 0]}>
        <cylinderGeometry args={[0.82, 0.88, actualHeight, 16]} />
        <meshStandardMaterial color="#262534" roughness={0.85} />
      </mesh>

      {/* Capital & Abacus (if intact) */}
      {!broken ? (
        <group position={[0, actualHeight + 1.4, 0]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[1.2, 0.85, 0.45, 16]} />
            <meshStandardMaterial color="#1f1e2b" roughness={0.88} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[1.8, 0.4, 1.8]} />
            <meshStandardMaterial color="#171620" roughness={0.9} />
          </mesh>
        </group>
      ) : (
        /* Jagged Broken Top & Fallen Column Drum */
        <group position={[0, actualHeight + 1.2, 0]}>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.7, 0.82, 0.3, 10]} />
            <meshStandardMaterial color="#1c1b26" roughness={0.95} />
          </mesh>
          <mesh position={[0.7, -actualHeight - 0.7, 0.6]} rotation={[0.4, 0.2, 0.8]}>
            <cylinderGeometry args={[0.82, 0.82, 1.4, 12]} />
            <meshStandardMaterial color="#242332" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* Glowing Runic Ring Band */}
      <mesh position={[0, 1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.84, 0.94, 20]} />
        <meshBasicMaterial color="#9333ea" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// Stone Sarcophagus Tomb
const Sarcophagus = ({ position, rotation = [0, 0, 0], open = false }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Stone Coffin Base */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.1, 1.0, 2.2]} />
        <meshStandardMaterial color="#1f1e28" roughness={0.9} />
      </mesh>
      {/* Carved Lid */}
      <mesh position={[open ? 0.35 : 0, open ? 1.05 : 1.1, open ? 0.15 : 0]} rotation={[0, 0, open ? 0.2 : 0]}>
        <boxGeometry args={[1.25, 0.25, 2.35]} />
        <meshStandardMaterial color="#292837" roughness={0.85} />
      </mesh>
    </group>
  );
};

// Mystic Barrier Gate that dissolves when wave is cleared
const MysticDungeonGate = ({ position, isOpen, roomNumber }) => {
  const forcefieldRef = useRef();

  useFrame((state) => {
    if (forcefieldRef.current && !isOpen) {
      const t = state.clock.getElapsedTime();
      forcefieldRef.current.material.opacity = 0.5 + Math.sin(t * 3.5) * 0.18;
    }
  });

  return (
    <group position={position}>
      {/* Stone Archway portal */}
      <StoneArch position={[0, 0, 0]} width={7.5} height={6.2} />

      {/* Medieval Spiked Iron Portcullis */}
      <IronPortcullis position={[0, 0, 0]} isOpen={isOpen} />

      {/* Runic Energy Barrier (Dissolves when open) */}
      {!isOpen && (
        <group>
          <mesh ref={forcefieldRef} position={[0, 3.2, 0]}>
            <planeGeometry args={[7.2, 5.8]} />
            <meshBasicMaterial color="#9333ea" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          <pointLight position={[0, 3.2, 0]} color="#a855f7" distance={10} intensity={2.5} />
        </group>
      )}
    </group>
  );
};

export const ForgottenCrypt = () => {
  const roomsUnlocked = useGameStore((s) => s.dungeon.roomsUnlocked);

  // Load PBR Textures
  const { albedoMap: floorAlbedo, bumpMap: floorBump, roughnessMap: floorRough } = useMemo(
    () => getFlagstoneMaterials(),
    []
  );
  const { albedoMap: wallAlbedo, bumpMap: wallBump } = useMemo(() => getWallMaterials(), []);

  // Floor and wall material instances
  const floorMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: floorAlbedo,
      bumpMap: floorBump,
      bumpScale: 0.08,
      roughnessMap: floorRough,
      roughness: 0.8,
      metalness: 0.05,
      color: '#ffffff'
    });
    if (floorAlbedo) floorAlbedo.repeat.set(8, 24);
    if (floorBump) floorBump.repeat.set(8, 24);
    if (floorRough) floorRough.repeat.set(8, 24);
    return mat;
  }, [floorAlbedo, floorBump, floorRough]);

  const wallMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: wallAlbedo,
      bumpMap: wallBump,
      bumpScale: 0.1,
      roughness: 0.85,
      metalness: 0.05,
      color: '#ffffff'
    });
    if (wallAlbedo) wallAlbedo.repeat.set(4, 2);
    if (wallBump) wallBump.repeat.set(4, 2);
    return mat;
  }, [wallAlbedo, wallBump]);

  return (
    <group>
      {/* --- REALISTIC VISIBLE DUNGEON LIGHTING --- */}
      {/* Visible dark fantasy ambient light */}
      <ambientLight intensity={0.75} color="#cbd5e1" />

      {/* Primary directional moonbeam casting crisp shadows */}
      <directionalLight
        position={[12, 28, 10]}
        intensity={1.8}
        color="#f1f5f9"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
      />

      {/* Atmospheric Underground Floating Dust Particles */}
      <DungeonDustMotes count={100} />

      {/* ============================================================== */}
      {/* 1. ENTRANCE & DESCENDING CORRIDOR (Z: 28 to 8)                 */}
      {/* ============================================================== */}
      {/* Floor */}
      <mesh position={[0, -0.05, 18]} receiveShadow rotation={[-Math.PI / 2, 0, 0]} material={floorMaterial}>
        <planeGeometry args={[14, 22]} />
      </mesh>
      {/* Vaulted Stone Archway */}
      <StoneArch position={[0, 0, 20]} width={14} height={6.2} />
      <StoneArch position={[0, 0, 12]} width={14} height={6.2} />
      {/* Side Walls */}
      <mesh position={[-7, 3, 18]} material={wallMaterial}>
        <boxGeometry args={[1, 6.2, 22]} />
      </mesh>
      <mesh position={[7, 3, 18]} material={wallMaterial}>
        <boxGeometry args={[1, 6.2, 22]} />
      </mesh>
      {/* Back Wall with Grand Sealed Door */}
      <mesh position={[0, 3, 29]} material={wallMaterial}>
        <boxGeometry args={[14, 6.2, 1]} />
      </mesh>

      {/* Entrance Props & Sconces */}
      <DungeonTorch position={[-6.4, 2.6, 24]} />
      <DungeonTorch position={[6.4, 2.6, 24]} />
      <DungeonTorch position={[-6.4, 2.6, 14]} />
      <DungeonTorch position={[6.4, 2.6, 14]} />

      <WoodBarrel position={[-5.8, 0, 26]} />
      <WoodBarrel position={[-5.1, 0, 26.2]} broken />
      <DungeonCrate position={[5.6, 0, 25.5]} scale={1.1} />
      <DungeonCrate position={[5.4, 0.85, 25.6]} scale={0.85} rotation={[0, 0.4, 0]} />

      <SkeletonRemains position={[-5.2, 0, 16]} rotation={[0, 0.6, 0]} />
      <HangingCage position={[0, 6.0, 16]} chainLength={2.8} />

      {/* Transition Arch into Room 1 */}
      <StoneArch position={[0, 0, 8]} width={8} height={5.8} />

      {/* ============================================================== */}
      {/* 2. ROOM 1: THE FORGOTTEN CRYPT (Z: 7 to -26)                  */}
      {/* ============================================================== */}
      {/* Floor */}
      <mesh position={[0, -0.05, -9]} receiveShadow rotation={[-Math.PI / 2, 0, 0]} material={floorMaterial}>
        <planeGeometry args={[28, 34]} />
      </mesh>
      {/* Vaulted Stone Arch Ribs (Visually defines ceiling without blocking directional light) */}
      <StoneArch position={[0, 0, 4]} width={28} height={8.5} />
      <StoneArch position={[0, 0, -6]} width={28} height={8.5} />
      <StoneArch position={[0, 0, -16]} width={28} height={8.5} />
      <StoneArch position={[0, 0, -25]} width={28} height={8.5} />
      {/* Side Walls */}
      <mesh position={[-14, 4.2, -9]} material={wallMaterial}>
        <boxGeometry args={[1, 8.5, 34]} />
      </mesh>
      <mesh position={[14, 4.2, -9]} material={wallMaterial}>
        <boxGeometry args={[1, 8.5, 34]} />
      </mesh>

      {/* Massive Columns in Room 1 */}
      <GrandColumn position={[-7.5, 0, -2]} height={8.0} />
      <GrandColumn position={[7.5, 0, -2]} height={8.0} broken />
      <GrandColumn position={[-7.5, 0, -16]} height={8.0} broken />
      <GrandColumn position={[7.5, 0, -16]} height={8.0} />

      {/* Column-mounted torches right in the action area */}
      <DungeonTorch position={[-7.5, 3.2, -1.2]} />
      <DungeonTorch position={[7.5, 3.2, -1.2]} />
      <DungeonTorch position={[-7.5, 3.2, -15.2]} />
      <DungeonTorch position={[7.5, 3.2, -15.2]} />
      <DungeonTorch position={[-4.5, 2.8, 3.5]} />
      <DungeonTorch position={[4.5, 2.8, 3.5]} />

      {/* Tombs and Sarcophagi */}
      <Sarcophagus position={[-11, 0, -5]} rotation={[0, Math.PI / 2, 0]} />
      <Sarcophagus position={[-11, 0, -13]} rotation={[0, Math.PI / 2, 0]} open />
      <Sarcophagus position={[11, 0, -5]} rotation={[0, -Math.PI / 2, 0]} />
      <Sarcophagus position={[11, 0, -13]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Torches in Room 1 */}
      <DungeonTorch position={[-13.4, 3.2, -2]} />
      <DungeonTorch position={[13.4, 3.2, -2]} />
      <DungeonTorch position={[-13.4, 3.2, -16]} />
      <DungeonTorch position={[13.4, 3.2, -16]} />

      {/* Water Puddles & Drips */}
      <WaterPuddle position={[-2.5, 0, -8]} radius={2.6} />
      <DrippingCeilingWater position={[-2.5, 0, -8]} height={8.2} />
      <WaterPuddle position={[4.2, 0, -19]} radius={2.0} />

      {/* Storytelling Debris */}
      <DiscardedShieldAndSword position={[3.2, 0, -4]} rotation={[0, 0.4, 0]} />
      <SkeletonRemains position={[9.5, 0, -18]} rotation={[0, 1.2, 0]} />
      <WoodBarrel position={[12, 0, -23]} />
      <DungeonCrate position={[12, 0, -21.8]} />

      {/* Hanging Iron Cages */}
      <HangingCage position={[-7.5, 8.2, -9]} chainLength={4.2} />
      <HangingCage position={[7.5, 8.2, -9]} chainLength={3.6} />

      {/* Mystic Gate 1 leading to Chasm Bridge at Z = -26 */}
      <MysticDungeonGate position={[0, 0, -26]} isOpen={roomsUnlocked[1]} roomNumber={1} />

      {/* ============================================================== */}
      {/* 3. SUBTERRANEAN BRIDGE OVER CHASM (Z: -27 to -40)             */}
      {/* ============================================================== */}
      {/* Stone Bridge Walkway */}
      <mesh position={[0, -0.05, -33.5]} receiveShadow rotation={[-Math.PI / 2, 0, 0]} material={floorMaterial}>
        <planeGeometry args={[7, 15]} />
      </mesh>
      {/* Bridge Parapets / Low Stone Railings */}
      <mesh position={[-3.5, 0.6, -33.5]}>
        <boxGeometry args={[0.5, 1.2, 15]} />
        <meshStandardMaterial color="#1a1924" roughness={0.9} />
      </mesh>
      <mesh position={[3.5, 0.6, -33.5]}>
        <boxGeometry args={[0.5, 1.2, 15]} />
        <meshStandardMaterial color="#1a1924" roughness={0.9} />
      </mesh>
      {/* Deep Abyss Void underneath bridge */}
      <mesh position={[0, -6.5, -33.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[36, 18]} />
        <meshBasicMaterial color="#020105" />
      </mesh>
      {/* Cold blue/violet chasm light */}
      <pointLight position={[0, -2.5, -33.5]} color="#06b6d4" distance={16} intensity={1.5} />

      {/* Torches on Bridge Posts */}
      <DungeonTorch position={[-3.6, 1.2, -28.5]} />
      <DungeonTorch position={[3.6, 1.2, -28.5]} />
      <DungeonTorch position={[-3.6, 1.2, -38.5]} />
      <DungeonTorch position={[3.6, 1.2, -38.5]} />

      {/* ============================================================== */}
      {/* 4. ROOM 2: ELITE SANCTUM (Z: -41 to -72)                      */}
      {/* ============================================================== */}
      {/* Sunken Central Floor */}
      <mesh position={[0, -0.05, -56.5]} receiveShadow rotation={[-Math.PI / 2, 0, 0]} material={floorMaterial}>
        <planeGeometry args={[26, 31]} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 9.5, -56.5]} rotation={[Math.PI / 2, 0, 0]} material={wallMaterial}>
        <planeGeometry args={[26, 31]} />
      </mesh>
      {/* Side Walls */}
      <mesh position={[-13, 4.7, -56.5]} material={wallMaterial}>
        <boxGeometry args={[1, 9.5, 31]} />
      </mesh>
      <mesh position={[13, 4.7, -56.5]} material={wallMaterial}>
        <boxGeometry args={[1, 9.5, 31]} />
      </mesh>

      {/* Elevated Dais / Dais Platform in Center */}
      <mesh position={[0, 0.12, -56.5]}>
        <cylinderGeometry args={[5.2, 5.8, 0.25, 24]} />
        <meshStandardMaterial color="#1e1d2b" roughness={0.85} />
      </mesh>
      {/* Glowing Arcane Rune Floor Circle */}
      <mesh position={[0, 0.26, -56.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.8, 4.6, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.26, -56.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.8, 32]} />
        <meshBasicMaterial color="#0c4a6e" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Ancient Statues flanking the Sanctum */}
      <AncientStatue position={[-9, 0, -48]} rotation={[0, Math.PI / 3, 0]} />
      <AncientStatue position={[9, 0, -48]} rotation={[0, -Math.PI / 3, 0]} />
      <AncientStatue position={[-9, 0, -65]} rotation={[0, Math.PI / 4, 0]} />
      <AncientStatue position={[9, 0, -65]} rotation={[0, -Math.PI / 4, 0]} />

      {/* Grand Columns in Sanctum */}
      <GrandColumn position={[-6.5, 0, -48]} height={9.0} />
      <GrandColumn position={[6.5, 0, -48]} height={9.0} />
      <GrandColumn position={[-6.5, 0, -65]} height={9.0} />
      <GrandColumn position={[6.5, 0, -65]} height={9.0} />

      {/* Sanctum Torches */}
      <DungeonTorch position={[-12.4, 3.5, -48]} />
      <DungeonTorch position={[12.4, 3.5, -48]} />
      <DungeonTorch position={[-12.4, 3.5, -65]} />
      <DungeonTorch position={[12.4, 3.5, -65]} />

      {/* Mystic Gate 2 leading to Catacombs at Z = -72 */}
      <MysticDungeonGate position={[0, 0, -72]} isOpen={roomsUnlocked[2]} roomNumber={2} />

      {/* ============================================================== */}
      {/* 5. ROOM 3: FLOODED CATACOMBS (Z: -73 to -108)                 */}
      {/* ============================================================== */}
      {/* Floor */}
      <mesh position={[0, -0.05, -90.5]} receiveShadow rotation={[-Math.PI / 2, 0, 0]} material={floorMaterial}>
        <planeGeometry args={[30, 35]} />
      </mesh>
      {/* High Arched Ceiling */}
      <mesh position={[0, 9.0, -90.5]} rotation={[Math.PI / 2, 0, 0]} material={wallMaterial}>
        <planeGeometry args={[30, 35]} />
      </mesh>
      {/* Walls with Crypt Niches */}
      <mesh position={[-15, 4.5, -90.5]} material={wallMaterial}>
        <boxGeometry args={[1, 9.0, 35]} />
      </mesh>
      <mesh position={[15, 4.5, -90.5]} material={wallMaterial}>
        <boxGeometry args={[1, 9.0, 35]} />
      </mesh>

      {/* Elevated Archer Platforms in Alcoves */}
      <mesh position={[-11, 2.0, -82]}>
        <boxGeometry args={[5, 4.0, 5]} />
        <meshStandardMaterial color="#1a1924" roughness={0.9} />
      </mesh>
      <mesh position={[11, 2.0, -82]}>
        <boxGeometry args={[5, 4.0, 5]} />
        <meshStandardMaterial color="#1a1924" roughness={0.9} />
      </mesh>
      <mesh position={[-11, 2.0, -98]}>
        <boxGeometry args={[5, 4.0, 5]} />
        <meshStandardMaterial color="#1a1924" roughness={0.9} />
      </mesh>
      <mesh position={[11, 2.0, -98]}>
        <boxGeometry args={[5, 4.0, 5]} />
        <meshStandardMaterial color="#1a1924" roughness={0.9} />
      </mesh>

      {/* Pillars */}
      <GrandColumn position={[-5, 0, -82]} height={8.5} broken />
      <GrandColumn position={[5, 0, -82]} height={8.5} />
      <GrandColumn position={[-5, 0, -98]} height={8.5} />
      <GrandColumn position={[5, 0, -98]} height={8.5} broken />

      {/* Large Water Puddles & Dripping Stalactites */}
      <WaterPuddle position={[0, 0, -90]} radius={4.2} />
      <DrippingCeilingWater position={[0, 0, -90]} height={8.8} />
      <WaterPuddle position={[-6, 0, -102]} radius={2.4} />
      <WaterPuddle position={[7, 0, -78]} radius={2.2} />

      {/* Environmental Skeletons & Hanging Torture Cages */}
      <HangingCage position={[-4, 8.8, -90]} chainLength={4.2} />
      <HangingCage position={[4, 8.8, -90]} chainLength={4.6} />
      <SkeletonRemains position={[-2, 0, -92]} rotation={[0, -0.8, 0]} />
      <SkeletonRemains position={[6, 0, -96]} rotation={[0, 0.4, 0]} />
      <DiscardedShieldAndSword position={[-8, 0, -76]} />

      {/* Torches in Catacombs */}
      <DungeonTorch position={[-14.4, 3.2, -80]} />
      <DungeonTorch position={[14.4, 3.2, -80]} />
      <DungeonTorch position={[-14.4, 3.2, -96]} />
      <DungeonTorch position={[14.4, 3.2, -96]} />

      {/* Mystic Gate 3 leading to Boss Chamber at Z = -108 */}
      <MysticDungeonGate position={[0, 0, -108]} isOpen={roomsUnlocked[3]} roomNumber={3} />

      {/* ============================================================== */}
      {/* 6. BOSS ARENA: THRONE OF THE ABYSS WARDEN (Z: -109 to -165)   */}
      {/* ============================================================== */}
      {/* Grand 42-meter Circular Stone Chamber Floor */}
      <mesh position={[0, -0.05, -136]} receiveShadow rotation={[-Math.PI / 2, 0, 0]} material={floorMaterial}>
        <circleGeometry args={[27, 48]} />
      </mesh>

      {/* Outer Curved Boundary Walls with Iron Torch Sconces */}
      {Array.from({ length: 28 }).map((_, i) => {
        const angle = (i / 28) * Math.PI * 2;
        // Don't close south entry archway
        if (Math.abs(angle - Math.PI / 2) < 0.28) return null;
        const x = Math.cos(angle) * 27;
        const z = -136 + Math.sin(angle) * 27;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 5, 0]} material={wallMaterial}>
              <boxGeometry args={[6.5, 10, 2.5]} />
            </mesh>
            {i % 4 === 0 && <DungeonTorch position={[0, 3.8, 1.2]} intensity={2.4} />}
          </group>
        );
      })}

      {/* Ring of 8 Colossal Hypostyle Monolith Columns around Boss Chamber */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 16;
        const z = -136 + Math.sin(angle) * 16;
        return <GrandColumn key={i} position={[x, 0, z]} height={9.5} broken={i === 2 || i === 5} />;
      })}

      {/* Grand Arcane Boss Seal Floor Circles */}
      <mesh position={[0, 0.02, -136]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[11, 12.8, 48]} />
        <meshBasicMaterial color="#9333ea" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.02, -136]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[18, 19.5, 48]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.02, -136]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6.5, 36]} />
        <meshBasicMaterial color="#2e1065" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* Weathered Demon King Throne at North End */}
      <group position={[0, 0, -159]}>
        {/* Throne Stone Dais Steps */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[8.5, 1.0, 5.5]} />
          <meshStandardMaterial color="#1a1922" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.3, -0.6]}>
          <boxGeometry args={[6.5, 0.8, 3.8]} />
          <meshStandardMaterial color="#1f1e29" roughness={0.88} />
        </mesh>
        {/* Massive Throne High Backrest */}
        <mesh position={[0, 4.5, -2.1]}>
          <boxGeometry args={[5.2, 5.8, 1.2]} />
          <meshStandardMaterial color="#15141e" roughness={0.92} />
        </mesh>
        {/* Glowing Pulsing Abyssal Core embedded in Throne */}
        <mesh position={[0, 4.8, -1.4]}>
          <octahedronGeometry args={[0.9]} />
          <meshBasicMaterial color="#c084fc" />
        </mesh>
        <pointLight position={[0, 4.8, 0]} color="#9333ea" distance={18} intensity={3.5} />
      </group>
    </group>
  );
};

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWoodMaterials, getIronMaterials } from './DungeonTextures';

// 1. WOODEN DUNGEON BARREL
export const WoodBarrel = ({ position, rotation = [0, 0, 0], broken = false }) => {
  const woodTexture = useMemo(() => getWoodMaterials(), []);
  const ironTexture = useMemo(() => getIronMaterials(), []);

  return (
    <group position={position} rotation={rotation}>
      {/* Barrel Bulging Body */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.9, 14]} />
        <meshStandardMaterial map={woodTexture} roughness={0.8} />
      </mesh>
      {/* Middle bulge ring */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.45, 14]} />
        <meshStandardMaterial map={woodTexture} roughness={0.8} />
      </mesh>
      {/* Iron Hoop Top */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.06, 14]} />
        <meshStandardMaterial map={ironTexture} metalness={0.8} roughness={0.4} />
      </mesh>
      {/* Iron Hoop Middle */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.39, 0.39, 0.06, 14]} />
        <meshStandardMaterial map={ironTexture} metalness={0.8} roughness={0.4} />
      </mesh>
      {/* Iron Hoop Bottom */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.06, 14]} />
        <meshStandardMaterial map={ironTexture} metalness={0.8} roughness={0.4} />
      </mesh>
      {broken && (
        <mesh position={[0.2, 0.1, 0.2]} rotation={[0.4, 0.2, 0]}>
          <boxGeometry args={[0.1, 0.03, 0.4]} />
          <meshStandardMaterial map={woodTexture} />
        </mesh>
      )}
    </group>
  );
};

// 2. DUNGEON WOODEN CRATE
export const DungeonCrate = ({ position, rotation = [0, 0, 0], scale = 1.0 }) => {
  const woodTexture = useMemo(() => getWoodMaterials(), []);
  const ironTexture = useMemo(() => getIronMaterials(), []);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Main Wood Box */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial map={woodTexture} roughness={0.85} />
      </mesh>
      {/* Corner Iron Brackets */}
      {[-0.4, 0.4].map((x, i) =>
        [-0.4, 0.4].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.4, z]}>
            <boxGeometry args={[0.08, 0.82, 0.08]} />
            <meshStandardMaterial map={ironTexture} metalness={0.85} roughness={0.4} />
          </mesh>
        ))
      )}
    </group>
  );
};

// 3. HANGING IRON CAGE (Animated sway)
export const HangingCage = ({ position, chainLength = 3.5 }) => {
  const cageRef = useRef();
  const ironTexture = useMemo(() => getIronMaterials(), []);

  useFrame((state) => {
    if (!cageRef.current) return;
    const t = state.clock.getElapsedTime();
    cageRef.current.rotation.z = Math.sin(t * 1.1 + position[0]) * 0.035;
    cageRef.current.rotation.x = Math.cos(t * 0.8 + position[2]) * 0.025;
  });

  return (
    <group position={position}>
      {/* Ceiling Chain */}
      <mesh position={[0, -chainLength / 2, 0]}>
        <cylinderGeometry args={[0.025, 0.025, chainLength, 6]} />
        <meshStandardMaterial map={ironTexture} metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Cage body hanging at bottom */}
      <group ref={cageRef} position={[0, -chainLength, 0]}>
        {/* Top & Bottom Iron Discs */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.06, 12]} />
          <meshStandardMaterial map={ironTexture} metalness={0.8} />
        </mesh>
        <mesh position={[0, -1.4, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.06, 12]} />
          <meshStandardMaterial map={ironTexture} metalness={0.8} />
        </mesh>
        {/* Vertical Iron Bars */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 0.55, -0.7, Math.sin(angle) * 0.55]}>
              <cylinderGeometry args={[0.02, 0.02, 1.4, 6]} />
              <meshStandardMaterial map={ironTexture} metalness={0.85} roughness={0.35} />
            </mesh>
          );
        })}
        {/* Bones inside cage */}
        <mesh position={[0, -1.2, 0]}>
          <sphereGeometry args={[0.12, 6, 6]} />
          <meshStandardMaterial color="#e5e5d8" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
};

// 4. SKELETON REMAINS & BONES
export const SkeletonRemains = ({ position, rotation = [0, 0, 0] }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Skull */}
      <mesh position={[0, 0.12, 0]} rotation={[0.2, 0.4, 0]}>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color="#d4d4c8" roughness={0.8} />
      </mesh>
      {/* Eye sockets */}
      <mesh position={[0.05, 0.13, 0.11]}>
        <boxGeometry args={[0.04, 0.04, 0.02]} />
        <meshBasicMaterial color="#08080a" />
      </mesh>
      <mesh position={[-0.05, 0.13, 0.11]}>
        <boxGeometry args={[0.04, 0.04, 0.02]} />
        <meshBasicMaterial color="#08080a" />
      </mesh>
      {/* Ribs & Arm bones */}
      <mesh position={[0, 0.04, -0.28]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.26, 0.08, 0.35]} />
        <meshStandardMaterial color="#c8c8bc" roughness={0.9} />
      </mesh>
      {/* Broken Femur */}
      <mesh position={[0.2, 0.03, -0.1]} rotation={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.35, 6]} />
        <meshStandardMaterial color="#e0e0d2" roughness={0.8} />
      </mesh>
    </group>
  );
};

// 5. DISCARDED BATTLE RELIC (Ancient Shield & Broken Sword)
export const DiscardedShieldAndSword = ({ position, rotation = [0, 0, 0] }) => {
  const ironTexture = useMemo(() => getIronMaterials(), []);
  return (
    <group position={position} rotation={rotation}>
      {/* Weathered Iron Heater Shield */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2 + 0.2, 0, 0.3]}>
        <boxGeometry args={[0.55, 0.8, 0.04]} />
        <meshStandardMaterial map={ironTexture} metalness={0.7} roughness={0.5} color="#52525b" />
      </mesh>
      {/* Broken Sword Blade stuck in ground */}
      <group position={[0.25, 0.3, 0.1]} rotation={[0.3, 0, -0.4]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.06, 0.6, 0.015]} />
          <meshStandardMaterial map={ironTexture} metalness={0.9} roughness={0.3} color="#94a3b8" />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.18, 0.03, 0.04]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
};

// 6. WATER PUDDLE WITH ANIMATED WATER DRIP RIPPLE
export const WaterPuddle = ({ position, radius = 2.2 }) => {
  const rippleRef = useRef();

  useFrame((state) => {
    if (!rippleRef.current) return;
    const t = state.clock.getElapsedTime();
    const cycle = (t * 0.9 + position[0]) % 1.8;
    const scale = (cycle / 1.8) * (radius * 0.7);
    rippleRef.current.scale.set(scale, scale, 1);
    rippleRef.current.material.opacity = Math.max(0, 0.6 - (cycle / 1.8) * 0.6);
  });

  return (
    <group position={position}>
      {/* Reflective Wet Puddle Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[radius, 24]} />
        <meshStandardMaterial
          color="#0d1117"
          roughness={0.06}
          metalness={0.2}
          transparent
          opacity={0.82}
        />
      </mesh>
      {/* Water ripple ring */}
      <mesh ref={rippleRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.1, 0.16, 24]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// 7. DRIPPING CEILING WATER DROPLET
export const DrippingCeilingWater = ({ position, height = 6.5 }) => {
  const dropRef = useRef();

  useFrame((state) => {
    if (!dropRef.current) return;
    const t = state.clock.getElapsedTime();
    const fallTime = 1.4;
    const phase = (t + position[0] * 2) % fallTime;
    const progress = phase / fallTime;
    dropRef.current.position.y = height * (1 - progress);
    dropRef.current.scale.set(0.04, 0.08 * (1 + progress), 0.04);
  });

  return (
    <group position={position}>
      <mesh ref={dropRef} position={[0, height, 0]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.7} />
      </mesh>
    </group>
  );
};

// 8. WEATHERED STONE SENTINEL STATUE
export const AncientStatue = ({ position, rotation = [0, 0, 0] }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Plinth */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.2, 0.7, 1.2]} />
        <meshStandardMaterial color="#212028" roughness={0.9} />
      </mesh>
      {/* Robed / Armored Torso */}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[0.7, 1.6, 0.5]} />
        <meshStandardMaterial color="#1a1922" roughness={0.9} />
      </mesh>
      {/* Weathered Helmet Head */}
      <mesh position={[0, 2.7, 0]}>
        <boxGeometry args={[0.42, 0.55, 0.42]} />
        <meshStandardMaterial color="#23222d" roughness={0.85} />
      </mesh>
      {/* Broken Greatsword resting point down */}
      <mesh position={[0, 1.2, 0.35]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.1, 1.8, 0.04]} />
        <meshStandardMaterial color="#3f3f46" metalness={0.7} roughness={0.5} />
      </mesh>
    </group>
  );
};

// 9. GRAND KEYSTONE STONE ARCH
export const StoneArch = ({ position, width = 7.0, height = 6.0 }) => {
  return (
    <group position={position}>
      {/* Left Pillar Column */}
      <mesh position={[-width / 2, height / 2, 0]}>
        <boxGeometry args={[1.2, height, 1.2]} />
        <meshStandardMaterial color="#201f29" roughness={0.9} />
      </mesh>
      {/* Right Pillar Column */}
      <mesh position={[width / 2, height / 2, 0]}>
        <boxGeometry args={[1.2, height, 1.2]} />
        <meshStandardMaterial color="#201f29" roughness={0.9} />
      </mesh>
      {/* Lintel Beam */}
      <mesh position={[0, height + 0.3, 0]}>
        <boxGeometry args={[width + 1.6, 0.8, 1.4]} />
        <meshStandardMaterial color="#191822" roughness={0.9} />
      </mesh>
      {/* Keystone block */}
      <mesh position={[0, height + 0.65, 0.1]}>
        <boxGeometry args={[0.8, 0.9, 1.5]} />
        <meshStandardMaterial color="#2b2938" roughness={0.8} />
      </mesh>
    </group>
  );
};

// 10. HEAVY IRON PORTCULLIS GATE
export const IronPortcullis = ({ position, isOpen }) => {
  const ironTexture = useMemo(() => getIronMaterials(), []);
  const gateY = isOpen ? 4.5 : 2.2;

  return (
    <group position={position}>
      {/* Sliding Gate Frame */}
      <group position={[0, gateY, 0]}>
        {/* Horizontal Bars */}
        {[-1.5, -0.5, 0.5, 1.5].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <boxGeometry args={[6.8, 0.08, 0.08]} />
            <meshStandardMaterial map={ironTexture} metalness={0.85} roughness={0.35} />
          </mesh>
        ))}
        {/* Vertical Spiked Bars */}
        {Array.from({ length: 12 }).map((_, i) => {
          const x = -3.2 + i * 0.58;
          return (
            <group key={i} position={[x, 0, 0]}>
              <mesh>
                <boxGeometry args={[0.07, 3.8, 0.07]} />
                <meshStandardMaterial map={ironTexture} metalness={0.85} roughness={0.35} />
              </mesh>
              {/* Bottom Spike */}
              <mesh position={[0, -2.0, 0]} rotation={[0, 0, Math.PI]}>
                <coneGeometry args={[0.07, 0.3, 4]} />
                <meshStandardMaterial map={ironTexture} metalness={0.85} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
};

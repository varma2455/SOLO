import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { globalPlayerState } from '../player/Player';
import { sound } from '../../audio/soundManager';
import { safeVector3, DEFAULT_PLAYER_POSITION } from '../../utils/vector3';
import { registerEnemyPosition, unregisterEnemyPosition } from '../combat/EnemyPositionTracker';
import { buildAbyssWardenModel } from '../enemies/MonsterModelBuilder';
import { MonsterAnimationController } from '../enemies/MonsterAnimationController';

const _bossPPos = new THREE.Vector3();
const _bossDir = new THREE.Vector3();
const _bossSlamTarget = new THREE.Vector3();

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

  // Procedural anatomical 3D Abyss Warden titan model and skeletal animation controller
  const { rootModel, nodes, animController } = useMemo(() => {
    const res = buildAbyssWardenModel();
    const anim = new MonsterAnimationController(res.nodes, 'boss');
    return { rootModel: res.root, nodes: res.nodes, animController: anim };
  }, []);

  // Dispose memory on unmount
  useEffect(() => {
    return () => {
      if (rootModel) {
        rootModel.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
              else child.material.dispose();
            }
          }
        });
      }
    };
  }, [rootModel]);

  // Boss location centered in the grand hypostyle arena
  const pos = useRef(new THREE.Vector3(0, 0, -140));
  const rotation = useRef(0);
  const attackTimer = useRef(2.0);
  const specialTimer = useRef(7.0);
  const hasSummonedAdds = useRef(false);
  const hasRoaredAwakening = useRef(false);
  const prevHp = useRef(bossHp);

  // Awakening roar on first load
  useEffect(() => {
    if (!hasRoaredAwakening.current) {
      hasRoaredAwakening.current = true;
      sound.playBossRoar();
    }
  }, []);

  // Monitor Boss HP & trigger flinch on damage
  useEffect(() => {
    if (bossHp < prevHp.current) {
      animController?.triggerHit(0.24);
    }
    prevHp.current = bossHp;

    if (bossHp <= 0 && aiState !== 'DEAD') {
      setAiState('DEAD');
      unregisterEnemyPosition('abyssWarden');
      sound.playBossRoar();
      if (onBossDefeated) {
        onBossDefeated([pos.current.x, 0.5, pos.current.z]);
      }
    }
  }, [bossHp, aiState, onBossDefeated, animController]);

  // Clean up boss tracking on unmount
  useEffect(() => {
    return () => {
      unregisterEnemyPosition('abyssWarden');
    };
  }, []);

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

    if (globalPlayerState && (globalPlayerState.pos || globalPlayerState.posVec)) {
      _bossPPos.copy(globalPlayerState.pos || globalPlayerState.posVec);
    } else {
      const curP = safeVector3(playerPos, DEFAULT_PLAYER_POSITION, 'AbyssWardenBoss:playerPos');
      _bossPPos.set(curP[0], curP[1], curP[2]);
    }

    const distToPlayer = pos.current.distanceTo(_bossPPos);

    // Speed bonus if enraged
    const speed = bossRage ? 5.5 : 3.6;

    // Telegraph area attack in Phase 3 or Phase 4
    if (bossPhase >= 3 && specialTimer.current <= 0 && distToPlayer < 24) {
      specialTimer.current = bossRage ? 5.5 : 9.0;
      setAiState('TELEGRAPH');
      animController?.triggerAttack();
      setShowTelegraph(true);
      const safeTel = [_bossPPos.x, 0.05, _bossPPos.z];
      setTelegraphPos(safeTel);
      sound.playBossRoar();

      setTimeout(() => {
        setShowTelegraph(false);
        if (aiState !== 'DEAD') {
          sound.playVoidBurst();
          const pCurrent = globalPlayerState ? (globalPlayerState.pos || globalPlayerState.posVec || _bossPPos) : _bossPPos;
          const [tx, , tz] = safeVector3(safeTel, [0, 0, -140], 'AbyssWardenBoss:slamTarget');
          _bossSlamTarget.set(tx, 0, tz);
          const slamDist = pCurrent.distanceTo(_bossSlamTarget);
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
          animController?.triggerAttack();

          if (swordRef.current) {
            swordRef.current.rotation.x = -2.2;
            setTimeout(() => {
              if (swordRef.current) swordRef.current.rotation.x = 0.2;
            }, 360);
          }

          setTimeout(() => {
            if (aiState !== 'DEAD') {
              const pCurrent = globalPlayerState ? (globalPlayerState.pos || globalPlayerState.posVec || _bossPPos) : _bossPPos;
              if (pos.current.distanceTo(pCurrent) <= 6.0) {
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
        _bossDir.subVectors(_bossPPos, pos.current).normalize();
        pos.current.addScaledVector(_bossDir, speed * dt);
        rotation.current = Math.atan2(_bossDir.x, _bossDir.z);
      }
    }

    // Apply movement
    meshRef.current.position.copy(pos.current);
    meshRef.current.rotation.y = rotation.current;

    // Update procedural skeletal animation machine
    const isMoving = aiState === 'CHASE';
    const isDead = aiState === 'DEAD' || bossHp <= 0;
    animController?.update(dt, isMoving, isDead, true, bossRage);

    registerEnemyPosition('abyssWarden', [pos.current.x, pos.current.y, pos.current.z], bossHp, bossMaxHp, {
      isBoss: true,
      name: 'Abyss Warden',
      role: 'boss',
      tier: 'boss'
    });

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

        {/* Procedural 3D Boss Model (~4.5m Imposing Titan) */}
        <primitive object={rootModel} />
      </group>
    </>
  );
};

// -------------------------------------------------------------
// SHADOW ASCENSION - ENEMY MANAGER WITH EXPLORE-FIRST SYSTEM
// Supports: Dormant exploration preview, proximity monster discovery,
// and dedicated battle arena combat activation.
// -------------------------------------------------------------

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { ENEMY_TYPES } from '../../data/enemies';
import { generateDungeonEncounters } from '../encounters/EncounterManager';
import { getRandomLoot } from '../../data/items';
import { calculatePlayerDamage, checkConeCollision, checkCircleCollision } from '../combat/CombatEngine';
import { Enemy } from './Enemy';
import { AbyssWardenBoss } from '../bosses/AbyssWardenBoss';
import { LootItem, ExtractionBeacon } from '../combat/LootItem';
import { sound } from '../../audio/soundManager';
import { globalPlayerState } from '../player/Player';
import { safeVector3, DEFAULT_PLAYER_POSITION } from '../../utils/vector3';
import { getEnemyPosition } from '../combat/EnemyPositionTracker';

export const EnemyManager = ({
  playerPos,
  combatAttackEvent,
  skillEvent,
  shadowAttackEvent,
  onLivingEnemiesChange
}) => {
  // Store actions & state
  const dungeon = useGameStore((s) => s.dungeon);
  const player = useGameStore((s) => s.player);
  const gameFlowState = useGameStore((s) => s.gameFlowState);
  const activeEncounter = useGameStore((s) => s.activeEncounter);
  const discoverMonster = useGameStore((s) => s.discoverMonster);
  const onEncounterVictory = useGameStore((s) => s.onEncounterVictory);
  const recordMonsterDefeated = useGameStore((s) => s.recordMonsterDefeated);
  const gainXp = useGameStore((s) => s.gainXp);
  const gainGold = useGameStore((s) => s.gainGold);
  const addDamageText = useGameStore((s) => s.addDamageText);
  const takeDamage = useGameStore((s) => s.takeDamage);
  const addItemToInventory = useGameStore((s) => s.addItemToInventory);
  const updateBossHp = useGameStore((s) => s.updateBossHp);
  const spawnWaveEvent = useGameStore((s) => s.spawnWaveEvent);
  const executionEvent = useGameStore((s) => s.executionEvent);
  const setExecutableEnemyId = useGameStore((s) => s.setExecutableEnemyId);

  // Active enemies list in current scene
  const [enemies, setEnemies] = useState([]);
  const [loots, setLoots] = useState([]);
  const [beacons, setBeacons] = useState([]);
  const frameCounter = useRef(0);

  // Check if any commander is alive to broadcast commander aura buff
  const isCommanderAlive = useMemo(() => {
    return enemies.some((e) => (e.isCommander || e.tier === 'commander') && e.hp > 0);
  }, [enemies]);

  // Report living enemies to Shadow Army companions
  useEffect(() => {
    if (!onLivingEnemiesChange) return;
    const living = enemies
      .filter((e) => e.hp > 0)
      .map((e) => ({
        id: e.id,
        position: safeVector3(e.spawnPosition, [0, 0, 0], 'EnemyManager:livingEnemies'),
        hp: e.hp
      }));
    if (dungeon.bossActive && dungeon.bossHp > 0) {
      living.push({ id: 'abyssWarden', position: [0, 0, -138], hp: dungeon.bossHp });
    }
    onLivingEnemiesChange(living);
  }, [enemies, dungeon.bossActive, dungeon.bossHp, onLivingEnemiesChange]);

  // Synchronize enemies whenever dungeon encounters or state change
  useEffect(() => {
    const encMap = dungeon.encounters || generateDungeonEncounters(dungeon.rank || 'E', player.level || 1, dungeon.seed || 133789);
    const encState = dungeon.encountersState || {};
    const visibleEnemies = [];

    // For rooms 1, 2, 3: render enemies if the encounter is NOT defeated
    for (let r = 1; r <= 3; r++) {
      const enc = encMap[r];
      if (enc && !encState[enc.id]?.defeated && !enc.defeated) {
        if (enc.enemies) {
          visibleEnemies.push(...enc.enemies);
        }
      }
    }

    setEnemies(visibleEnemies);
  }, [dungeon.encounters, dungeon.encountersState, dungeon.seed, dungeon.rank]);

  // Proximity Detection Loop: checks distance to undefeated monsters during EXPLORING mode
  useFrame(() => {
    if (gameFlowState !== 'EXPLORING') return;

    frameCounter.current++;
    // Throttled check every 8 frames (~7.5 Hz) for zero performance impact
    if (frameCounter.current % 8 !== 0) return;

    const pPos = globalPlayerState?.pos || new THREE.Vector3(0, 0.5, 24);
    const encMap = dungeon.encounters;
    const encState = dungeon.encountersState || {};
    if (!encMap) return;

    // Check each room's encounter
    for (const enc of Object.values(encMap)) {
      if (!enc || enc.defeated || encState[enc.id]?.defeated) continue;

      // Don't check rooms far away
      if (Math.abs(enc.roomIndex - dungeon.currentRoom) > 1) continue;

      const center = safeVector3(enc.encounterCenter, [0, 0, 0], 'EnemyManager:encounterCenter');
      const dx = pPos.x - center[0];
      const dz = pPos.z - center[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= enc.discoveryDistance) {
        discoverMonster(enc);
        break;
      }
    }
  });

  // Listen for wave reinforcement spawns (e.g. Swarm Wave 2/3)
  useEffect(() => {
    if (!spawnWaveEvent || !spawnWaveEvent.wave) return;
    const incomingEnemies = spawnWaveEvent.wave.enemies;
    setEnemies((prev) => [...prev, ...incomingEnemies]);
  }, [spawnWaveEvent]);

  // Handle Finisher / Execution Event
  useEffect(() => {
    if (!executionEvent || !executionEvent.targetEnemy) return;
    const target = executionEvent.targetEnemy;

    setEnemies((prev) =>
      prev.map((en) => {
        if (en.id === target.id && en.hp > 0) {
          const enPos = safeVector3(en.spawnPosition, [0, 1.5, 0], 'EnemyManager:execution');
          addDamageText(9999, [enPos[0], 2.4, enPos[2]], true);
          return { ...en, hp: 0 };
        }
        return en;
      })
    );
  }, [executionEvent, addDamageText]);

  // Handle incoming attacks from summoned Shadow companions
  useEffect(() => {
    if (!shadowAttackEvent || gameFlowState !== 'BATTLE') return;
    handleShadowAttackEnemy(shadowAttackEvent.shadow, shadowAttackEvent.enemyId, shadowAttackEvent.power);
  }, [shadowAttackEvent, gameFlowState]);

  // Process Basic Attack Hits (Only active during BATTLE)
  useEffect(() => {
    if (!combatAttackEvent || gameFlowState !== 'BATTLE') return;
    const { position, angle, multiplier, range } = combatAttackEvent;

    // Check hit on Boss
    if (dungeon.bossActive && dungeon.bossHp > 0) {
      const bossPos = getEnemyPosition('abyssWarden', [0, 0, -138]);
      const isBossHit = checkConeCollision(position, angle, bossPos, range + 2.8, 85);
      if (isBossHit) {
        const { damage, isCrit } = calculatePlayerDamage(multiplier);
        sound.playHit(isCrit);
        addDamageText(damage, [bossPos[0], 2.8, bossPos[2]], isCrit);
        updateBossHp(dungeon.bossHp - damage);
      }
    }

    // Check hit on regular enemies of active encounter
    setEnemies((prev) =>
      prev.map((en) => {
        if (en.hp <= 0) return en;

        const livePos = getEnemyPosition(en.id, en.spawnPosition);
        const enPos = safeVector3(livePos, [0, 1.5, 0], 'EnemyManager:combatHit');
        const isHit = checkConeCollision(position, angle, enPos, range, 85);
        if (isHit) {
          const { damage, isCrit } = calculatePlayerDamage(multiplier);
          sound.playHit(isCrit);
          addDamageText(damage, [enPos[0], 1.5, enPos[2]], isCrit);
          return { ...en, hp: Math.max(0, en.hp - damage) };
        }
        return en;
      })
    );
  }, [combatAttackEvent, gameFlowState, dungeon.bossActive, dungeon.bossHp, addDamageText, updateBossHp]);

  // Process Skill Hits (Shadow Slash, Void Burst, Eclipse Dominion)
  useEffect(() => {
    if (!skillEvent || gameFlowState !== 'BATTLE') return;
    const { skillId, position, angle, range, multiplier } = skillEvent;

    // Hit Boss with skill
    if (dungeon.bossActive && dungeon.bossHp > 0) {
      const bossPos = getEnemyPosition('abyssWarden', [0, 0, -138]);
      let bossHit = false;

      if (skillId === 'shadowSlash') {
        bossHit = checkConeCollision(position, angle, bossPos, range + 2.5, 75);
      } else {
        bossHit = checkCircleCollision(position, bossPos, range + 3.0);
      }

      if (bossHit) {
        const { damage, isCrit } = calculatePlayerDamage(multiplier);
        sound.playHit(isCrit);
        addDamageText(damage, [bossPos[0], 3.0, bossPos[2]], isCrit);
        updateBossHp(dungeon.bossHp - damage);
      }
    }

    // Hit normal enemies with skill
    setEnemies((prev) =>
      prev.map((en) => {
        if (en.hp <= 0) return en;

        const livePos = getEnemyPosition(en.id, en.spawnPosition);
        const enPos = safeVector3(livePos, [0, 1.5, 0], 'EnemyManager:skillHit');
        let hit = false;
        if (skillId === 'shadowSlash') {
          hit = checkConeCollision(position, angle, enPos, range, 75);
        } else {
          hit = checkCircleCollision(position, enPos, range);
        }

        if (hit) {
          const { damage, isCrit } = calculatePlayerDamage(multiplier);
          sound.playHit(isCrit);
          addDamageText(damage, [enPos[0], 1.6, enPos[2]], isCrit);
          return { ...en, hp: Math.max(0, en.hp - damage) };
        }
        return en;
      })
    );
  }, [skillEvent, gameFlowState, dungeon.bossActive, dungeon.bossHp, addDamageText, updateBossHp]);

  // Shadow Minions attacking enemies
  const handleShadowAttackEnemy = (shadow, enemyId, attackPower) => {
    setEnemies((prev) =>
      prev.map((en) => {
        if (en.id === enemyId && en.hp > 0) {
          const enPos = safeVector3(en.spawnPosition, [0, 1.5, 0], 'EnemyManager:shadowAtk');
          const dmg = Math.round(attackPower * (0.9 + Math.random() * 0.2));
          addDamageText(dmg, [enPos[0], 1.4, enPos[2]], false);
          return { ...en, hp: Math.max(0, en.hp - dmg) };
        }
        return en;
      })
    );

    // If attacking boss
    if (enemyId === 'abyssWarden' && dungeon.bossActive && dungeon.bossHp > 0) {
      const dmg = Math.round(attackPower * (0.9 + Math.random() * 0.2));
      addDamageText(dmg, [0, 3.0, -138], false);
      updateBossHp(dungeon.bossHp - dmg);
    }
  };

  // Enemy Death Handler
  const handleEnemyDeath = useCallback((enemy, deathPos) => {
    const safeDeath = safeVector3(deathPos, [0, 0.5, 0], 'EnemyManager:enemyDeath');
    gainXp(enemy.xpReward || 35);
    gainGold(enemy.goldReward || 15);
    recordMonsterDefeated(enemy.id, safeDeath);

    // Spawn Loot Crystal
    const droppedItems = getRandomLoot(enemy.id?.split('_')[0] || 'ashGoblin');
    const lootId = 'loot_' + Math.random().toString(36).substring(2, 7);
    setLoots((prev) => [
      ...prev,
      {
        id: lootId,
        position: [safeDeath[0], 0.6, safeDeath[2]],
        items: droppedItems,
        rarityColor: enemy.tier === 'commander' ? '#f97316' : enemy.tier === 'elite' ? '#38bdf8' : '#fbbf24'
      }
    ]);

    // If extractable, calculate extraction chance and spawn soul extraction beacon
    const rate = enemy.extractionRate || (enemy.tier === 'elite' ? 0.85 : 0.25);
    if (enemy.extractable && Math.random() <= rate) {
      const beaconId = 'beacon_' + Math.random().toString(36).substring(2, 7);
      setBeacons((prev) => [
        ...prev,
        {
          id: beaconId,
          name: enemy.shadowName || enemy.name,
          rank: enemy.shadowRank || enemy.rank,
          shadowId: enemy.shadowName?.toLowerCase().replace(/\s+/g, '_') || 'shadow_stalker',
          position: [safeDeath[0], 0.1, safeDeath[2]]
        }
      ]);
    }
  }, [gainXp, gainGold, recordMonsterDefeated]);

  // Boss Defeated Handler
  const handleBossDefeated = useCallback((deathPos) => {
    const safeDeath = safeVector3(deathPos, [0, 0.8, -138], 'EnemyManager:bossDefeated');
    gainXp(4500);
    gainGold(2400);
    const bossLoot = getRandomLoot('abyssWarden');
    setLoots((prev) => [
      ...prev,
      {
        id: 'boss_loot',
        position: [safeDeath[0], 0.8, safeDeath[2]],
        items: bossLoot,
        rarityColor: '#f43f5e'
      }
    ]);
  }, [gainXp, gainGold]);

  // Boss Phase 2 & 3 summons
  const handleSpawnBossMinions = useCallback((positions) => {
    const newAdds = (positions || []).map((pos, idx) => ({
      id: `boss_add_${Date.now()}_${idx}`,
      ...ENEMY_TYPES.boneReaver,
      spawnPosition: safeVector3(pos, [0, 0.5, -138], 'bossMinions'),
      hp: ENEMY_TYPES.boneReaver.baseHp || 180,
      maxHp: ENEMY_TYPES.boneReaver.baseHp || 180,
      room: 4
    }));
    setEnemies((prev) => [...prev, ...newAdds]);
  }, []);

  // Loot Collection
  const handleCollectLoot = useCallback((loot) => {
    sound.playLoot();
    if (loot.items && loot.items.length > 0) {
      loot.items.forEach((item) => addItemToInventory(item));
    }
    setLoots((prev) => prev.filter((l) => l.id !== loot.id));
  }, [addItemToInventory]);

  // Enemy attacks player (Only damages player during BATTLE)
  const handleEnemyAttackPlayer = useCallback((damage) => {
    if (useGameStore.getState().gameFlowState !== 'BATTLE') return;
    const actual = takeDamage(damage);
    if (actual > 0) {
      const p = globalPlayerState?.pos || (playerPos ? safeVector3(playerPos, DEFAULT_PLAYER_POSITION) : null);
      const safeP = p ? [p.x ?? p[0] ?? 0, (p.y ?? p[1] ?? 0.5) + 1.2, p.z ?? p[2] ?? 24] : [0, 1.7, 24];
      addDamageText(`-${actual}`, safeP, false, true);
    }
  }, [takeDamage, addDamageText, playerPos]);

  // Finisher target proximity
  const handleNearExecutable = useCallback((enemyId, isNear) => {
    if (isNear && gameFlowState === 'BATTLE') {
      const target = enemies.find((e) => e.id === enemyId);
      if (target) setExecutableEnemyId(target);
    } else {
      setExecutableEnemyId(null);
    }
  }, [enemies, gameFlowState, setExecutableEnemyId]);

  // Determine whether an enemy is dormant:
  // An enemy is ONLY active when gameFlowState === 'BATTLE' and it belongs to the active encounter.
  const isEncounterActiveInBattle = (enemy) => {
    if (gameFlowState !== 'BATTLE' || !activeEncounter) return false;
    return enemy.room === activeEncounter.roomIndex;
  };

  const currentPPos = playerPos || globalPlayerState?.position || DEFAULT_PLAYER_POSITION;

  return (
    <group>
      {/* Enemies in the dungeon */}
      {enemies.map((en) => {
        const isBattleActive = isEncounterActiveInBattle(en);
        return (
          <Enemy
            key={en.id}
            enemyData={en}
            playerPos={currentPPos}
            onEnemyDeath={handleEnemyDeath}
            onEnemyAttackPlayer={handleEnemyAttackPlayer}
            commanderAlive={isCommanderAlive}
            onNearExecutable={handleNearExecutable}
            isDormant={!isBattleActive}
          />
        );
      })}

      {/* Boss Abyss Warden in Room 4 */}
      {dungeon.bossActive && dungeon.bossHp > 0 && (
        <AbyssWardenBoss
          playerPos={currentPPos}
          onBossAttackPlayer={handleEnemyAttackPlayer}
          onBossDefeated={handleBossDefeated}
          onSpawnMinions={handleSpawnBossMinions}
        />
      )}

      {/* Loot Drops */}
      {loots.map((loot) => (
        <LootItem key={loot.id} loot={loot} playerPos={currentPPos} onCollect={handleCollectLoot} />
      ))}

      {/* Soul Extraction Beacons */}
      {beacons.map((beacon) => (
        <ExtractionBeacon key={beacon.id} beacon={beacon} playerPos={currentPPos} />
      ))}
    </group>
  );
};

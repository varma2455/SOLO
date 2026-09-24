// -------------------------------------------------------------
// SHADOW ASCENSION - ENEMY MANAGER WITH DYNAMIC ENCOUNTERS
// Coordinates multi-tier waves, commanders, ambushes, and finishers
// -------------------------------------------------------------

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ENEMY_TYPES } from '../../data/enemies';
import { generateDungeonEncounters } from '../encounters/EncounterManager';
import { getRandomLoot } from '../../data/items';
import { calculatePlayerDamage, checkConeCollision, checkCircleCollision } from '../combat/CombatEngine';
import { Enemy } from './Enemy';
import { AbyssWardenBoss } from '../bosses/AbyssWardenBoss';
import { LootItem, ExtractionBeacon } from '../combat/LootItem';
import { sound } from '../../audio/soundManager';

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

  // Active enemies list
  const [enemies, setEnemies] = useState([]);
  const [loots, setLoots] = useState([]);
  const [beacons, setBeacons] = useState([]);

  // Check if any commander is alive to broadcast commander aura buff
  const isCommanderAlive = useMemo(() => {
    return enemies.some((e) => (e.isCommander || e.tier === 'commander') && e.hp > 0);
  }, [enemies]);

  // Report living enemies to Shadow Army companions
  useEffect(() => {
    if (!onLivingEnemiesChange) return;
    const living = enemies
      .filter((e) => e.hp > 0)
      .map((e) => ({ id: e.id, position: e.spawnPosition, hp: e.hp }));
    if (dungeon.bossActive && dungeon.bossHp > 0) {
      living.push({ id: 'abyssWarden', position: [0, 0, -140], hp: dungeon.bossHp });
    }
    onLivingEnemiesChange(living);
  }, [enemies, dungeon.bossActive, dungeon.bossHp, onLivingEnemiesChange]);

  // Initialize or reload enemies whenever dungeon encounters are generated
  useEffect(() => {
    const enc = dungeon.encounters || generateDungeonEncounters(dungeon.rank || 'E', player.level || 1);
    const initialList = [];
    if (enc[1]?.enemies) initialList.push(...enc[1].enemies);
    if (enc[2]?.enemies) initialList.push(...enc[2].enemies);
    if (enc[3]?.enemies) initialList.push(...enc[3].enemies);

    setEnemies(initialList);
  }, [dungeon.encounters]);

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
          addDamageText(9999, [en.spawnPosition[0], 2.4, en.spawnPosition[2]], true);
          return { ...en, hp: 0 };
        }
        return en;
      })
    );
  }, [executionEvent, addDamageText]);

  // Handle incoming attacks from summoned Shadow companions
  useEffect(() => {
    if (!shadowAttackEvent) return;
    handleShadowAttackEnemy(shadowAttackEvent.shadow, shadowAttackEvent.enemyId, shadowAttackEvent.power);
  }, [shadowAttackEvent]);

  // Process Basic Attack Hits
  useEffect(() => {
    if (!combatAttackEvent) return;
    const { position, angle, multiplier, range } = combatAttackEvent;

    // Check hit on Boss
    if (dungeon.bossActive && dungeon.bossHp > 0) {
      const bossPos = [0, 0, -140];
      const isBossHit = checkConeCollision(position, angle, bossPos, range + 2.4, 75);
      if (isBossHit) {
        const { damage, isCrit } = calculatePlayerDamage(multiplier);
        sound.playHit(isCrit);
        addDamageText(damage, [bossPos[0], 2.8, bossPos[2]], isCrit);
        updateBossHp(dungeon.bossHp - damage);
      }
    }

    // Check hit on regular enemies
    setEnemies((prev) =>
      prev.map((en) => {
        if (en.hp <= 0) return en;

        const isHit = checkConeCollision(position, angle, en.spawnPosition, range, 75);
        if (isHit) {
          const { damage, isCrit } = calculatePlayerDamage(multiplier);
          sound.playHit(isCrit);
          addDamageText(damage, [en.spawnPosition[0], 1.5, en.spawnPosition[2]], isCrit);
          return { ...en, hp: Math.max(0, en.hp - damage) };
        }
        return en;
      })
    );
  }, [combatAttackEvent, dungeon.bossActive, dungeon.bossHp, addDamageText, updateBossHp]);

  // Process Skill Hits (Shadow Slash, Void Burst, Eclipse Dominion)
  useEffect(() => {
    if (!skillEvent) return;
    const { skillId, position, angle, range, multiplier } = skillEvent;

    // Hit Boss with skill
    if (dungeon.bossActive && dungeon.bossHp > 0) {
      const bossPos = [0, 0, -140];
      let bossHit = false;

      if (skillId === 'shadowSlash') {
        bossHit = checkConeCollision(position, angle, bossPos, range + 2.5, 60);
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

        let hit = false;
        if (skillId === 'shadowSlash') {
          hit = checkConeCollision(position, angle, en.spawnPosition, range, 60);
        } else {
          hit = checkCircleCollision(position, en.spawnPosition, range);
        }

        if (hit) {
          const { damage, isCrit } = calculatePlayerDamage(multiplier);
          sound.playHit(isCrit);
          addDamageText(damage, [en.spawnPosition[0], 1.6, en.spawnPosition[2]], isCrit);
          return { ...en, hp: Math.max(0, en.hp - damage) };
        }
        return en;
      })
    );
  }, [skillEvent, dungeon.bossActive, dungeon.bossHp, addDamageText, updateBossHp]);

  // Shadow Minions attacking enemies
  const handleShadowAttackEnemy = (shadow, enemyId, attackPower) => {
    setEnemies((prev) =>
      prev.map((en) => {
        if (en.id === enemyId && en.hp > 0) {
          const dmg = Math.round(attackPower * (0.9 + Math.random() * 0.2));
          addDamageText(dmg, [en.spawnPosition[0], 1.4, en.spawnPosition[2]], false);
          return { ...en, hp: Math.max(0, en.hp - dmg) };
        }
        return en;
      })
    );

    // If attacking boss
    if (enemyId === 'abyssWarden' && dungeon.bossActive && dungeon.bossHp > 0) {
      const dmg = Math.round(attackPower * (0.9 + Math.random() * 0.2));
      addDamageText(dmg, [0, 3.0, -140], false);
      updateBossHp(dungeon.bossHp - dmg);
    }
  };

  // Enemy Death Handler
  const handleEnemyDeath = useCallback((enemy, deathPos) => {
    gainXp(enemy.xpReward || 35);
    gainGold(enemy.goldReward || 15);
    recordMonsterDefeated(enemy.id, deathPos);

    // Spawn Loot Crystal
    const droppedItems = getRandomLoot(enemy.id?.split('_')[0] || 'ashGoblin');
    const lootId = 'loot_' + Math.random().toString(36).substring(2, 7);
    setLoots((prev) => [
      ...prev,
      {
        id: lootId,
        position: [deathPos[0], 0.6, deathPos[2]],
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
          position: [deathPos[0], 0.1, deathPos[2]]
        }
      ]);
    }
  }, [gainXp, gainGold, recordMonsterDefeated]);

  // Boss Defeated Handler
  const handleBossDefeated = useCallback((deathPos) => {
    gainXp(4500);
    gainGold(2400);
    const bossLoot = getRandomLoot('abyssWarden');
    setLoots((prev) => [
      ...prev,
      {
        id: 'boss_loot',
        position: [deathPos[0], 0.8, deathPos[2]],
        items: bossLoot,
        rarityColor: '#f43f5e'
      }
    ]);
  }, [gainXp, gainGold]);

  // Boss Phase 2 & 3 summons
  const handleSpawnBossMinions = useCallback((positions) => {
    const newAdds = positions.map((pos, idx) => ({
      id: `boss_add_${Date.now()}_${idx}`,
      ...ENEMY_TYPES.boneReaver,
      spawnPosition: pos,
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

  // Enemy attacks player
  const handleEnemyAttackPlayer = useCallback((damage) => {
    const actual = takeDamage(damage);
    if (actual > 0) {
      addDamageText(`-${actual}`, playerPos, false, true);
    }
  }, [takeDamage, addDamageText, playerPos]);

  // Finisher target proximity
  const handleNearExecutable = useCallback((enemyId, isNear) => {
    if (isNear) {
      const target = enemies.find((e) => e.id === enemyId);
      if (target) setExecutableEnemyId(target);
    } else {
      setExecutableEnemyId(null);
    }
  }, [enemies, setExecutableEnemyId]);

  return (
    <group>
      {/* Dynamic Enemies */}
      {enemies.map((en) => (
        <Enemy
          key={en.id}
          enemyData={en}
          playerPos={playerPos}
          onEnemyDeath={handleEnemyDeath}
          onEnemyAttackPlayer={handleEnemyAttackPlayer}
          commanderAlive={isCommanderAlive}
          onNearExecutable={handleNearExecutable}
        />
      ))}

      {/* Boss Abyss Warden */}
      {dungeon.bossActive && dungeon.bossHp > 0 && (
        <AbyssWardenBoss
          playerPos={playerPos}
          onBossAttackPlayer={handleEnemyAttackPlayer}
          onBossDefeated={handleBossDefeated}
          onSpawnMinions={handleSpawnBossMinions}
        />
      )}

      {/* Loot Drops */}
      {loots.map((loot) => (
        <LootItem key={loot.id} loot={loot} playerPos={playerPos} onCollect={handleCollectLoot} />
      ))}

      {/* Soul Extraction Beacons */}
      {beacons.map((beacon) => (
        <ExtractionBeacon key={beacon.id} beacon={beacon} playerPos={playerPos} />
      ))}
    </group>
  );
};

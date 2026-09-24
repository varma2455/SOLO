// -------------------------------------------------------------
// SHADOW ASCENSION - DYNAMIC ENCOUNTER MANAGER
// Generates procedural, unpredictable dungeon room encounters
// -------------------------------------------------------------

import { ENEMY_TYPES, DUNGEON_RANKS, scaleEnemyStats } from '../../data/enemies.js';

export const ENCOUNTER_TYPES = {
  SWARM: 'SWARM',           // 20-40 weak enemies in waves
  SOLO_ELITE: 'SOLO_ELITE', // 1 massive apex monster, arena duel
  SQUAD: 'SQUAD',           // 4-8 coordinated medium enemies
  MIXED: 'MIXED',           // Weak frontline + medium guards + 1 elite
  COMMANDER: 'COMMANDER',   // 1 commander buffing 10-18 weaker monsters
  AMBUSH: 'AMBUSH',         // Enemies surge from dark corners after entry
  BOSS: 'BOSS'              // Multi-phase boss + minion waves
};

// Room physical boundary definitions for spawn coordinate generation
const ROOM_BOUNDS = {
  1: { xMin: -11, xMax: 11, zMin: -24, zMax: 4, floorY: 0 },
  2: { xMin: -10, xMax: 10, zMin: -68, zMax: -45, floorY: 0 },
  3: { xMin: -12, xMax: 12, zMin: -104, zMax: -76, floorY: 0 },
  4: { xMin: -18, xMax: 18, zMin: -160, zMax: -115, floorY: 0 }
};

/**
 * Generate logical spawn positions inside a room avoiding player entry point
 */
function generateSpawnPoints(roomIndex, count, pattern = 'scatter') {
  const bounds = ROOM_BOUNDS[roomIndex] || ROOM_BOUNDS[1];
  const points = [];
  const minDistance = 2.0;

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let pos = null;

    while (attempts < 20) {
      attempts++;
      let x, z;

      if (pattern === 'ambush') {
        // Spawn near room edges / side walls / alcoves
        const side = Math.random() > 0.5 ? 1 : -1;
        x = side * (bounds.xMax - 1 - Math.random() * 2.5);
        z = bounds.zMin + 2 + Math.random() * (bounds.zMax - bounds.zMin - 4);
      } else if (pattern === 'ring') {
        // Circular perimeter around center
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const radius = 6.0 + Math.random() * 4.5;
        const centerX = 0;
        const centerZ = (bounds.zMin + bounds.zMax) / 2;
        x = Math.max(bounds.xMin + 1, Math.min(bounds.xMax - 1, centerX + Math.cos(angle) * radius));
        z = Math.max(bounds.zMin + 1, Math.min(bounds.zMax - 1, centerZ + Math.sin(angle) * radius));
      } else if (pattern === 'center_guard') {
        // High density around central dais / throne
        const centerZ = (bounds.zMin + bounds.zMax) / 2;
        x = (Math.random() - 0.5) * 8;
        z = centerZ + (Math.random() - 0.5) * 8;
      } else {
        // General scatter
        x = bounds.xMin + 2 + Math.random() * (bounds.xMax - bounds.xMin - 4);
        z = bounds.zMin + 2 + Math.random() * (bounds.zMax - bounds.zMin - 4);
      }

      // Check distance against already generated points
      const tooClose = points.some(p => {
        const dx = p[0] - x;
        const dz = p[2] - z;
        return Math.sqrt(dx * dx + dz * dz) < minDistance;
      });

      if (!tooClose || attempts > 15) {
        pos = [+(x.toFixed(2)), bounds.floorY, +(z.toFixed(2))];
        break;
      }
    }

    if (pos) points.push(pos);
  }

  return points;
}

/**
 * Calculates danger rating (1-5 stars) and human-readable label
 */
export function calculateDangerRating(totalHp, enemyCount, hasCommander, hasElite, playerLevel) {
  let score = 1;
  if (totalHp > 1500) score = 2;
  if (totalHp > 3500 || hasElite) score = 3;
  if (totalHp > 6000 || hasCommander || (hasElite && enemyCount > 10)) score = 4;
  if (totalHp > 12000 || (hasCommander && hasElite)) score = 5;

  // Scale score relative to player level
  if (playerLevel >= 15 && score > 2) score = Math.max(2, score - 1);
  if (playerLevel <= 3 && score < 4) score = Math.min(5, score + 1);

  const labels = {
    1: 'LOW',
    2: 'MODERATE',
    3: 'HIGH',
    4: 'EXTREME',
    5: 'LETHAL'
  };

  return {
    stars: score,
    label: labels[score] || 'HIGH',
    ratingText: '★'.repeat(score) + '☆'.repeat(5 - score)
  };
}

/**
 * Procedurally generates encounters for the entire dungeon
 */
export function generateDungeonEncounters(dungeonRank = 'E', playerLevel = 1) {
  const rankConfig = DUNGEON_RANKS[dungeonRank] || DUNGEON_RANKS.E;
  const rankMult = rankConfig.multiplier;
  const baseLevel = Math.max(playerLevel, rankConfig.baseLevel);

  const encounters = {};

  // -------------------------------------------------------------
  // ROOM 1 ENCOUNTER (Z: 7 to -26)
  // Options: SWARM (20-25 weak) | SQUAD (5-8 medium) | AMBUSH (12 mixed) | MIXED (8 weak + 2 medium)
  // -------------------------------------------------------------
  const room1Types = [
    { type: ENCOUNTER_TYPES.SQUAD, weight: 35 },
    { type: ENCOUNTER_TYPES.SWARM, weight: 30 },
    { type: ENCOUNTER_TYPES.MIXED, weight: 25 },
    { type: ENCOUNTER_TYPES.AMBUSH, weight: 10 }
  ];
  const r1Choice = weightedRandom(room1Types);

  encounters[1] = buildRoomEncounter(1, r1Choice, baseLevel, rankMult, {
    weakTypes: ['ashGoblin', 'rottingSkeleton', 'caveCrawler', 'shadowRat'],
    mediumTypes: ['graveSoldier', 'boneReaver'],
    eliteTypes: ['cryptGuardian'],
    allowCommander: false
  });

  // -------------------------------------------------------------
  // ROOM 2 ENCOUNTER (Z: -41 to -72)
  // Options: SOLO_ELITE (1 massive apex) | COMMANDER (1 warlord + minions) | MIXED (elite + squad) | SWARM (25-30)
  // -------------------------------------------------------------
  const room2Types = [
    { type: ENCOUNTER_TYPES.SOLO_ELITE, weight: 35 },
    { type: ENCOUNTER_TYPES.COMMANDER, weight: 25 },
    { type: ENCOUNTER_TYPES.MIXED, weight: 25 },
    { type: ENCOUNTER_TYPES.SWARM, weight: 15 }
  ];
  const r2Choice = weightedRandom(room2Types);

  encounters[2] = buildRoomEncounter(2, r2Choice, baseLevel + 2, rankMult, {
    weakTypes: ['ashGoblin', 'rottingSkeleton', 'caveCrawler'],
    mediumTypes: ['graveSoldier', 'boneReaver', 'cryptHunter'],
    eliteTypes: ['bloodKnight', 'cryptGuardian', 'voidExecutioner'],
    commanderTypes: ['graveWarlord'],
    allowCommander: true
  });

  // -------------------------------------------------------------
  // ROOM 3 ENCOUNTER (Z: -73 to -108)
  // Options: COMMANDER (1 warlord + archers + guards) | AMBUSH (escalating waves) | MIXED (2 elites + minions) | SWARM (30 crawlers)
  // -------------------------------------------------------------
  const room3Types = [
    { type: ENCOUNTER_TYPES.COMMANDER, weight: 40 },
    { type: ENCOUNTER_TYPES.AMBUSH, weight: 25 },
    { type: ENCOUNTER_TYPES.MIXED, weight: 20 },
    { type: ENCOUNTER_TYPES.SWARM, weight: 15 }
  ];
  const r3Choice = weightedRandom(room3Types);

  encounters[3] = buildRoomEncounter(3, r3Choice, baseLevel + 4, rankMult, {
    weakTypes: ['caveCrawler', 'shadowRat', 'rottingSkeleton'],
    mediumTypes: ['voidArcher', 'graveSoldier', 'darkBeast', 'cryptHunter'],
    eliteTypes: ['bloodKnight', 'cryptReaper', 'voidExecutioner'],
    commanderTypes: ['graveWarlord'],
    allowCommander: true
  });

  // -------------------------------------------------------------
  // ROOM 4 ENCOUNTER: THE ABYSS WARDEN BOSS (Z: -109 to -165)
  // Multi-phase boss with dynamic minion wave generation
  // -------------------------------------------------------------
  const bossLevel = baseLevel + 6;
  const scaledBoss = scaleEnemyStats(ENEMY_TYPES.abyssWarden, bossLevel, rankMult);

  encounters[4] = {
    roomIndex: 4,
    type: ENCOUNTER_TYPES.BOSS,
    typeName: 'Sovereign of the Abyss',
    dangerRating: { stars: 5, label: 'LETHAL', ratingText: '★★★★★' },
    rewardMultiplier: 3.5,
    hasCommander: true,
    hasElite: true,
    isAmbush: false,
    boss: scaledBoss,
    waves: [
      {
        waveNumber: 1,
        waveName: 'Awakening Duel',
        enemies: [] // Boss is rendered by AbyssWardenBoss
      },
      {
        waveNumber: 2,
        waveName: 'Phase 2: Void Reavers Surge',
        enemies: [
          { type: 'boneReaver', count: 4, level: baseLevel + 2 },
          { type: 'voidArcher', count: 2, level: baseLevel + 2 }
        ]
      },
      {
        waveNumber: 3,
        waveName: 'Phase 3: Shadow Minion Influx',
        enemies: [
          { type: 'darkBeast', count: 3, level: baseLevel + 3 },
          { type: 'caveCrawler', count: 8, level: baseLevel + 1 }
        ]
      }
    ],
    totalEnemies: 1
  };

  return encounters;
}

/**
 * Builds a concrete room encounter based on type and enemy pool
 */
function buildRoomEncounter(roomIndex, encounterType, level, rankMult, pools) {
  let enemies = [];
  let waves = [];
  let typeName = '';
  let rewardMultiplier = 1.0;
  let hasCommander = false;
  let hasElite = false;
  let commanderId = null;
  let isAmbush = false;

  const randFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  if (encounterType === ENCOUNTER_TYPES.SWARM) {
    // 20–35 weak enemies in 2 fast waves!
    typeName = 'Verminous Swarm';
    rewardMultiplier = 1.6;
    const wave1Count = 12 + Math.floor(Math.random() * 6);
    const wave2Count = 14 + Math.floor(Math.random() * 8);

    const spawnPointsW1 = generateSpawnPoints(roomIndex, wave1Count, 'ring');
    const spawnPointsW2 = generateSpawnPoints(roomIndex, wave2Count, 'ambush');

    const w1Enemies = spawnPointsW1.map((pos, idx) => {
      const typeKey = randFrom(pools.weakTypes);
      const scaled = scaleEnemyStats(ENEMY_TYPES[typeKey], level, rankMult);
      return {
        ...scaled,
        id: `r${roomIndex}_w1_${idx}_${typeKey}`,
        spawnPosition: pos,
        room: roomIndex
      };
    });

    const w2Enemies = spawnPointsW2.map((pos, idx) => {
      const typeKey = randFrom(pools.weakTypes);
      const scaled = scaleEnemyStats(ENEMY_TYPES[typeKey], level + 1, rankMult);
      return {
        ...scaled,
        id: `r${roomIndex}_w2_${idx}_${typeKey}`,
        spawnPosition: pos,
        room: roomIndex
      };
    });

    waves = [
      { waveNumber: 1, waveName: 'Swarm Vanguard', enemies: w1Enemies },
      { waveNumber: 2, waveName: 'Swarm Overwhelming Wave', enemies: w2Enemies }
    ];
    enemies = w1Enemies; // Initial active wave

  } else if (encounterType === ENCOUNTER_TYPES.SOLO_ELITE) {
    // 1 massive monster, dramatic arena duel
    typeName = 'Apex Predator Duel';
    rewardMultiplier = 2.2;
    hasElite = true;

    const eliteKey = randFrom(pools.eliteTypes);
    const scaledElite = scaleEnemyStats(ENEMY_TYPES[eliteKey], level + 2, rankMult * 1.3);

    // Center spawn
    const bounds = ROOM_BOUNDS[roomIndex];
    const centerZ = (bounds.zMin + bounds.zMax) / 2;
    const elitePos = [0, bounds.floorY, centerZ];

    const eliteEnemy = {
      ...scaledElite,
      id: `r${roomIndex}_elite_apex`,
      name: `Prime ${scaledElite.name}`,
      scale: (scaledElite.scale || 1.4) * 1.25, // Noticeably larger!
      baseHp: scaledElite.baseHp * 1.5,
      maxHp: Math.round(scaledElite.maxHp * 1.5),
      hp: Math.round(scaledElite.maxHp * 1.5),
      spawnPosition: elitePos,
      isApex: true,
      room: roomIndex
    };

    enemies = [eliteEnemy];
    waves = [{ waveNumber: 1, waveName: 'Apex Predator', enemies }];

  } else if (encounterType === ENCOUNTER_TYPES.COMMANDER) {
    // 1 commander + 10-18 weaker monsters
    typeName = 'Warlord Battle Legion';
    rewardMultiplier = 2.6;
    hasCommander = true;
    hasElite = true;

    const cmdKey = randFrom(pools.commanderTypes || ['graveWarlord']);
    const scaledCmd = scaleEnemyStats(ENEMY_TYPES[cmdKey], level + 3, rankMult);

    const bounds = ROOM_BOUNDS[roomIndex];
    const centerZ = (bounds.zMin + bounds.zMax) / 2;
    commanderId = `r${roomIndex}_commander`;

    const commanderEnemy = {
      ...scaledCmd,
      id: commanderId,
      spawnPosition: [0, bounds.floorY, centerZ - 2],
      isCommander: true,
      room: roomIndex
    };

    const minionCount = 10 + Math.floor(Math.random() * 6);
    const minionPoints = generateSpawnPoints(roomIndex, minionCount, 'center_guard');

    const minions = minionPoints.map((pos, idx) => {
      // 70% weak, 30% normal guards
      const isGuard = Math.random() < 0.35 && pools.mediumTypes.length > 0;
      const typeKey = isGuard ? randFrom(pools.mediumTypes) : randFrom(pools.weakTypes);
      const scaled = scaleEnemyStats(ENEMY_TYPES[typeKey], level, rankMult);
      return {
        ...scaled,
        id: `r${roomIndex}_minion_${idx}`,
        spawnPosition: pos,
        commanderId,
        room: roomIndex
      };
    });

    enemies = [commanderEnemy, ...minions];
    waves = [{ waveNumber: 1, waveName: 'Legion Assembly', enemies }];

  } else if (encounterType === ENCOUNTER_TYPES.AMBUSH) {
    // Ambush encounter: enemies surge from multiple directions
    typeName = 'Subterranean Ambush';
    rewardMultiplier = 1.9;
    isAmbush = true;

    const ambushCount = 12 + Math.floor(Math.random() * 6);
    const ambushPoints = generateSpawnPoints(roomIndex, ambushCount, 'ambush');

    enemies = ambushPoints.map((pos, idx) => {
      const typeKey = idx % 3 === 0 && pools.mediumTypes.length > 0
        ? randFrom(pools.mediumTypes)
        : randFrom(pools.weakTypes);
      const scaled = scaleEnemyStats(ENEMY_TYPES[typeKey], level + 1, rankMult);
      return {
        ...scaled,
        id: `r${roomIndex}_ambush_${idx}`,
        spawnPosition: pos,
        isAmbushSpawn: true,
        room: roomIndex
      };
    });

    waves = [{ waveNumber: 1, waveName: 'Ambush Strike', enemies }];

  } else if (encounterType === ENCOUNTER_TYPES.MIXED) {
    // 8-12 weak + 3 medium + 1 elite
    typeName = 'Vanguard Phalanx';
    rewardMultiplier = 2.0;
    hasElite = true;

    const eliteKey = randFrom(pools.eliteTypes);
    const scaledElite = scaleEnemyStats(ENEMY_TYPES[eliteKey], level + 2, rankMult);
    const bounds = ROOM_BOUNDS[roomIndex];
    const centerZ = (bounds.zMin + bounds.zMax) / 2;

    const eliteEnemy = {
      ...scaledElite,
      id: `r${roomIndex}_phalanx_elite`,
      spawnPosition: [0, bounds.floorY, centerZ],
      room: roomIndex
    };

    const guardCount = 3 + Math.floor(Math.random() * 3);
    const guardPoints = generateSpawnPoints(roomIndex, guardCount, 'center_guard');
    const guards = guardPoints.map((pos, idx) => {
      const typeKey = randFrom(pools.mediumTypes);
      const scaled = scaleEnemyStats(ENEMY_TYPES[typeKey], level + 1, rankMult);
      return {
        ...scaled,
        id: `r${roomIndex}_guard_${idx}`,
        spawnPosition: pos,
        room: roomIndex
      };
    });

    const weakCount = 6 + Math.floor(Math.random() * 5);
    const weakPoints = generateSpawnPoints(roomIndex, weakCount, 'ring');
    const weaks = weakPoints.map((pos, idx) => {
      const typeKey = randFrom(pools.weakTypes);
      const scaled = scaleEnemyStats(ENEMY_TYPES[typeKey], level, rankMult);
      return {
        ...scaled,
        id: `r${roomIndex}_phalanx_weak_${idx}`,
        spawnPosition: pos,
        room: roomIndex
      };
    });

    enemies = [eliteEnemy, ...guards, ...weaks];
    waves = [{ waveNumber: 1, waveName: 'Phalanx Vanguard', enemies }];

  } else {
    // SQUAD: 4-8 medium enemies
    typeName = 'Crypt Patrol Squad';
    rewardMultiplier = 1.4;

    const squadCount = 4 + Math.floor(Math.random() * 4);
    const squadPoints = generateSpawnPoints(roomIndex, squadCount, 'scatter');

    enemies = squadPoints.map((pos, idx) => {
      const typeKey = randFrom(pools.mediumTypes.concat(pools.weakTypes));
      const scaled = scaleEnemyStats(ENEMY_TYPES[typeKey], level, rankMult);
      return {
        ...scaled,
        id: `r${roomIndex}_squad_${idx}`,
        spawnPosition: pos,
        room: roomIndex
      };
    });

    waves = [{ waveNumber: 1, waveName: 'Patrol Squad', enemies }];
  }

  // Calculate total HP and danger rating
  let totalHp = enemies.reduce((sum, e) => sum + (e.maxHp || e.baseHp || 100), 0);
  if (waves.length > 1) {
    waves.slice(1).forEach(w => {
      totalHp += w.enemies.reduce((sum, e) => sum + (e.maxHp || e.baseHp || 100), 0);
    });
  }

  const dangerRating = calculateDangerRating(totalHp, enemies.length, hasCommander, hasElite, level);

  return {
    roomIndex,
    type: encounterType,
    typeName,
    dangerRating,
    rewardMultiplier,
    hasCommander,
    hasElite,
    commanderId,
    isAmbush,
    enemies,
    waves,
    currentWave: 1,
    totalWaves: waves.length,
    totalEnemies: enemies.length + (waves.length > 1 ? waves.slice(1).reduce((acc, w) => acc + w.enemies.length, 0) : 0)
  };
}

/**
 * Weighted random selector helper
 */
function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    if (random < item.weight) {
      return item.type;
    }
    random -= item.weight;
  }

  return items[0].type;
}

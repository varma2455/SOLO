// -------------------------------------------------------------
// SHADOW ASCENSION - SEED-BASED DETERMINISTIC ENCOUNTER MANAGER
// Generates reproducible dungeon encounters, environmental clues,
// and discovery metadata for explore-first gameplay.
// -------------------------------------------------------------

import { ENEMY_TYPES, DUNGEON_RANKS, scaleEnemyStats } from '../../data/enemies.js';
import { createPrng } from '../../utils/prng.js';

export const ENCOUNTER_TYPES = {
  SWARM: 'SWARM',           // 15-30 weak enemies in waves
  SOLO_ELITE: 'SOLO_ELITE', // 1 massive apex monster, arena duel
  SQUAD: 'SQUAD',           // 4-8 coordinated medium enemies
  MIXED: 'MIXED',           // Weak frontline + medium guards + 1 elite
  COMMANDER: 'COMMANDER',   // 1 commander buffing minions
  AMBUSH: 'AMBUSH',         // Hidden enemies springing a trap
  BOSS: 'BOSS'              // Multi-phase sovereign boss
};

// Physical boundaries for rooms
const ROOM_BOUNDS = {
  1: { xMin: -11, xMax: 11, zMin: -24, zMax: 4, floorY: 0, centerZ: -10 },
  2: { xMin: -10, xMax: 10, zMin: -68, zMax: -45, floorY: 0, centerZ: -56.5 },
  3: { xMin: -12, xMax: 12, zMin: -104, zMax: -76, floorY: 0, centerZ: -90.5 },
  4: { xMin: -18, xMax: 18, zMin: -160, zMax: -115, floorY: 0, centerZ: -136 }
};

/**
 * Calculates danger rating stars, label, and formatted text
 */
export function calculateDangerRating(totalHp, enemyCount, hasCommander, hasElite, playerLevel) {
  let score = 1;
  if (totalHp > 1400 || enemyCount > 8) score = 2;
  if (totalHp > 3000 || hasElite) score = 3;
  if (totalHp > 5500 || hasCommander || (hasElite && enemyCount > 6)) score = 4;
  if (totalHp > 10000 || (hasCommander && hasElite)) score = 5;

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
 * Generates spawn positions using deterministic PRNG
 */
function generateDeterministicPoints(prng, roomIndex, count, pattern = 'scatter') {
  const bounds = ROOM_BOUNDS[roomIndex] || ROOM_BOUNDS[1];
  const points = [];
  const minDistance = 2.0;

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let pos = null;

    while (attempts < 25) {
      attempts++;
      let x, z;

      if (pattern === 'ambush') {
        const side = prng.random() > 0.5 ? 1 : -1;
        x = side * (bounds.xMax - 1 - prng.random() * 2.5);
        z = bounds.zMin + 2 + prng.random() * (bounds.zMax - bounds.zMin - 4);
      } else if (pattern === 'ring') {
        const angle = (i / count) * Math.PI * 2 + (prng.random() - 0.5) * 0.4;
        const radius = 5.0 + prng.random() * 3.5;
        const centerX = 0;
        const centerZ = bounds.centerZ;
        x = Math.max(bounds.xMin + 1, Math.min(bounds.xMax - 1, centerX + Math.cos(angle) * radius));
        z = Math.max(bounds.zMin + 1, Math.min(bounds.zMax - 1, centerZ + Math.sin(angle) * radius));
      } else if (pattern === 'center_guard') {
        x = (prng.random() - 0.5) * 6;
        z = bounds.centerZ + (prng.random() - 0.5) * 6;
      } else {
        x = bounds.xMin + 2 + prng.random() * (bounds.xMax - bounds.zMin > 0 ? bounds.xMax - bounds.xMin - 4 : 8);
        z = bounds.zMin + 3 + prng.random() * (bounds.zMax - bounds.zMin - 6);
      }

      const tooClose = points.some((p) => {
        const dx = p[0] - x;
        const dz = p[2] - z;
        return Math.sqrt(dx * dx + dz * dz) < minDistance;
      });

      if (!tooClose || attempts > 18) {
        pos = [+(x.toFixed(2)), bounds.floorY, +(z.toFixed(2))];
        break;
      }
    }

    if (pos) points.push(pos);
  }

  return points;
}

/**
 * Procedurally generates encounters for the entire dungeon with seed determinism.
 */
export function generateDungeonEncounters(dungeonRank = 'E', playerLevel = 1, seed = 133789) {
  const prng = createPrng(seed);
  const rankConfig = DUNGEON_RANKS[dungeonRank] || DUNGEON_RANKS.E;
  const rankMult = rankConfig.multiplier;
  const baseLevel = Math.max(playerLevel, rankConfig.baseLevel);

  const encounters = {};

  // -------------------------------------------------------------
  // ROOM 1: THE FORGOTTEN CRYPT (Z: 7 to -26)
  // Options: SQUAD | SWARM | MIXED
  // -------------------------------------------------------------
  const r1Types = [
    { type: ENCOUNTER_TYPES.SQUAD, weight: 40 },
    { type: ENCOUNTER_TYPES.SWARM, weight: 35 },
    { type: ENCOUNTER_TYPES.MIXED, weight: 25 }
  ];
  const r1Choice = weightedRandom(prng, r1Types);

  encounters[1] = buildDeterministicRoomEncounter(prng, 1, r1Choice, baseLevel, rankMult, {
    weakTypes: ['ashGoblin', 'rottingSkeleton', 'caveCrawler', 'shadowRat'],
    mediumTypes: ['graveSoldier', 'boneReaver'],
    eliteTypes: ['cryptGuardian'],
    allowCommander: false
  });

  // -------------------------------------------------------------
  // ROOM 2: ELITE SANCTUM (Z: -41 to -72)
  // Options: SOLO_ELITE (Blood Knight / Crypt Guardian) | COMMANDER | MIXED
  // -------------------------------------------------------------
  const r2Types = [
    { type: ENCOUNTER_TYPES.SOLO_ELITE, weight: 50 },
    { type: ENCOUNTER_TYPES.COMMANDER, weight: 25 },
    { type: ENCOUNTER_TYPES.MIXED, weight: 25 }
  ];
  const r2Choice = weightedRandom(prng, r2Types);

  encounters[2] = buildDeterministicRoomEncounter(prng, 2, r2Choice, baseLevel + 2, rankMult, {
    weakTypes: ['ashGoblin', 'rottingSkeleton', 'caveCrawler'],
    mediumTypes: ['graveSoldier', 'boneReaver', 'cryptHunter'],
    eliteTypes: ['bloodKnight', 'cryptGuardian', 'voidExecutioner'],
    commanderTypes: ['graveWarlord'],
    allowCommander: true
  });

  // -------------------------------------------------------------
  // ROOM 3: FLOODED CATACOMBS (Z: -73 to -108)
  // Options: COMMANDER | AMBUSH | MIXED
  // -------------------------------------------------------------
  const r3Types = [
    { type: ENCOUNTER_TYPES.COMMANDER, weight: 40 },
    { type: ENCOUNTER_TYPES.AMBUSH, weight: 35 },
    { type: ENCOUNTER_TYPES.MIXED, weight: 25 }
  ];
  const r3Choice = weightedRandom(prng, r3Types);

  encounters[3] = buildDeterministicRoomEncounter(prng, 3, r3Choice, baseLevel + 4, rankMult, {
    weakTypes: ['caveCrawler', 'shadowRat', 'rottingSkeleton'],
    mediumTypes: ['voidArcher', 'graveSoldier', 'darkBeast', 'cryptHunter'],
    eliteTypes: ['bloodKnight', 'cryptReaper', 'voidExecutioner'],
    commanderTypes: ['graveWarlord'],
    allowCommander: true
  });

  // -------------------------------------------------------------
  // ROOM 4: THRONE OF THE ABYSS WARDEN (Z: -109 to -165)
  // Boss Sovereign
  // -------------------------------------------------------------
  const bossLevel = baseLevel + 6;
  const scaledBoss = scaleEnemyStats(ENEMY_TYPES.abyssWarden, bossLevel, rankMult);

  encounters[4] = {
    id: 'enc_r4_abyss_warden',
    roomIndex: 4,
    type: ENCOUNTER_TYPES.BOSS,
    typeName: 'Sovereign of the Abyss',
    primaryEnemy: {
      id: 'abyssWarden',
      name: 'Abyss Warden',
      tier: 'boss',
      tierLabel: 'BOSS',
      starsText: '★★★★★',
      level: bossLevel,
      description: 'The supreme ancient sovereign awakened within the depths of the throne room.',
      dangerLabel: 'LETHAL',
      dangerStars: 5,
      hp: scaledBoss.maxHp,
      maxHp: scaledBoss.maxHp,
      attack: scaledBoss.attack
    },
    dangerRating: { stars: 5, label: 'LETHAL', ratingText: '★★★★★' },
    discoveryDistance: 25.0, // 25 meters detection range for Boss
    encounterCenter: [0, 0, -136],
    battleSpawnPlayer: [0, 0.5, -126], // 10 meters in front
    battleSpawnMonster: [0, 0, -138],
    isAmbush: false,
    isSwarm: false,
    hasCommander: true,
    hasElite: true,
    boss: scaledBoss,
    enemies: [
      {
        ...scaledBoss,
        id: 'abyssWarden',
        spawnPosition: [0, 0, -138],
        room: 4
      }
    ],
    waves: [
      {
        waveNumber: 1,
        waveName: 'Awakening Duel',
        enemies: []
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
    totalEnemies: 1,
    discovered: false,
    defeated: false,
    clues: [
      'Violent abyssal energy emanates through the grand portal',
      'The ground trembles under colossal footfalls ahead',
      'Ancient warning inscriptions carved into the stone floor'
    ]
  };

  return encounters;
}

/**
 * Builds an encounter for rooms 1-3
 */
function buildDeterministicRoomEncounter(prng, roomIndex, encounterType, level, rankMult, pools) {
  const bounds = ROOM_BOUNDS[roomIndex];
  const centerZ = bounds.centerZ;
  const encounterCenter = [0, bounds.floorY, centerZ];

  let enemies = [];
  let waves = [];
  let typeName = '';
  let primaryEnemy = null;
  let hasCommander = false;
  let hasElite = false;
  let isAmbush = false;
  let isSwarm = false;
  let discoveryDistance = 12.0;
  let clues = [];

  const randFrom = (arr) => arr[Math.floor(prng.random() * arr.length)];

  if (encounterType === ENCOUNTER_TYPES.SWARM) {
    // SWARM: 14-22 weak enemies
    isSwarm = true;
    typeName = 'Verminous Swarm';
    discoveryDistance = 10.0; // 10m weak detection
    const count = 14 + Math.floor(prng.random() * 8);

    const spawnPoints = generateDeterministicPoints(prng, roomIndex, count, 'ring');
    const primaryTypeKey = randFrom(pools.weakTypes);
    const sampleEnemy = scaleEnemyStats(ENEMY_TYPES[primaryTypeKey], level, rankMult);

    enemies = spawnPoints.map((pos, idx) => {
      const typeKey = idx % 2 === 0 ? primaryTypeKey : randFrom(pools.weakTypes);
      const scaled = scaleEnemyStats(ENEMY_TYPES[typeKey], level, rankMult);
      return {
        ...scaled,
        id: `enc_r${roomIndex}_swarm_${idx}_${typeKey}`,
        spawnPosition: pos,
        room: roomIndex
      };
    });

    primaryEnemy = {
      id: `swarm_r${roomIndex}`,
      name: `${sampleEnemy.name} Swarm`,
      tier: 'weak',
      tierLabel: 'SWARM',
      starsText: '★☆☆☆☆',
      level,
      description: `A horde of ${enemies.length} frenzied creatures skittering in the shadows.`,
      dangerLabel: 'MODERATE',
      dangerStars: 2,
      hp: sampleEnemy.maxHp * enemies.length,
      maxHp: sampleEnemy.maxHp * enemies.length,
      enemyCount: enemies.length
    };

    clues = [
      'Claw scratches and scurry marks cover the damp flagstones',
      'High-pitched chattering echoes from the gloom',
      'Gnawed bones scattered along the corridor'
    ];

  } else if (encounterType === ENCOUNTER_TYPES.SOLO_ELITE) {
    // SOLO ELITE: Blood Knight or Crypt Guardian
    hasElite = true;
    discoveryDistance = 15.0; // 15m elite detection

    const eliteKey = randFrom(pools.eliteTypes);
    const scaledElite = scaleEnemyStats(ENEMY_TYPES[eliteKey], level + 2, rankMult * 1.3);

    const eliteEnemy = {
      ...scaledElite,
      id: `enc_r${roomIndex}_elite_${eliteKey}`,
      name: scaledElite.name,
      scale: (scaledElite.scale || 1.4) * 1.15,
      maxHp: Math.round(scaledElite.maxHp * 1.4),
      hp: Math.round(scaledElite.maxHp * 1.4),
      attack: Math.round(scaledElite.attack * 1.2),
      spawnPosition: [0, bounds.floorY, centerZ],
      isApex: true,
      room: roomIndex
    };

    enemies = [eliteEnemy];
    typeName = `${eliteEnemy.name} Sanctum`;

    primaryEnemy = {
      id: eliteEnemy.id,
      name: eliteEnemy.name,
      tier: 'elite',
      tierLabel: 'ELITE',
      starsText: '★★★★☆',
      level: level + 2,
      description: `A formidable ${eliteEnemy.name} standing vigil over the chamber.`,
      dangerLabel: 'EXTREME',
      dangerStars: 4,
      hp: eliteEnemy.maxHp,
      maxHp: eliteEnemy.maxHp,
      attack: eliteEnemy.attack
    };

    clues = [
      'Heavy iron armored footprints indented into the floor',
      'Deep halberd gouges slashed across the stonework',
      'Fresh blood stains pooling near the central dais',
      'A menacing crimson aura pulses from within'
    ];

  } else if (encounterType === ENCOUNTER_TYPES.COMMANDER) {
    // COMMANDER: 1 Grave Warlord + guards
    hasCommander = true;
    hasElite = true;
    discoveryDistance = 18.0;

    const cmdKey = randFrom(pools.commanderTypes || ['graveWarlord']);
    const scaledCmd = scaleEnemyStats(ENEMY_TYPES[cmdKey], level + 3, rankMult);
    const cmdId = `enc_r${roomIndex}_commander_${cmdKey}`;

    const commanderEnemy = {
      ...scaledCmd,
      id: cmdId,
      spawnPosition: [0, bounds.floorY, centerZ - 2],
      isCommander: true,
      room: roomIndex
    };

    const minionCount = 6 + Math.floor(prng.random() * 4);
    const minionPoints = generateDeterministicPoints(prng, roomIndex, minionCount, 'center_guard');
    const minions = minionPoints.map((pos, idx) => {
      const typeKey = prng.random() < 0.4 ? randFrom(pools.mediumTypes) : randFrom(pools.weakTypes);
      const scaled = scaleEnemyStats(ENEMY_TYPES[typeKey], level, rankMult);
      return {
        ...scaled,
        id: `enc_r${roomIndex}_cmd_minion_${idx}`,
        spawnPosition: pos,
        commanderId: cmdId,
        room: roomIndex
      };
    });

    enemies = [commanderEnemy, ...minions];
    typeName = `${commanderEnemy.name} Warband`;

    primaryEnemy = {
      id: commanderEnemy.id,
      name: commanderEnemy.name,
      tier: 'commander',
      tierLabel: 'COMMANDER',
      starsText: '★★★★★',
      level: level + 3,
      description: `A battle-hardened ${commanderEnemy.name} commanding a retinue of undead legionnaires.`,
      dangerLabel: 'EXTREME',
      dangerStars: 4,
      hp: commanderEnemy.maxHp,
      maxHp: commanderEnemy.maxHp,
      attack: commanderEnemy.attack,
      enemyCount: enemies.length
    };

    clues = [
      'Shattered shields with military crests litter the pathway',
      'A low, rumbling war chant resonates from the hall',
      'Torches ahead burn with an unnatural dark flame'
    ];

  } else if (encounterType === ENCOUNTER_TYPES.AMBUSH) {
    // AMBUSH: Hidden enemies springing from alcoves
    isAmbush = true;
    discoveryDistance = 12.0;
    typeName = 'Subterranean Ambush';

    const ambushCount = 8 + Math.floor(prng.random() * 4);
    const ambushPoints = generateDeterministicPoints(prng, roomIndex, ambushCount, 'ambush');

    enemies = ambushPoints.map((pos, idx) => {
      const typeKey = idx % 3 === 0 ? randFrom(pools.mediumTypes) : randFrom(pools.weakTypes);
      const scaled = scaleEnemyStats(ENEMY_TYPES[typeKey], level + 1, rankMult);
      return {
        ...scaled,
        id: `enc_r${roomIndex}_ambush_${idx}`,
        spawnPosition: pos,
        isAmbushSpawn: true,
        room: roomIndex
      };
    });

    primaryEnemy = {
      id: `ambush_r${roomIndex}`,
      name: 'Crypt Stalker Ambush',
      tier: 'normal',
      tierLabel: 'AMBUSH',
      starsText: '★★★☆☆',
      level: level + 1,
      description: 'Hostile presences lurking in dark crevices, waiting to encircle prey.',
      dangerLabel: 'HIGH',
      dangerStars: 3,
      hp: enemies.reduce((sum, e) => sum + e.maxHp, 0),
      maxHp: enemies.reduce((sum, e) => sum + e.maxHp, 0),
      enemyCount: enemies.length
    };

    clues = [
      'Ominous silence clings to the chamber walls',
      'Disturbed cobwebs and fresh ceiling debris',
      'A faint shadow flits between the upper alcoves'
    ];

  } else if (encounterType === ENCOUNTER_TYPES.MIXED) {
    // MIXED: 1 elite + guards + minions
    hasElite = true;
    discoveryDistance = 14.0;
    typeName = 'Vanguard Phalanx';

    const eliteKey = randFrom(pools.eliteTypes);
    const scaledElite = scaleEnemyStats(ENEMY_TYPES[eliteKey], level + 2, rankMult);
    const eliteEnemy = {
      ...scaledElite,
      id: `enc_r${roomIndex}_phalanx_elite`,
      spawnPosition: [0, bounds.floorY, centerZ],
      room: roomIndex
    };

    const guardCount = 3 + Math.floor(prng.random() * 2);
    const guardPoints = generateDeterministicPoints(prng, roomIndex, guardCount, 'center_guard');
    const guards = guardPoints.map((pos, idx) => {
      const typeKey = randFrom(pools.mediumTypes);
      const scaled = scaleEnemyStats(ENEMY_TYPES[typeKey], level + 1, rankMult);
      return {
        ...scaled,
        id: `enc_r${roomIndex}_phalanx_guard_${idx}`,
        spawnPosition: pos,
        room: roomIndex
      };
    });

    const weakCount = 4 + Math.floor(prng.random() * 3);
    const weakPoints = generateDeterministicPoints(prng, roomIndex, weakCount, 'ring');
    const weaks = weakPoints.map((pos, idx) => {
      const typeKey = randFrom(pools.weakTypes);
      const scaled = scaleEnemyStats(ENEMY_TYPES[typeKey], level, rankMult);
      return {
        ...scaled,
        id: `enc_r${roomIndex}_phalanx_weak_${idx}`,
        spawnPosition: pos,
        room: roomIndex
      };
    });

    enemies = [eliteEnemy, ...guards, ...weaks];

    primaryEnemy = {
      id: eliteEnemy.id,
      name: `${eliteEnemy.name} Guard`,
      tier: 'elite',
      tierLabel: 'ELITE SQUAD',
      starsText: '★★★★☆',
      level: level + 2,
      description: `An elite ${eliteEnemy.name} supported by stalwart defenders.`,
      dangerLabel: 'HIGH',
      dangerStars: 3,
      hp: eliteEnemy.maxHp,
      maxHp: eliteEnemy.maxHp,
      enemyCount: enemies.length
    };

    clues = [
      'Heavy barricades and broken iron gates',
      'The scent of dark sorcery lingering in the stagnant air',
      'Scattered weapons dropped in panicked retreat'
    ];

  } else {
    // SQUAD: 4-6 normal enemies
    discoveryDistance = 12.0;
    typeName = 'Crypt Patrol Squad';

    const count = 4 + Math.floor(prng.random() * 3);
    const points = generateDeterministicPoints(prng, roomIndex, count, 'scatter');
    const primaryKey = randFrom(pools.mediumTypes);
    const sample = scaleEnemyStats(ENEMY_TYPES[primaryKey], level, rankMult);

    enemies = points.map((pos, idx) => {
      const typeKey = idx === 0 ? primaryKey : randFrom(pools.mediumTypes.concat(pools.weakTypes));
      const scaled = scaleEnemyStats(ENEMY_TYPES[typeKey], level, rankMult);
      return {
        ...scaled,
        id: `enc_r${roomIndex}_squad_${idx}`,
        spawnPosition: pos,
        room: roomIndex
      };
    });

    primaryEnemy = {
      id: `squad_r${roomIndex}`,
      name: `${sample.name} Patrol`,
      tier: 'normal',
      tierLabel: 'NORMAL',
      starsText: '★★☆☆☆',
      level,
      description: `A squad of ${enemies.length} hostile undead patrolling the corridor.`,
      dangerLabel: 'MODERATE',
      dangerStars: 2,
      hp: enemies.reduce((sum, e) => sum + e.maxHp, 0),
      maxHp: enemies.reduce((sum, e) => sum + e.maxHp, 0),
      enemyCount: enemies.length
    };

    clues = [
      'Rhythmic clanking of rusty chainmail ahead',
      'Muffled metallic footsteps echoing between the pillars',
      'Scratched sigils on the floor marking patrol boundaries'
    ];
  }

  const totalHp = enemies.reduce((sum, e) => sum + (e.maxHp || 100), 0);
  const dangerRating = calculateDangerRating(totalHp, enemies.length, hasCommander, hasElite, level);

  // Position player 9m in front of center for battle transition
  const battleSpawnPlayer = [0, 0.5, centerZ + 9.5];
  const battleSpawnMonster = [0, 0, centerZ - 1.5];

  return {
    id: `enc_r${roomIndex}_${encounterType.toLowerCase()}`,
    roomIndex,
    type: encounterType,
    typeName,
    primaryEnemy,
    dangerRating,
    discoveryDistance,
    encounterCenter,
    battleSpawnPlayer,
    battleSpawnMonster,
    enemies,
    totalEnemies: enemies.length,
    waves: [{ waveNumber: 1, waveName: typeName, enemies }],
    hasCommander,
    hasElite,
    isAmbush,
    isSwarm,
    discovered: false,
    defeated: false,
    clues
  };
}

function weightedRandom(prng, items) {
  const total = items.reduce((acc, item) => acc + item.weight, 0);
  let threshold = prng.random() * total;
  for (const item of items) {
    if (threshold < item.weight) return item.type;
    threshold -= item.weight;
  }
  return items[0].type;
}

// -------------------------------------------------------------
// SHADOW ASCENSION - CUSTOM DATABASE ENGINE
// Manages: Users (Admin + Player), Player Progress, Shadows, Inventory,
// Quests, Monster Definitions, Game Settings, & Statistics.
// Persists locally to server/data/db.json and synchronizes with Firestore.
// -------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default Monsters
const DEFAULT_MONSTERS = [
  {
    id: 'ashGoblin',
    name: 'Ash Goblin',
    tier: 'weak',
    rank: 'E',
    hp: 120,
    attack: 16,
    defense: 6,
    speed: 3.4,
    xpReward: 30,
    goldReward: 15,
    status: 'active',
    description: 'A nimble scavaging fiend wielding jagged crypt shards.'
  },
  {
    id: 'goblinScout',
    name: 'Goblin Scout',
    tier: 'weak',
    rank: 'E',
    hp: 95,
    attack: 22,
    defense: 4,
    speed: 4.8,
    xpReward: 35,
    goldReward: 18,
    status: 'active',
    description: 'Swift assassin lurker attacking from shadows.'
  },
  {
    id: 'cryptSkeleton',
    name: 'Crypt Sentinel',
    tier: 'elite',
    rank: 'D',
    hp: 350,
    attack: 38,
    defense: 16,
    speed: 2.8,
    xpReward: 85,
    goldReward: 45,
    status: 'active',
    description: 'Armored skeleton guardian armed with rusted greatsword.'
  },
  {
    id: 'bloodLurker',
    name: 'Blood Lurker',
    tier: 'elite',
    rank: 'C',
    hp: 650,
    attack: 55,
    defense: 22,
    speed: 3.8,
    xpReward: 160,
    goldReward: 80,
    status: 'active',
    description: 'Ravenous beast stalking the inner crypt tunnels.'
  },
  {
    id: 'abyssWarden',
    name: 'Abyss Warden',
    tier: 'boss',
    rank: 'B',
    hp: 3200,
    attack: 90,
    defense: 40,
    speed: 3.2,
    xpReward: 600,
    goldReward: 350,
    status: 'active',
    description: 'The terrifying crypt gatekeeper commanding demonic flame.'
  }
];

// Default Shadow Definitions
const DEFAULT_SHADOW_DEFINITIONS = [
  {
    id: 'dusk_knight',
    name: 'Dusk Knight',
    rank: 'C',
    role: 'Melee Heavy Tank',
    baseHp: 1000,
    baseMp: 500,
    attack: 65,
    defense: 25,
    speed: 4.8,
    summonCost: 60,
    cooldown: 1.2,
    status: 'active',
    description: 'Towering dark plate knight forged from crypt guardian soul.'
  },
  {
    id: 'nightfang',
    name: 'Nightfang',
    rank: 'D',
    role: 'Agile Assassin',
    baseHp: 800,
    baseMp: 500,
    attack: 80,
    defense: 12,
    speed: 5.6,
    summonCost: 50,
    cooldown: 0.9,
    status: 'active',
    description: 'Extracted from a bone reaver. Blistering flanking speed.'
  },
  {
    id: 'void_marksman',
    name: 'Void Marksman',
    rank: 'C',
    role: 'Ranged Sniper',
    baseHp: 750,
    baseMp: 500,
    attack: 85,
    defense: 10,
    speed: 4.6,
    summonCost: 65,
    cooldown: 1.4,
    status: 'active',
    description: 'Phantom archer unleashing piercing shadow arrows from afar.'
  },
  {
    id: 'iron_golem',
    name: 'Iron Warden',
    rank: 'B',
    role: 'Colossal Vanguard',
    baseHp: 1600,
    baseMp: 500,
    attack: 95,
    defense: 45,
    speed: 3.6,
    summonCost: 90,
    cooldown: 1.6,
    status: 'active',
    description: 'Enormous monolith of dark steel that shatters enemy lines.'
  }
];

// Default Quests
const DEFAULT_QUESTS = [
  {
    id: 'main_awakening',
    title: 'THE AWAKENING',
    type: 'main',
    description: 'Awaken your Ascension Core and purge the depths of the Forgotten Crypt.',
    objectives: [
      { id: 'defeat_monsters', text: 'Enemies defeated', current: 0, target: 10 },
      { id: 'extract_shadow', text: 'Extract a Shadow Soldier', current: 0, target: 1 },
      { id: 'defeat_boss', text: 'Defeat Abyss Warden', current: 0, target: 1 }
    ],
    rewards: { xp: 500, gold: 150, shadowCores: 3 },
    status: 'active'
  },
  {
    id: 'daily_crypt_cleansing',
    title: 'DAILY: Crypt Cleansing',
    type: 'daily',
    description: 'Purge wandering husks to prevent dark miasma overflow.',
    objectives: [
      { id: 'defeat_15', text: 'Defeat 15 monsters', current: 0, target: 15 }
    ],
    rewards: { xp: 250, gold: 80, shadowCores: 2 },
    status: 'active'
  },
  {
    id: 'daily_shadow_monarch',
    title: 'DAILY: Shadow Commander',
    type: 'daily',
    description: 'Exercise the power of your core by commanding Shadows in battle.',
    objectives: [
      { id: 'extract_shadows_2', text: 'Extract 2 defeated enemies', current: 0, target: 2 }
    ],
    rewards: { xp: 300, gold: 100, shadowCores: 3 },
    status: 'active'
  }
];

// Default Game Settings
const DEFAULT_SETTINGS = {
  xpMultiplier: 1.0,
  goldMultiplier: 1.0,
  difficulty: 'Normal', // Normal, Hard, Nightmare
  enemyDensity: 1.0,
  bossScaling: 1.0,
  maintenanceMode: false,
  updatedAt: new Date().toISOString(),
  updatedBy: 'System'
};

// Default Dungeon Settings
const DEFAULT_DUNGEONS = [
  {
    id: 'forgotten_crypt',
    name: 'The Forgotten Crypt',
    rank: 'E',
    totalRooms: 4,
    room1Enemies: 8,
    room2Enemies: 10,
    room3Enemies: 12,
    bossName: 'Abyss Warden',
    bossHp: 3200,
    difficulty: 'Normal',
    rewards: { xp: 1000, gold: 500 }
  }
];

/**
 * Initializes or loads database state
 */
function loadDatabase() {
  let dbState = {
    users: {},
    playerProgress: {},
    playerShadows: {},
    playerInventory: {},
    playerQuests: {},
    monsters: DEFAULT_MONSTERS,
    shadowDefinitions: DEFAULT_SHADOW_DEFINITIONS,
    quests: DEFAULT_QUESTS,
    dungeons: DEFAULT_DUNGEONS,
    gameSettings: DEFAULT_SETTINGS,
    statistics: {
      totalMonstersDefeated: 0,
      totalBossesDefeated: 0,
      totalDungeonsCompleted: 0,
      totalShadowsExtracted: 0
    }
  };

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      dbState = { ...dbState, ...parsed };
    } catch (err) {
      console.warn('[DB Engine] Could not read db.json, creating clean store:', err.message);
    }
  }

  // Ensure initial administrator account exists securely
  const hasAdmin = Object.values(dbState.users).some((u) => u.role === 'admin');
  if (!hasAdmin) {
    const adminId = 'admin_overseer';
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('AdminPass2026!', salt);

    dbState.users[adminId] = {
      id: adminId,
      username: 'admin',
      displayName: 'SYSTEM OVERSEER',
      email: 'admin@shadowascension.com',
      passwordHash,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: null
    };

    saveDatabase(dbState);
    console.log('[DB Engine] Provisioned initial Administrator account: admin@shadowascension.com');
  }

  return dbState;
}

let dbInstance = loadDatabase();

function saveDatabase(state = dbInstance) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB Engine] Failed to save db.json:', err);
  }
}

// =============================================================
// REPOSITORY METHODS
// =============================================================

export const db = {
  // --- USERS ---
  findUserByEmail(email) {
    if (!email) return null;
    const clean = email.toLowerCase().trim();
    return Object.values(dbInstance.users).find((u) => u.email.toLowerCase().trim() === clean) || null;
  },

  findUserById(id) {
    if (!id) return null;
    return dbInstance.users[id] || null;
  },

  findUserByUsername(username) {
    if (!username) return null;
    const clean = username.toLowerCase().trim();
    return Object.values(dbInstance.users).find((u) => u.username.toLowerCase().trim() === clean) || null;
  },

  getAllUsers() {
    return Object.values(dbInstance.users).map((u) => {
      // NEVER return passwordHash to caller
      const { passwordHash, ...safeUser } = u;
      return safeUser;
    });
  },

  createUser({ username, displayName, email, passwordHash, role = 'user', status = 'active' }) {
    const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newUser = {
      id,
      username: (username || displayName || 'hunter').toLowerCase().trim(),
      displayName: displayName?.trim() || 'AWAKENED HUNTER',
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role === 'admin' ? 'admin' : 'user', // Enforce role
      status: status || 'active',
      createdAt: now,
      lastLoginAt: null
    };

    dbInstance.users[id] = newUser;

    // Initialize blank isolated player progress for this specific user
    dbInstance.playerProgress[id] = {
      userId: id,
      level: 1,
      xp: 0,
      maxXp: 100,
      hp: 560,
      maxHp: 560,
      mp: 270,
      maxMp: 270,
      gold: 100,
      shadowCores: 3,
      currentRoom: 1,
      monstersDefeated: 0,
      bossesDefeated: 0,
      dungeonsCompleted: 0,
      attributes: { strength: 10, agility: 10, intelligence: 10, vitality: 10 },
      position: [0, 0.5, 24],
      rotation: 0,
      updatedAt: now
    };

    // Initialize user's separate shadows collection
    dbInstance.playerShadows[id] = [];

    // Initialize user's separate inventory
    dbInstance.playerInventory[id] = [
      {
        id: 'starting_iron_blade',
        name: 'Initiate Iron Blade',
        category: 'weapon',
        rarity: 'common',
        icon: '⚔️',
        attack: 15,
        equipped: true,
        description: 'Standard issue blade for awakened hunters.'
      }
    ];

    // Initialize user's separate quests
    dbInstance.playerQuests[id] = JSON.parse(JSON.stringify(DEFAULT_QUESTS));

    saveDatabase();

    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  },

  updateUser(id, updates) {
    if (!dbInstance.users[id]) return null;
    const current = dbInstance.users[id];

    // Disallow overriding id or role if not allowed
    const safeUpdates = { ...updates };
    delete safeUpdates.id;

    dbInstance.users[id] = { ...current, ...safeUpdates };
    saveDatabase();

    const { passwordHash, ...safeUser } = dbInstance.users[id];
    return safeUser;
  },

  // --- PLAYER PROGRESS & GAMEPLAY DATA ---
  getUserProgress(userId) {
    if (!userId) return null;
    if (!dbInstance.playerProgress[userId]) {
      dbInstance.playerProgress[userId] = {
        userId,
        level: 1,
        xp: 0,
        maxXp: 100,
        hp: 560,
        maxHp: 560,
        mp: 270,
        maxMp: 270,
        gold: 100,
        shadowCores: 3,
        currentRoom: 1,
        monstersDefeated: 0,
        bossesDefeated: 0,
        dungeonsCompleted: 0,
        attributes: { strength: 10, agility: 10, intelligence: 10, vitality: 10 },
        position: [0, 0.5, 24],
        rotation: 0,
        updatedAt: new Date().toISOString()
      };
      saveDatabase();
    }
    return dbInstance.playerProgress[userId];
  },

  saveUserProgress(userId, progressData) {
    if (!userId) return null;
    const existing = dbInstance.playerProgress[userId] || {};

    const updated = {
      ...existing,
      ...progressData,
      userId,
      updatedAt: new Date().toISOString()
    };

    dbInstance.playerProgress[userId] = updated;

    // Update global aggregate telemetry
    if (progressData.monstersDefeated && progressData.monstersDefeated > (existing.monstersDefeated || 0)) {
      const delta = progressData.monstersDefeated - (existing.monstersDefeated || 0);
      dbInstance.statistics.totalMonstersDefeated += delta;
    }
    if (progressData.bossesDefeated && progressData.bossesDefeated > (existing.bossesDefeated || 0)) {
      dbInstance.statistics.totalBossesDefeated += 1;
    }
    if (progressData.dungeonsCompleted && progressData.dungeonsCompleted > (existing.dungeonsCompleted || 0)) {
      dbInstance.statistics.totalDungeonsCompleted += 1;
    }

    saveDatabase();
    return updated;
  },

  // --- SHADOWS ---
  getUserShadows(userId) {
    if (!userId) return [];
    if (!dbInstance.playerShadows[userId]) {
      dbInstance.playerShadows[userId] = [];
      saveDatabase();
    }
    return dbInstance.playerShadows[userId];
  },

  saveUserShadows(userId, shadows) {
    if (!userId || !Array.isArray(shadows)) return [];
    dbInstance.playerShadows[userId] = shadows;
    dbInstance.statistics.totalShadowsExtracted = Object.values(dbInstance.playerShadows).reduce(
      (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
      0
    );
    saveDatabase();
    return shadows;
  },

  // --- INVENTORY ---
  getUserInventory(userId) {
    if (!userId) return [];
    if (!dbInstance.playerInventory[userId]) {
      dbInstance.playerInventory[userId] = [];
      saveDatabase();
    }
    return dbInstance.playerInventory[userId];
  },

  saveUserInventory(userId, inventory) {
    if (!userId || !Array.isArray(inventory)) return [];
    dbInstance.playerInventory[userId] = inventory;
    saveDatabase();
    return inventory;
  },

  // --- QUESTS ---
  getUserQuests(userId) {
    if (!userId) return [];
    if (!dbInstance.playerQuests[userId]) {
      dbInstance.playerQuests[userId] = JSON.parse(JSON.stringify(DEFAULT_QUESTS));
      saveDatabase();
    }
    return dbInstance.playerQuests[userId];
  },

  saveUserQuests(userId, quests) {
    if (!userId || !Array.isArray(quests)) return [];
    dbInstance.playerQuests[userId] = quests;
    saveDatabase();
    return quests;
  },

  // --- ADMIN ENTITIES ---
  getMonsters() {
    return dbInstance.monsters || [];
  },

  saveMonster(monsterData) {
    const list = dbInstance.monsters || [];
    const idx = list.findIndex((m) => m.id === monsterData.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...monsterData };
    } else {
      list.push(monsterData);
    }
    dbInstance.monsters = list;
    saveDatabase();
    return monsterData;
  },

  deleteMonster(id) {
    dbInstance.monsters = (dbInstance.monsters || []).filter((m) => m.id !== id);
    saveDatabase();
    return true;
  },

  getShadowDefinitions() {
    return dbInstance.shadowDefinitions || [];
  },

  saveShadowDefinition(definition) {
    const list = dbInstance.shadowDefinitions || [];
    const idx = list.findIndex((s) => s.id === definition.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...definition };
    } else {
      list.push(definition);
    }
    dbInstance.shadowDefinitions = list;
    saveDatabase();
    return definition;
  },

  getQuests() {
    return dbInstance.quests || [];
  },

  saveQuest(questData) {
    const list = dbInstance.quests || [];
    const idx = list.findIndex((q) => q.id === questData.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...questData };
    } else {
      list.push(questData);
    }
    dbInstance.quests = list;
    saveDatabase();
    return questData;
  },

  getDungeons() {
    return dbInstance.dungeons || DEFAULT_DUNGEONS;
  },

  saveDungeon(dungeonData) {
    const list = dbInstance.dungeons || [];
    const idx = list.findIndex((d) => d.id === dungeonData.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...dungeonData };
    } else {
      list.push(dungeonData);
    }
    dbInstance.dungeons = list;
    saveDatabase();
    return dungeonData;
  },

  getSettings() {
    return dbInstance.gameSettings || DEFAULT_SETTINGS;
  },

  saveSettings(settings, adminEmail = 'Admin') {
    dbInstance.gameSettings = {
      ...DEFAULT_SETTINGS,
      ...dbInstance.gameSettings,
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail
    };
    saveDatabase();
    return dbInstance.gameSettings;
  },

  addAuditLog(entry) {
    if (!dbInstance.auditLogs) {
      dbInstance.auditLogs = [];
    }
    const logItem = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    dbInstance.auditLogs.unshift(logItem);
    if (dbInstance.auditLogs.length > 200) {
      dbInstance.auditLogs = dbInstance.auditLogs.slice(0, 200);
    }
    saveDatabase();
    return logItem;
  },

  getAuditLogs() {
    return dbInstance.auditLogs || [];
  },

  getStats() {
    const users = Object.values(dbInstance.users);
    const activeUsers = users.filter((u) => u.status === 'active').length;
    const adminUsers = users.filter((u) => u.role === 'admin' && u.status === 'active').length;
    const disabledUsers = users.filter((u) => u.status === 'disabled' || u.status === 'inactive').length;
    const totalUsers = users.length;

    let totalMonstersDefeated = 0;
    let totalBosses = 0;
    let totalDungeonsCompleted = 0;
    let extractedShadows = 0;

    Object.values(dbInstance.playerProgress).forEach((p) => {
      totalMonstersDefeated += p.monstersDefeated || 0;
      totalBosses += p.bossesDefeated || 0;
      totalDungeonsCompleted += p.dungeonsCompleted || 0;
    });

    Object.values(dbInstance.playerShadows).forEach((sList) => {
      extractedShadows += Array.isArray(sList) ? sList.length : 0;
    });

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      disabledUsers,
      totalMonsters: (dbInstance.monsters || []).length,
      totalShadows: (dbInstance.shadowDefinitions || []).length || Math.max(extractedShadows, dbInstance.statistics?.totalShadowsExtracted || 0),
      totalQuests: (dbInstance.quests || []).length,
      totalDungeons: (dbInstance.dungeons || []).length,
      totalMonstersDefeated: Math.max(totalMonstersDefeated, dbInstance.statistics?.totalMonstersDefeated || 0),
      totalBossesDefeated: Math.max(totalBosses, dbInstance.statistics?.totalBossesDefeated || 0),
      totalDungeonsCompleted: Math.max(totalDungeonsCompleted, dbInstance.statistics?.totalDungeonsCompleted || 0),
      recentActivity: (dbInstance.auditLogs || []).slice(0, 15)
    };
  }
};

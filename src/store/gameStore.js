import { create } from 'zustand';
import { sound } from '../audio/soundManager';
import { SKILLS } from '../data/skills';
import { ITEMS_DATABASE, getRandomLoot } from '../data/items';
import { QUESTS_DATABASE } from '../data/quests';
import { DEFAULT_SHADOWS } from '../data/shadowArmy';
import { generateDungeonEncounters } from '../game/encounters/EncounterManager';
import {
  SaveManager,
  SAVE_VERSION,
  PRIMARY_SAVE_KEY,
  BACKUP_SAVE_KEY,
  CHECKPOINT_KEY,
  subscribeSaveStatus
} from '../utils/SaveManager';
import { generateSeed } from '../utils/prng';
import { safeVector3, DEFAULT_PLAYER_POSITION } from '../utils/vector3';

const calculateMaxXp = (level) => {
  return Math.floor(100 * Math.pow(1.55, level - 1));
};

const initialPlayerState = {
  name: 'Kael',
  level: 1,
  xp: 0,
  maxXp: 100,
  baseHp: 350,
  hp: 350,
  maxHp: 350,
  baseMana: 150,
  mana: 150,
  maxMana: 150,
  baseAttack: 25,
  attack: 25,
  baseDefense: 12,
  defense: 12,
  speed: 6.5,
  critChance: 10, // 10%
  critDamage: 150, // 150%
  statPoints: 0,
  attributes: {
    strength: 10,
    agility: 10,
    intelligence: 10,
    vitality: 10
  },
  gold: 100,
  shadowCores: 3,
  isInvulnerable: false,
  isDashing: false,
  isAttacking: false,
  comboStep: 1,
  position: [0, 1, 8], // Room 1 crypt entrance archway
  rotation: 0
};

let regenAccumulator = 0;

export const useGameStore = create((set, get) => ({
  // Screen management: 'menu', 'game', 'character', 'inventory', 'shadows', 'settings', 'gameover'
  currentScreen: 'menu',
  previousScreen: 'menu',
  isPaused: false,

  // EXPLORATION & COMBAT STATE MACHINE
  // States: MAIN_MENU, NEW_GAME, LOADING_SAVE, EXPLORING, MONSTER_DISCOVERED,
  // ENCOUNTER_DECISION, PREPARING, BATTLE_LOADING, BATTLE, VICTORY, DEFEAT,
  // RETURNING_TO_EXPLORATION, PAUSED
  gameFlowState: 'MAIN_MENU',

  // Current active / discovered monster encounter
  activeEncounter: null,
  activeEncounterId: null,

  // Battle Transition state & countdown
  battleTransition: {
    active: false,
    monsterName: '',
    countdown: 3
  },

  // Victory Rewards Modal
  victoryData: null,

  // Save Points (Ancient Shrine modal)
  safePointPrompt: null,

  // Save Indicator
  saveIndicator: {
    visible: false,
    text: '',
    status: 'idle'
  },

  // Performance & Graphics Settings
  graphicsQuality: 'high', // 'low' | 'medium' | 'high' | 'ultra'
  autoFpsOptimization: true,
  setGraphicsQuality: (quality) => set({ graphicsQuality: quality }),
  setAutoFpsOptimization: (enabled) => set({ autoFpsOptimization: enabled }),

  // Third-person Camera Configuration
  cameraSettings: {
    sensitivity: 1.0, // Multiplier on base 0.0035
    invertY: false,
    cameraShake: true
  },
  setCameraSetting: (key, val) =>
    set((state) => ({
      cameraSettings: { ...state.cameraSettings, [key]: val }
    })),

  // Optional Target Lock (TAB or soft auto-targeting)
  lockedTargetId: null,
  setLockedTargetId: (id) => set({ lockedTargetId: id }),
  toggleTargetLock: (enemies = []) => {
    const current = get().lockedTargetId;
    if (current) {
      set({ lockedTargetId: null });
      return;
    }
    const pPos = typeof window !== 'undefined' && window.__playerPos ? window.__playerPos : [0, 0.5, 24];
    let nearest = null;
    let minDist = 30;
    (enemies || []).forEach((en) => {
      if (en && en.hp > 0 && en.spawnPosition) {
        const [x, , z] = safeVector3(en.spawnPosition, [0, 0, 0]);
        const dist = Math.hypot(pPos[0] - x, pPos[2] - z);
        if (dist < minDist) {
          minDist = dist;
          nearest = en;
        }
      }
    });
    if (nearest) {
      set({ lockedTargetId: nearest.id });
    }
  },

  // Out of Combat Health Regeneration
  regenerateOutOfCombat: (dt = 0.1) => {
    const state = get();
    if (state.gameFlowState !== 'EXPLORING' && state.gameFlowState !== 'SAFE_POINT') return;
    const player = state.player;
    if (player && player.hp < player.maxHp) {
      const regenRate = player.maxHp * 0.04; // 4% per second
      set({
        player: {
          ...player,
          hp: Math.min(player.maxHp, +(player.hp + regenRate * dt).toFixed(1))
        }
      });
    }
  },

  // Beginner-friendly Health Recovery Potion
  useHealthPotion: () => {
    const state = get();
    const player = state.player;
    if (!player || player.hp >= player.maxHp) return false;
    sound.playLevelUp();
    const healAmount = Math.round(player.maxHp * 0.45);
    const newHp = Math.min(player.maxHp, player.hp + healAmount);
    set({
      player: {
        ...player,
        hp: newHp
      }
    });
    const safePos = safeVector3(player.position, [0, 1.8, 24]);
    get().addDamageText(`+${healAmount} HP`, [safePos[0], safePos[1] + 1.2, safePos[2]], false, false);
    get().addNotification('HEALTH RESTORED', `Recovered +${healAmount} HP`, 'info');
    return true;
  },

  // Player state
  player: { ...initialPlayerState },

  // Skills cooldowns
  skillCooldowns: {
    shadowSlash: 0,
    voidBurst: 0,
    phantomStep: 0,
    eclipseDominion: 0
  },

  // Active shadows (up to 3 can be summoned in 3D world)
  shadows: JSON.parse(JSON.stringify(DEFAULT_SHADOWS)),
  maxActiveShadows: 3,

  // Inventory & Equipment
  inventory: [
    { ...ITEMS_DATABASE[0] }, // Initiate's Dagger
    { ...ITEMS_DATABASE[4] }, // Scout Leather Garb
    { ...ITEMS_DATABASE[8], count: 3 }, // HP Potions
    { ...ITEMS_DATABASE[9], count: 2 }  // MP Potions
  ],
  equipment: {
    weapon: { ...ITEMS_DATABASE[0] },
    armor: { ...ITEMS_DATABASE[4] },
    accessory: null
  },

  // Quests
  quests: JSON.parse(JSON.stringify(QUESTS_DATABASE)),

  // Dungeon state
  dungeon: {
    name: 'The Forgotten Crypt',
    rank: 'E',
    seed: 133789,
    currentRoom: 1, // 1: Room 1, 2: Room 2, 3: Room 3, 4: Boss Arena
    totalRooms: 4,
    encounters: null,
    encountersState: {}, // { [id]: { discovered: bool, defeated: bool } }
    currentEncounter: null,
    currentWave: 1,
    totalWaves: 1,
    dangerRating: { stars: 2, label: 'MODERATE', ratingText: '★★☆☆☆' },
    roomEnemiesRemaining: 5,
    roomEnemiesTotal: 5,
    roomsUnlocked: [true, false, false, false],
    fogExplored: [1], // Room indices explored
    bossActive: false,
    bossHp: 3200,
    bossMaxHp: 3200,
    bossPhase: 1,
    bossRage: false,
    monstersDefeated: 0
  },

  // Dynamic Execution / Finisher
  executableEnemyId: null,
  executionEvent: null,
  spawnWaveEvent: null,

  // Shadow Extraction Target
  extractionTarget: null,
  showExtractionModal: false,

  // Floating Combat Numbers & Notifications
  damageNumbers: [],
  notifications: [],
  tookDamageRecent: false,

  // Navigation
  setScreen: (screen) => {
    sound.playClick();
    set((state) => ({
      previousScreen: state.currentScreen,
      currentScreen: screen
    }));
  },

  setGameFlowState: (flowState) => {
    set({ gameFlowState: flowState });
  },

  setDungeonRank: (rank) => {
    set((state) => ({ dungeon: { ...state.dungeon, rank } }));
  },

  // -------------------------------------------------------------
  // START NEW GAME (Exploration First! Never spawns into combat)
  // -------------------------------------------------------------
  startNewGame: (chosenRank = 'E') => {
    sound.playClick();
    const freshPlayer = {
      ...initialPlayerState,
      position: [0, 1, 8] // Room 1 crypt entrance archway
    };
    const seed = generateSeed();
    const encounters = generateDungeonEncounters(chosenRank, freshPlayer.level, seed);

    const encountersState = {};
    Object.values(encounters).forEach((enc) => {
      if (enc && enc.id) {
        encountersState[enc.id] = {
          discovered: false,
          defeated: false
        };
      }
    });

    const newDungeon = {
      name: 'The Forgotten Crypt',
      rank: chosenRank,
      seed,
      currentRoom: 1,
      totalRooms: 4,
      encounters,
      encountersState,
      currentEncounter: null,
      currentWave: 1,
      totalWaves: 1,
      dangerRating: { stars: 1, label: 'CALM', ratingText: '★☆☆☆☆' },
      roomEnemiesRemaining: 0,
      roomEnemiesTotal: 0,
      roomsUnlocked: [true, false, false, false],
      fogExplored: [1],
      bossActive: false,
      bossHp: encounters[4]?.boss?.maxHp || 3200,
      bossMaxHp: encounters[4]?.boss?.maxHp || 3200,
      bossPhase: 1,
      bossRage: false,
      monstersDefeated: 0
    };

    set({
      currentScreen: 'game',
      gameFlowState: 'EXPLORING',
      activeEncounter: null,
      activeEncounterId: null,
      victoryData: null,
      safePointPrompt: null,
      player: freshPlayer,
      dungeon: newDungeon,
      executableEnemyId: null,
      executionEvent: null,
      spawnWaveEvent: null,
      extractionTarget: null,
      showExtractionModal: false,
      damageNumbers: []
    });

    get().recalculateStats();

    // Auto-save the new adventure
    setTimeout(() => {
      get().saveGame();
      get().addNotification(
        'DUNGEON EXPLORATION BEGINS',
        'Explore the crypt corridors. Stay alert for environmental clues and hostile presences.',
        'info'
      );
    }, 300);
  },

  // -------------------------------------------------------------
  // CONTINUE GAME (Loads and reconstructs exact seed and rooms)
  // -------------------------------------------------------------
  continueGame: () => {
    sound.playClick();
    const result = SaveManager.loadGame();

    if (!result.success || !result.data) {
      get().addNotification('NO SAVE FOUND', 'Starting new adventure.', 'info');
      get().startNewGame();
      return;
    }

    const { data, fromBackup } = result;

    // Reconstruct deterministic encounters with saved seed and rank
    const savedSeed = data.dungeon.seed || 133789;
    const savedRank = data.dungeon.rank || 'E';
    const playerLevel = data.player.level || 1;
    const reconstructedEncounters = generateDungeonEncounters(savedRank, playerLevel, savedSeed);

    // Apply saved encounter discovery/defeated state
    const mergedEncountersState = { ...(data.dungeon.encountersState || {}) };
    Object.values(reconstructedEncounters).forEach((enc) => {
      if (enc && enc.id) {
        if (!mergedEncountersState[enc.id]) {
          mergedEncountersState[enc.id] = { discovered: false, defeated: false };
        }
        enc.discovered = Boolean(mergedEncountersState[enc.id].discovered);
        enc.defeated = Boolean(mergedEncountersState[enc.id].defeated);
      }
    });

    const activeEnc = data.activeEncounterId ? reconstructedEncounters[data.dungeon.currentRoom] : null;

    set({
      currentScreen: 'game',
      gameFlowState: 'EXPLORING', // Safely resume in exploration mode
      activeEncounter: null,
      activeEncounterId: null,
      victoryData: null,
      safePointPrompt: null,
      player: data.player,
      inventory: data.inventory,
      equipment: data.equipment,
      shadows: data.shadows,
      quests: data.quests,
      dungeon: {
        ...data.dungeon,
        encounters: reconstructedEncounters,
        encountersState: mergedEncountersState,
        currentEncounter: activeEnc
      },
      executableEnemyId: null,
      executionEvent: null,
      spawnWaveEvent: null,
      extractionTarget: null,
      showExtractionModal: false,
      damageNumbers: []
    });

    get().recalculateStats();

    if (fromBackup) {
      get().addNotification('BACKUP SAVE RESTORED', 'Primary save was repaired using the automatic backup.', 'level');
    } else {
      get().addNotification(
        'JOURNEY RESTORED',
        `Resumed in ${data.dungeon.name} (Room ${data.dungeon.currentRoom})`,
        'info'
      );
    }
  },

  // -------------------------------------------------------------
  // SAVE & RECOVERY ENGINE METHODS
  // -------------------------------------------------------------
  saveGame: (options = {}) => {
    const state = get();
    // Build snapshot
    const dataToSave = {
      player: {
        ...state.player,
        // Make sure latest global position is saved
        position: typeof window !== 'undefined' && window.__playerPos ? window.__playerPos : state.player.position
      },
      dungeon: {
        ...state.dungeon,
        encounters: null // don't serialize large object graph; regenerated from seed
      },
      inventory: state.inventory,
      equipment: state.equipment,
      shadows: state.shadows,
      quests: state.quests,
      activeEncounterId: state.activeEncounter?.id || state.activeEncounterId || null,
      gameFlowState: state.gameFlowState === 'BATTLE' ? 'EXPLORING' : state.gameFlowState
    };

    return SaveManager.saveGame(dataToSave, options);
  },

  // Save battle checkpoint before starting combat
  saveBattleCheckpoint: () => {
    return get().saveGame({ isCheckpoint: true });
  },

  loadBattleCheckpoint: () => {
    sound.playClick();
    const result = SaveManager.loadCheckpoint();
    if (!result.success || !result.data) {
      get().continueGame();
      return;
    }

    const { data } = result;
    const savedSeed = data.dungeon.seed || 133789;
    const reconstructed = generateDungeonEncounters(data.dungeon.rank || 'E', data.player.level || 1, savedSeed);

    set({
      currentScreen: 'game',
      gameFlowState: 'EXPLORING',
      activeEncounter: null,
      activeEncounterId: null,
      victoryData: null,
      player: {
        ...data.player,
        hp: data.player.maxHp, // Full health on checkpoint reload
        mana: data.player.maxMana
      },
      inventory: data.inventory,
      equipment: data.equipment,
      shadows: data.shadows,
      quests: data.quests,
      dungeon: {
        ...data.dungeon,
        encounters: reconstructed
      }
    });

    get().recalculateStats();
    get().addNotification('CHECKPOINT RESTORED', 'Ready to face the encounter once more.', 'info');
  },

  // -------------------------------------------------------------
  // MONSTER DISCOVERY & 3-PLAYER-CHOICE LOOP
  // -------------------------------------------------------------
  discoverMonster: (encounter) => {
    if (!encounter || encounter.defeated) return;
    const state = get();

    // Prevent re-triggering while already handling discovery or in battle
    if (state.gameFlowState !== 'EXPLORING') return;

    sound.playBossRoar();

    // Mark as discovered in state
    const updatedEncountersState = {
      ...state.dungeon.encountersState,
      [encounter.id]: {
        ...(state.dungeon.encountersState[encounter.id] || {}),
        discovered: true
      }
    };

    set({
      gameFlowState: 'MONSTER_DISCOVERED',
      activeEncounter: encounter,
      activeEncounterId: encounter.id,
      dungeon: {
        ...state.dungeon,
        encountersState: updatedEncountersState
      }
    });

    // Auto-save on discovering major monster
    get().saveGame();
  },

  // Option 1: ENTER BATTLE
  decideEnterBattle: () => {
    const { activeEncounter } = get();
    if (!activeEncounter) return;

    sound.playClick();

    // 1. Save battle checkpoint automatically!
    get().saveBattleCheckpoint();

    // 2. Short Cinematic Transition (1.8s)
    set({
      gameFlowState: 'BATTLE_LOADING',
      battleTransition: {
        active: true,
        monsterName: activeEncounter.primaryEnemy?.name || activeEncounter.typeName,
        countdown: 3
      }
    });

    sound.playExtraction();

    // Countdown / Transition timing
    setTimeout(() => {
      set((s) => ({ battleTransition: { ...s.battleTransition, countdown: 2 } }));
    }, 600);

    setTimeout(() => {
      set((s) => ({ battleTransition: { ...s.battleTransition, countdown: 1 } }));
    }, 1200);

    setTimeout(() => {
      const current = get().activeEncounter;
      if (!current) return;

      // Position player at safe battle distance in front of monster (8-12m)
      const fallbackZ = current.encounterCenter && Number.isFinite(current.encounterCenter[2]) ? current.encounterCenter[2] + 9.5 : 24;
      const spawnPos = safeVector3(current.battleSpawnPlayer, [0, 0.5, fallbackZ], 'battleSpawnPlayer');
      if (typeof window !== 'undefined' && window.__setPlayerPosition) {
        window.__setPlayerPosition(spawnPos[0], spawnPos[1], spawnPos[2]);
      }

      set({
        gameFlowState: 'BATTLE',
        battleTransition: { active: false, monsterName: '', countdown: 0 },
        dungeon: {
          ...get().dungeon,
          currentEncounter: current,
          dangerRating: current.dangerRating,
          roomEnemiesRemaining: current.enemies?.length || 1,
          roomEnemiesTotal: current.totalEnemies || 1
        }
      });

      sound.playBossRoar();
      get().addNotification(
        'COMBAT ENGAGED',
        `${current.primaryEnemy?.name || current.typeName} attacks!`,
        'danger'
      );
    }, 1800);
  },

  // Option 2: SAVE & PREPARE
  decideSaveAndPrepare: () => {
    sound.playClick();
    get().saveGame();
    set({ gameFlowState: 'PREPARING' });
  },

  // Option 3: BACK AWAY
  decideBackAway: () => {
    sound.playClick();
    set({
      gameFlowState: 'EXPLORING',
      activeEncounter: null,
      activeEncounterId: null
    });
    get().addNotification(
      'RETREATED',
      'You cautiously backed away. The monster remains guarding the area.',
      'info'
    );
  },

  // Return to exploration from Save & Prepare modal
  returnToExploration: () => {
    sound.playClick();
    set({
      gameFlowState: 'EXPLORING',
      activeEncounter: null,
      activeEncounterId: null
    });
  },

  // -------------------------------------------------------------
  // COMBAT VICTORY & DEFEAT
  // -------------------------------------------------------------
  onEncounterVictory: (encounter) => {
    const enc = encounter || get().activeEncounter;
    if (!enc) return;

    sound.playLevelUp();

    const xpReward = Math.round((enc.primaryEnemy?.level || 1) * 75 * (enc.hasElite ? 2.5 : 1.2));
    const goldReward = Math.round((enc.primaryEnemy?.level || 1) * 35 * (enc.hasElite ? 2.0 : 1.0));
    const droppedItem = getRandomLoot(enc.primaryEnemy?.id || 'bloodKnight')[0] || ITEMS_DATABASE[1];

    get().gainXp(xpReward);
    get().gainGold(goldReward);
    if (droppedItem) {
      get().addItemToInventory(droppedItem);
    }

    // Mark encounter as defeated in state
    const updatedEncountersState = {
      ...get().dungeon.encountersState,
      [enc.id]: {
        discovered: true,
        defeated: true
      }
    };

    set({
      gameFlowState: 'VICTORY',
      victoryData: {
        encounterName: enc.primaryEnemy?.name || enc.typeName,
        xp: xpReward,
        gold: goldReward,
        item: droppedItem
      },
      dungeon: {
        ...get().dungeon,
        encountersState: updatedEncountersState,
        monstersDefeated: get().dungeon.monstersDefeated + 1,
        roomEnemiesRemaining: 0
      }
    });

    // Auto-save victory state!
    get().saveGame();
  },

  continueExploringAfterVictory: () => {
    sound.playClick();
    const currentRoom = get().dungeon.currentRoom;
    const roomsUnlocked = [...get().dungeon.roomsUnlocked];

    // If clearing this room, unlock gate to next room!
    if (!roomsUnlocked[currentRoom] && currentRoom < get().dungeon.totalRooms) {
      roomsUnlocked[currentRoom] = true;
      get().addNotification(
        `AREA ${currentRoom} CLEARED!`,
        currentRoom === 3 ? 'Boss Chamber seal unlocked! Abyss Warden awaits.' : 'Mystic barrier dissipated. Proceed to next room.',
        'info'
      );
    }

    set({
      gameFlowState: 'EXPLORING',
      activeEncounter: null,
      activeEncounterId: null,
      victoryData: null,
      dungeon: {
        ...get().dungeon,
        roomsUnlocked
      }
    });

    // Auto-save state
    get().saveGame();
  },

  onPlayerDefeated: () => {
    set({
      gameFlowState: 'DEFEAT',
      currentScreen: 'gameover'
    });
  },

  // -------------------------------------------------------------
  // SAFE POINT INTERACTIONS (Shrines)
  // -------------------------------------------------------------
  promptSafePoint: (safePoint) => {
    if (get().gameFlowState !== 'EXPLORING') return;
    set({ safePointPrompt: safePoint });
  },

  closeSafePointPrompt: () => {
    set({ safePointPrompt: null });
  },

  confirmSafePointSave: () => {
    sound.playLoot();
    get().saveGame();
    get().healPlayer(get().player.maxHp, get().player.maxMana); // Shrine heals player
    get().addNotification('SAFE POINT ACTIVATED', 'Progress saved & essence fully restored.', 'level');
    set({ safePointPrompt: null });
  },

  // -------------------------------------------------------------
  // ROOM PROGRESSION & FOG OF EXPLORATION
  // -------------------------------------------------------------
  advanceRoom: (roomIndex) => {
    const state = get();
    if (state.dungeon.currentRoom === roomIndex) return;

    const fogExplored = [...new Set([...(state.dungeon.fogExplored || [1]), roomIndex])];

    set((s) => ({
      dungeon: {
        ...s.dungeon,
        currentRoom: roomIndex,
        fogExplored
      }
    }));

    // Auto-save when entering a new room
    get().saveGame();

    get().addNotification(
      roomIndex === 4 ? 'BOSS SANCTUM ENTERED' : `ENTERED AREA ${roomIndex}`,
      roomIndex === 4 ? 'The air turns freezing cold. Colossal sovereign awaits.' : 'New dungeon sector discovered.',
      'info'
    );
  },

  // -------------------------------------------------------------
  // COMBAT ENGINE INTERACTION & STATS
  // -------------------------------------------------------------
  recalculateStats: () => {
    set((state) => {
      const p = { ...state.player };
      const eq = state.equipment;
      const attr = p.attributes;

      const strBonus = attr.strength * 2.2;
      const agiBonusCrit = attr.agility * 0.4;
      const agiBonusSpeed = attr.agility * 0.05;
      const intBonusMana = attr.intelligence * 12;
      const vitBonusHp = attr.vitality * 18;
      const vitBonusDef = attr.vitality * 0.8;

      let eqAtk = 0;
      let eqDef = 0;
      let eqHp = 0;
      let eqMana = 0;
      let eqCrit = 0;
      let eqCritDmg = 0;

      Object.values(eq).forEach((item) => {
        if (item) {
          if (item.attack) eqAtk += item.attack;
          if (item.defense) eqDef += item.defense;
          if (item.maxHp) eqHp += item.maxHp;
          if (item.maxMana) eqMana += item.maxMana;
          if (item.critChance) eqCrit += item.critChance;
          if (item.critDamage) eqCritDmg += item.critDamage;
        }
      });

      const newMaxHp = Math.round(p.baseHp + vitBonusHp + eqHp);
      const newMaxMana = Math.round(p.baseMana + intBonusMana + eqMana);
      const newAtk = Math.round(p.baseAttack + strBonus + eqAtk);
      const newDef = Math.round(p.baseDefense + vitBonusDef + eqDef);
      const newSpeed = +(p.speed + agiBonusSpeed).toFixed(1);
      const newCritChance = +(p.critChance + agiBonusCrit + eqCrit).toFixed(1);
      const newCritDamage = Math.round(p.critDamage + eqCritDmg);

      p.maxHp = newMaxHp;
      p.hp = Math.min(p.hp, newMaxHp);
      p.maxMana = newMaxMana;
      p.mana = Math.min(p.mana, newMaxMana);
      p.attack = newAtk;
      p.defense = newDef;
      p.critChance = newCritChance;
      p.critDamage = newCritDamage;

      return { player: p };
    });
  },

  gainXp: (amount) => {
    set((state) => {
      let { level, xp, maxXp, statPoints, baseHp, baseMana, baseAttack, baseDefense } = state.player;
      let newXp = xp + amount;
      let leveledUp = false;

      while (newXp >= maxXp) {
        newXp -= maxXp;
        level += 1;
        maxXp = calculateMaxXp(level);
        statPoints += 4;
        baseHp += 30;
        baseMana += 15;
        baseAttack += 5;
        baseDefense += 3;
        leveledUp = true;
      }

      const updatedPlayer = {
        ...state.player,
        level,
        xp: newXp,
        maxXp,
        statPoints,
        baseHp,
        baseMana,
        baseAttack,
        baseDefense,
        hp: leveledUp ? baseHp + 100 : state.player.hp,
        mana: leveledUp ? baseMana + 50 : state.player.mana
      };

      if (leveledUp) {
        sound.playLevelUp();
        setTimeout(() => {
          get().addNotification(`LEVEL UP!`, `Reached Level ${level}! +4 Stat Points gained.`, 'level');
          get().recalculateStats();
          get().saveGame(); // Auto-save on level up
        }, 100);
      }

      return { player: updatedPlayer };
    });
  },

  gainGold: (amount) => {
    sound.playLoot();
    set((state) => ({
      player: { ...state.player, gold: state.player.gold + amount }
    }));
  },

  gainShadowCores: (amount) => {
    set((state) => ({
      player: { ...state.player, shadowCores: state.player.shadowCores + amount }
    }));
    get().addNotification('ESSENCE HARVESTED', `Acquired ${amount}x Ascension Essence Shard`, 'loot');
  },

  takeDamage: (rawDamage) => {
    const { player, isInvulnerable, gameFlowState } = get();
    if (isInvulnerable || player.hp <= 0) return 0;

    const def = player.defense || 10;
    const damageReduction = 100 / (100 + def);
    const actualDamage = Math.max(1, Math.round(rawDamage * damageReduction));

    sound.playHit(false);

    set((state) => {
      const nextHp = Math.max(0, state.player.hp - actualDamage);
      return {
        player: { ...state.player, hp: nextHp },
        tookDamageRecent: true
      };
    });

    setTimeout(() => {
      set({ tookDamageRecent: false });
    }, 180);

    if (get().player.hp <= 0) {
      setTimeout(() => {
        get().onPlayerDefeated();
      }, 400);
    }

    return actualDamage;
  },

  healPlayer: (hpAmount, manaAmount = 0) => {
    set((state) => {
      const newHp = Math.min(state.player.maxHp, state.player.hp + hpAmount);
      const newMana = Math.min(state.player.maxMana, state.player.mana + manaAmount);
      return {
        player: { ...state.player, hp: newHp, mana: newMana }
      };
    });
  },

  allocateStat: (attrKey) => {
    const { player } = get();
    if (player.statPoints <= 0) return;

    sound.playClick();
    set((state) => ({
      player: {
        ...state.player,
        statPoints: state.player.statPoints - 1,
        attributes: {
          ...state.player.attributes,
          [attrKey]: state.player.attributes[attrKey] + 1
        }
      }
    }));
    get().recalculateStats();
  },

  canUseSkill: (skillId) => {
    const state = get();
    // Allow skills only in BATTLE state
    if (state.gameFlowState !== 'BATTLE') return false;

    const skill = SKILLS[skillId];
    if (!skill) return false;

    const now = Date.now() / 1000;
    const readyAt = state.skillCooldowns[skillId] || 0;
    const hasMana = state.player.mana >= skill.manaCost;

    return now >= readyAt && hasMana;
  },

  triggerSkill: (skillId) => {
    const skill = SKILLS[skillId];
    if (!skill || !get().canUseSkill(skillId)) return false;

    const now = Date.now() / 1000;
    const cooldownExpires = now + skill.cooldown;

    set((state) => ({
      player: { ...state.player, mana: Math.max(0, state.player.mana - skill.manaCost) },
      skillCooldowns: { ...state.skillCooldowns, [skillId]: cooldownExpires }
    }));

    if (skillId === 'shadowSlash') sound.playShadowSlash();
    else if (skillId === 'phantomStep') {
      sound.playDash();
      set((state) => ({ player: { ...state.player, isInvulnerable: true, isDashing: true } }));
      setTimeout(() => {
        set((state) => ({ player: { ...state.player, isInvulnerable: false, isDashing: false } }));
      }, (skill.invulnerableDuration || 0.5) * 1000);
    } else if (skillId === 'voidBurst') sound.playVoidBurst();
    else if (skillId === 'eclipseDominion') {
      sound.playUltimate();
      get().addNotification('ECLIPSE DOMINION ACTIVATED', 'Shadow forces surge with 150% power!', 'info');
    }

    return true;
  },

  regenTick: (delta) => {
    regenAccumulator += delta;
    if (regenAccumulator < 0.25) return;
    const elapsed = regenAccumulator;
    regenAccumulator = 0;

    const state = get();
    if (state.currentScreen !== 'game') return;
    const p = state.player;
    if (p.hp >= p.maxHp && p.mana >= p.maxMana) return;

    const manaRegenRate = 5.0;
    const hpRegenRate = 1.0;
    const nextMana = Math.min(p.maxMana, p.mana + manaRegenRate * elapsed);
    const nextHp = Math.min(p.maxHp, p.hp + hpRegenRate * elapsed);

    set({
      player: { ...p, mana: nextMana, hp: nextHp }
    });
  },

  equipItem: (item) => {
    sound.playClick();
    set((state) => {
      const slot = item.category;
      if (!['weapon', 'armor', 'accessory'].includes(slot)) return state;

      const previousEquipped = state.equipment[slot];
      const newInventory = state.inventory.filter((i) => i !== item);

      if (previousEquipped) {
        newInventory.push(previousEquipped);
      }

      return {
        equipment: { ...state.equipment, [slot]: item },
        inventory: newInventory
      };
    });
    get().recalculateStats();
    get().addNotification('ITEM EQUIPPED', item.name, 'loot');
    get().saveGame();
  },

  unequipItem: (slot) => {
    sound.playClick();
    set((state) => {
      const currentItem = state.equipment[slot];
      if (!currentItem) return state;

      return {
        equipment: { ...state.equipment, [slot]: null },
        inventory: [...state.inventory, currentItem]
      };
    });
    get().recalculateStats();
    get().saveGame();
  },

  useConsumable: (item) => {
    if (item.category !== 'consumable') return;
    sound.playLoot();

    if (item.healAmount) {
      get().healPlayer(item.healAmount, 0);
      get().addNotification('POTION USED', `Restored ${item.healAmount} HP`, 'info');
    }
    if (item.manaAmount) {
      get().healPlayer(0, item.manaAmount);
      get().addNotification('POTION USED', `Restored ${item.manaAmount} MP`, 'info');
    }
    if (item.id === 'con_shadow_core') {
      get().gainShadowCores(1);
    }

    set((state) => {
      let updatedInv = [...state.inventory];
      const index = updatedInv.indexOf(item);
      if (index !== -1) {
        if (item.count && item.count > 1) {
          updatedInv[index] = { ...item, count: item.count - 1 };
        } else {
          updatedInv.splice(index, 1);
        }
      }
      return { inventory: updatedInv };
    });
  },

  addItemToInventory: (item) => {
    sound.playLoot();
    set((state) => {
      if (item.category === 'consumable') {
        const existing = state.inventory.find((i) => i.id === item.id);
        if (existing) {
          existing.count = (existing.count || 1) + (item.count || 1);
          return { inventory: [...state.inventory] };
        }
      }
      return { inventory: [...state.inventory, { ...item, count: item.count || 1 }] };
    });
    get().addNotification('ITEM ACQUIRED', `${item.name} (${item.rarity.toUpperCase()})`, 'loot');
  },

  // Shadow Extraction Flow
  openExtractionModal: (target) => {
    set({
      extractionTarget: target,
      showExtractionModal: true
    });
  },

  closeExtractionModal: () => {
    set({
      extractionTarget: null,
      showExtractionModal: false
    });
  },

  performExtraction: () => {
    const { extractionTarget, shadows } = get();
    if (!extractionTarget) return;

    sound.playExtraction();

    let extractedShadow = null;
    const updatedShadows = shadows.map((sh) => {
      if (sh.id === extractionTarget.shadowId || sh.name.toLowerCase().includes(extractionTarget.name.toLowerCase().split(' ')[0])) {
        extractedShadow = sh;
        return {
          ...sh,
          unlocked: true,
          level: sh.level + 1,
          hp: sh.hp + 50,
          maxHp: sh.maxHp + 50,
          attack: sh.attack + 8,
          defense: sh.defense + 4
        };
      }
      return sh;
    });

    if (!extractedShadow && shadows.length > 0) {
      const locked = shadows.find((s) => !s.unlocked);
      if (locked) {
        locked.unlocked = true;
        extractedShadow = locked;
      }
    }

    set({
      shadows: updatedShadows,
      extractionTarget: null,
      showExtractionModal: false
    });

    get().updateQuestProgress('extract_shadow', 1);
    get().updateQuestProgress('extract_shadows_2', 1);

    const shadowName = extractedShadow ? extractedShadow.name : 'Shadow Soldier';
    get().addNotification('SHADOW ACQUIRED!', `${shadowName} extracted into your army!`, 'shadow');
    get().saveGame();
  },

  toggleShadowActive: (shadowId) => {
    sound.playClick();
    set((state) => {
      const activeCount = state.shadows.filter((s) => s.active && s.unlocked).length;
      const target = state.shadows.find((s) => s.id === shadowId);
      if (!target || !target.unlocked) return state;

      if (!target.active && activeCount >= state.maxActiveShadows) {
        get().addNotification('SUMMON LIMIT', `Maximum ${state.maxActiveShadows} active shadows allowed.`, 'info');
        return state;
      }

      const updated = state.shadows.map((s) => {
        if (s.id === shadowId) {
          return { ...s, active: !s.active };
        }
        return s;
      });

      return { shadows: updated };
    });
  },

  upgradeShadow: (shadowId) => {
    const { player } = get();
    if (player.shadowCores < 1) {
      get().addNotification('INSUFFICIENT ESSENCE', 'Need at least 1 Ascension Essence Shard.', 'info');
      return;
    }

    sound.playLevelUp();
    set((state) => {
      const updated = state.shadows.map((s) => {
        if (s.id === shadowId && s.unlocked) {
          return {
            ...s,
            level: s.level + 1,
            hp: s.hp + 60,
            maxHp: s.maxHp + 60,
            attack: s.attack + 10,
            defense: s.defense + 6
          };
        }
        return s;
      });

      return {
        player: { ...state.player, shadowCores: state.player.shadowCores - 1 },
        shadows: updated
      };
    });

    get().addNotification('SHADOW ASCENDED', 'Shadow warrior stats greatly enhanced!', 'shadow');
    get().saveGame();
  },

  updateQuestProgress: (objectiveId, increment = 1) => {
    set((state) => {
      let questCompleted = false;
      let completedQuestObj = null;

      const updatedQuests = state.quests.map((q) => {
        if (q.completed) return q;

        let allDone = true;
        const updatedObjectives = q.objectives.map((obj) => {
          if (obj.id === objectiveId) {
            const nextCurrent = Math.min(obj.target, obj.current + increment);
            if (nextCurrent < obj.target) allDone = false;
            return { ...obj, current: nextCurrent };
          }
          if (obj.current < obj.target) allDone = false;
          return obj;
        });

        if (allDone && !q.completed) {
          questCompleted = true;
          completedQuestObj = q;
          return { ...q, objectives: updatedObjectives, completed: true };
        }

        return { ...q, objectives: updatedObjectives };
      });

      if (questCompleted && completedQuestObj) {
        sound.playLevelUp();
        setTimeout(() => {
          get().gainXp(completedQuestObj.rewards.xp);
          get().gainGold(completedQuestObj.rewards.gold);
          if (completedQuestObj.rewards.shadowCores) {
            get().gainShadowCores(completedQuestObj.rewards.shadowCores);
          }
          get().addNotification('QUEST COMPLETED!', completedQuestObj.title, 'level');
          get().saveGame();
        }, 200);
      }

      return { quests: updatedQuests };
    });
  },

  setExecutableEnemyId: (enemyId) => {
    set({ executableEnemyId: enemyId });
  },

  triggerFinisher: (targetEnemy) => {
    sound.playShadowSlash();
    sound.playHit(true);
    sound.playExtraction();
    get().addNotification('SHADOW EXECUTION!', 'Lethal execution finisher delivered!', 'shadow');
    set({
      executionEvent: { targetEnemy, timestamp: Date.now() },
      executableEnemyId: null
    });
  },

  // Record individual monster defeated during battle
  recordMonsterDefeated: (enemyType, pos) => {
    const state = get();
    const d = { ...state.dungeon };
    d.monstersDefeated += 1;
    d.roomEnemiesRemaining = Math.max(0, d.roomEnemiesRemaining - 1);

    get().updateQuestProgress('defeat_monsters', 1);
    get().updateQuestProgress('defeat_any_15', 1);

    // Multi-wave check
    if (d.roomEnemiesRemaining === 0 && d.currentEncounter && d.currentWave < d.currentEncounter.totalWaves) {
      const nextWaveNum = d.currentWave + 1;
      const nextWave = d.currentEncounter.waves.find((w) => w.waveNumber === nextWaveNum);
      if (nextWave) {
        d.currentWave = nextWaveNum;
        d.roomEnemiesRemaining = nextWave.enemies.length;
        sound.playBossRoar();
        get().addNotification(
          `WAVE ${nextWaveNum}/${d.currentEncounter.totalWaves} INVASION!`,
          nextWave.waveName || 'Reinforcements swarming!',
          'danger'
        );
        set({
          dungeon: d,
          spawnWaveEvent: { wave: nextWave, timestamp: Date.now() }
        });
        return;
      }
    }

    set({ dungeon: d });

    // If all enemies in the current battle encounter are dead -> Trigger Victory!
    if (d.roomEnemiesRemaining === 0 && state.gameFlowState === 'BATTLE') {
      setTimeout(() => {
        get().onEncounterVictory(d.currentEncounter);
      }, 500);
    }
  },

  updateBossHp: (newHp) => {
    set((state) => {
      const d = { ...state.dungeon };
      d.bossHp = Math.max(0, newHp);

      const hpPercent = (d.bossHp / d.bossMaxHp) * 100;
      if (hpPercent <= 25 && d.bossPhase < 4) {
        d.bossPhase = 4;
        d.bossRage = true;
        sound.playBossRoar();
        get().addNotification('BOSS ENRAGED!', 'Abyss Warden enters Phase 4: Void Frenzy!', 'danger');
      } else if (hpPercent <= 50 && d.bossPhase < 3) {
        d.bossPhase = 3;
        sound.playBossRoar();
        get().addNotification('PHASE 3: VOID CATACLYSM', 'Abyss Warden unleashes dark energy ripples!', 'danger');
      } else if (hpPercent <= 75 && d.bossPhase < 2) {
        d.bossPhase = 2;
        sound.playBossRoar();
        get().addNotification('PHASE 2: MINION SWARM', 'Abyss Warden summons void reavers!', 'danger');
      }

      if (d.bossHp <= 0) {
        setTimeout(() => {
          get().updateQuestProgress('defeat_boss', 1);
          get().onEncounterVictory(d.encounters?.[4] || { primaryEnemy: { name: 'Abyss Warden', level: 25 }, hasElite: true });
          get().openExtractionModal({
            id: 'boss_extraction',
            name: 'Abyss Warden',
            rank: 'A',
            shadowId: 'umbral_general',
            position: [0, 0, -136]
          });
        }, 600);
      }

      return { dungeon: d };
    });
  },

  addDamageText: (text, pos, isCrit = false, isPlayer = false) => {
    const id = Math.random().toString(36).substring(2, 9);
    const color = isPlayer ? '#ef4444' : isCrit ? '#f59e0b' : '#f3f4f6';
    const fallbackPos = isPlayer
      ? (typeof window !== 'undefined' && window.__playerPos ? window.__playerPos : [0, 1.5, 24])
      : [0, 1.5, 0];
    const safePos = safeVector3(pos, fallbackPos, 'addDamageText');
    set((state) => ({
      damageNumbers: [...state.damageNumbers.slice(-15), { id, text, position: safePos, isCrit, color }]
    }));

    setTimeout(() => {
      set((state) => ({
        damageNumbers: state.damageNumbers.filter((n) => n.id !== id)
      }));
    }, 1200);
  },

  addNotification: (title, subtitle, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      notifications: [...state.notifications.slice(-4), { id, title, subtitle, type }]
    }));

    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      }));
    }, 3800);
  },

  resetGame: () => {
    SaveManager.deleteSave();
    get().startNewGame();
    get().addNotification('PROGRESS RESET', 'New adventure initiated.', 'info');
  }
}));

// Subscribe to SaveManager status updates for UI indicator
subscribeSaveStatus(({ status, text }) => {
  useGameStore.setState({
    saveIndicator: {
      visible: status !== 'idle',
      text,
      status
    }
  });
});

if (typeof window !== 'undefined') {
  window.__useGameStore = useGameStore;
}

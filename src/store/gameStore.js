import { create } from 'zustand';
import { sound } from '../audio/soundManager';
import { SKILLS } from '../data/skills';
import { ITEMS_DATABASE, getRandomLoot } from '../data/items';
import { QUESTS_DATABASE } from '../data/quests';
import { DEFAULT_SHADOWS } from '../data/shadowArmy';
import { generateDungeonEncounters } from '../game/encounters/EncounterManager';

const SAVE_KEY = 'shadow_ascension_save_v1';

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
  position: [0, 0.5, 0],
  rotation: 0
};

export const useGameStore = create((set, get) => ({
  // Screen management: 'menu', 'game', 'character', 'inventory', 'shadows', 'settings', 'gameover', 'victory'
  currentScreen: 'menu',
  previousScreen: 'menu',
  isPaused: false,

  // Performance & Graphics Settings
  graphicsQuality: 'high', // 'low' | 'medium' | 'high' | 'ultra'
  autoFpsOptimization: true,
  setGraphicsQuality: (quality) => set({ graphicsQuality: quality }),
  setAutoFpsOptimization: (enabled) => set({ autoFpsOptimization: enabled }),

  // Player state
  player: { ...initialPlayerState },

  // Skills cooldowns: key -> timestamp when it will be ready
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
    currentRoom: 1, // 1: Room 1, 2: Room 2, 3: Room 3, 4: Boss Arena
    totalRooms: 4,
    encounters: null,
    currentEncounter: null,
    currentWave: 1,
    totalWaves: 1,
    dangerRating: { stars: 2, label: 'MODERATE', ratingText: '★★☆☆☆' },
    roomEnemiesRemaining: 5,
    roomEnemiesTotal: 5,
    roomsUnlocked: [true, false, false, false],
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
  extractionTarget: null, // { id, name, rank, shadowId, position }
  showExtractionModal: false,

  // Dynamic Combat floating numbers: [{ id, text, position, isCrit, color }]
  damageNumbers: [],

  // Notification banners: [{ id, title, subtitle, type, icon }]
  notifications: [],

  // Screen damage flash
  tookDamageRecent: false,

  // Navigation
  setScreen: (screen) => {
    sound.playClick();
    set((state) => ({
      previousScreen: state.currentScreen,
      currentScreen: screen
    }));
  },

  setDungeonRank: (rank) => {
    set((state) => ({ dungeon: { ...state.dungeon, rank } }));
  },

  startNewGame: (chosenRank = 'E') => {
    sound.playClick();
    const freshPlayer = { ...initialPlayerState };
    const encounters = generateDungeonEncounters(chosenRank, freshPlayer.level);
    const r1 = encounters[1];

    set({
      currentScreen: 'game',
      player: freshPlayer,
      dungeon: {
        name: 'The Forgotten Crypt',
        rank: chosenRank,
        currentRoom: 1,
        totalRooms: 4,
        encounters,
        currentEncounter: r1,
        currentWave: 1,
        totalWaves: r1 ? r1.totalWaves : 1,
        dangerRating: r1 ? r1.dangerRating : { stars: 2, label: 'MODERATE', ratingText: '★★☆☆☆' },
        roomEnemiesRemaining: r1 ? r1.enemies.length : 5,
        roomEnemiesTotal: r1 ? r1.totalEnemies : 5,
        roomsUnlocked: [true, false, false, false],
        bossActive: false,
        bossHp: encounters[4]?.boss?.maxHp || 3200,
        bossMaxHp: encounters[4]?.boss?.maxHp || 3200,
        bossPhase: 1,
        bossRage: false,
        monstersDefeated: 0
      },
      executableEnemyId: null,
      executionEvent: null,
      spawnWaveEvent: null,
      extractionTarget: null,
      showExtractionModal: false,
      damageNumbers: []
    });
    get().recalculateStats();
    if (r1) {
      get().addNotification(
        `${r1.typeName.toUpperCase()}`,
        `Danger: ${r1.dangerRating.ratingText} (${r1.dangerRating.label}) - ${r1.totalEnemies} hostile entities detected.`,
        'danger'
      );
    } else {
      get().addNotification('ASCENSION AWAKENED', 'Enter the crypt and gather your shadow army.', 'info');
    }
  },

  continueGame: () => {
    sound.playClick();
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      get().loadGame();
    }
    set({ currentScreen: 'game' });
  },

  // Recalculate stats from base + attributes + equipment
  recalculateStats: () => {
    set((state) => {
      const p = { ...state.player };
      const eq = state.equipment;
      const attr = p.attributes;

      // Attributes influence
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

  // Experience and Leveling
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
        hp: leveledUp ? baseHp + 100 : state.player.hp, // Full heal on level up
        mana: leveledUp ? baseMana + 50 : state.player.mana
      };

      if (leveledUp) {
        sound.playLevelUp();
        setTimeout(() => {
          get().addNotification(`LEVEL UP!`, `You reached Level ${level}! +4 Stat Points gained.`, 'level');
          get().recalculateStats();
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

  // Player takes damage
  takeDamage: (rawDamage) => {
    const { player, isInvulnerable } = get();
    if (isInvulnerable || player.hp <= 0) return 0;

    // Damage reduced by defense formula: damage = raw * (100 / (100 + defense))
    const def = player.defense || 10;
    const damageReduction = 100 / (100 + def);
    const actualDamage = Math.max(1, Math.round(rawDamage * damageReduction));

    sound.playHit(false);

    set((state) => {
      const nextHp = Math.max(0, state.player.hp - actualDamage);
      const isDead = nextHp <= 0;

      return {
        player: { ...state.player, hp: nextHp },
        tookDamageRecent: true
      };
    });

    // Reset damage flash
    setTimeout(() => {
      set({ tookDamageRecent: false });
    }, 180);

    if (get().player.hp <= 0) {
      setTimeout(() => {
        set({ currentScreen: 'gameover' });
      }, 500);
    }

    return actualDamage;
  },

  // Heal player HP & MP
  healPlayer: (hpAmount, manaAmount = 0) => {
    set((state) => {
      const newHp = Math.min(state.player.maxHp, state.player.hp + hpAmount);
      const newMana = Math.min(state.player.maxMana, state.player.mana + manaAmount);
      return {
        player: { ...state.player, hp: newHp, mana: newMana }
      };
    });
  },

  // Attribute Point Allocation
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

  // Skill execution & cooldown checks
  canUseSkill: (skillId) => {
    const state = get();
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

    // Deduct mana
    set((state) => ({
      player: { ...state.player, mana: Math.max(0, state.player.mana - skill.manaCost) },
      skillCooldowns: { ...state.skillCooldowns, [skillId]: cooldownExpires }
    }));

    // Trigger skill sound
    if (skillId === 'shadowSlash') sound.playShadowSlash();
    else if (skillId === 'phantomStep') {
      sound.playDash();
      // Set invulnerability
      set((state) => ({ player: { ...state.player, isInvulnerable: true, isDashing: true } }));
      setTimeout(() => {
        set((state) => ({ player: { ...state.player, isInvulnerable: false, isDashing: false } }));
      }, (skill.invulnerableDuration || 0.5) * 1000);
    } else if (skillId === 'voidBurst') sound.playVoidBurst();
    else if (skillId === 'eclipseDominion') {
      sound.playUltimate();
      // Summon additional temporary shadow buffs
      get().addNotification('ECLIPSE DOMINION ACTIVATED', 'Shadow forces surge with 150% power!', 'info');
    }

    return true;
  },

  // Natural Mana & HP Regeneration loop (throttled to 4 updates/sec max to avoid React render churn)
  regenTick: (delta) => {
    if (!regenTick._accum) regenTick._accum = 0;
    regenTick._accum += delta;
    if (regenTick._accum < 0.25) return;
    const elapsed = regenTick._accum;
    regenTick._accum = 0;

    const state = get();
    if (state.currentScreen !== 'game') return;
    const p = state.player;
    if (p.hp >= p.maxHp && p.mana >= p.maxMana) return;

    const manaRegenRate = 5.0; // 5 MP / sec
    const hpRegenRate = 1.0; // 1 HP / sec
    const nextMana = Math.min(p.maxMana, p.mana + manaRegenRate * elapsed);
    const nextHp = Math.min(p.maxHp, p.hp + hpRegenRate * elapsed);

    set({
      player: { ...p, mana: nextMana, hp: nextHp }
    });
  },

  // Equipment & Inventory actions
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
      // Check if stackable consumable
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

    // Unlock or level up corresponding shadow companion
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
      // Fallback unlock first locked shadow
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

    // Update quest progress
    get().updateQuestProgress('extract_shadow', 1);
    get().updateQuestProgress('extract_shadows_2', 1);

    const shadowName = extractedShadow ? extractedShadow.name : 'Shadow Soldier';
    get().addNotification('SHADOW ACQUIRED!', `${shadowName} extracted into your army!`, 'shadow');
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
    const { player, shadows } = get();
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
  },

  // Quests
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
        }, 200);
      }

      return { quests: updatedQuests };
    });
  },

  // Dynamic Execution / Finisher Trigger
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

  // Dungeon Progression
  recordMonsterDefeated: (enemyType, pos) => {
    const state = get();
    const d = { ...state.dungeon };
    d.monstersDefeated += 1;
    d.roomEnemiesRemaining = Math.max(0, d.roomEnemiesRemaining - 1);

    // Update quest counters
    get().updateQuestProgress('defeat_monsters', 1);
    get().updateQuestProgress('defeat_any_15', 1);

    // Check if next wave should be spawned in current room (e.g. Swarm waves!)
    if (d.roomEnemiesRemaining === 0 && d.currentEncounter && d.currentWave < d.currentEncounter.totalWaves) {
      const nextWaveNum = d.currentWave + 1;
      const nextWave = d.currentEncounter.waves.find((w) => w.waveNumber === nextWaveNum);
      if (nextWave) {
        d.currentWave = nextWaveNum;
        d.roomEnemiesRemaining = nextWave.enemies.length;
        sound.playBossRoar();
        get().addNotification(
          `WAVE ${nextWaveNum}/${d.currentEncounter.totalWaves} INVASION!`,
          nextWave.waveName || 'Reinforcements swarming the room!',
          'danger'
        );
        set({
          dungeon: d,
          spawnWaveEvent: { wave: nextWave, timestamp: Date.now() }
        });
        return;
      }
    }

    // If current room is cleared of enemies and all waves
    if (d.roomEnemiesRemaining === 0 && !d.roomsUnlocked[d.currentRoom]) {
      const newUnlocked = [...d.roomsUnlocked];
      if (d.currentRoom < d.totalRooms) {
        newUnlocked[d.currentRoom] = true;
        sound.playBossRoar();
        get().addNotification(
          `AREA ${d.currentRoom} CLEARED!`,
          d.currentRoom === 3 ? 'Boss Chamber seal unlocked! Abyss Warden awaits.' : 'Mystic barrier dissipated. Proceed to next room.',
          'info'
        );
      }
      d.roomsUnlocked = newUnlocked;
    }

    set({ dungeon: d });
  },

  advanceRoom: (roomIndex) => {
    set((state) => {
      const d = { ...state.dungeon };
      d.currentRoom = roomIndex;
      const encounters = d.encounters || generateDungeonEncounters(d.rank || 'E', state.player.level);
      d.encounters = encounters;
      const enc = encounters[roomIndex];
      d.currentEncounter = enc;
      d.currentWave = 1;
      d.totalWaves = enc ? enc.totalWaves : 1;
      d.dangerRating = enc ? enc.dangerRating : { stars: 3, label: 'HIGH', ratingText: '★★★☆☆' };

      if (roomIndex === 4) {
        d.bossActive = true;
        d.roomEnemiesRemaining = 1;
        d.roomEnemiesTotal = 1;
        sound.playBossRoar();
        get().addNotification('BOSS ENGAGED', 'Abyss Warden emerges from the dark void!', 'danger');
      } else if (enc) {
        d.roomEnemiesRemaining = enc.enemies.length;
        d.roomEnemiesTotal = enc.totalEnemies;
        sound.playBossRoar();
        get().addNotification(
          `${enc.typeName.toUpperCase()}`,
          `Danger: ${enc.dangerRating.ratingText} (${enc.dangerRating.label}) - ${enc.totalEnemies} hostiles detected.`,
          'danger'
        );
      }
      return { dungeon: d };
    });
  },

  updateBossHp: (newHp) => {
    set((state) => {
      const d = { ...state.dungeon };
      d.bossHp = Math.max(0, newHp);

      // Phase transitions
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
        // Boss defeated!
        setTimeout(() => {
          get().updateQuestProgress('defeat_boss', 1);
          get().addNotification('VICTORY!', 'The Abyss Warden has fallen!', 'level');
          // Offer boss extraction
          get().openExtractionModal({
            id: 'boss_extraction',
            name: 'Abyss Warden',
            rank: 'A',
            shadowId: 'umbral_general',
            position: [0, 0, -90]
          });
        }, 600);
      }

      return { dungeon: d };
    });
  },

  // Floating Combat Numbers
  addDamageText: (text, pos, isCrit = false, isPlayer = false) => {
    const id = Math.random().toString(36).substring(2, 9);
    const color = isPlayer ? '#ef4444' : isCrit ? '#f59e0b' : '#f3f4f6';
    set((state) => ({
      damageNumbers: [...state.damageNumbers.slice(-15), { id, text, position: pos, isCrit, color }]
    }));

    setTimeout(() => {
      set((state) => ({
        damageNumbers: state.damageNumbers.filter((n) => n.id !== id)
      }));
    }, 1200);
  },

  // Notification queue
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

  // Save / Load / Reset
  saveGame: () => {
    const state = get();
    const dataToSave = {
      player: state.player,
      shadows: state.shadows,
      inventory: state.inventory,
      equipment: state.equipment,
      quests: state.quests,
      dungeon: state.dungeon
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
      get().addNotification('GAME SAVED', 'Progress saved to local storage.', 'info');
    } catch (e) {
      console.error('Failed to save', e);
    }
  },

  loadGame: () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        get().addNotification('NO SAVE FOUND', 'Starting fresh session.', 'info');
        return;
      }
      const parsed = JSON.parse(raw);
      set({
        player: parsed.player,
        shadows: parsed.shadows,
        inventory: parsed.inventory,
        equipment: parsed.equipment,
        quests: parsed.quests,
        dungeon: parsed.dungeon
      });
      get().recalculateStats();
      get().addNotification('GAME LOADED', `Welcome back, ${parsed.player.name || 'Hunter'}!`, 'info');
    } catch (e) {
      console.error('Failed to load', e);
    }
  },

  resetGame: () => {
    localStorage.removeItem(SAVE_KEY);
    get().startNewGame();
    get().addNotification('PROGRESS RESET', 'New journey initiated.', 'info');
  }
}));

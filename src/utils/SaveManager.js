// -------------------------------------------------------------
// SHADOW ASCENSION - ROBUST SAVE & RECOVERY ENGINE (SaveManager)
// Features: Versioning, Primary & Automatic Backup, Validation & Repair,
// Checkpoints, and Corruption Recovery.
// -------------------------------------------------------------

export const SAVE_VERSION = 1;
export const PRIMARY_SAVE_KEY = 'shadow_ascension_save_v1';
export const BACKUP_SAVE_KEY = 'shadow_ascension_save_backup_v1';
export const CHECKPOINT_KEY = 'shadow_ascension_checkpoint_v1';

// Save event listeners for UI indicator
const saveStatusListeners = new Set();

export function subscribeSaveStatus(listener) {
  saveStatusListeners.add(listener);
  return () => saveStatusListeners.delete(listener);
}

function notifySaveStatus(status, text) {
  saveStatusListeners.forEach((fn) => {
    try {
      fn({ status, text });
    } catch (e) {
      console.error('Save status listener error:', e);
    }
  });
}

/**
 * Validates and repairs arbitrary save data with safe defaults.
 * Guarantees no NaN, null player, invalid coordinates, or game-breaking corruption.
 */
export function validateSaveData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, sanitized: null, reason: 'Root data is not an object' };
  }

  try {
    const version = Number(data.version) || SAVE_VERSION;
    const timestamp = Number(data.timestamp) || Date.now();

    // 1. Sanitize Player
    const rawP = data.player || {};
    const level = Math.max(1, Math.floor(Number(rawP.level) || 1));
    const maxHp = Math.max(100, Math.floor(Number(rawP.maxHp) || 350));
    // Never allow loading in with 0 or negative HP (auto-recover to maxHp or saved HP)
    let hp = Number(rawP.hp);
    if (!Number.isFinite(hp) || hp <= 0) {
      hp = maxHp;
    } else {
      hp = Math.min(maxHp, hp);
    }

    const maxMana = Math.max(50, Math.floor(Number(rawP.maxMana) || 150));
    let mana = Number(rawP.mana);
    if (!Number.isFinite(mana) || mana < 0) {
      mana = maxMana;
    } else {
      mana = Math.min(maxMana, mana);
    }

    // Coordinates sanity check: [x, y, z] must be numbers within dungeon bounds
    let position = [0, 0.5, 24]; // Entrance corridor default
    if (Array.isArray(rawP.position) && rawP.position.length >= 3) {
      const x = Number(rawP.position[0]);
      const y = Number(rawP.position[1]);
      const z = Number(rawP.position[2]);
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        // Dungeon bounds: X roughly -25 to 25, Z roughly -165 to 30
        const clampedX = Math.max(-24, Math.min(24, x));
        const clampedY = Math.max(0, Math.min(10, y));
        const clampedZ = Math.max(-165, Math.min(28, z));
        position = [clampedX, clampedY, clampedZ];
      }
    }

    const player = {
      name: typeof rawP.name === 'string' && rawP.name.trim() ? rawP.name.trim() : 'Kael',
      level,
      xp: Math.max(0, Math.floor(Number(rawP.xp) || 0)),
      maxXp: Math.max(50, Math.floor(Number(rawP.maxXp) || 100)),
      baseHp: Math.max(100, Math.floor(Number(rawP.baseHp) || 350)),
      hp,
      maxHp,
      baseMana: Math.max(50, Math.floor(Number(rawP.baseMana) || 150)),
      mana,
      maxMana,
      baseAttack: Math.max(1, Math.floor(Number(rawP.baseAttack) || 25)),
      attack: Math.max(1, Math.floor(Number(rawP.attack) || 25)),
      baseDefense: Math.max(0, Math.floor(Number(rawP.baseDefense) || 12)),
      defense: Math.max(0, Math.floor(Number(rawP.defense) || 12)),
      speed: Math.max(3.0, Number(rawP.speed) || 6.5),
      critChance: Math.max(0, Number(rawP.critChance) || 10),
      critDamage: Math.max(100, Number(rawP.critDamage) || 150),
      statPoints: Math.max(0, Math.floor(Number(rawP.statPoints) || 0)),
      attributes: {
        strength: Math.max(1, Math.floor(Number(rawP.attributes?.strength) || 10)),
        agility: Math.max(1, Math.floor(Number(rawP.attributes?.agility) || 10)),
        intelligence: Math.max(1, Math.floor(Number(rawP.attributes?.intelligence) || 10)),
        vitality: Math.max(1, Math.floor(Number(rawP.attributes?.vitality) || 10))
      },
      gold: Math.max(0, Math.floor(Number(rawP.gold) || 0)),
      shadowCores: Math.max(0, Math.floor(Number(rawP.shadowCores) || 0)),
      isInvulnerable: false,
      isDashing: false,
      isAttacking: false,
      comboStep: 1,
      position,
      rotation: Number.isFinite(Number(rawP.rotation)) ? Number(rawP.rotation) : 0
    };

    // 2. Sanitize Dungeon
    const rawD = data.dungeon || {};
    const dungeon = {
      name: rawD.name || 'The Forgotten Crypt',
      rank: rawD.rank || 'E',
      seed: Number.isFinite(Number(rawD.seed)) ? Number(rawD.seed) : 133789,
      currentRoom: Math.max(1, Math.min(4, Math.floor(Number(rawD.currentRoom) || 1))),
      totalRooms: 4,
      roomsUnlocked: Array.isArray(rawD.roomsUnlocked) && rawD.roomsUnlocked.length === 4
        ? rawD.roomsUnlocked.map((u, i) => (i === 0 ? true : Boolean(u)))
        : [true, false, false, false],
      fogExplored: Array.isArray(rawD.fogExplored)
        ? rawD.fogExplored
        : [1], // Room 1 explored by default
      encountersState: rawD.encountersState && typeof rawD.encountersState === 'object'
        ? rawD.encountersState
        : {},
      currentEncounterId: rawD.currentEncounterId || null,
      bossActive: Boolean(rawD.bossActive),
      bossHp: Number.isFinite(Number(rawD.bossHp)) ? Math.max(0, Number(rawD.bossHp)) : 3200,
      bossMaxHp: Number.isFinite(Number(rawD.bossMaxHp)) ? Math.max(100, Number(rawD.bossMaxHp)) : 3200,
      bossPhase: Math.max(1, Math.min(4, Math.floor(Number(rawD.bossPhase) || 1))),
      bossRage: Boolean(rawD.bossRage),
      monstersDefeated: Math.max(0, Math.floor(Number(rawD.monstersDefeated) || 0))
    };

    // 3. Sanitize Inventory & Equipment
    const inventory = Array.isArray(data.inventory) ? data.inventory : [];
    const equipment = data.equipment && typeof data.equipment === 'object'
      ? data.equipment
      : { weapon: null, armor: null, accessory: null };

    // 4. Sanitize Shadows & Quests
    const shadows = Array.isArray(data.shadows) ? data.shadows : [];
    const quests = Array.isArray(data.quests) ? data.quests : [];

    // 5. Sanitize State Machine
    const validStates = [
      'MAIN_MENU',
      'NEW_GAME',
      'LOADING_SAVE',
      'EXPLORING',
      'MONSTER_DISCOVERED',
      'ENCOUNTER_DECISION',
      'PREPARING',
      'BATTLE_LOADING',
      'BATTLE',
      'VICTORY',
      'DEFEAT',
      'RETURNING_TO_EXPLORATION',
      'PAUSED'
    ];
    let currentState = typeof data.currentState === 'string' && validStates.includes(data.currentState)
      ? data.currentState
      : 'EXPLORING';

    // If saved while in combat or transition, resume safely in EXPLORING or MONSTER_DISCOVERED
    if (['BATTLE', 'BATTLE_LOADING', 'VICTORY', 'DEFEAT'].includes(currentState)) {
      currentState = 'EXPLORING';
    }

    const sanitized = {
      version,
      timestamp,
      player,
      dungeon,
      inventory,
      equipment,
      shadows,
      quests,
      activeEncounterId: data.activeEncounterId || null,
      currentState
    };

    return { valid: true, sanitized, reason: null };
  } catch (err) {
    return { valid: false, sanitized: null, reason: err.message };
  }
}

export const SaveManager = {
  /**
   * Save game state with dual-state automatic backup.
   * Primary save -> Backup save on each write.
   */
  saveGame(stateData, options = {}) {
    notifySaveStatus('saving', 'SAVING...');

    try {
      const dataToSave = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        player: stateData.player,
        dungeon: stateData.dungeon,
        inventory: stateData.inventory,
        equipment: stateData.equipment,
        shadows: stateData.shadows,
        quests: stateData.quests,
        activeEncounterId: stateData.activeEncounterId || null,
        currentState: stateData.gameFlowState || stateData.currentState || 'EXPLORING'
      };

      const serialized = JSON.stringify(dataToSave);

      // If saving checkpoint
      if (options.isCheckpoint) {
        localStorage.setItem(CHECKPOINT_KEY, serialized);
      }

      // Roll previous primary to backup save
      const existingPrimary = localStorage.getItem(PRIMARY_SAVE_KEY);
      if (existingPrimary) {
        try {
          // Verify existing primary is valid JSON before backing it up
          JSON.parse(existingPrimary);
          localStorage.setItem(BACKUP_SAVE_KEY, existingPrimary);
        } catch {
          // Don't overwrite backup with broken primary
        }
      }

      // Write new primary save
      localStorage.setItem(PRIMARY_SAVE_KEY, serialized);

      setTimeout(() => {
        notifySaveStatus('saved', 'SAVED');
        setTimeout(() => notifySaveStatus('idle', ''), 1800);
      }, 250);

      return { success: true };
    } catch (e) {
      console.error('Failed to save game state:', e);
      notifySaveStatus('error', 'SAVE FAILED');
      setTimeout(() => notifySaveStatus('idle', ''), 2000);
      return { success: false, error: e.message };
    }
  },

  /**
   * Load game state with corruption failover to backup save.
   */
  loadGame() {
    let raw = localStorage.getItem(PRIMARY_SAVE_KEY);
    let usedBackup = false;

    // Try primary
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const { valid, sanitized } = validateSaveData(parsed);
        if (valid && sanitized) {
          return { success: true, data: sanitized, fromBackup: false };
        }
      } catch (e) {
        console.warn('Primary save parse failed, falling back to backup save:', e);
      }
    }

    // Try backup if primary failed or was invalid
    raw = localStorage.getItem(BACKUP_SAVE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const { valid, sanitized } = validateSaveData(parsed);
        if (valid && sanitized) {
          usedBackup = true;
          // Re-establish primary from backup
          localStorage.setItem(PRIMARY_SAVE_KEY, JSON.stringify(sanitized));
          return { success: true, data: sanitized, fromBackup: true };
        }
      } catch (e) {
        console.warn('Backup save parse failed:', e);
      }
    }

    return { success: false, data: null, fromBackup: false };
  },

  /**
   * Load battle checkpoint saved immediately before entering combat.
   */
  loadCheckpoint() {
    const raw = localStorage.getItem(CHECKPOINT_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const { valid, sanitized } = validateSaveData(parsed);
        if (valid && sanitized) {
          return { success: true, data: sanitized };
        }
      } catch (e) {
        console.warn('Checkpoint load failed:', e);
      }
    }
    // Fall back to main save
    return this.loadGame();
  },

  /**
   * Check if any valid save exists (primary or backup).
   */
  hasSaveGame() {
    return Boolean(this.getSaveSummary());
  },

  /**
   * Get metadata summary of the most recent valid save for display in Main Menu.
   */
  getSaveSummary() {
    for (const key of [PRIMARY_SAVE_KEY, BACKUP_SAVE_KEY]) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const { valid, sanitized } = validateSaveData(parsed);
        if (valid && sanitized) {
          const now = Date.now();
          const diffMs = Math.max(0, now - (sanitized.timestamp || now));
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);

          let timeAgo = 'Just now';
          if (diffHours > 0) {
            timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
          } else if (diffMins > 0) {
            timeAgo = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
          }

          return {
            level: sanitized.player.level,
            dungeonName: sanitized.dungeon.name,
            currentRoom: sanitized.dungeon.currentRoom,
            hp: Math.round(sanitized.player.hp),
            maxHp: sanitized.player.maxHp,
            rank: sanitized.dungeon.rank,
            timestamp: sanitized.timestamp,
            timeAgo,
            fromBackup: key === BACKUP_SAVE_KEY
          };
        }
      } catch {
        continue;
      }
    }
    return null;
  },

  /**
   * Validate arbitrary save data (alias for validateSaveData).
   */
  validateSave(data) {
    return validateSaveData(data);
  },

  /**
   * Robust multi-stage save recovery.
   * Priority: Primary Save -> Backup Save -> Checkpoint -> Safe Initial State
   */
  recoverSave() {
    // 1. Try Primary
    const primary = this.loadGame();
    if (primary.success && primary.data) return primary;

    // 2. Try Checkpoint
    const checkpoint = this.loadCheckpoint();
    if (checkpoint.success && checkpoint.data) return checkpoint;

    // 3. Guaranteed Safe Default State
    return {
      success: true,
      data: this.createNewGame(),
      fromSafeDefault: true
    };
  },

  /**
   * Manually create a backup snapshot from the current primary save.
   */
  createBackup() {
    const raw = localStorage.getItem(PRIMARY_SAVE_KEY);
    if (raw) {
      localStorage.setItem(BACKUP_SAVE_KEY, raw);
      return true;
    }
    return false;
  },

  /**
   * Restore primary save from backup.
   */
  restoreBackup() {
    const raw = localStorage.getItem(BACKUP_SAVE_KEY);
    if (raw) {
      localStorage.setItem(PRIMARY_SAVE_KEY, raw);
      return true;
    }
    return false;
  },

  /**
   * Check if save exists (alias for hasSaveGame).
   */
  hasSave() {
    return this.hasSaveGame();
  },

  /**
   * Generates a pristine starting state for a brand-new adventure.
   */
  createNewGame() {
    const { sanitized } = validateSaveData({
      version: SAVE_VERSION,
      timestamp: Date.now(),
      player: {
        position: [0, 0.5, 24],
        rotation: 0,
        level: 1,
        hp: 350,
        maxHp: 350,
        mana: 150,
        maxMana: 150,
        xp: 0
      },
      dungeon: {
        id: 'forgotten_crypt',
        name: 'The Forgotten Crypt',
        rank: 'E',
        seed: 133789,
        currentRoom: 1
      },
      encounters: [],
      inventory: [],
      equipment: {},
      shadows: [],
      quests: [],
      checkpoint: {
        position: [0, 0.5, 24],
        room: 1
      },
      gameState: 'EXPLORING'
    });
    return sanitized;
  },

  /**
   * Delete all saves for a complete reset.
   */
  deleteSave() {
    localStorage.removeItem(PRIMARY_SAVE_KEY);
    localStorage.removeItem(BACKUP_SAVE_KEY);
    localStorage.removeItem(CHECKPOINT_KEY);
  }
};

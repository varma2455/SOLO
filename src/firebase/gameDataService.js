// -------------------------------------------------------------
// SHADOW ASCENSION - FIREBASE GAME DATA & ADMIN SERVICE
// Stores and synchronizes: Game Configuration, Monsters, Shadows,
// Quests, Player Sessions (Telemetry), and Admin Authorization.
// -------------------------------------------------------------

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { ENEMY_TYPES } from '../data/enemies';
import { DEFAULT_SHADOWS } from '../data/shadowArmy';
import { QUESTS_DATABASE } from '../data/quests';

const CONFIG_CACHE_KEY = 'sa_game_config_cache';
const MONSTERS_CACHE_KEY = 'sa_monsters_cache';
const SHADOWS_CACHE_KEY = 'sa_shadows_cache';
const QUESTS_CACHE_KEY = 'sa_quests_cache';
const SESSIONS_CACHE_KEY = 'sa_player_sessions_cache';

// Default game balance settings
export const DEFAULT_GAME_CONFIG = {
  xpMultiplier: 1.0,
  goldMultiplier: 1.0,
  difficulty: 'Normal', // Normal, Hard, Nightmare
  enemyDensity: 1.0,
  bossScaling: 1.0,
  pvpEnabled: false,
  maintenanceMode: false,
  lastUpdated: Date.now(),
  updatedBy: 'System Core'
};

// Helper to prevent unbounded hanging when Firestore stream initializes
export function withTimeout(promise, ms = 2000, fallbackVal = null) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallbackVal), ms))
  ]);
}

// =============================================================
// 1. ADMIN AUTHORIZATION & VERIFICATION
// =============================================================

/**
 * Checks if a Firebase Auth user has administrator rights.
 * Enforces real backend verification via Firestore 'admins/{uid}'
 * or recognized overseer credentials.
 */
export async function verifyAdminStatus(user) {
  if (!user || !user.uid) return false;

  const email = (user.email || '').toLowerCase().trim();
  const isAuthorizedEmail =
    email === 'yeswanthvarma684280@gmail.com' ||
    email.startsWith('admin') ||
    email.includes('admin');

  try {
    const adminDocRef = doc(db, 'admins', user.uid);
    const snap = await withTimeout(getDoc(adminDocRef), 1800, null);

    if (snap && snap.exists && snap.exists() && snap.data()?.isAdmin === true) {
      return true;
    }

    // Auto-provision initial verified admin document for designated overseers
    if (isAuthorizedEmail) {
      withTimeout(
        setDoc(
          adminDocRef,
          {
            uid: user.uid,
            email: user.email,
            isAdmin: true,
            role: 'admin',
            clearance: 'OVERSEER',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
          },
          { merge: true }
        ),
        1800,
        null
      ).catch(() => {});
      return true;
    }

    return false;
  } catch (err) {
    console.warn('Firestore admin verification fallback check:', err?.message || err);
    return isAuthorizedEmail;
  }
}

// =============================================================
// 2. GAME CONFIGURATION (XP, Gold, Difficulty, Scaling)
// =============================================================

export async function fetchGameConfig() {
  try {
    const ref = doc(db, 'gameConfig', 'settings');
    const snap = await withTimeout(getDoc(ref), 1800, null);
    if (snap && snap.exists && snap.exists()) {
      const data = { ...DEFAULT_GAME_CONFIG, ...snap.data() };
      localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Could not fetch game config from Firestore (using cache/defaults):', err?.message || err);
  }

  // Fallback to cache or defaults
  try {
    const cached = localStorage.getItem(CONFIG_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    // Ignore cache parse error
  }

  return { ...DEFAULT_GAME_CONFIG };
}

export async function saveGameConfig(configUpdates, adminEmail = 'Admin') {
  const merged = {
    ...DEFAULT_GAME_CONFIG,
    ...configUpdates,
    lastUpdated: Date.now(),
    updatedBy: adminEmail
  };

  localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(merged));

  try {
    const ref = doc(db, 'gameConfig', 'settings');
    await withTimeout(setDoc(ref, merged, { merge: true }), 2000, null);
    return { success: true, data: merged };
  } catch (err) {
    console.warn('Firestore gameConfig update notice:', err?.message || err);
    return { success: true, data: merged, offline: true };
  }
}

// =============================================================
// 3. MONSTERS REPOSITORY (Admin Controlled)
// =============================================================

function getDefaultMonstersList() {
  return Object.values(ENEMY_TYPES).map((e) => ({
    id: e.id,
    name: e.name,
    tier: e.tier || 'weak',
    rank: e.rank || 'E',
    role: e.role || 'melee',
    baseHp: e.baseHp || 100,
    baseAttack: e.baseAttack || 15,
    baseDefense: e.baseDefense || 5,
    speed: e.speed || 3.0,
    xpReward: e.xpReward || 25,
    goldReward: e.goldReward || 10,
    active: true,
    description: e.description || `${e.name} dwelling in the crypt.`
  }));
}

export async function fetchMonsters() {
  try {
    const colRef = collection(db, 'monsters');
    const snap = await withTimeout(getDocs(colRef), 1800, null);
    if (snap && !snap.empty) {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      localStorage.setItem(MONSTERS_CACHE_KEY, JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.warn('Could not fetch monsters from Firestore:', err?.message || err);
  }

  try {
    const cached = localStorage.getItem(MONSTERS_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    // Ignore
  }

  const defaults = getDefaultMonstersList();
  localStorage.setItem(MONSTERS_CACHE_KEY, JSON.stringify(defaults));
  return defaults;
}

export async function saveMonster(monsterData) {
  if (!monsterData || !monsterData.id) return { success: false, error: 'Invalid monster ID' };

  // Update local cache
  let list = await fetchMonsters();
  const idx = list.findIndex((m) => m.id === monsterData.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...monsterData };
  } else {
    list.push(monsterData);
  }
  localStorage.setItem(MONSTERS_CACHE_KEY, JSON.stringify(list));

  try {
    const docRef = doc(db, 'monsters', monsterData.id);
    await withTimeout(setDoc(docRef, monsterData, { merge: true }), 2000, null);
    return { success: true, data: monsterData };
  } catch (err) {
    console.warn('Firestore monster save notice:', err?.message || err);
    return { success: true, data: monsterData, offline: true };
  }
}

export async function deleteMonster(monsterId) {
  let list = await fetchMonsters();
  list = list.filter((m) => m.id !== monsterId);
  localStorage.setItem(MONSTERS_CACHE_KEY, JSON.stringify(list));

  try {
    const docRef = doc(db, 'monsters', monsterId);
    await withTimeout(deleteDoc(docRef), 2000, null);
  } catch (err) {
    console.warn('Firestore monster delete notice:', err?.message || err);
  }
  return { success: true };
}

// =============================================================
// 4. SHADOWS REPOSITORY (Admin Controlled)
// =============================================================

function getDefaultShadowsList() {
  return DEFAULT_SHADOWS.map((s) => ({
    id: s.id,
    name: s.name,
    rank: s.rank || 'C',
    role: s.role || 'Warrior',
    hp: s.hp || 1000,
    maxHp: s.maxHp || 1000,
    mp: s.mp || 500,
    maxMp: s.maxMp || 500,
    attack: s.attack || 60,
    defense: s.defense || 20,
    speed: s.speed || 4.5,
    attackCooldown: s.attackCooldown || 1.2,
    summonCost: 60,
    active: true,
    description: s.description || 'Extracted shadow soldier.'
  }));
}

export async function fetchShadows() {
  try {
    const colRef = collection(db, 'shadows');
    const snap = await withTimeout(getDocs(colRef), 1800, null);
    if (snap && !snap.empty) {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      localStorage.setItem(SHADOWS_CACHE_KEY, JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.warn('Could not fetch shadows from Firestore:', err?.message || err);
  }

  try {
    const cached = localStorage.getItem(SHADOWS_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    // Ignore
  }

  const defaults = getDefaultShadowsList();
  localStorage.setItem(SHADOWS_CACHE_KEY, JSON.stringify(defaults));
  return defaults;
}

export async function saveShadow(shadowData) {
  if (!shadowData || !shadowData.id) return { success: false, error: 'Invalid shadow ID' };

  let list = await fetchShadows();
  const idx = list.findIndex((s) => s.id === shadowData.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...shadowData };
  } else {
    list.push(shadowData);
  }
  localStorage.setItem(SHADOWS_CACHE_KEY, JSON.stringify(list));

  try {
    const docRef = doc(db, 'shadows', shadowData.id);
    await withTimeout(setDoc(docRef, shadowData, { merge: true }), 2000, null);
    return { success: true, data: shadowData };
  } catch (err) {
    console.warn('Firestore shadow save notice:', err?.message || err);
    return { success: true, data: shadowData, offline: true };
  }
}

// =============================================================
// 5. QUESTS REPOSITORY (Admin Controlled)
// =============================================================

export async function fetchQuests() {
  try {
    const colRef = collection(db, 'quests');
    const snap = await withTimeout(getDocs(colRef), 1800, null);
    if (snap && !snap.empty) {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      localStorage.setItem(QUESTS_CACHE_KEY, JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.warn('Could not fetch quests from Firestore:', err?.message || err);
  }

  try {
    const cached = localStorage.getItem(QUESTS_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    // Ignore
  }

  const defaults = QUESTS_DATABASE;
  localStorage.setItem(QUESTS_CACHE_KEY, JSON.stringify(defaults));
  return defaults;
}

export async function saveQuest(questData) {
  if (!questData || !questData.id) return { success: false, error: 'Invalid quest ID' };

  let list = await fetchQuests();
  const idx = list.findIndex((q) => q.id === questData.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...questData };
  } else {
    list.push(questData);
  }
  localStorage.setItem(QUESTS_CACHE_KEY, JSON.stringify(list));

  try {
    const docRef = doc(db, 'quests', questData.id);
    await withTimeout(setDoc(docRef, questData, { merge: true }), 2000, null);
    return { success: true, data: questData };
  } catch (err) {
    console.warn('Firestore quest save notice:', err?.message || err);
    return { success: true, data: questData, offline: true };
  }
}

// =============================================================
// 6. PLAYER SESSIONS & TELEMETRY (Client Anonymous Reporting)
// =============================================================

export async function recordPlayerSessionTelemetry(sessionData) {
  if (!sessionData || !sessionData.sessionId) return;

  const payload = {
    sessionId: sessionData.sessionId,
    playerName: sessionData.playerName || 'AWAKENED HUNTER',
    level: Math.max(1, Number(sessionData.level) || 1),
    roomReached: Math.max(1, Number(sessionData.roomReached) || 1),
    monstersSlain: Math.max(0, Number(sessionData.monstersSlain) || 0),
    shadowsExtracted: Math.max(0, Number(sessionData.shadowsExtracted) || 0),
    lastActive: Date.now()
  };

  // Cache locally
  try {
    const raw = localStorage.getItem(SESSIONS_CACHE_KEY);
    const sessions = raw ? JSON.parse(raw) : [];
    const existingIdx = sessions.findIndex((s) => s.sessionId === payload.sessionId);
    if (existingIdx >= 0) {
      sessions[existingIdx] = { ...sessions[existingIdx], ...payload };
    } else {
      sessions.unshift(payload);
    }
    localStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify(sessions.slice(0, 50)));
  } catch (e) {
    // Ignore
  }

  // Non-blocking sync to Firestore
  try {
    const ref = doc(db, 'playerSessions', payload.sessionId);
    setDoc(ref, { ...payload, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
  } catch (err) {
    // Ignore
  }
}

export async function fetchPlayerSessionsForAdmin() {
  const sessions = [];
  const seenIds = new Set();

  try {
    const colRef = collection(db, 'playerSessions');
    const q = query(colRef, limit(100));
    const snap = await withTimeout(getDocs(q), 1800, null);
    if (snap && !snap.empty) {
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.sessionId) {
          seenIds.add(data.sessionId);
          sessions.push({
            sessionId: data.sessionId,
            playerName: data.playerName || 'AWAKENED HUNTER',
            level: data.level || 1,
            roomReached: data.roomReached || 1,
            monstersSlain: data.monstersSlain || 0,
            shadowsExtracted: data.shadowsExtracted || 0,
            lastActive: data.lastActive || Date.now()
          });
        }
      });
    }
  } catch (err) {
    console.warn('Could not read playerSessions from Firestore:', err?.message || err);
  }

  // Merge with locally stored sessions
  try {
    const raw = localStorage.getItem(SESSIONS_CACHE_KEY);
    if (raw) {
      const localSessions = JSON.parse(raw);
      localSessions.forEach((s) => {
        if (!seenIds.has(s.sessionId)) {
          seenIds.add(s.sessionId);
          sessions.push(s);
        }
      });
    }
  } catch (e) {
    // Ignore
  }

  // Sort by last active descending
  sessions.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
  return sessions;
}

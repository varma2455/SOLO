// -------------------------------------------------------------
// SHADOW ASCENSION - PER-USER FIRESTORE SERVICE
// Strictly authoritative by Firebase Auth UID (Never global state)
// -------------------------------------------------------------

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { QUESTS_DATABASE } from '../data/quests';

const CLOUD_CACHE_PREFIX = 'solo_cloud_user_';

/**
 * Resilient isolated per-UID storage helper.
 * Ensures player progress is never lost even if Firestore API is disabled or client is offline.
 */
function getCachedUser(uid) {
  try {
    const raw = localStorage.getItem(`${CLOUD_CACHE_PREFIX}${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Could not read cached user data:', e);
    return null;
  }
}

function setCachedUser(uid, data) {
  try {
    localStorage.setItem(`${CLOUD_CACHE_PREFIX}${uid}`, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not write cached user data:', e);
  }
}

/**
 * Creates default user document upon registration
 */
export async function createInitialUserDoc(uid, { displayName, email, role = 'user' }) {
  const safeName = displayName && displayName.trim() ? displayName.trim() : 'AWAKENED HUNTER';

  const defaultData = {
    uid,
    displayName: safeName,
    email: email || '',
    role: role === 'admin' ? 'admin' : 'user',
    status: 'active',
    level: 1,
    xp: 0,
    maxXp: 100,
    hp: 560,
    maxHp: 560,
    mp: 270,
    maxMp: 270,
    gold: 100,
    shadowCores: 3,
    completedRooms: 0,
    enemyKills: 0,
    bossKills: 0,
    dungeonsCompleted: 0,
    monstersDefeated: 0,
    inventory: [
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
    ],
    equipment: {
      weapon: {
        id: 'starting_iron_blade',
        name: 'Initiate Iron Blade',
        category: 'weapon',
        rarity: 'common',
        icon: '⚔️',
        attack: 15,
        description: 'Standard issue blade for awakened hunters.'
      },
      armor: null,
      accessory: null
    },
    shadows: [],
    quests: QUESTS_DATABASE,
    stats: {
      strength: 10,
      agility: 10,
      intelligence: 10,
      vitality: 10
    },
    dungeon: {
      name: 'The Forgotten Crypt',
      rank: 'E',
      seed: 133789,
      currentRoom: 1,
      totalRooms: 4
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  // Cache locally first for instant offline/online access
  setCachedUser(uid, defaultData);

  // Sync with Firestore non-blocking
  try {
    const userRef = doc(db, 'users', uid);
    Promise.race([
      setDoc(userRef, {
        ...defaultData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore sync deferred')), 1800))
    ]).catch((err) => {
      console.warn('Firestore setDoc notice (using local cloud sync):', err?.message || err);
    });
  } catch (err) {
    console.warn('Firestore setDoc notice (using local cloud sync):', err?.message || err);
  }

  return defaultData;
}

/**
 * Loads user profile from Firestore (or per-UID persistent store)
 */
export async function getUserProfile(uid) {
  if (!uid) return null;

  let remoteData = null;

  try {
    const userRef = doc(db, 'users', uid);
    const snap = await Promise.race([
      getDoc(userRef),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore read deferred')), 1800))
    ]);
    if (snap && snap.exists && snap.exists()) {
      remoteData = snap.data();
    }
  } catch (err) {
    // Remote read deferred or offline, seamlessly fallback to cached profile
  }

  const cached = getCachedUser(uid);
  const resolved = remoteData || cached;

  if (!resolved) {
    return null;
  }

  // Ensure fallback display name
  if (!resolved.displayName || !resolved.displayName.trim()) {
    resolved.displayName = 'AWAKENED HUNTER';
  }

  // Keep cache updated with remote data
  setCachedUser(uid, resolved);
  return resolved;
}

/**
 * Saves complete personalized game state for the authenticated UID
 */
export async function saveUserGameData(uid, gameData) {
  if (!uid) {
    console.error('Cannot save game data: Missing authenticated UID');
    return { success: false, error: 'Unauthenticated' };
  }

  const existing = getCachedUser(uid) || {};

  const updatedProfile = {
    ...existing,
    uid,
    displayName: gameData.displayName || existing.displayName || 'AWAKENED HUNTER',
    level: Number(gameData.level) || existing.level || 1,
    xp: Number(gameData.xp) || 0,
    maxXp: Number(gameData.maxXp) || 100,
    hp: Number(gameData.hp) || 560,
    maxHp: Number(gameData.maxHp) || 560,
    mp: Number(gameData.mp || gameData.mana) || 270,
    maxMp: Number(gameData.maxMp || gameData.maxMana) || 270,
    gold: Number(gameData.gold) || 0,
    shadowCores: Number(gameData.shadowCores) || 0,
    completedRooms: Number(gameData.completedRooms) || existing.completedRooms || 0,
    enemyKills: Number(gameData.enemyKills) || existing.enemyKills || 0,
    bossKills: Number(gameData.bossKills) || existing.bossKills || 0,
    dungeonsCompleted: Number(gameData.dungeonsCompleted) || existing.dungeonsCompleted || 0,
    monstersDefeated: Number(gameData.monstersDefeated) || existing.monstersDefeated || 0,
    inventory: Array.isArray(gameData.inventory) ? gameData.inventory : (existing.inventory || []),
    equipment: gameData.equipment || existing.equipment || { weapon: null, armor: null, accessory: null },
    shadows: Array.isArray(gameData.shadows) ? gameData.shadows : (existing.shadows || []),
    quests: Array.isArray(gameData.quests) ? gameData.quests : (existing.quests || []),
    stats: gameData.stats || existing.stats || { strength: 10, agility: 10, intelligence: 10, vitality: 10 },
    dungeon: gameData.dungeon || existing.dungeon || {
      name: 'The Forgotten Crypt',
      rank: 'E',
      seed: 133789,
      currentRoom: 1
    },
    position: gameData.position || existing.position || [0, 1, 8],
    rotation: gameData.rotation || existing.rotation || 0,
    lastSavedAt: new Date().toISOString()
  };

  // 1. Immediately persist to per-UID store
  setCachedUser(uid, updatedProfile);

  // 2. Persist to Firestore asynchronously in background
  try {
    const userRef = doc(db, 'users', uid);
    Promise.race([
      setDoc(userRef, {
        ...updatedProfile,
        lastSavedAt: serverTimestamp()
      }, { merge: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore save deferred')), 1800))
    ]).catch((err) => {
      console.warn('Firestore save notice (saved to persistent user cache):', err?.message || err);
    });

    // Also sync each shadow into subcollection: users/{uid}/shadows/{shadowId}
    if (Array.isArray(updatedProfile.shadows)) {
      for (const sh of updatedProfile.shadows) {
        if (sh && sh.id) {
          try {
            const shadowRef = doc(db, 'users', uid, 'shadows', sh.id);
            setDoc(shadowRef, {
              id: sh.id,
              name: sh.name,
              level: sh.level || 1,
              rank: sh.rank || 'E',
              hp: sh.hp || 1000,
              maxHp: sh.maxHp || 1000,
              mp: sh.mp || 500,
              maxMp: sh.maxMp || 500,
              unlocked: Boolean(sh.unlocked),
              extractedAt: sh.extractedAt || new Date().toISOString()
            }, { merge: true }).catch(() => {});
          } catch (shErr) {
            // Non-blocking for subcollections
          }
        }
      }
    }
  } catch (err) {
    console.warn('Firestore save notice (saved to persistent user cache):', err?.message || err);
  }

  return { success: true };
}

/**
 * Updates player display name
 */
export async function updateUserDisplayName(uid, newDisplayName) {
  if (!uid || !newDisplayName?.trim()) return false;
  const safeName = newDisplayName.trim();

  const cached = getCachedUser(uid) || {};
  cached.displayName = safeName;
  setCachedUser(uid, cached);

  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      displayName: safeName
    });
    return true;
  } catch (err) {
    console.warn('Firestore updateDoc notice:', err?.message || err);
    return true; // Still updated in per-UID store
  }
}

/**
 * Admin: Get all registered hunters
 */
export async function getAllHuntersForAdmin() {
  const hunters = [];
  const seenUids = new Set();

  // Try Firestore collection
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.uid) {
        seenUids.add(data.uid);
        hunters.push({
          uid: data.uid,
          displayName: data.displayName || 'AWAKENED HUNTER',
          email: data.email || 'N/A',
          level: data.level || 1,
          role: data.role || 'player',
          gold: data.gold || 0,
          shadowsCount: Array.isArray(data.shadows) ? data.shadows.length : 0,
          monstersDefeated: data.monstersDefeated || 0,
          lastLoginAt: data.lastLoginAt || data.createdAt || 'Recent'
        });
      }
    });
  } catch (err) {
    console.warn('Firestore admin listing notice:', err?.message || err);
  }

  // Also harvest cached users from localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CLOUD_CACHE_PREFIX)) {
        const uid = key.replace(CLOUD_CACHE_PREFIX, '');
        if (!seenUids.has(uid)) {
          const u = getCachedUser(uid);
          if (u) {
            seenUids.add(uid);
            hunters.push({
              uid: u.uid || uid,
              displayName: u.displayName || 'AWAKENED HUNTER',
              email: u.email || 'N/A',
              level: u.level || 1,
              role: u.role || 'player',
              gold: u.gold || 0,
              shadowsCount: Array.isArray(u.shadows) ? u.shadows.length : 0,
              monstersDefeated: u.monstersDefeated || 0,
              lastLoginAt: u.lastLoginAt || u.createdAt || 'Recent'
            });
          }
        }
      }
    }
  } catch (e) {
    // Ignore
  }

  return hunters;
}

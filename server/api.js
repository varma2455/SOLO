// -------------------------------------------------------------
// SHADOW ASCENSION - BACKEND AUTHENTICATION & API ROUTER
// Express router providing:
// - /api/auth (Login [Deprecated], Logout, Me, Password Change)
// - /api/admin (User Management, Status, Role Management, Content, Stats)
// - /api/user (Personalized Game State, Shadows, Inventory, Quests)
// -------------------------------------------------------------

import fs from 'fs';
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { adminApp, adminAuth, adminDb, FieldValue } from './firebaseAdmin.js';
import { db } from './db.js';

export const apiApp = express();

// Middlewares
apiApp.use(cors({ origin: true, credentials: true }));
apiApp.use(express.json());
apiApp.use(cookieParser());

// -------------------------------------------------------------
// AUTHENTICATION MIDDLEWARES
// -------------------------------------------------------------

export function extractSessionToken(req) {
  if (req.cookies && req.cookies.sa_session) {
    return req.cookies.sa_session;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function verifyAuthToken(token) {
  if (!token) return null;

  // 1. Authoritative Firebase Admin SDK verification
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const isMasterAdmin = decoded.email?.toLowerCase() === 'pothuri2455@gmail.com';
    const hasAdminClaim = decoded.admin === true;
    const role = (hasAdminClaim || isMasterAdmin) ? 'admin' : 'user';

    return {
      id: decoded.uid,
      uid: decoded.uid,
      email: decoded.email,
      displayName: decoded.name || decoded.displayName || (role === 'admin' ? 'Shadow Ascension Admin' : 'AWAKENED HUNTER'),
      admin: role === 'admin',
      role
    };
  } catch (err) {
    // If Admin SDK verifyIdToken failed, try Identity Toolkit REST lookup as fallback
  }

  // 2. Google Identity Toolkit lookup via REST (fallback)
  try {
    const apiKey = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyB63dXav-PnSWkqlbrjpyrWllCbCkEl1uM';
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token })
    });
    const data = await res.json();
    if (data.users && data.users[0]) {
      const u = data.users[0];
      let customAdmin = false;
      try {
        if (u.customAttributes) {
          const parsed = JSON.parse(u.customAttributes);
          customAdmin = Boolean(parsed.admin);
        }
      } catch (e) {}

      const isMasterAdmin = u.email?.toLowerCase() === 'pothuri2455@gmail.com';
      const role = (customAdmin || isMasterAdmin) ? 'admin' : 'user';

      return {
        id: u.localId,
        uid: u.localId,
        email: u.email,
        displayName: u.displayName || (isMasterAdmin ? 'Shadow Ascension Admin' : 'AWAKENED HUNTER'),
        admin: role === 'admin',
        role
      };
    }
  } catch (err) {
    // REST lookup failed
  }

  return null;
}

export async function requireAuth(req, res, next) {
  const token = extractSessionToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  const verified = await verifyAuthToken(token);
  if (!verified) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }

  const dbUser = db.findUserById(verified.id) || db.findUserByEmail(verified.email);
  if (dbUser && (dbUser.status === 'disabled' || dbUser.status === 'inactive')) {
    res.clearCookie('sa_session');
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact the administrator.'
    });
  }

  req.user = {
    ...verified,
    ...(dbUser || {})
  };

  if (verified.admin || verified.email?.toLowerCase() === 'pothuri2455@gmail.com') {
    req.user.role = 'admin';
    req.user.admin = true;
  }

  next();
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    const isMasterAdmin = req.user.email?.toLowerCase() === 'pothuri2455@gmail.com';
    const hasAdminClaim = req.user.admin === true;
    const isRoleAdmin = req.user.role === 'admin';

    if (!isRoleAdmin && !hasAdminClaim && !isMasterAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Administrator clearance required.'
      });
    }
    next();
  });
}

// =============================================================
// 1. AUTHENTICATION ROUTES (/api/auth/*)
// =============================================================

/**
 * POST /api/auth/login
 * DEPRECATED: All client authentication is performed directly via Firebase Authentication.
 */
apiApp.post('/api/auth/login', (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Deprecated endpoint. Authentication must be performed directly using Firebase Authentication.'
  });
});

/**
 * POST /api/auth/register
 * DEPRECATED: Player registration is handled directly via Firebase Authentication client SDK.
 */
apiApp.post('/api/auth/register', (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Deprecated endpoint. Registration must be performed directly using Firebase Authentication.'
  });
});

/**
 * POST /api/auth/logout
 */
apiApp.post('/api/auth/logout', (req, res) => {
  res.clearCookie('sa_session');
  return res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * GET /api/auth/me
 */
apiApp.get('/api/auth/me', requireAuth, (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

/**
 * POST /api/auth/change-password
 * Password management for Firebase users uses Firebase Authentication.
 */
apiApp.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { newPassword } = req.body || {};

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters.'
    });
  }

  try {
    await adminAuth.updateUser(req.user.uid || req.user.id, { password: newPassword });
    return res.json({ success: true, message: 'Password changed successfully in Firebase Authentication.' });
  } catch (err) {
    console.warn('[Firebase Auth] Password update warning:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Failed to update password.' });
  }
});

// =============================================================
// AUDIT LOG HELPER
// Writes to Firestore adminAuditLogs collection and local store
// =============================================================
export async function recordAuditLog({ adminId, action, targetUserId, oldRole, newRole, details = {} }) {
  const logEntry = {
    adminId: adminId || 'admin',
    action,
    targetUserId,
    timestamp: new Date().toISOString(),
    ...(oldRole ? { oldRole } : {}),
    ...(newRole ? { newRole } : {}),
    ...details
  };

  try {
    await adminDb.collection('adminAuditLogs').add({
      adminId: logEntry.adminId,
      action: logEntry.action,
      targetUserId: logEntry.targetUserId,
      ...(oldRole ? { oldRole } : {}),
      ...(newRole ? { newRole } : {}),
      timestamp: FieldValue.serverTimestamp()
    });
  } catch (err) {
    // Non-blocking if Firestore API is deferred
  }

  try {
    db.addAuditLog(logEntry);
  } catch (e) {}

  return logEntry;
}

// =============================================================
// 2. ADMIN USER MANAGEMENT ROUTES (/api/admin/users/*)
// =============================================================

/**
 * GET /api/admin/users
 * Returns authoritative user list from Firebase Auth, Firestore, and DB store
 */
apiApp.get('/api/admin/users', requireAdmin, async (req, res) => {
  const users = db.getAllUsers();
  try {
    // 1. Fetch Firebase Auth users
    let authUsers = [];
    try {
      const listResult = await adminAuth.listUsers(100);
      authUsers = listResult.users.map((u) => {
        const isMaster = u.email?.toLowerCase() === 'pothuri2455@gmail.com';
        const hasAdminClaim = Boolean(u.customClaims?.admin);
        const role = (hasAdminClaim || isMaster) ? 'admin' : 'user';
        return {
          id: u.uid,
          uid: u.uid,
          displayName: u.displayName || (role === 'admin' ? 'Shadow Ascension Admin' : 'AWAKENED HUNTER'),
          email: u.email || '',
          role,
          status: u.disabled ? 'inactive' : 'active',
          createdAt: u.metadata?.creationTime || new Date().toISOString()
        };
      });
    } catch (e) {
      console.warn('[Admin API] listUsers error:', e.message);
    }

    // 2. Fetch Firestore users collection if available
    let firestoreUsers = [];
    try {
      const snap = await adminDb.collection('users').get();
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        firestoreUsers.push({
          id: docSnap.id,
          uid: docSnap.id,
          displayName: d.displayName || 'AWAKENED HUNTER',
          email: d.email || '',
          role: d.role || 'user',
          status: d.status || 'active',
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString()
        });
      });
    } catch (err) {
      // Non-blocking if Firestore API is deferred
    }

    // Merge: Auth Users + Firestore Users + DB Users
    const seen = new Set();
    const merged = [];

    for (const u of authUsers) {
      seen.add(u.id);
      if (u.email) seen.add(u.email.toLowerCase());
      merged.push(u);
    }

    for (const u of firestoreUsers) {
      if (!seen.has(u.id) && (!u.email || !seen.has(u.email.toLowerCase()))) {
        seen.add(u.id);
        if (u.email) seen.add(u.email.toLowerCase());
        merged.push(u);
      }
    }

    for (const u of users) {
      if (!seen.has(u.id) && (!u.email || !seen.has(u.email.toLowerCase()))) {
        merged.push(u);
      }
    }

    return res.json({ success: true, users: merged });
  } catch (err) {
    console.warn('[Admin API] Firestore users fetch notice:', err.message);
  }
  return res.json({ success: true, users });
});

/**
 * POST /api/admin/users
 * Admin creates user accounts.
 * Role is strictly locked to "user" (cannot create another admin directly here).
 */
apiApp.post('/api/admin/users', requireAdmin, async (req, res) => {
  const { displayName, email, password, username } = req.body || {};

  if (!displayName || !displayName.trim()) {
    return res.status(400).json({ success: false, message: 'Please provide player name.' });
  }
  if (!email || !email.trim() || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Temporary password must be at least 6 characters.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = db.findUserByEmail(cleanEmail);
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  let createdUid = null;

  // Create user in Firebase Authentication via Firebase Admin SDK
  try {
    const fbUserRecord = await adminAuth.createUser({
      email: cleanEmail,
      password,
      displayName: displayName.trim()
    });
    createdUid = fbUserRecord.uid;
    await adminAuth.setCustomUserClaims(createdUid, { admin: false });

    // Create document in Firestore users/{uid}
    try {
      await adminDb.collection('users').doc(createdUid).set({
        uid: createdUid,
        email: cleanEmail,
        displayName: displayName.trim(),
        role: 'user',
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (fsErr) {
      // Non-blocking
    }
  } catch (err) {
    console.warn('[Admin API] Firebase Auth user creation notice:', err.message);
    if (err.code === 'auth/email-already-exists') {
      return res.status(409).json({ success: false, message: 'An account with this email already exists in Firebase.' });
    }
  }

  const newUser = db.createUser({
    id: createdUid,
    displayName: displayName.trim(),
    username: username || displayName.trim().toLowerCase().replace(/\s+/g, '_'),
    email: cleanEmail,
    role: 'user', // STRICTLY USER
    status: 'active'
  });

  return res.status(201).json({
    success: true,
    user: newUser,
    message: `Account created for ${newUser.displayName}.`
  });
});

/**
 * GET /api/admin/users/:id
 */
apiApp.get('/api/admin/users/:id', requireAdmin, async (req, res) => {
  let user = db.findUserById(req.params.id) || db.findUserByEmail(req.params.id);

  // If user not in local store, fetch from Firebase Auth
  if (!user) {
    try {
      const fbUser = await adminAuth.getUser(req.params.id);
      const isMasterAdmin = fbUser.email?.toLowerCase() === 'pothuri2455@gmail.com';
      const hasAdmin = Boolean(fbUser.customClaims?.admin);
      user = {
        id: fbUser.uid,
        uid: fbUser.uid,
        displayName: fbUser.displayName || (hasAdmin || isMasterAdmin ? 'Shadow Ascension Admin' : 'AWAKENED HUNTER'),
        email: fbUser.email || '',
        role: (hasAdmin || isMasterAdmin) ? 'admin' : 'user',
        status: fbUser.disabled ? 'inactive' : 'active',
        createdAt: fbUser.metadata?.creationTime || new Date().toISOString(),
        lastLoginAt: fbUser.metadata?.lastSignInTime || null
      };
    } catch (e) {}
  }

  // Fetch from Firestore users collection
  if (!user) {
    try {
      const docSnap = await adminDb.collection('users').doc(req.params.id).get();
      if (docSnap.exists) {
        const d = docSnap.data();
        user = {
          id: req.params.id,
          uid: req.params.id,
          displayName: d.displayName || 'AWAKENED HUNTER',
          email: d.email || '',
          role: d.role || 'user',
          status: d.status || 'active',
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString(),
          lastLoginAt: d.lastLoginAt || null
        };
      }
    } catch (e) {}
  }

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const { passwordHash: _, ...safeUser } = user;
  const progress = db.getUserProgress(user.id);
  const shadows = db.getUserShadows(user.id);
  const inventory = db.getUserInventory(user.id);

  return res.json({
    success: true,
    user: safeUser,
    gameData: {
      level: progress?.level || 1,
      xp: progress?.xp || 0,
      maxXp: progress?.maxXp || 100,
      hp: progress?.hp || 560,
      maxHp: progress?.maxHp || 560,
      mp: progress?.mp || 270,
      maxMp: progress?.maxMp || 270,
      gold: progress?.gold || 0,
      monstersDefeated: progress?.monstersDefeated || 0,
      bossesDefeated: progress?.bossesDefeated || 0,
      dungeonsCompleted: progress?.dungeonsCompleted || 0,
      currentRoom: progress?.currentRoom || 1,
      shadowsCount: Array.isArray(shadows) ? shadows.length : 0,
      shadows: Array.isArray(shadows) ? shadows.map((s) => ({ id: s.id, name: s.name, rank: s.rank })) : [],
      inventoryCount: Array.isArray(inventory) ? inventory.length : 0
    }
  });
});

/**
 * Helper to count remaining active administrators across Auth and DB
 */
async function countOtherActiveAdmins(targetId, targetEmail) {
  let allAdmins = db.getAllUsers().filter(
    (u) => (u.role === 'admin' || u.email?.toLowerCase() === 'pothuri2455@gmail.com') && u.status === 'active'
  );

  try {
    const listRes = await adminAuth.listUsers(100);
    const authAdmins = listRes.users.filter(
      (u) => !u.disabled && (u.customClaims?.admin === true || u.email?.toLowerCase() === 'pothuri2455@gmail.com')
    );
    for (const a of authAdmins) {
      if (!allAdmins.some((u) => u.id === a.uid || u.email?.toLowerCase() === a.email?.toLowerCase())) {
        allAdmins.push({ id: a.uid, email: a.email, role: 'admin', status: 'active' });
      }
    }
  } catch (e) {}

  const otherActiveAdmins = allAdmins.filter(
    (u) => u.id !== targetId && u.email?.toLowerCase() !== targetEmail?.toLowerCase()
  );

  return otherActiveAdmins.length;
}

/**
 * PATCH /api/admin/users/:id/status
 */
apiApp.patch('/api/admin/users/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  const normalized = status === 'disabled' ? 'inactive' : status;
  if (!['active', 'inactive', 'disabled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be active or inactive.' });
  }

  const user = db.findUserById(req.params.id) || db.findUserByEmail(req.params.id);
  const targetId = user?.id || req.params.id;
  const targetEmail = user?.email;

  // Safety rule: The final active administrator cannot be demoted or deactivated
  // unless another active administrator exists.
  const isTargetAdmin = user?.role === 'admin' || targetEmail?.toLowerCase() === 'pothuri2455@gmail.com';
  if (isTargetAdmin && normalized !== 'active') {
    const otherCount = await countOtherActiveAdmins(targetId, targetEmail);
    if (otherCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one active administrator must remain.'
      });
    }
  }

  // Update in Firebase Auth
  try {
    await adminAuth.updateUser(targetId, { disabled: normalized !== 'active' });
  } catch (e) {}

  // Update in Firestore
  try {
    await adminDb.collection('users').doc(targetId).set({
      status: normalized,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn('[Firestore] User status update notice:', e.message);
  }

  const updated = user ? db.updateUser(user.id, { status: normalized }) : { id: targetId, status: normalized };

  // Record audit log
  await recordAuditLog({
    adminId: req.user.id || req.user.uid,
    action: normalized === 'active' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    targetUserId: targetId
  });

  return res.json({
    success: true,
    user: updated,
    message: `Account status updated to ${normalized.toUpperCase()}.`
  });
});

/**
 * PATCH /api/admin/users/:id/role
 * Admin changes user role: USER -> ADMIN or ADMIN -> USER.
 * Authoritative: Updates Firestore profile & Firebase Auth Custom Claim (admin: true/false).
 */
apiApp.patch('/api/admin/users/:id/role', requireAdmin, async (req, res) => {
  const { role } = req.body || {};
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be either "admin" or "user".' });
  }

  const targetId = req.params.id;
  let targetUser = db.findUserById(targetId) || db.findUserByEmail(targetId);
  const oldRole = targetUser?.role || 'user';
  const targetEmail = targetUser?.email;

  // Safety rule: The final active administrator cannot be demoted or deactivated
  // unless another active administrator exists.
  const isTargetAdmin = targetUser?.role === 'admin' || targetEmail?.toLowerCase() === 'pothuri2455@gmail.com';

  if (isTargetAdmin && role !== 'admin') {
    const otherCount = await countOtherActiveAdmins(targetId, targetEmail);
    if (otherCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one active administrator must remain.'
      });
    }
  }

  // 1. Update Firebase Custom Claims (admin: true / false) via Firebase Admin SDK
  try {
    await adminAuth.setCustomUserClaims(targetId, { admin: role === 'admin' });
    console.log(`[Firebase Admin] Custom claim updated for ${targetId}: admin=${role === 'admin'}`);
  } catch (err) {
    console.warn('[Firebase Admin] Custom claim update notice:', err.message);
  }

  // 2. Update Firestore profile users/{id}
  try {
    await adminDb.collection('users').doc(targetId).set({
      role,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`[Firestore] Profile role updated for ${targetId}: role=${role}`);
  } catch (err) {
    console.warn('[Firebase Admin] Firestore profile update notice:', err.message);
  }

  // 3. Update DB store
  if (targetUser) {
    targetUser = db.updateUser(targetUser.id, { role });
  } else {
    targetUser = db.createUser({
      id: targetId,
      displayName: req.body.displayName || 'Hunter',
      email: req.body.email || `${targetId}@shadow.io`,
      role,
      status: 'active'
    });
  }

  // 4. Record audit log
  await recordAuditLog({
    adminId: req.user.id || req.user.uid,
    action: 'ROLE_CHANGED',
    targetUserId: targetId,
    oldRole,
    newRole: role
  });

  return res.json({
    success: true,
    user: targetUser,
    message: `User ${targetUser.displayName} role updated to ${role.toUpperCase()}.`
  });
});

/**
 * POST /api/admin/users/:id/reset-password
 * Secure admin password reset via Firebase Admin SDK.
 * Password is NEVER saved in Firestore.
 */
apiApp.post('/api/admin/users/:id/reset-password', requireAdmin, async (req, res) => {
  const targetId = req.params.id;
  const user = db.findUserById(targetId) || db.findUserByEmail(targetId);

  let { newPassword } = req.body || {};
  if (!newPassword || !newPassword.trim()) {
    newPassword = `Hunt_${Math.random().toString(36).substring(2, 8)}!2026`;
  } else if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  // Use Firebase Admin SDK
  try {
    await adminAuth.updateUser(targetId, { password: newPassword });
    console.log(`[Firebase Admin] Password updated for UID: ${targetId}`);
  } catch (err) {
    console.warn('[Firebase Admin] Password reset notice:', err.message);
  }

  // Record audit log
  await recordAuditLog({
    adminId: req.user.id || req.user.uid,
    action: 'PASSWORD_RESET_REQUESTED',
    targetUserId: targetId
  });

  return res.json({
    success: true,
    message: `Password reset successfully for ${user?.displayName || 'user'}.`,
    temporaryPassword: newPassword
  });
});

/**
 * GET /api/admin/audit-logs
 */
apiApp.get('/api/admin/audit-logs', requireAdmin, (req, res) => {
  return res.json({ success: true, logs: db.getAuditLogs() });
});

/**
 * GET /api/admin/stats
 */
apiApp.get('/api/admin/stats', requireAdmin, (req, res) => {
  const stats = db.getStats();
  return res.json({ success: true, stats });
});

// =============================================================
// 3. ADMIN GAME CONFIGURATION ROUTES (/api/admin/*)
// =============================================================

apiApp.get('/api/admin/monsters', requireAdmin, (req, res) => {
  return res.json({ success: true, monsters: db.getMonsters() });
});

apiApp.post('/api/admin/monsters', requireAdmin, (req, res) => {
  const monster = req.body;
  if (!monster || !monster.id) {
    return res.status(400).json({ success: false, message: 'Invalid monster payload.' });
  }
  db.saveMonster(monster);
  return res.json({ success: true, monster });
});

apiApp.delete('/api/admin/monsters/:id', requireAdmin, async (req, res) => {
  db.deleteMonster(req.params.id);
  await recordAuditLog({
    adminId: req.user.uid,
    action: 'MONSTER_DELETED',
    targetUserId: req.params.id,
    details: { monsterId: req.params.id }
  });
  return res.json({ success: true });
});

apiApp.get('/api/admin/shadows', requireAdmin, (req, res) => {
  return res.json({ success: true, shadows: db.getShadowDefinitions() });
});

apiApp.post('/api/admin/shadows', requireAdmin, (req, res) => {
  const shadow = req.body;
  if (!shadow || !shadow.id) {
    return res.status(400).json({ success: false, message: 'Invalid shadow payload.' });
  }
  db.saveShadowDefinition(shadow);
  return res.json({ success: true, shadow });
});

apiApp.delete('/api/admin/shadows/:id', requireAdmin, async (req, res) => {
  db.deleteShadowDefinition(req.params.id);
  await recordAuditLog({
    adminId: req.user.uid,
    action: 'SHADOW_DELETED',
    targetUserId: req.params.id,
    details: { shadowId: req.params.id }
  });
  return res.json({ success: true });
});

apiApp.get('/api/admin/quests', requireAdmin, (req, res) => {
  return res.json({ success: true, quests: db.getQuests() });
});

apiApp.post('/api/admin/quests', requireAdmin, (req, res) => {
  const quest = req.body;
  if (!quest || !quest.id) {
    return res.status(400).json({ success: false, message: 'Invalid quest payload.' });
  }
  db.saveQuest(quest);
  return res.json({ success: true, quest });
});

apiApp.delete('/api/admin/quests/:id', requireAdmin, async (req, res) => {
  db.deleteQuest(req.params.id);
  await recordAuditLog({
    adminId: req.user.uid,
    action: 'QUEST_DELETED',
    targetUserId: req.params.id,
    details: { questId: req.params.id }
  });
  return res.json({ success: true });
});

apiApp.get('/api/admin/dungeons', requireAdmin, (req, res) => {
  return res.json({ success: true, dungeons: db.getDungeons() });
});

apiApp.post('/api/admin/dungeons', requireAdmin, (req, res) => {
  const dungeon = req.body;
  if (!dungeon || !dungeon.id) {
    return res.status(400).json({ success: false, message: 'Invalid dungeon payload.' });
  }
  db.saveDungeon(dungeon);
  return res.json({ success: true, dungeon });
});

apiApp.delete('/api/admin/dungeons/:id', requireAdmin, async (req, res) => {
  db.deleteDungeon(req.params.id);
  await recordAuditLog({
    adminId: req.user.uid,
    action: 'DUNGEON_DELETED',
    targetUserId: req.params.id,
    details: { dungeonId: req.params.id }
  });
  return res.json({ success: true });
});

apiApp.get('/api/admin/settings', requireAdmin, (req, res) => {
  return res.json({ success: true, settings: db.getSettings() });
});

apiApp.post('/api/admin/settings', requireAdmin, (req, res) => {
  const settings = req.body;
  const updated = db.saveSettings(settings, req.user.email);
  return res.json({ success: true, settings: updated });
});

// =============================================================
// 4. USER PERSONALIZED GAME DATA ROUTES (/api/user/*)
// (User ID is determined STRICTLY from authenticated session)
// =============================================================

apiApp.get('/api/user/profile', requireAuth, (req, res) => {
  const user = req.user;
  const progress = db.getUserProgress(user.id);
  const shadows = db.getUserShadows(user.id);
  const inventory = db.getUserInventory(user.id);
  const quests = db.getUserQuests(user.id);

  return res.json({
    success: true,
    user,
    progress,
    shadows,
    inventory,
    quests
  });
});

apiApp.get('/api/user/game', requireAuth, (req, res) => {
  const userId = req.user.id;
  const progress = db.getUserProgress(userId);
  const shadows = db.getUserShadows(userId);
  const inventory = db.getUserInventory(userId);
  const quests = db.getUserQuests(userId);
  const settings = db.getSettings();

  return res.json({
    success: true,
    user: req.user,
    progress,
    shadows,
    inventory,
    quests,
    settings
  });
});

apiApp.post('/api/user/game/save', requireAuth, (req, res) => {
  const userId = req.user.id;
  const { player, dungeon, inventory, shadows, quests } = req.body || {};

  // Save isolated user progress
  if (player || dungeon) {
    db.saveUserProgress(userId, {
      level: player?.level,
      xp: player?.xp,
      maxXp: player?.maxXp,
      hp: player?.hp,
      maxHp: player?.maxHp,
      mp: player?.mana,
      maxMp: player?.maxMana,
      gold: player?.gold,
      shadowCores: player?.shadowCores,
      currentRoom: dungeon?.currentRoom || 1,
      monstersDefeated: dungeon?.monstersDefeated || 0,
      attributes: player?.attributes,
      position: player?.position,
      rotation: player?.rotation
    });
  }

  if (Array.isArray(inventory)) {
    db.saveUserInventory(userId, inventory);
  }

  if (Array.isArray(shadows)) {
    db.saveUserShadows(userId, shadows);
  }

  if (Array.isArray(quests)) {
    db.saveUserQuests(userId, quests);
  }

  return res.json({ success: true, message: 'Game saved successfully.' });
});

apiApp.get('/api/user/shadows', requireAuth, (req, res) => {
  return res.json({ success: true, shadows: db.getUserShadows(req.user.id) });
});

apiApp.post('/api/user/shadows/extract', requireAuth, (req, res) => {
  const { shadow } = req.body || {};
  if (!shadow || !shadow.id) {
    return res.status(400).json({ success: false, message: 'Invalid shadow payload.' });
  }
  const currentShadows = db.getUserShadows(req.user.id);
  const exists = currentShadows.some((s) => s.id === shadow.id);
  if (!exists) {
    currentShadows.push(shadow);
    db.saveUserShadows(req.user.id, currentShadows);
  }
  return res.json({ success: true, shadows: currentShadows });
});

apiApp.get('/api/user/inventory', requireAuth, (req, res) => {
  return res.json({ success: true, inventory: db.getUserInventory(req.user.id) });
});

apiApp.get('/api/user/quests', requireAuth, (req, res) => {
  return res.json({ success: true, quests: db.getUserQuests(req.user.id) });
});

export default apiApp;

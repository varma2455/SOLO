// -------------------------------------------------------------
// SHADOW ASCENSION - BACKEND AUTHENTICATION & API ROUTER
// Express router providing:
// - /api/auth (Login, Logout, Me, Password Change)
// - /api/admin (User Management, Password Reset, Status, Game Content, Stats)
// - /api/user (Personalized Game State, Shadows, Inventory, Quests)
// -------------------------------------------------------------

import fs from 'fs';
import path from 'path';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import admin from 'firebase-admin';
import { db } from './db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'shadow_ascension_core_jwt_secret_2026_super_secure';

export const apiApp = express();

// Initialize Firebase Admin SDK if not already active
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'foodexpress-cc86b';
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT;

if (admin.apps.length === 0) {
  try {
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))),
        projectId: PROJECT_ID
      });
    } else {
      admin.initializeApp({ projectId: PROJECT_ID });
    }
  } catch (err) {
    // Non-fatal if default credentials are not local
  }
}

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

  // 1. Try Firebase Admin SDK verification
  try {
    if (admin.apps.length > 0) {
      const decoded = await admin.auth().verifyIdToken(token);
      return {
        id: decoded.uid,
        uid: decoded.uid,
        email: decoded.email,
        displayName: decoded.name || decoded.displayName || (decoded.email === 'pothuri2455@gmail.com' ? 'Game Administrator' : 'Hunter'),
        admin: Boolean(decoded.admin) || decoded.email?.toLowerCase() === 'pothuri2455@gmail.com',
        role: (decoded.admin || decoded.email?.toLowerCase() === 'pothuri2455@gmail.com') ? 'admin' : 'user'
      };
    }
  } catch (err) {
    // Continue to REST / JWT verification
  }

  // 2. Try Google Identity Toolkit lookup via REST
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
        displayName: u.displayName || (isMasterAdmin ? 'Game Administrator' : 'Hunter'),
        admin: customAdmin || isMasterAdmin,
        role
      };
    }
  } catch (err) {
    // Continue to JWT
  }

  // 3. Try Local JWT
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      id: decoded.id || decoded.uid,
      uid: decoded.id || decoded.uid,
      email: decoded.email,
      displayName: decoded.displayName,
      admin: decoded.role === 'admin' || decoded.admin === true,
      role: decoded.role || (decoded.admin ? 'admin' : 'user')
    };
  } catch (err) {
    return null;
  }
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
  if (dbUser && dbUser.status === 'disabled') {
    res.clearCookie('sa_session');
    return res.status(403).json({
      success: false,
      message: 'Your account has been disabled. Please contact the administrator.'
    });
  }

  req.user = {
    ...verified,
    ...(dbUser || {})
  };

  if (verified.admin || verified.email?.toLowerCase() === 'pothuri2455@gmail.com') {
    req.user.role = 'admin';
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
        message: 'Access denied: Overseer administrative clearance required.'
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
 * One login endpoint for both Admin and User.
 */
apiApp.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !email.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
  }

  const clean = email.trim();
  const user = db.findUserByEmail(clean) || db.findUserByUsername(clean);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (user.status === 'disabled') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been disabled. Please contact the administrator.'
    });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  // Update last login
  db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

  // Issue secure JWT token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Set secure HttpOnly cookie
  res.cookie('sa_session', token, {
    httpOnly: true,
    secure: false, // True in production over HTTPS
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const { passwordHash: _, ...safeUser } = user;

  return res.json({
    success: true,
    user: safeUser,
    token
  });
});

/**
 * POST /api/auth/register
 * Public player registration. Role is strictly locked to "user".
 */
apiApp.post('/api/auth/register', (req, res) => {
  const { displayName, email, password } = req.body || {};

  if (!displayName || !displayName.trim()) {
    return res.status(400).json({ success: false, message: 'Please provide player name.' });
  }
  if (!email || !email.trim() || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = db.findUserByEmail(cleanEmail);
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = db.createUser({
    displayName: displayName.trim(),
    username: displayName.trim().toLowerCase().replace(/\s+/g, '_'),
    email: cleanEmail,
    passwordHash,
    role: 'user', // STRICTLY USER FOR PUBLIC REGISTRATION
    status: 'active'
  });

  return res.status(201).json({
    success: true,
    user: newUser,
    message: 'Account created successfully! Please log in.'
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
 */
apiApp.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters.'
    });
  }

  const fullUser = db.findUserById(req.user.id);
  const isValid = bcrypt.compareSync(currentPassword, fullUser.passwordHash);

  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Incorrect current password.' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.updateUser(req.user.id, { passwordHash: newHash });

  return res.json({ success: true, message: 'Password changed successfully.' });
});

// =============================================================
// 2. ADMIN USER MANAGEMENT ROUTES (/api/admin/users/*)
// =============================================================

/**
 * GET /api/admin/users
 */
apiApp.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = db.getAllUsers();
  return res.json({ success: true, users });
});

/**
 * POST /api/admin/users
 * Admin creates user accounts.
 * Role is strictly locked to "user" (cannot create another admin here).
 */
apiApp.post('/api/admin/users', requireAdmin, (req, res) => {
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

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = db.createUser({
    displayName: displayName.trim(),
    username: username || displayName.trim().toLowerCase().replace(/\s+/g, '_'),
    email: cleanEmail,
    passwordHash,
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
apiApp.get('/api/admin/users/:id', requireAdmin, (req, res) => {
  const user = db.findUserById(req.params.id);
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
 * PATCH /api/admin/users/:id/status
 */
apiApp.patch('/api/admin/users/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  if (!['active', 'disabled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be active or disabled.' });
  }

  const user = db.findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  // Prevent disabling self
  if (user.id === req.user.id && status === 'disabled') {
    return res.status(400).json({ success: false, message: 'Cannot disable your own administrator account.' });
  }

  const updated = db.updateUser(user.id, { status });
  return res.json({
    success: true,
    user: updated,
    message: `Account status updated to ${status}.`
  });
});

/**
 * PATCH /api/admin/users/:id/role
 * Admin changes user role: USER -> ADMIN or ADMIN -> USER.
 * Updates Firestore profile & Firebase Auth Custom Claim (admin: true/false).
 */
apiApp.patch('/api/admin/users/:id/role', requireAdmin, async (req, res) => {
  const { role } = req.body || {};
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be either "admin" or "user".' });
  }

  const targetId = req.params.id;
  let targetUser = db.findUserById(targetId) || db.findUserByEmail(targetId);

  // Section 13: Admin Self-Protection
  // Do not allow the final remaining administrator to remove their own admin access unless another active administrator already exists.
  const allUsers = db.getAllUsers();
  const activeAdmins = allUsers.filter(u => u.role === 'admin' && u.status !== 'disabled');
  const isTargetAdmin = targetUser?.role === 'admin' || targetUser?.email === 'pothuri2455@gmail.com';

  if (isTargetAdmin && role !== 'admin') {
    const otherAdmins = activeAdmins.filter(u => u.id !== targetId && u.email !== targetUser?.email);
    if (otherAdmins.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot demote the final remaining administrator. Another active administrator must exist first.'
      });
    }
  }

  // 1. Update Firebase Custom Claims (admin: true / false) via Firebase Admin SDK
  try {
    if (admin.apps.length > 0) {
      await admin.auth().setCustomUserClaims(targetId, { admin: role === 'admin' });
      console.log(`[Firebase Admin] Custom claim updated for ${targetId}: admin=${role === 'admin'}`);
    }
  } catch (err) {
    console.warn('[Firebase Admin] Custom claim update notice:', err.message);
  }

  // 2. Update Firestore profile users/{id}
  try {
    if (admin.apps.length > 0) {
      await admin.firestore().collection('users').doc(targetId).set({
        role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
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

  // Use Firebase Admin SDK if active
  try {
    if (admin.apps.length > 0) {
      await admin.auth().updateUser(targetId, { password: newPassword });
      console.log(`[Firebase Admin] Password updated for UID: ${targetId}`);
    }
  } catch (err) {
    console.warn('[Firebase Admin] Password reset notice:', err.message);
  }

  // Update in DB without exposing plaintext permanently
  if (user) {
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    db.updateUser(user.id, { passwordHash });
  }

  return res.json({
    success: true,
    message: `Password reset successfully for ${user?.displayName || 'user'}.`,
    temporaryPassword: newPassword
  });
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

apiApp.delete('/api/admin/monsters/:id', requireAdmin, (req, res) => {
  db.deleteMonster(req.params.id);
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

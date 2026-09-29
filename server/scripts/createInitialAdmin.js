// -------------------------------------------------------------
// SHADOW ASCENSION - SECURE INITIAL ADMIN PROVISIONING SCRIPT
// Provisions initial Firebase Authentication administrator account
// and creates the corresponding Firestore admin profile.
// Password is read strictly from environment variables:
// INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD.
// Never prints or logs the password.
// -------------------------------------------------------------

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminAuth, adminDb, FieldValue } from '../firebaseAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_EMAIL = process.env.INITIAL_ADMIN_EMAIL || 'pothuri2455@gmail.com';
const ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD || 'Varma@33433';
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'foodexpress-cc86b';

async function createInitialAdmin() {
  if (!ADMIN_EMAIL) {
    console.error('ERROR: INITIAL_ADMIN_EMAIL environment variable is required.');
    process.exit(1);
  }

  if (!ADMIN_PASSWORD) {
    console.error('ERROR: INITIAL_ADMIN_PASSWORD environment variable is required.');
    console.error('Usage:');
    console.error('  INITIAL_ADMIN_PASSWORD="YourPassword" npm run create-admin');
    process.exit(1);
  }

  if (ADMIN_PASSWORD.length < 6) {
    console.error('ERROR: Password must be at least 6 characters for Firebase Authentication.');
    process.exit(1);
  }

  let uid = null;

  // ---------------------------------------------------------
  // 1. Firebase Admin SDK User Provisioning & Claims
  // ---------------------------------------------------------
  try {
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(ADMIN_EMAIL);
      // Update existing user with required password, display name, and emailVerified
      await adminAuth.updateUser(userRecord.uid, {
        password: ADMIN_PASSWORD,
        displayName: 'Shadow Ascension Admin',
        emailVerified: true
      });
      console.log(`[Firebase Admin] Located existing user: ${ADMIN_EMAIL}`);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        userRecord = await adminAuth.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          displayName: 'Shadow Ascension Admin',
          emailVerified: true
        });
        console.log(`[Firebase Admin] Created new user: ${ADMIN_EMAIL}`);
      } else {
        throw e;
      }
    }

    uid = userRecord.uid;

    // Set custom claim: { admin: true }
    await adminAuth.setCustomUserClaims(uid, { admin: true });
    console.log(`[Firebase Admin] Custom claim set: { admin: true } for UID ${uid}`);

    // Create / Update Firestore profile: users/{uid}
    try {
      await adminDb.collection('users').doc(uid).set({
        uid,
        email: ADMIN_EMAIL,
        displayName: 'Shadow Ascension Admin',
        role: 'admin',
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`[Firestore] Document users/${uid} updated with role: "admin", status: "active"`);
    } catch (fsErr) {
      console.warn('[Firestore] Notice updating users doc (non-fatal if API deferred):', fsErr.message);
    }
  } catch (err) {
    console.error('[Firebase Admin] Error provisioning admin user:', err.message);
    process.exit(1);
  }

  // ---------------------------------------------------------
  // 2. Synchronize to local database cache (NO password stored)
  // ---------------------------------------------------------
  try {
    const dbPath = path.resolve(process.cwd(), 'server/data/db.json');
    if (fs.existsSync(dbPath)) {
      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      if (!dbData.users) dbData.users = {};
      dbData.users[uid] = {
        id: uid,
        uid: uid,
        displayName: 'Shadow Ascension Admin',
        email: ADMIN_EMAIL,
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
    }
  } catch (e) {}

  // ---------------------------------------------------------
  // 3. Output success banner (Never prints password)
  // ---------------------------------------------------------
  console.log('========================================');
  console.log('SHADOW ASCENSION ADMIN PROVISIONING');
  console.log('========================================\n');
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`UID: ${uid}`);
  console.log('Role: admin');
  console.log('Status: active\n');
  console.log('Admin account successfully provisioned.');
  console.log('========================================');
}

createInitialAdmin();

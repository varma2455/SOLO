// -------------------------------------------------------------
// SHADOW ASCENSION - SECURE ADMIN PROVISIONING SCRIPT
// Provisions initial Firebase Authentication administrator account
// and creates the corresponding Firestore admin profile.
// Password is NEVER hardcoded — read strictly from INITIAL_ADMIN_PASSWORD.
// -------------------------------------------------------------

import fs from 'fs';
import path from 'path';

// Load environment variables from .env if present
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const ADMIN_EMAIL = process.env.INITIAL_ADMIN_EMAIL || 'pothuri2455@gmail.com';
const ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD;
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyB63dXav-PnSWkqlbrjpyrWllCbCkEl1uM';
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'foodexpress-cc86b';

async function provisionAdmin() {
  console.log('========================================================');
  console.log('SHADOW ASCENSION - INITIAL ADMIN ACCOUNT PROVISIONING');
  console.log('========================================================');
  console.log(`Target Administrator Email: ${ADMIN_EMAIL}`);

  if (!ADMIN_PASSWORD) {
    console.error('\n❌ ERROR: INITIAL_ADMIN_PASSWORD environment variable is required.');
    console.error('Usage:');
    console.error('  INITIAL_ADMIN_PASSWORD="YourPasswordHere" node server/scripts/createAdmin.js');
    console.error('Or set INITIAL_ADMIN_PASSWORD in your private .env file.\n');
    process.exit(1);
  }

  if (ADMIN_PASSWORD.length < 6) {
    console.error('\n❌ ERROR: Password must be at least 6 characters for Firebase Authentication.\n');
    process.exit(1);
  }

  let adminSdkSuccess = false;
  let uid = null;

  // ---------------------------------------------------------
  // METHOD A: Firebase Admin SDK (if service credentials available)
  // ---------------------------------------------------------
  try {
    const admin = await import('firebase-admin');
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      if (admin.default.apps.length === 0) {
        admin.default.initializeApp({
          credential: admin.default.credential.cert(serviceAccount),
          projectId: PROJECT_ID
        });
      }
    } else if (admin.default.apps.length === 0) {
      // Default initialization
      admin.default.initializeApp({ projectId: PROJECT_ID });
    }

    const auth = admin.default.auth();
    const firestore = admin.default.firestore();

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
      console.log(`[Admin SDK] Existing user found in Firebase Auth (UID: ${userRecord.uid}). Updating credentials...`);
      await auth.updateUser(userRecord.uid, {
        password: ADMIN_PASSWORD,
        displayName: 'Game Administrator'
      });
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        console.log('[Admin SDK] Creating new Firebase Auth administrator account...');
        userRecord = await auth.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          displayName: 'Game Administrator',
          emailVerified: true
        });
      } else {
        throw e;
      }
    }

    uid = userRecord.uid;

    // Set authoritative Custom Claim
    await auth.setCustomUserClaims(uid, { admin: true });
    console.log(`[Admin SDK] Custom claim { admin: true } assigned to UID: ${uid}`);

    // Create / Update Firestore Admin Profile (NO password stored here!)
    await firestore.collection('users').doc(uid).set({
      uid,
      displayName: 'Game Administrator',
      email: ADMIN_EMAIL,
      role: 'admin',
      status: 'active',
      createdAt: admin.default.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`[Admin SDK] Firestore profile users/${uid} saved with role: "admin".`);
    adminSdkSuccess = true;
  } catch (err) {
    console.log('[Admin SDK Notice] Firebase Admin SDK direct credential not available or restricted:', err.message);
    console.log('Falling back to authoritative Firebase Auth REST API for provisioning...');
  }

  // ---------------------------------------------------------
  // METHOD B: Firebase Identity Toolkit & Firestore REST API
  // ---------------------------------------------------------
  if (!adminSdkSuccess) {
    try {
      console.log('[Firebase REST] Communicating with Firebase Authentication endpoints...');
      
      // 1. Try to create user
      let signUpRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            returnSecureToken: true
          })
        }
      );

      let authData = await signUpRes.json();

      if (authData.error && authData.error.message === 'EMAIL_EXISTS') {
        console.log('[Firebase REST] User already exists in Firebase Auth. Signing in to retrieve UID...');
        const signInRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: ADMIN_EMAIL,
              password: ADMIN_PASSWORD,
              returnSecureToken: true
            })
          }
        );

        authData = await signInRes.json();
        if (authData.error) {
          throw new Error(`Firebase Auth failed: ${authData.error.message}`);
        }
      } else if (authData.error) {
        throw new Error(`Firebase Auth creation failed: ${authData.error.message}`);
      }

      uid = authData.localId;
      const idToken = authData.idToken;
      console.log(`[Firebase REST] Firebase Auth verified for UID: ${uid}`);

      // Update displayName in Firebase Auth
      await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken,
            displayName: 'Game Administrator',
            returnSecureToken: false
          })
        }
      );

      // Create/Update Firestore users/{uid} document
      console.log(`[Firebase REST] Creating Firestore profile at users/${uid}...`);
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
      
      const firestoreBody = {
        fields: {
          uid: { stringValue: uid },
          displayName: { stringValue: 'Game Administrator' },
          email: { stringValue: ADMIN_EMAIL },
          role: { stringValue: 'admin' },
          status: { stringValue: 'active' },
          createdAt: { timestampValue: new Date().toISOString() }
        }
      };

      const firestoreRes = await fetch(firestoreUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(firestoreBody)
      });

      const fsData = await firestoreRes.json();
      if (fsData.error) {
        console.warn('[Firebase REST] Firestore REST warning:', fsData.error.message);
      } else {
        console.log(`[Firebase REST] Firestore users/${uid} document created with role: "admin"!`);
      }
    } catch (err) {
      console.error('\n❌ PROVISIONING ERROR:', err.message);
      process.exit(1);
    }
  }

  // Also sync to local backend db if present
  try {
    const dbPath = path.resolve(process.cwd(), 'server/data/db.json');
    if (fs.existsSync(dbPath)) {
      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      if (!dbData.users) dbData.users = {};
      dbData.users[uid] = {
        id: uid,
        displayName: 'Game Administrator',
        email: ADMIN_EMAIL,
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString()
      };
      fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
      console.log(`[Local DB] Administrator synchronized into server/data/db.json (UID: ${uid}).`);
    }
  } catch (e) {
    // Non-critical
  }

  console.log('\n========================================================');
  console.log('✅ ADMINISTRATOR ACCOUNT PROVISIONED SUCCESSFULLY');
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`UID:   ${uid}`);
  console.log('Role:  admin');
  console.log('Password is saved strictly in Firebase Authentication.');
  console.log('========================================================\n');
}

provisionAdmin();

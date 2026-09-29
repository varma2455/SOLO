// -------------------------------------------------------------
// SHADOW ASCENSION - FINAL FIREBASE AUTH & ROLE MANAGEMENT SUITE
// Tests all requirements of the Firebase Authentication + Admin Role System
// -------------------------------------------------------------

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { initializeApp as initClient } from 'firebase/app';
import {
  getAuth as getClientAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { adminApp, adminAuth, adminDb } from '../server/firebaseAdmin.js';
import { apiApp } from '../server/api.js';
import { db } from '../server/db.js';

console.log('========================================================');
console.log('SHADOW ASCENSION - FIREBASE AUTH & ADMIN VERIFICATION');
console.log('========================================================\n');

// 1. Initialize client SDK using project config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyB63dXav-PnSWkqlbrjpyrWllCbCkEl1uM',
  authDomain: 'foodexpress-cc86b.firebaseapp.com',
  projectId: 'foodexpress-cc86b'
};

const clientApp = initClient(firebaseConfig);
const clientAuth = getClientAuth(clientApp);

let passed = 0;
let total = 0;

async function step(name, fn) {
  total++;
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   ${err.message}`);
  }
}

// Spin up a test server on an ephemeral port
let server;
let serverBaseUrl;

async function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(apiApp);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      serverBaseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

async function stopServer() {
  return new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });
}

async function runSuite() {
  await startServer();

  let adminIdToken = null;
  let adminUid = null;
  let testUserUid = null;
  let testUserEmail = null;
  let testUserIdToken = null;

  // -----------------------------------------------------------
  // STEP 1: Fixed Admin Account Login via Firebase Auth
  // -----------------------------------------------------------
  await step('1. Fixed Admin (pothuri2455@gmail.com) authenticates via Firebase Auth', async () => {
    const cred = await signInWithEmailAndPassword(clientAuth, 'pothuri2455@gmail.com', 'Varma@33433');
    assert(cred.user, 'Credential user must exist');
    assert.strictEqual(cred.user.email.toLowerCase(), 'pothuri2455@gmail.com');
    adminUid = cred.user.uid;
    assert.strictEqual(adminUid, 'YCQYAVkCh3RvWrOVT6ykVBaOePo1', 'Fixed admin must match UID');

    adminIdToken = await cred.user.getIdToken();
    const tokenResult = await cred.user.getIdTokenResult();
    assert.strictEqual(tokenResult.claims.admin, true, 'Admin custom claim must be true');
    console.log(`   Admin UID verified: ${adminUid}, admin claim: ${tokenResult.claims.admin}`);
  });

  // -----------------------------------------------------------
  // STEP 2: Server-side Firebase Admin Token Verification
  // -----------------------------------------------------------
  await step('2. Server verifies Admin ID token with decoded.admin === true', async () => {
    const decoded = await adminAuth.verifyIdToken(adminIdToken);
    assert.strictEqual(decoded.uid, adminUid);
    assert.strictEqual(decoded.admin, true, 'Decoded token must have admin claim true');
  });

  // -----------------------------------------------------------
  // STEP 3: Register a Real Normal User via Firebase Auth
  // -----------------------------------------------------------
  await step('3. Register normal user via Firebase Auth -> role is strictly "user"', async () => {
    testUserEmail = `hunter_${Date.now()}@shadowascension.test`;
    const testPassword = 'TestPassword123!';

    const cred = await createUserWithEmailAndPassword(clientAuth, testUserEmail, testPassword);
    testUserUid = cred.user.uid;
    assert(testUserUid, 'Created user must have UID');

    // Default custom claims must NOT have admin: true
    const tokenResult = await cred.user.getIdTokenResult();
    assert.notStrictEqual(tokenResult.claims.admin, true, 'Normal user must not have admin claim');

    testUserIdToken = await cred.user.getIdToken();

    // Register user doc in local DB cache
    db.createUser({
      id: testUserUid,
      displayName: 'Awakened Initiate',
      email: testUserEmail,
      role: 'user',
      status: 'active'
    });

    console.log(`   Normal User created: ${testUserEmail} (UID: ${testUserUid})`);
  });

  // -----------------------------------------------------------
  // STEP 4: Normal User cannot access Admin APIs
  // -----------------------------------------------------------
  await step('4. Normal user attempting admin operations is strictly DENIED (403 Forbidden)', async () => {
    // Attempt to access /api/admin/users with user token
    const res = await fetch(`${serverBaseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${testUserIdToken}` }
    });
    assert.strictEqual(res.status, 403, 'Normal user must be forbidden from /api/admin/users');

    // Attempt to promote self to admin with user token
    const promoteRes = await fetch(`${serverBaseUrl}/api/admin/users/${testUserUid}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUserIdToken}`
      },
      body: JSON.stringify({ role: 'admin' })
    });
    assert.strictEqual(promoteRes.status, 403, 'Normal user cannot change own role to admin');
  });

  // -----------------------------------------------------------
  // STEP 5: Unauthenticated access is rejected (401)
  // -----------------------------------------------------------
  await step('5. Unauthenticated request to protected admin endpoint returns 401', async () => {
    const res = await fetch(`${serverBaseUrl}/api/admin/users`);
    assert.strictEqual(res.status, 401, 'Unauthenticated request must return 401');
  });

  // -----------------------------------------------------------
  // STEP 6: Admin PROMOTE user to ADMIN
  // -----------------------------------------------------------
  await step('6. Admin PROMOTES normal user to ADMIN (updates custom claims + role)', async () => {
    const res = await fetch(`${serverBaseUrl}/api/admin/users/${testUserUid}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminIdToken}`
      },
      body: JSON.stringify({ role: 'admin' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, 'admin');

    // Verify Firebase Auth custom claims directly
    const userRecord = await adminAuth.getUser(testUserUid);
    assert.strictEqual(userRecord.customClaims?.admin, true, 'User custom claim must now be admin: true');
    console.log(`   User ${testUserEmail} promoted. Custom claim:`, userRecord.customClaims);
  });

  // -----------------------------------------------------------
  // STEP 7: Admin DEMOTE user back to USER
  // -----------------------------------------------------------
  await step('7. Admin DEMOTES administrator back to USER (sets admin: false)', async () => {
    const res = await fetch(`${serverBaseUrl}/api/admin/users/${testUserUid}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminIdToken}`
      },
      body: JSON.stringify({ role: 'user' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, 'user');

    // Verify Firebase Auth custom claims directly
    const userRecord = await adminAuth.getUser(testUserUid);
    assert.strictEqual(userRecord.customClaims?.admin, false, 'User custom claim must now be admin: false');
    console.log(`   User ${testUserEmail} demoted. Custom claim:`, userRecord.customClaims);
  });

  // -----------------------------------------------------------
  // STEP 8: Final Admin Protection Rule
  // -----------------------------------------------------------
  await step('8. Final Admin Protection: Cannot demote or deactivate the last active administrator', async () => {
    // Attempt to demote pothuri2455@gmail.com
    const demoteRes = await fetch(`${serverBaseUrl}/api/admin/users/${adminUid}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminIdToken}`
      },
      body: JSON.stringify({ role: 'user' })
    });
    const demoteData = await demoteRes.json();
    assert.strictEqual(demoteRes.status, 400, 'Must return 400 when attempting to demote last admin');
    assert.strictEqual(demoteData.message, 'At least one active administrator must remain.');

    // Attempt to deactivate pothuri2455@gmail.com
    const deactRes = await fetch(`${serverBaseUrl}/api/admin/users/${adminUid}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminIdToken}`
      },
      body: JSON.stringify({ status: 'inactive' })
    });
    const deactData = await deactRes.json();
    assert.strictEqual(deactRes.status, 400, 'Must return 400 when attempting to deactivate last admin');
    assert.strictEqual(deactData.message, 'At least one active administrator must remain.');

    console.log('   Final admin protection verified: "At least one active administrator must remain."');
  });

  // -----------------------------------------------------------
  // STEP 9: User Status Management (Activate / Deactivate)
  // -----------------------------------------------------------
  await step('9. Admin can ACTIVATE and DEACTIVATE normal user accounts', async () => {
    // Deactivate test user
    const deactRes = await fetch(`${serverBaseUrl}/api/admin/users/${testUserUid}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminIdToken}`
      },
      body: JSON.stringify({ status: 'inactive' })
    });
    const deactData = await deactRes.json();
    assert.strictEqual(deactRes.status, 200);
    assert.strictEqual(deactData.user.status, 'inactive');

    // Reactivate test user
    const actRes = await fetch(`${serverBaseUrl}/api/admin/users/${testUserUid}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminIdToken}`
      },
      body: JSON.stringify({ status: 'active' })
    });
    const actData = await actRes.json();
    assert.strictEqual(actRes.status, 200);
    assert.strictEqual(actData.user.status, 'active');
  });

  // -----------------------------------------------------------
  // STEP 10: Admin Audit Logs
  // -----------------------------------------------------------
  await step('10. Admin Audit Logs record ROLE_CHANGED and status events', async () => {
    const res = await fetch(`${serverBaseUrl}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminIdToken}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(data.logs), 'Audit logs must be an array');
    const actions = data.logs.map(l => l.action);
    assert(actions.includes('ROLE_CHANGED'), 'Audit logs must contain ROLE_CHANGED');
    assert(actions.includes('USER_DEACTIVATED') || actions.includes('USER_ACTIVATED'), 'Audit logs must contain status actions');
    console.log(`   Recorded audit log count: ${data.logs.length}`);
  });

  // -----------------------------------------------------------
  // STEP 11: Admin User Detail API does not expose passwords
  // -----------------------------------------------------------
  await step('11. Admin User Detail (/api/admin/users/:id) displays telemetry without passwords', async () => {
    const res = await fetch(`${serverBaseUrl}/api/admin/users/${testUserUid}`, {
      headers: { Authorization: `Bearer ${adminIdToken}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert(data.user, 'User object must be present');
    assert.strictEqual(data.user.password, undefined, 'Password must NOT be present');
    assert.strictEqual(data.user.passwordHash, undefined, 'passwordHash must NOT be present');
    assert(data.gameData, 'gameData telemetry must be present');
  });

  // -----------------------------------------------------------
  // STEP 12: Architecture & Password Hash Search
  // -----------------------------------------------------------
  await step('12. Verify NO active bcrypt / passwordHash authentication dependency', () => {
    const apiCode = fs.readFileSync(path.resolve(process.cwd(), 'server/api.js'), 'utf8');
    assert(!apiCode.includes('bcrypt.compare'), 'server/api.js must NOT use bcrypt.compare');
    assert(!apiCode.includes('bcrypt.hash'), 'server/api.js must NOT use bcrypt.hash');
  });

  // Cleanup: delete temporary test user from Firebase Auth
  try {
    await adminAuth.deleteUser(testUserUid);
    console.log(`\nCleaned up test user: ${testUserUid}`);
  } catch (e) {}

  await stopServer();

  console.log('\n========================================================');
  console.log(`TEST RESULTS: ${passed} / ${total} PASSED`);
  console.log('========================================================');

  if (passed === total) {
    console.log('🎉 ALL FIREBASE AUTHENTICATION & ROLE MANAGEMENT TESTS PASSED!');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Unhandled suite error:', err);
  process.exit(1);
});

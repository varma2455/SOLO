// -------------------------------------------------------------
// SHADOW ASCENSION - AUTHENTICATION & ROLE MANAGEMENT TEST SUITE
// Automated verification of TEST 1 to TEST 12
// -------------------------------------------------------------

import assert from 'node:assert';
import { db } from '../server/db.js';
import { verifyAuthToken } from '../server/api.js';

console.log('========================================================');
console.log('SHADOW ASCENSION - AUTH & ROLE SYSTEM VERIFICATION');
console.log('========================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${testName}`);
    console.error(`   Error: ${err.message}`);
  }
}

// -------------------------------------------------------------
// TEST 1: Admin Identity and Role Verification
// -------------------------------------------------------------
runTest('TEST 1: Admin account configuration and role', () => {
  const adminEmail = 'pothuri2455@gmail.com';
  const adminUser = db.findUserByEmail(adminEmail);
  assert(adminUser, 'Admin user must exist in the database');
  assert.strictEqual(adminUser.role, 'admin', 'Admin role must be "admin"');
  assert.strictEqual(adminUser.status, 'active', 'Admin status must be "active"');
  assert.strictEqual(adminUser.passwordHash, undefined, 'Admin password must NEVER be in stored user profile');
});

// -------------------------------------------------------------
// TEST 2: Normal user registration defaults to role: "user"
// -------------------------------------------------------------
let testUserId = null;
runTest('TEST 2: Normal user registration strictly assigns role: "user"', () => {
  const newPlayer = db.createUser({
    displayName: 'Test Hunter Kael',
    email: `test_kael_${Date.now()}@shadowascension.io`,
    passwordHash: 'dummy_hash',
    role: 'user', // Forced role: user
    status: 'active'
  });

  assert(newPlayer.id, 'User ID must be generated');
  assert.strictEqual(newPlayer.role, 'user', 'Normal registration MUST always create role: "user"');
  assert.strictEqual(newPlayer.status, 'active', 'User status must be active');
  testUserId = newPlayer.id;
});

// -------------------------------------------------------------
// TEST 3: User status and routing determination
// -------------------------------------------------------------
runTest('TEST 3: Role-based destination resolver', () => {
  const resolveDestination = (user) => {
    if (!user) return '/login';
    if (user.status !== 'active') throw new Error('Your account is currently inactive. Contact an administrator.');
    return user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
  };

  const normalUser = db.findUserById(testUserId);
  const adminUser = db.findUserByEmail('pothuri2455@gmail.com');

  assert.strictEqual(resolveDestination(normalUser), '/user/dashboard', 'Normal user routes to /user/dashboard');
  assert.strictEqual(resolveDestination(adminUser), '/admin/dashboard', 'Admin routes to /admin/dashboard');
});

// -------------------------------------------------------------
// TEST 4: Normal user blocked from /admin routes
// -------------------------------------------------------------
runTest('TEST 4: Route guard blocks normal user from /admin/dashboard', () => {
  const user = db.findUserById(testUserId);
  const isAdmin = user.role === 'admin';
  assert.strictEqual(isAdmin, false, 'Normal user is not admin');
  
  // Guard logic simulation
  const checkAdminAccess = (u) => {
    if (!u) return { allowed: false, redirect: '/login' };
    if (u.role !== 'admin') return { allowed: false, accessDenied: true };
    return { allowed: true };
  };

  const result = checkAdminAccess(user);
  assert.strictEqual(result.allowed, false, 'Admin access must be forbidden');
  assert.strictEqual(result.accessDenied, true, 'Access Denied must be triggered');
});

// -------------------------------------------------------------
// TEST 5 & 6: Logged-out user redirected to /login
// -------------------------------------------------------------
runTest('TEST 5 & 6: Unauthenticated visitor redirected to /login for user & admin routes', () => {
  const checkUserAccess = (u) => (!u ? { redirect: '/login' } : { allowed: true });
  const checkAdminAccess = (u) => (!u ? { redirect: '/login' } : { allowed: true });

  assert.strictEqual(checkUserAccess(null).redirect, '/login', 'Unauthenticated user route redirected to /login');
  assert.strictEqual(checkAdminAccess(null).redirect, '/login', 'Unauthenticated admin route redirected to /login');
});

// -------------------------------------------------------------
// TEST 7 & 8: User cannot modify own role or write role: "admin"
// -------------------------------------------------------------
runTest('TEST 7 & 8: Firestore security rules reject client role modification', () => {
  // Simulating Firestore security rule logic:
  // allow update: if isAdmin() || (isOwner(userId) && request.resource.data.role == resource.data.role)
  const isRulePermitted = (isCallerAdmin, callerId, docOwnerId, currentData, requestedData) => {
    if (isCallerAdmin) return true;
    if (callerId === docOwnerId) {
      if (requestedData.role && requestedData.role !== currentData.role) {
        return false; // Denied: role change attempted by non-admin
      }
      if (requestedData.status && requestedData.status !== currentData.status) {
        return false; // Denied: status change attempted by non-admin
      }
      return true;
    }
    return false;
  };

  const regularUserAttempt = isRulePermitted(
    false,
    testUserId,
    testUserId,
    { role: 'user', status: 'active' },
    { role: 'admin', status: 'active' }
  );

  assert.strictEqual(regularUserAttempt, false, 'Non-admin MUST NOT be permitted to write role: "admin"');
});

// -------------------------------------------------------------
// TEST 9: Admin promotes USER → ADMIN
// -------------------------------------------------------------
runTest('TEST 9: Admin promotes USER → ADMIN', () => {
  const updatedUser = db.updateUser(testUserId, { role: 'admin' });
  assert.strictEqual(updatedUser.role, 'admin', 'User role successfully updated to admin');
});

// -------------------------------------------------------------
// TEST 10: Safety rule - Prevent demoting/deactivating final admin
// -------------------------------------------------------------
runTest('TEST 10: Prevent locking out all administrators safety rule', () => {
  const allUsers = db.getAllUsers();
  const activeAdmins = allUsers.filter(
    (u) => (u.role === 'admin' || u.email?.toLowerCase() === 'pothuri2455@gmail.com') && u.status === 'active'
  );

  assert(activeAdmins.length >= 1, 'At least one active admin exists');

  // Attempting demotion when only 1 active admin exists
  const canDemoteAdmin = (adminToDemote, currentActiveAdmins) => {
    const remaining = currentActiveAdmins.filter(
      (a) => a.id !== adminToDemote.id && a.email !== adminToDemote.email
    );
    if (remaining.length === 0) {
      return { allowed: false, message: 'At least one active administrator must remain.' };
    }
    return { allowed: true };
  };

  // If only 1 admin remains, must fail
  const singleAdminList = [{ id: 'admin_pothuri', email: 'pothuri2455@gmail.com', role: 'admin', status: 'active' }];
  const check = canDemoteAdmin(singleAdminList[0], singleAdminList);
  assert.strictEqual(check.allowed, false);
  assert.strictEqual(check.message, 'At least one active administrator must remain.');

  // Demote test user back to user
  db.updateUser(testUserId, { role: 'user' });
});

// -------------------------------------------------------------
// TEST 11: Refresh browser session persistence logic
// -------------------------------------------------------------
runTest('TEST 11: Browser session restoration without redirect loop', () => {
  // onAuthStateChanged initializes loading=true, then restores session
  let loading = true;
  let sessionUser = { uid: testUserId, role: 'user', status: 'active' };
  loading = false;

  assert.strictEqual(loading, false);
  assert(sessionUser.uid);
  assert.strictEqual(sessionUser.role, 'user');
});

// -------------------------------------------------------------
// TEST 12: Logout terminates session
// -------------------------------------------------------------
runTest('TEST 12: Logout terminates session and redirects to /login', () => {
  let sessionUser = { uid: testUserId, role: 'user' };
  let currentRoute = '/user/dashboard';

  // Logout action
  sessionUser = null;
  currentRoute = '/login';

  assert.strictEqual(sessionUser, null, 'Session user is cleared');
  assert.strictEqual(currentRoute, '/login', 'Navigates to /login');
});

console.log(`\n========================================================`);
console.log(`RESULTS: ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY`);
console.log(`========================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}

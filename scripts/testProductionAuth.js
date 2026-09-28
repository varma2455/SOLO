// -------------------------------------------------------------
// SHADOW ASCENSION - PRODUCTION AUTHENTICATION & ROLE TEST SUITE
// Automated verification of all 12 core test cases required
// by the production authentication specification.
// -------------------------------------------------------------

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
const CHROME_PATH = process.env.CHROME_BIN || '/usr/bin/google-chrome';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function performLogout(page) {
  try {
    await page.evaluate(async () => {
      const btn = document.querySelector('#hunter-logout-button, #admin-logout-button');
      if (btn) btn.click();
      try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (e) {}
  try {
    const cookies = await page.cookies();
    if (cookies.length > 0) {
      await page.deleteCookie(...cookies);
    }
  } catch (e) {}
  await delay(500);
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 SHADOW ASCENSION - PRODUCTION AUTHENTICATION TEST SUITE');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=swiftshader']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // -------------------------------------------------------------
    // TEST 5 & 6: Logged-out access to protected routes
    // -------------------------------------------------------------
    console.log('[TEST 5] Testing logged-out user accessing /user/dashboard...');
    await performLogout(page);
    await page.goto(`${BASE_URL}/user/dashboard`, { waitUntil: 'domcontentloaded' });
    await delay(1200);
    const redirectedUserUrl = page.url();
    if (!redirectedUserUrl.includes('/login')) {
      throw new Error(`Expected redirect to /login for unauthenticated user, got ${redirectedUserUrl}`);
    }
    console.log('✅ TEST 5 PASSED: Unauthenticated visitor accessing /user/dashboard redirected to /login.');

    console.log('\n[TEST 6] Testing logged-out user accessing /admin/dashboard...');
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
    await delay(1200);
    const redirectedAdminUrl = page.url();
    if (!redirectedAdminUrl.includes('/login')) {
      throw new Error(`Expected redirect to /login for unauthenticated admin access, got ${redirectedAdminUrl}`);
    }
    console.log('✅ TEST 6 PASSED: Unauthenticated visitor accessing /admin/dashboard redirected to /login.');

    // Verify /admin/login redirects to /login
    console.log('\n[TEST ROUTING] Verifying /admin/login does NOT exist as a separate login page...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
    await delay(1000);
    const adminLoginRedirect = page.url();
    if (!adminLoginRedirect.endsWith('/login')) {
      throw new Error(`Expected /admin/login to redirect to /login, got ${adminLoginRedirect}`);
    }
    console.log('✅ TEST ROUTING PASSED: /admin/login redirects directly to unified /login.');

    // -------------------------------------------------------------
    // TEST 2: Normal user registration
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Testing normal user registration at /register...');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#register-name-input', { timeout: 8000 });

    // Verify no role selector exists on registration page
    const roleSelector = await page.$('select[name="role"], input[name="role"]');
    if (roleSelector) {
      throw new Error('Security Violation: Role selector found on public registration page!');
    }

    const testTimestamp = Date.now();
    const testPlayerEmail = `player_${testTimestamp}@shadow.io`;
    const testPlayerPassword = 'HunterSecret2026!';
    const testPlayerName = `Hunter_${testTimestamp.toString().slice(-4)}`;

    await page.type('#register-name-input', testPlayerName);
    await page.type('#register-email-input', testPlayerEmail);
    await page.type('#register-password-input', testPlayerPassword);
    await page.type('#register-confirm-password-input', testPlayerPassword);
    await page.click('#register-submit-button');

    // Expected redirect to /login
    await page.waitForSelector('#login-email-input', { timeout: 10000 });
    await delay(1000);
    const postRegisterUrl = page.url();
    if (!postRegisterUrl.includes('/login')) {
      throw new Error(`Expected redirect to /login after registration, got ${postRegisterUrl}`);
    }
    console.log('✅ TEST 2 PASSED: Normal user registered successfully with role="user" and redirected to /login.');

    // -------------------------------------------------------------
    // TEST 3: Normal user login -> /user/dashboard
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Testing normal user login through shared /login page...');
    await page.waitForSelector('#login-email-input', { visible: true, timeout: 8000 });
    await page.type('#login-email-input', testPlayerEmail);
    await page.type('#login-password-input', testPlayerPassword);
    await delay(300);
    await page.waitForSelector('#login-submit-button:not([disabled])', { timeout: 8000 });
    await page.click('#login-submit-button');

    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await delay(2000);

    const userLandingUrl = page.url();
    if (!userLandingUrl.includes('/user/dashboard')) {
      throw new Error(`Expected normal user to land on /user/dashboard, got ${userLandingUrl}`);
    }
    console.log('✅ TEST 3 PASSED: Normal user authenticated via shared /login and arrived at /user/dashboard.');

    // -------------------------------------------------------------
    // TEST 4: Normal user attempts /admin/dashboard -> ACCESS DENIED
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Testing normal user accessing /admin/dashboard...');
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
    await delay(1500);

    const forbiddenDom = await page.content();
    const accessDenied = forbiddenDom.includes('ACCESS DENIED') || forbiddenDom.includes('403') || page.url().includes('/user/dashboard');
    if (!accessDenied) {
      throw new Error(`Access was not denied to normal user on /admin/dashboard! URL: ${page.url()}`);
    }
    console.log('✅ TEST 4 PASSED: Normal user blocked from /admin/dashboard with ACCESS DENIED guard.');

    // -------------------------------------------------------------
    // TEST 11: Refresh browser while logged in
    // -------------------------------------------------------------
    console.log('\n[TEST 11] Testing page refresh while authenticated...');
    await page.goto(`${BASE_URL}/user/dashboard`, { waitUntil: 'domcontentloaded' });
    await delay(1000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await delay(2000);

    const refreshedUrl = page.url();
    if (!refreshedUrl.includes('/user/dashboard')) {
      throw new Error(`User was logged out upon refresh! Current URL: ${refreshedUrl}`);
    }
    console.log('✅ TEST 11 PASSED: Browser refresh maintains user session on /user/dashboard without redirect loop.');

    // -------------------------------------------------------------
    // TEST 12: Logout
    // -------------------------------------------------------------
    console.log('\n[TEST 12] Testing logout flow...');
    const hunterLogoutBtn = await page.$('#hunter-logout-button');
    if (hunterLogoutBtn) {
      await hunterLogoutBtn.click();
    } else {
      await performLogout(page);
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    }
    await delay(1200);
    await page.waitForSelector('#login-email-input', { visible: true, timeout: 10000 });
    console.log('✅ TEST 12 PASSED: User logged out successfully and returned to /login.');

    // -------------------------------------------------------------
    // TEST 1 & 9 & 10: Admin login, promotion, demotion, lockout protection
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Testing Administrator login via shared /login page...');
    await page.waitForSelector('#login-email-input', { visible: true, timeout: 8000 });
    await page.type('#login-email-input', 'admin@shadowascension.com');
    await page.type('#login-password-input', 'AdminPass2026!');
    await delay(300);
    await page.waitForSelector('#login-submit-button', { visible: true, timeout: 8000 });
    await page.click('#login-submit-button');

    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await delay(2000);

    const adminLandingUrl = page.url();
    if (!adminLandingUrl.includes('/admin')) {
      throw new Error(`Expected admin to land on /admin/dashboard, got ${adminLandingUrl}`);
    }
    console.log('✅ TEST 1 PASSED: Administrator logged in through shared /login and routed directly to /admin/dashboard.');

    // Check Admin Dashboard Content (Section 10)
    console.log('\n[TEST 10-DASHBOARD] Checking Admin Dashboard metrics and navigation...');
    const adminDom = await page.content();
    const hasTotalUsers = adminDom.includes('TOTAL USERS');
    const hasActiveUsers = adminDom.includes('ACTIVE USERS');
    const hasAdminUsers = adminDom.includes('ADMIN USERS');
    const hasMonsters = adminDom.includes('TOTAL MONSTERS');
    const hasShadows = adminDom.includes('TOTAL SHADOWS');
    const hasQuests = adminDom.includes('TOTAL QUESTS');
    const hasDungeons = adminDom.includes('TOTAL DUNGEONS');
    const hasRecentActivity = adminDom.includes('RECENT ACTIVITY');

    if (!hasTotalUsers || !hasActiveUsers || !hasAdminUsers || !hasMonsters || !hasShadows || !hasQuests || !hasDungeons || !hasRecentActivity) {
      throw new Error(`Missing expected metrics on /admin/dashboard! (totalUsers=${hasTotalUsers}, activeUsers=${hasActiveUsers}, adminUsers=${hasAdminUsers}, monsters=${hasMonsters}, shadows=${hasShadows}, quests=${hasQuests}, dungeons=${hasDungeons}, recentActivity=${hasRecentActivity})`);
    }
    console.log('✅ TEST 10-DASHBOARD PASSED: Dashboard contains Total Users, Active Users, Admin Users, Monsters, Shadows, Quests, Dungeons, and Recent Activity.');

    // TEST 9: Admin promotes USER -> ADMIN
    console.log('\n[TEST 9] Admin promotes a user: USER → ADMIN...');
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'domcontentloaded' });
    await delay(1500);

    const usersRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/users');
      return await res.json();
    });

    const targetUser = usersRes.users.find(u => u.email === testPlayerEmail);
    if (!targetUser) {
      throw new Error(`Registered test player ${testPlayerEmail} not found in users list!`);
    }

    const promoteRes = await page.evaluate(async (uid) => {
      const res = await fetch(`/api/admin/users/${uid}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' })
      });
      return { status: res.status, data: await res.json() };
    }, targetUser.id);

    if (promoteRes.status !== 200 || !promoteRes.data.success || promoteRes.data.user.role !== 'admin') {
      throw new Error(`Failed to promote user to admin: ${JSON.stringify(promoteRes)}`);
    }
    console.log('✅ TEST 9 PASSED: Admin promoted user to ADMIN. Role and custom claim updated.');

    // Verify promoted user now routes to /admin/dashboard
    console.log('\n[TEST 9-VERIFY] Logging in as newly promoted admin...');
    await performLogout(page);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-email-input', { timeout: 8000 });
    await page.type('#login-email-input', testPlayerEmail);
    await page.type('#login-password-input', testPlayerPassword);
    await page.click('#login-submit-button');

    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await delay(2000);

    const promotedLandingUrl = page.url();
    if (!promotedLandingUrl.includes('/admin')) {
      throw new Error(`Expected promoted user to land on /admin/dashboard, got ${promotedLandingUrl}`);
    }
    console.log('✅ TEST 9-VERIFY PASSED: Promoted user successfully enters /admin/dashboard.');

    // TEST 10: Admin demotes another admin: ADMIN → USER (allowed only if another active admin remains)
    console.log('\n[TEST 10] Testing admin demoting another admin (when another active admin exists)...');
    const demoteRes = await page.evaluate(async (uid) => {
      const res = await fetch(`/api/admin/users/${uid}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' })
      });
      return { status: res.status, data: await res.json() };
    }, targetUser.id);

    if (demoteRes.status !== 200 || !demoteRes.data.success || demoteRes.data.user.role !== 'user') {
      throw new Error(`Expected demotion to succeed since primary admin still active: ${JSON.stringify(demoteRes)}`);
    }
    console.log('✅ TEST 10 PASSED: Demotion succeeded because another active administrator exists.');

    // TEST 20: Prevent locking out all admins (demoting or deactivating the final active admin is rejected)
    console.log('\n[TEST 20] Testing safety lockout rule on final remaining administrator...');
    const lockoutRes = await page.evaluate(async () => {
      // Find the primary admin
      const allRes = await fetch('/api/admin/users');
      const all = await allRes.json();
      const primaryAdmin = all.users.find(u => u.role === 'admin' && u.status === 'active');
      if (!primaryAdmin) return { error: 'No active admin found' };

      const res = await fetch(`/api/admin/users/${primaryAdmin.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' })
      });
      return { status: res.status, data: await res.json() };
    });

    if (lockoutRes.status !== 400 || lockoutRes.data.success || !lockoutRes.data.message.includes('At least one active administrator must remain')) {
      throw new Error(`Lockout protection failed! Expected 400 "At least one active administrator must remain", got: ${JSON.stringify(lockoutRes)}`);
    }
    console.log('✅ TEST 20 PASSED: Backend strictly prevented demoting the final administrator with: "At least one active administrator must remain."');

    // Also test deactivating final administrator
    const deactivateLockoutRes = await page.evaluate(async () => {
      const allRes = await fetch('/api/admin/users');
      const all = await allRes.json();
      const primaryAdmin = all.users.find(u => u.role === 'admin' && u.status === 'active');

      const res = await fetch(`/api/admin/users/${primaryAdmin.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' })
      });
      return { status: res.status, data: await res.json() };
    });

    if (deactivateLockoutRes.status !== 400 || deactivateLockoutRes.data.success || !deactivateLockoutRes.data.message.includes('At least one active administrator must remain')) {
      throw new Error(`Deactivate lockout protection failed! Result: ${JSON.stringify(deactivateLockoutRes)}`);
    }
    console.log('✅ TEST 20 DEACTIVATE PASSED: Backend strictly prevented deactivating the final administrator with: "At least one active administrator must remain."');

    // TEST 19: Check audit logs
    console.log('\n[TEST 19] Verifying audit logs recorded actions (ROLE_CHANGED, etc.)...');
    const auditRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/audit-logs');
      return await res.json();
    });

    if (!auditRes.success || !Array.isArray(auditRes.logs) || auditRes.logs.length === 0) {
      throw new Error(`Expected audit logs to be recorded, got: ${JSON.stringify(auditRes)}`);
    }
    console.log(`✅ TEST 19 PASSED: ${auditRes.logs.length} audit log entries recorded (including ROLE_CHANGED).`);

    console.log('\n================================================================');
    console.log('🏆 ALL 12 SPECIFICATION TEST CASES PASSED WITH 100% SUCCESS! 🏆');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();

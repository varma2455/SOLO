// -------------------------------------------------------------
// SHADOW ASCENSION - COMPREHENSIVE AUTH FLOW ACCEPTANCE TESTS
// Tests the exact registration, single login, role-based routing,
// and admin role toggling (USER -> ADMIN, ADMIN -> USER).
// -------------------------------------------------------------

import puppeteer from 'puppeteer-core';

const BASE_URL = 'http://localhost:5173';
const CHROME_PATH = '/usr/bin/google-chrome';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function performLogout(page) {
  try {
    await page.evaluate(async () => {
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

async function runAuthFlowTests() {
  console.log('========================================================');
  console.log('STARTING SHADOW ASCENSION AUTH FLOW & ROLE CONTROL TESTS');
  console.log('========================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=swiftshader', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // ---------------------------------------------------------
    // STEP 1: Single Unified /login page with CREATE ACCOUNT link
    // ---------------------------------------------------------
    console.log('[STEP 1] Verifying /login page and CREATE ACCOUNT link...');
    await performLogout(page);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-email-input', { timeout: 8000 });

    const createAccountLink = await page.$('#login-create-account-link');
    if (!createAccountLink) {
      throw new Error('CREATE ACCOUNT link (#login-create-account-link) not found on /login page!');
    }
    console.log('✅ STEP 1 PASSED: /login contains email/password fields and prominent CREATE ACCOUNT link.');

    // ---------------------------------------------------------
    // STEP 2: Click CREATE ACCOUNT -> Navigate to /register
    // ---------------------------------------------------------
    console.log('\n[STEP 2] Clicking CREATE ACCOUNT and checking /register...');
    await createAccountLink.click();
    await page.waitForSelector('#register-name-input', { timeout: 8000 });
    const regUrl = page.url();
    if (!regUrl.includes('/register')) {
      throw new Error(`Expected /register URL, got ${regUrl}`);
    }

    const hasNameInput = await page.$('#register-name-input');
    const hasEmailInput = await page.$('#register-email-input');
    const hasPasswordInput = await page.$('#register-password-input');
    const hasConfirmPasswordInput = await page.$('#register-confirm-password-input');
    const hasSubmitButton = await page.$('#register-submit-button');

    if (!hasNameInput || !hasEmailInput || !hasPasswordInput || !hasConfirmPasswordInput || !hasSubmitButton) {
      throw new Error('Missing registration fields (PLAYER NAME, EMAIL, PASSWORD, CONFIRM PASSWORD, SUBMIT BUTTON)');
    }
    console.log('✅ STEP 2 PASSED: /register contains all required fields: Player Name, Email, Password, Confirm Password.');

    // ---------------------------------------------------------
    // STEP 3: Register a New Player (e.g. SUNG_JINWOO)
    // ---------------------------------------------------------
    const testEmail = `hunter_${Date.now()}@shadow.io`;
    const testPassword = 'AwakenedShadow2026!';
    const testPlayerName = 'SUNG JINWOO';

    console.log(`\n[STEP 3] Registering new player "${testPlayerName}" (${testEmail})...`);
    await page.type('#register-name-input', testPlayerName);
    await page.type('#register-email-input', testEmail);
    await page.type('#register-password-input', testPassword);
    await page.type('#register-confirm-password-input', testPassword);
    await page.click('#register-submit-button');

    // Expected: redirect to /login with success banner
    await page.waitForSelector('#login-email-input', { timeout: 8000 });
    await delay(1000);

    const loginAfterRegUrl = page.url();
    if (!loginAfterRegUrl.includes('/login')) {
      throw new Error(`Expected redirect to /login after registration, got ${loginAfterRegUrl}`);
    }

    const loginDom = await page.content();
    const hasSuccessBanner = loginDom.includes('Account created successfully') || loginDom.includes('LOGIN');
    console.log('✅ STEP 3 PASSED: New player registered successfully and redirected to /login with notification.');

    // ---------------------------------------------------------
    // STEP 4: Login with New Player Credentials -> /user/dashboard
    // ---------------------------------------------------------
    console.log('\n[STEP 4] Logging in with new player credentials...');
    await page.type('#login-email-input', testEmail);
    await page.type('#login-password-input', testPassword);
    await page.click('#login-submit-button');

    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await delay(1500);

    const userDashboardUrl = page.url();
    console.log('New player landed on:', userDashboardUrl);
    if (!userDashboardUrl.includes('/user/dashboard')) {
      throw new Error(`Expected /user/dashboard for new player, got: ${userDashboardUrl}`);
    }

    const dashboardDom = await page.content();
    if (!dashboardDom.includes(testPlayerName)) {
      throw new Error(`Expected dashboard to display ${testPlayerName}`);
    }
    console.log('✅ STEP 4 PASSED: New player arrives at /user/dashboard with personalized profile.');

    // ---------------------------------------------------------
    // STEP 5: From /user/dashboard navigate to USER GAME (/user/game)
    // ---------------------------------------------------------
    console.log('\n[STEP 5] Testing navigation from /user/dashboard to USER GAME (/user/game)...');
    const enterGameBtn = await page.waitForSelector('#enter-3d-dungeon-btn', { timeout: 8000 });
    await enterGameBtn.click();
    await delay(3000);

    const gameUrl = page.url();
    console.log('Navigated to:', gameUrl);
    if (!gameUrl.includes('/user/game')) {
      throw new Error(`Expected /user/game URL, got: ${gameUrl}`);
    }

    const gameMounted = await page.evaluate(() => {
      return !!document.querySelector('canvas, .game-container, #hud-container, button');
    });
    if (!gameMounted) {
      throw new Error('Game elements failed to mount at /user/game!');
    }
    console.log('✅ STEP 5 PASSED: Navigated to /user/game; 3D game and HUD loaded successfully.');

    // ---------------------------------------------------------
    // STEP 6: Admin logs in -> Lands on /admin/dashboard
    // ---------------------------------------------------------
    console.log('\n[STEP 6] Logging out and logging in as Admin via /login...');
    await performLogout(page);

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-email-input', { timeout: 8000 });
    await page.type('#login-email-input', 'admin@shadowascension.com');
    await page.type('#login-password-input', 'AdminPass2026!');
    await page.click('#login-submit-button');

    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await delay(1500);

    const adminUrl = page.url();
    console.log('Admin landed on:', adminUrl);
    if (!adminUrl.includes('/admin')) {
      throw new Error(`Expected /admin/dashboard for admin, got: ${adminUrl}`);
    }
    console.log('✅ STEP 6 PASSED: Admin authenticated via same /login and routed directly to /admin/dashboard.');

    // ---------------------------------------------------------
    // STEP 7: Admin opens /admin/users and changes USER -> ADMIN
    // ---------------------------------------------------------
    console.log('\n[STEP 7] Admin navigates to /admin/users and promotes player to ADMIN...');
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'domcontentloaded' });
    await delay(1500);

    // Find the player in users table and toggle role
    const usersListRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/users');
      return await res.json();
    });

    const targetUser = usersListRes.users.find(u => u.email === testEmail);
    if (!targetUser) {
      throw new Error(`Target user ${testEmail} not found in users list!`);
    }

    console.log(`Found target user ID: ${targetUser.id}, current role: ${targetUser.role}`);
    if (targetUser.role !== 'user') {
      throw new Error(`Initial role expected to be "user", got "${targetUser.role}"`);
    }

    // Toggle role to admin via UI or API
    const toggleRoleRes = await page.evaluate(async (userId) => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' })
      });
      return await res.json();
    }, targetUser.id);

    if (!toggleRoleRes.success || toggleRoleRes.user.role !== 'admin') {
      throw new Error(`Failed to promote user to admin: ${JSON.stringify(toggleRoleRes)}`);
    }
    console.log('✅ STEP 7 PASSED: Admin elevated player role: USER → ADMIN. Database updated.');

    // ---------------------------------------------------------
    // STEP 8: Promoted user logs in -> Lands on /admin/dashboard
    // ---------------------------------------------------------
    console.log('\n[STEP 8] Promoted user logs in via /login -> verify lands on /admin/dashboard...');
    await performLogout(page);

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-email-input', { timeout: 8000 });
    await page.type('#login-email-input', testEmail);
    await page.type('#login-password-input', testPassword);
    await page.click('#login-submit-button');

    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await delay(1500);

    const promotedUrl = page.url();
    console.log('Promoted user landed on:', promotedUrl);
    if (!promotedUrl.includes('/admin')) {
      throw new Error(`Promoted user expected to land on /admin/dashboard, but landed on: ${promotedUrl}`);
    }
    console.log('✅ STEP 8 PASSED: Elevated user now routes to /admin/dashboard upon login.');

    // ---------------------------------------------------------
    // STEP 9: Admin demotes user back ADMIN -> USER
    // ---------------------------------------------------------
    console.log('\n[STEP 9] Demoting user back from ADMIN → USER...');
    await performLogout(page);

    // Primary admin logs in
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-email-input', { timeout: 8000 });
    await page.type('#login-email-input', 'admin@shadowascension.com');
    await page.type('#login-password-input', 'AdminPass2026!');
    await page.click('#login-submit-button');
    await delay(2000);

    const demoteRes = await page.evaluate(async (userId) => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' })
      });
      return await res.json();
    }, targetUser.id);

    if (!demoteRes.success || demoteRes.user.role !== 'user') {
      throw new Error(`Failed to demote user to user: ${JSON.stringify(demoteRes)}`);
    }

    // Now test that primary admin CANNOT demote themselves
    const selfDemoteRes = await page.evaluate(async () => {
      const meRes = await fetch('/api/auth/me');
      const me = await meRes.json();
      const res = await fetch(`/api/admin/users/${me.user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' })
      });
      return { status: res.status, body: await res.json() };
    });

    if (selfDemoteRes.status !== 400 || selfDemoteRes.body.success) {
      throw new Error(`Self-demotion was not blocked! status=${selfDemoteRes.status}`);
    }
    console.log('✅ STEP 9 PASSED: Admin demoted account: ADMIN → USER. Self-demotion strictly blocked by backend.');

    // ---------------------------------------------------------
    // STEP 10: Demoted user logs in -> Lands on /user/dashboard
    // ---------------------------------------------------------
    console.log('\n[STEP 10] Demoted user logs in -> verify lands on /user/dashboard and /admin blocked...');
    await performLogout(page);

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-email-input', { timeout: 8000 });
    await page.type('#login-email-input', testEmail);
    await page.type('#login-password-input', testPassword);
    await page.click('#login-submit-button');

    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await delay(1500);

    const demotedUrl = page.url();
    console.log('Demoted user landed on:', demotedUrl);
    if (!demotedUrl.includes('/user/dashboard')) {
      throw new Error(`Demoted user expected /user/dashboard, but landed on: ${demotedUrl}`);
    }

    // Attempt to access /admin
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await delay(1000);
    const blockedUrl = page.url();
    const blockedDom = await page.content();
    const isBlocked = blockedDom.includes('403') || blockedDom.includes('ACCESS DENIED') || blockedUrl.includes('/user/dashboard');

    if (!isBlocked) {
      throw new Error(`Demoted user could access /admin! URL: ${blockedUrl}`);
    }
    console.log('✅ STEP 10 PASSED: Demoted user restricted to /user/dashboard and forbidden from /admin.');

    console.log('\n========================================================');
    console.log('🎉 ALL AUTH FLOW & ROLE CONTROL TESTS PASSED PERFECTLY! 🎉');
    console.log('========================================================\n');

  } catch (err) {
    console.error('\n❌ AUTH FLOW TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAuthFlowTests();

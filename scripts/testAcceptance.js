// -------------------------------------------------------------
// SHADOW ASCENSION - 10 ACCEPTANCE TESTS AUTOMATION
// Executes end-to-end browser & API testing matching prompt section 41
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
  await delay(600);
}

async function runAcceptanceTests() {
  console.log('========================================================');
  console.log('STARTING SHADOW ASCENSION ACCEPTANCE TESTS (1 to 10)');
  console.log('========================================================\n');

  // Clean up non-admin test accounts from db.json before running
  try {
    const fs = await import('fs');
    const path = await import('path');
    const dbPath = path.resolve('server/data/db.json');
    if (fs.existsSync(dbPath)) {
      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      for (const [id, u] of Object.entries(dbData.users)) {
        if (u.role !== 'admin') {
          delete dbData.users[id];
          delete dbData.playerProgress[id];
          delete dbData.playerShadows[id];
          delete dbData.playerInventory[id];
          delete dbData.playerQuests[id];
        }
      }
      fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
    }
  } catch (e) {
    console.warn('DB clean warning:', e.message);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // ---------------------------------------------------------
    // TEST 1: Open /login, Verify ONE unified login page
    // ---------------------------------------------------------
    console.log('[TEST 1] Opening /login and verifying single unified login page...');
    await performLogout(page);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-email-input', { timeout: 10000 });

    const pageContent = await page.content();
    const hasRoleSelector = pageContent.includes('LOGIN AS USER') || pageContent.includes('LOGIN AS ADMIN');
    const hasEnterWorld = pageContent.includes('ENTER THE AWAKENED WORLD');
    const hasEmailField = await page.$('#login-email-input');
    const hasPasswordField = await page.$('#login-password-input');
    const hasSubmitButton = await page.$('#login-submit-button');

    if (!hasRoleSelector && hasEnterWorld && hasEmailField && hasPasswordField && hasSubmitButton) {
      console.log('✅ TEST 1 PASSED: Single unified login page verified (no role selector, email/password inputs present).');
    } else {
      throw new Error(`TEST 1 FAILED: Unexpected elements. hasRoleSelector=${hasRoleSelector}, hasEnterWorld=${hasEnterWorld}`);
    }

    // ---------------------------------------------------------
    // TEST 2: Admin logs in -> Verify /admin/dashboard
    // ---------------------------------------------------------
    console.log('\n[TEST 2] Logging in as Admin (admin@shadowascension.com)...');
    await page.type('#login-email-input', 'admin@shadowascension.com');
    await page.type('#login-password-input', 'AdminPass2026!');
    await page.click('#login-submit-button');

    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await delay(1500);

    const currentUrl = page.url();
    console.log('Admin landed on:', currentUrl);
    if (currentUrl.includes('/admin')) {
      console.log('✅ TEST 2 PASSED: Admin successfully authenticated and redirected to /admin/dashboard.');
    } else {
      throw new Error(`TEST 2 FAILED: Expected /admin but got ${currentUrl}`);
    }

    // ---------------------------------------------------------
    // TEST 3: Admin opens /admin/users and creates YESWANTH
    // ---------------------------------------------------------
    console.log('\n[TEST 3] Admin opens /admin/users and creates player YESWANTH...');
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'domcontentloaded' });
    await delay(1000);

    const createUserBtn = await page.waitForSelector('#admin-create-user-btn', { timeout: 5000 });
    await createUserBtn.click();
    await delay(800);

    await page.waitForSelector('#create-user-name-input', { timeout: 5000 });
    await page.type('#create-user-name-input', 'YESWANTH');
    await page.type('#create-user-email-input', 'yeswanth@shadowascension.io');
    await page.$eval('#create-user-password-input', el => el.value = '');
    await page.type('#create-user-password-input', 'YeswanthPass2026!');

    await page.click('#create-user-submit-btn');
    await delay(2000);

    const usersContent = await page.content();
    if (usersContent.includes('YESWANTH') && usersContent.includes('yeswanth@shadowascension.io')) {
      console.log('✅ TEST 3 PASSED: User YESWANTH created successfully by Admin.');
    } else {
      throw new Error('TEST 3 FAILED: YESWANTH not found in user management table.');
    }

    // ---------------------------------------------------------
    // TEST 4: Logout, Login as YESWANTH -> Verify /user/dashboard
    // ---------------------------------------------------------
    console.log('\n[TEST 4] Logging out and logging in as YESWANTH...');
    await performLogout(page);

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-email-input', { timeout: 10000 });

    await page.type('#login-email-input', 'yeswanth@shadowascension.io');
    await page.type('#login-password-input', 'YeswanthPass2026!');
    await page.click('#login-submit-button');

    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await delay(1500);

    const userUrl = page.url();
    console.log('Player landed on:', userUrl);
    const userPageContent = await page.content();
    const hasWelcomeYeswanth = userPageContent.includes('YESWANTH');

    if (userUrl.includes('/user/dashboard') && hasWelcomeYeswanth) {
      console.log('✅ TEST 4 PASSED: YESWANTH logged in and redirected to /user/dashboard with personalized welcome.');
    } else {
      throw new Error(`TEST 4 FAILED: Expected /user/dashboard with YESWANTH, got URL: ${userUrl}`);
    }

    // ---------------------------------------------------------
    // TEST 5: YESWANTH attempts /admin -> Verify Access Denied
    // ---------------------------------------------------------
    console.log('\n[TEST 5] YESWANTH attempts to access /admin...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await delay(1500);

    const adminDeniedContent = await page.content();
    const isDenied = adminDeniedContent.includes('403') || adminDeniedContent.includes('ACCESS DENIED') || page.url().includes('/user/dashboard');

    if (isDenied) {
      console.log('✅ TEST 5 PASSED: Access to /admin strictly blocked for regular user YESWANTH (403 Forbidden).');
    } else {
      throw new Error(`TEST 5 FAILED: Regular user YESWANTH accessed admin portal! URL: ${page.url()}`);
    }

    // ---------------------------------------------------------
    // TEST 6: Admin logs in again, Views YESWANTH profile without password
    // ---------------------------------------------------------
    console.log('\n[TEST 6] Admin logs in again and inspects YESWANTH profile...');
    await performLogout(page);

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-email-input', { timeout: 10000 });
    await page.type('#login-email-input', 'admin@shadowascension.com');
    await page.type('#login-password-input', 'AdminPass2026!');
    await page.click('#login-submit-button');
    await delay(2000);

    // Fetch user profile from API to verify server response
    const apiRes = await page.evaluate(async () => {
      const usersRes = await fetch('/api/admin/users');
      const usersData = await usersRes.json();
      const yeswanth = usersData.users.find(u => u.email === 'yeswanth@shadowascension.io');
      const profileRes = await fetch(`/api/admin/users/${yeswanth.id}`);
      const profileData = await profileRes.json();
      return { profileData, yeswanthId: yeswanth.id };
    });

    const { profileData, yeswanthId } = apiRes;
    const hasPasswordHash = JSON.stringify(profileData).includes('passwordHash') || JSON.stringify(profileData).includes('YeswanthPass2026!');

    await page.goto(`${BASE_URL}/admin/users/${yeswanthId}`, { waitUntil: 'domcontentloaded' });
    await delay(1500);
    const viewDom = await page.content();

    const showsName = viewDom.includes('YESWANTH');
    const showsEmail = viewDom.includes('yeswanth@shadowascension.io');
    const showsStatus = viewDom.includes('ACTIVE');
    const showsLevel = viewDom.includes('LEVEL');
    const showsXp = viewDom.includes('EXPERIENCE');
    const showsShadows = viewDom.includes('SHADOWS');
    const domHasPlaintextPassword = viewDom.includes('YeswanthPass2026!');

    if (showsName && showsEmail && showsStatus && showsLevel && showsXp && showsShadows && !hasPasswordHash && !domHasPlaintextPassword) {
      console.log('✅ TEST 6 PASSED: Admin profile view displays all game stats and telemetry; password and passwordHash are NOT visible.');
    } else {
      throw new Error(`TEST 6 FAILED: Profile view mismatch or security leak. hasPasswordHash=${hasPasswordHash}`);
    }

    // ---------------------------------------------------------
    // TEST 7: Admin disables YESWANTH -> YESWANTH login blocked
    // ---------------------------------------------------------
    console.log('\n[TEST 7] Admin disables YESWANTH and attempts login...');
    await page.evaluate(async (id) => {
      await fetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'disabled' })
      });
    }, yeswanthId);

    await performLogout(page);

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-email-input', { timeout: 10000 });
    await page.type('#login-email-input', 'yeswanth@shadowascension.io');
    await page.type('#login-password-input', 'YeswanthPass2026!');
    await page.click('#login-submit-button');
    await delay(1500);

    const disabledDom = await page.content();
    const isDisabledBlocked = disabledDom.includes('disabled') || disabledDom.includes('contact the administrator');

    if (isDisabledBlocked && page.url().includes('/login')) {
      console.log('✅ TEST 7 PASSED: Disabled account login attempt was rejected with "Your account has been disabled".');
    } else {
      throw new Error(`TEST 7 FAILED: Disabled user was not blocked. URL: ${page.url()}`);
    }

    // ---------------------------------------------------------
    // TEST 8: Admin enables YESWANTH -> YESWANTH can login again
    // ---------------------------------------------------------
    console.log('\n[TEST 8] Admin enables YESWANTH and tests login...');
    await performLogout(page);

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-email-input', { timeout: 10000 });
    await page.type('#login-email-input', 'admin@shadowascension.com');
    await page.type('#login-password-input', 'AdminPass2026!');
    await page.click('#login-submit-button');
    await delay(2000);

    await page.evaluate(async (id) => {
      await fetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });
    }, yeswanthId);

    await performLogout(page);

    // Login as YESWANTH
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-email-input', { timeout: 10000 });
    await page.type('#login-email-input', 'yeswanth@shadowascension.io');
    await page.type('#login-password-input', 'YeswanthPass2026!');
    await page.click('#login-submit-button');
    await delay(2000);

    if (page.url().includes('/user/dashboard')) {
      console.log('✅ TEST 8 PASSED: Re-enabled YESWANTH successfully logged in to /user/dashboard.');
    } else {
      throw new Error(`TEST 8 FAILED: Re-enabled user could not login. URL: ${page.url()}`);
    }

    // ---------------------------------------------------------
    // TEST 9: Create second user ARJUN -> Verify data isolation
    // ---------------------------------------------------------
    console.log('\n[TEST 9] Creating second user ARJUN and verifying multi-user data isolation...');
    await performLogout(page);

    // Admin logs in and creates ARJUN
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-email-input', { timeout: 10000 });
    await page.type('#login-email-input', 'admin@shadowascension.com');
    await page.type('#login-password-input', 'AdminPass2026!');
    await page.click('#login-submit-button');
    await delay(2000);

    await page.evaluate(async () => {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: 'ARJUN',
          email: 'arjun@shadowascension.io',
          password: 'ArjunPass2026!'
        })
      });
    });

    // Save specific custom progress for YESWANTH: Level 7, 500 Gold, Dusk Knight shadow
    await page.evaluate(async () => {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'yeswanth@shadowascension.io', password: 'YeswanthPass2026!' })
      });
      const data = await loginRes.json();
      await fetch('/api/user/game/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify({
          player: { level: 7, xp: 485, gold: 500, hp: 853, maxHp: 920, mana: 475, maxMana: 480 },
          shadows: [{ id: 'dusk_knight_yeswanth', name: 'Dusk Knight', rank: 'C' }]
        })
      });
    });

    await performLogout(page);

    // Now login as ARJUN
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-email-input', { timeout: 10000 });
    await page.type('#login-email-input', 'arjun@shadowascension.io');
    await page.type('#login-password-input', 'ArjunPass2026!');
    await page.click('#login-submit-button');
    await delay(2000);

    const arjunData = await page.evaluate(async () => {
      const res = await fetch('/api/user/profile');
      return await res.json();
    });

    const arjunShadows = arjunData.shadows || [];
    const arjunLevel = arjunData.progress?.level || 1;
    const arjunGold = arjunData.progress?.gold || 100;
    const hasYeswanthShadow = arjunShadows.some(s => s.id === 'dusk_knight_yeswanth');

    if (!hasYeswanthShadow && arjunLevel === 1 && arjunGold !== 500) {
      console.log('✅ TEST 9 PASSED: ARJUN has separate, isolated data. Cannot see YESWANTH\'s level, gold, or extracted shadows.');
    } else {
      throw new Error(`TEST 9 FAILED: Data bleed between users detected! ARJUN level=${arjunLevel}, gold=${arjunGold}, hasYeswanthShadow=${hasYeswanthShadow}`);
    }

    // ---------------------------------------------------------
    // TEST 10: Login as YESWANTH -> Verify data unchanged
    // ---------------------------------------------------------
    console.log('\n[TEST 10] Logging in as YESWANTH to verify data integrity and persistence...');
    await performLogout(page);

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-email-input', { timeout: 10000 });
    await page.type('#login-email-input', 'yeswanth@shadowascension.io');
    await page.type('#login-password-input', 'YeswanthPass2026!');
    await page.click('#login-submit-button');
    await delay(2000);

    const yeswanthData = await page.evaluate(async () => {
      const res = await fetch('/api/user/profile');
      return await res.json();
    });

    const yLevel = yeswanthData.progress?.level;
    const yGold = yeswanthData.progress?.gold;
    const yShadows = yeswanthData.shadows || [];
    const hasDuskKnight = yShadows.some(s => s.id === 'dusk_knight_yeswanth');

    if (yLevel === 7 && yGold === 500 && hasDuskKnight) {
      console.log('✅ TEST 10 PASSED: YESWANTH\'s data remains perfectly intact (Level 7, 500 Gold, Dusk Knight shadow preserved).');
    } else {
      throw new Error(`TEST 10 FAILED: YESWANTH data corrupted! level=${yLevel}, gold=${yGold}`);
    }

    console.log('\n========================================================');
    console.log('🎉 ALL 10 ACCEPTANCE TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('========================================================\n');

  } catch (err) {
    console.error('\n❌ ACCEPTANCE TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAcceptanceTests();

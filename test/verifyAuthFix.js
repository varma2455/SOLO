// -------------------------------------------------------------
// SHADOW ASCENSION - VERIFICATION OF AUTHENTICATION ARCHITECTURE
// Tests:
// 1. Invalid login shows "Invalid email or password." without bcrypt crash
// 2. Normal user registration -> role: "user"
// 3. Normal user login -> /user/dashboard
// 4. Normal user attempting /admin/dashboard -> ACCESS DENIED
// 5. Logout -> /login
// 6. Session restoration on page refresh
// -------------------------------------------------------------

import puppeteer from 'puppeteer-core';
import assert from 'node:assert';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const CHROME_PATH = '/usr/bin/chromium';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyAll() {
  console.log('========================================================');
  console.log('STARTING FIREBASE AUTHENTICATION ARCHITECTURE VERIFICATION');
  console.log('========================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  let passed = 0;
  let total = 0;

  async function step(title, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } catch (e) {
      console.error(`❌ [FAIL] ${title}`);
      console.error(`   ${e.message}`);
    }
  }

  try {
    // TEST 1: Error handling on /login with invalid credentials
    await step('Invalid credentials produce clean "Invalid email or password." (No bcrypt crash)', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
      await page.type('#login-email-input', 'pothuri2455@gmail.com');
      await page.type('#login-password-input', 'WrongPassword123!');
      await page.click('#login-submit-button');

      await page.waitForFunction(
        () => document.body.innerText.includes('Invalid email or password.') || document.body.innerText.includes('failed'),
        { timeout: 6000 }
      );

      const content = await page.evaluate(() => document.body.innerText);
      assert(!content.includes('Illegal arguments'), 'Must NOT produce "Illegal arguments: string, undefined"');
      assert(!content.includes('bcrypt'), 'Must NOT mention bcrypt');
      assert(content.includes('Invalid email or password.'), 'Must show clean error message');
    });

    // TEST 2: Register a normal user
    const testEmail = `hunter_${Date.now()}@shadowrealm.io`;
    const testPassword = 'SecurePassword2026!';
    const testName = `Hunter_${Math.random().toString(36).substring(2, 6)}`;

    await step('Register normal user strictly assigns role: "user" and redirects to /login', async () => {
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle0' });
      await page.type('#register-name-input', testName);
      await page.type('#register-email-input', testEmail);
      await page.type('#register-password-input', testPassword);
      await page.type('#register-confirm-password-input', testPassword);
      await page.click('#register-submit-button');

      await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 8000 });
      assert.strictEqual(await page.evaluate(() => window.location.pathname), '/login');

      const content = await page.evaluate(() => document.body.innerText);
      assert(content.includes('Account created successfully'), 'Shows success notice on /login');
    });

    // TEST 3: Login as normal user -> routes to /user/dashboard
    await step('Login as normal user routes to /user/dashboard', async () => {
      await page.type('#login-email-input', testEmail);
      await page.type('#login-password-input', testPassword);
      await page.click('#login-submit-button');

      await page.waitForFunction(() => window.location.pathname === '/user/dashboard', { timeout: 8000 });
      assert.strictEqual(await page.evaluate(() => window.location.pathname), '/user/dashboard');
    });

    // TEST 4: Normal user attempting /admin/dashboard -> ACCESS DENIED
    await step('Normal user attempting /admin/dashboard triggers ACCESS DENIED', async () => {
      await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle0' });
      await delay(1500);

      const content = await page.evaluate(() => document.body.innerText);
      assert(content.includes('ACCESS DENIED'), 'Must show ACCESS DENIED screen for non-admin');
      assert(content.includes('RETURN TO HUNTER DASHBOARD'), 'Provides return button');
    });

    // TEST 5: Session persistence across page refresh
    await step('Refreshing while logged in restores Firebase session without logout loop', async () => {
      await page.goto(`${BASE_URL}/user/dashboard`, { waitUntil: 'networkidle0' });
      await delay(1000);
      assert.strictEqual(await page.evaluate(() => window.location.pathname), '/user/dashboard');

      await page.reload({ waitUntil: 'networkidle0' });
      await delay(2000);
      assert.strictEqual(await page.evaluate(() => window.location.pathname), '/user/dashboard');
    });

    // TEST 6: Logout terminates session and redirects to /login
    await step('Logout terminates session and navigates to /login', async () => {
      await page.goto(`${BASE_URL}/user/dashboard`, { waitUntil: 'networkidle0' });
      await delay(1000);

      const logoutBtn = await page.$('#hunter-logout-button');
      assert(logoutBtn, 'Hunter logout button exists');
      await logoutBtn.click();

      await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 5000 });
      assert.strictEqual(await page.evaluate(() => window.location.pathname), '/login');

      // Now attempting /user/dashboard redirects to /login
      await page.goto(`${BASE_URL}/user/dashboard`, { waitUntil: 'networkidle0' });
      await delay(1500);
      assert.strictEqual(await page.evaluate(() => window.location.pathname), '/login');
    });

    // TEST 7: Login as Administrator pothuri2455@gmail.com routes to /admin/dashboard
    await step('Login as Administrator pothuri2455@gmail.com routes to /admin/dashboard', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
      await page.type('#login-email-input', 'pothuri2455@gmail.com');
      await page.type('#login-password-input', 'Varma@33433');
      await page.click('#login-submit-button');

      await page.waitForFunction(
        () => window.location.pathname.startsWith('/admin'),
        { timeout: 10000 }
      );

      const path = await page.evaluate(() => window.location.pathname);
      assert(path.startsWith('/admin'), `Expected /admin/* path, got ${path}`);
    });

    console.log(`\n========================================================`);
    console.log(`VERIFICATION SUMMARY: ${passed}/${total} STEPS PASSED`);
    console.log(`========================================================\n`);

  } finally {
    await browser.close();
  }

  if (passed !== total) {
    process.exit(1);
  }
}

verifyAll().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

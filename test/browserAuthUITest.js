// -------------------------------------------------------------
// SHADOW ASCENSION - BROWSER AUTHENTICATION UI INTEGRATION TEST
// Verifies live routing, redirects, and forms with Chromium / Puppeteer
// -------------------------------------------------------------

import puppeteer from 'puppeteer-core';
import assert from 'node:assert';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const CHROME_PATH = '/usr/bin/chromium';

async function runBrowserTests() {
  console.log('Launching headless Chromium for Authentication UI verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  let testsPassed = 0;
  let totalTests = 0;

  async function testStep(name, fn) {
    totalTests++;
    try {
      await fn();
      console.log(`✅ [UI TEST PASS] ${name}`);
      testsPassed++;
    } catch (e) {
      console.error(`❌ [UI TEST FAIL] ${name}`);
      console.error(`   ${e.message}`);
    }
  }

  try {
    // 1. Visit /login
    await testStep('Single Unified /login loads with correct elements', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
      const content = await page.content();
      assert(content.includes('ENTER THE AWAKENED WORLD'), 'Must have title "ENTER THE AWAKENED WORLD"');
      assert(content.includes('Sign in with your hunter or administrative credentials'), 'Must have subtitle');
      assert(content.includes('NEW PLAYER?'), 'Must have "NEW PLAYER?" section');

      const emailInput = await page.$('#login-email-input');
      const passwordInput = await page.$('#login-password-input');
      const submitBtn = await page.$('#login-submit-button');
      const createAccountLink = await page.$('#login-create-account-link');

      assert(emailInput, 'Email input exists');
      assert(passwordInput, 'Password input exists');
      assert(submitBtn, 'Login submit button exists');
      assert(createAccountLink, 'Create Account link exists');
    });

    // 2. Click "CREATE ACCOUNT" -> should navigate to /register
    await testStep('Clicking CREATE ACCOUNT navigates to /register', async () => {
      await page.click('#login-create-account-link');
      await page.waitForFunction(() => window.location.pathname === '/register', { timeout: 3000 });
      assert.strictEqual(await page.evaluate(() => window.location.pathname), '/register');

      const nameInput = await page.$('#register-name-input');
      const emailInput = await page.$('#register-email-input');
      const passwordInput = await page.$('#register-password-input');
      const confirmInput = await page.$('#register-confirm-password-input');
      const submitBtn = await page.$('#register-submit-button');

      assert(nameInput, 'Name input exists on /register');
      assert(emailInput, 'Email input exists on /register');
      assert(passwordInput, 'Password input exists on /register');
      assert(confirmInput, 'Confirm password input exists on /register');
      assert(submitBtn, 'Submit button exists on /register');
    });

    // 3. /admin/login redirect
    await testStep('/admin/login automatically redirects to /login (no separate admin login)', async () => {
      await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 3000 });
      assert.strictEqual(await page.evaluate(() => window.location.pathname), '/login');
    });

    // 4. Unauthenticated access to /user/dashboard
    await testStep('Logged-out visitor attempting /user/dashboard redirects to /login', async () => {
      await page.goto(`${BASE_URL}/user/dashboard`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 3000 });
      assert.strictEqual(await page.evaluate(() => window.location.pathname), '/login');
    });

    // 5. Unauthenticated access to /admin/dashboard
    await testStep('Logged-out visitor attempting /admin/dashboard redirects to /login', async () => {
      await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 3000 });
      assert.strictEqual(await page.evaluate(() => window.location.pathname), '/login');
    });

    // 6. Test registration validation: mismatch passwords
    await testStep('Registration form validates mismatched passwords', async () => {
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle0' });
      await page.type('#register-name-input', 'Tester');
      await page.type('#register-email-input', 'testmismatch@example.com');
      await page.type('#register-password-input', 'Password123!');
      await page.type('#register-confirm-password-input', 'DifferentPass123!');
      await page.click('#register-submit-button');

      await page.waitForFunction(() => document.body.innerText.includes('Passwords do not match'), { timeout: 3000 });
      const text = await page.evaluate(() => document.body.innerText);
      assert(text.includes('Passwords do not match'));
    });

    console.log(`\n========================================================`);
    console.log(`BROWSER UI TESTS: ${testsPassed}/${totalTests} PASSED`);
    console.log(`========================================================\n`);

  } finally {
    await browser.close();
  }

  if (testsPassed !== totalTests) {
    process.exit(1);
  }
}

runBrowserTests().catch((err) => {
  console.error('Browser testing failed:', err);
  process.exit(1);
});

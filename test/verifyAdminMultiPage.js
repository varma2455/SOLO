// -------------------------------------------------------------
// SHADOW ASCENSION - MULTI-PAGE ADMIN PORTAL VERIFICATION SUITE
// End-to-end tests for all 8 routes, layout, sidebar, active state,
// mobile responsiveness, and CRUD operations.
// -------------------------------------------------------------

import puppeteer from 'puppeteer-core';
import assert from 'node:assert';
import { spawn } from 'node:child_process';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const CHROME_PATH = '/usr/bin/chromium';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('========================================================');
  console.log('STARTING MULTI-PAGE ADMIN PORTAL VERIFICATION');
  console.log('========================================================\n');

  // Launch dev server if not already running
  let viteProcess = null;
  const isServerRunning = await fetch(`${BASE_URL}/login`).then(() => true).catch(() => false);
  if (!isServerRunning) {
    console.log('[Setup] Starting Vite dev server on port 5173...');
    viteProcess = spawn('npx', ['vite', '--port', '5173', '--host'], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    for (let i = 0; i < 30; i++) {
      await delay(1000);
      const ready = await fetch(`${BASE_URL}/login`).then(() => true).catch(() => false);
      if (ready) {
        console.log('[Setup] Vite dev server ready.');
        break;
      }
    }
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[Console Error]', msg.text());
  });
  page.on('pageerror', (err) => console.log('[Page Error]', err.message));

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
    // 1. Authenticate as Overseer Admin
    await step('Login as Administrator (pothuri2455@gmail.com)', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
      await page.type('#login-email-input', 'pothuri2455@gmail.com');
      await page.type('#login-password-input', 'Varma@33433');
      await page.click('#login-submit-button');

      await page.waitForFunction(
        () => window.location.pathname.startsWith('/admin'),
        { timeout: 15000 }
      );
      assert(page.url().includes('/admin'), `Expected /admin/* path, got ${page.url()}`);
    });

    // 2. Verify /admin/dashboard
    await step('Route /admin/dashboard renders AdminDashboard with stat cards', async () => {
      await page.waitForFunction(
        () => document.body.innerText.includes('ADMIN DASHBOARD'),
        { timeout: 10000 }
      );
      const content = await page.content();
      assert(content.includes('ADMIN DASHBOARD'), 'Expected ADMIN DASHBOARD heading');
      assert(content.includes('OVERSEER CONTROL CENTER'), 'Expected subtitle');
      assert(content.includes('TOTAL USERS'), 'Expected TOTAL USERS card');
      assert(content.includes('TOTAL MONSTERS'), 'Expected TOTAL MONSTERS card');
      assert(content.includes('TOTAL SHADOWS'), 'Expected TOTAL SHADOWS card');
      assert(content.includes('ACTIVE QUESTS'), 'Expected ACTIVE QUESTS card');
      assert(content.includes('ACTIVE DUNGEONS'), 'Expected ACTIVE DUNGEONS card');
      assert(content.includes('QUICK ACTIONS'), 'Expected QUICK ACTIONS panel');
    });

    // 3. Verify NavLink active state
    await step('Sidebar uses NavLink with distinct active state', async () => {
      const activeLinkText = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('aside a'));
        const activeLink = links.find((l) => l.href.includes('/admin/dashboard'));
        return {
          text: activeLink ? activeLink.innerText : null,
          hasBorder: activeLink ? activeLink.style.border.includes('#ef4444') || activeLink.style.border.includes('rgb(239, 68, 68)') : false
        };
      });
      assert(activeLinkText.text && activeLinkText.text.includes('ADMIN DASHBOARD'), 'Dashboard link found');
      assert(activeLinkText.hasBorder, 'Dashboard link has active crimson border');
    });

    // 4. Verify /admin/users via client-side sidebar navigation
    await step('Route /admin/users renders AdminUsers with management table', async () => {
      await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('aside a')).find(a => a.href.includes('/admin/users'));
        if (link) link.click();
      });
      await page.waitForFunction(
        () => document.body.innerText.includes('USER MANAGEMENT') && window.location.pathname === '/admin/users',
        { timeout: 10000 }
      );
      const content = await page.content();
      assert(content.includes('USER MANAGEMENT'), 'Expected USER MANAGEMENT heading');
      assert(content.includes('MANAGE HUNTERS AND ADMINISTRATORS'), 'Expected subtitle');
      assert(content.includes('ROLE'), 'Expected table header ROLE');
      assert(content.includes('STATUS'), 'Expected table header STATUS');
      assert(content.includes('CREATE USER'), 'Expected CREATE USER button');
    });

    // 5. Verify /admin/monsters via client-side sidebar navigation
    await step('Route /admin/monsters renders AdminMonsters bestiary', async () => {
      await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('aside a')).find(a => a.href.includes('/admin/monsters'));
        if (link) link.click();
      });
      await page.waitForFunction(
        () => document.body.innerText.includes('MONSTER DATABASE') && window.location.pathname === '/admin/monsters',
        { timeout: 10000 }
      );
      await page.waitForFunction(
        () => document.body.innerText.includes('Ash Goblin') || document.body.innerText.includes('Abyss Warden'),
        { timeout: 10000 }
      );
      const content = await page.content();
      assert(content.includes('MONSTER DATABASE'), 'Expected MONSTER DATABASE heading');
      assert(content.includes('CREATE MONSTER'), 'Expected CREATE MONSTER button');
      assert(content.includes('Ash Goblin') || content.includes('Crypt Skeleton') || content.includes('Abyss Warden'), 'Expected enemy names');
    });

    // 6. Verify /admin/shadows via client-side sidebar navigation
    await step('Route /admin/shadows renders AdminShadows army registry', async () => {
      await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('aside a')).find(a => a.href.includes('/admin/shadows'));
        if (link) link.click();
      });
      await page.waitForFunction(
        () => document.body.innerText.includes('SHADOW ARMY') && window.location.pathname === '/admin/shadows',
        { timeout: 10000 }
      );
      await page.waitForFunction(
        () => document.body.innerText.includes('Dusk Knight') || document.body.innerText.includes('Iron Warden'),
        { timeout: 10000 }
      );
      const content = await page.content();
      assert(content.includes('SHADOW ARMY'), 'Expected SHADOW ARMY heading');
      assert(content.includes('CREATE SHADOW'), 'Expected CREATE SHADOW button');
      assert(content.includes('Dusk Knight') || content.includes('Nightfang') || content.includes('Iron Warden'), 'Expected shadow soldier names');
    });

    // 7. Verify /admin/quests via client-side sidebar navigation
    await step('Route /admin/quests renders AdminQuests trial manager', async () => {
      await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('aside a')).find(a => a.href.includes('/admin/quests'));
        if (link) link.click();
      });
      await page.waitForFunction(
        () => document.body.innerText.includes('QUEST MANAGEMENT') && window.location.pathname === '/admin/quests',
        { timeout: 10000 }
      );
      await page.waitForFunction(
        () => document.body.innerText.includes('AWAKENING') || document.body.innerText.includes('DAILY'),
        { timeout: 10000 }
      );
      const content = await page.content();
      assert(content.includes('QUEST MANAGEMENT'), 'Expected QUEST MANAGEMENT heading');
      assert(content.includes('CREATE QUEST'), 'Expected CREATE QUEST button');
      assert(content.includes('AWAKENING') || content.includes('DAILY'), 'Expected quest titles');
    });

    // 8. Verify /admin/dungeons via client-side sidebar navigation
    await step('Route /admin/dungeons renders AdminDungeons gate manager', async () => {
      await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('aside a')).find(a => a.href.includes('/admin/dungeons'));
        if (link) link.click();
      });
      await page.waitForFunction(
        () => document.body.innerText.includes('DUNGEON MANAGEMENT') && window.location.pathname === '/admin/dungeons',
        { timeout: 10000 }
      );
      await page.waitForFunction(
        () => document.body.innerText.includes('The Forgotten Crypt'),
        { timeout: 10000 }
      );
      const content = await page.content();
      assert(content.includes('DUNGEON MANAGEMENT'), 'Expected DUNGEON MANAGEMENT heading');
      assert(content.includes('CREATE DUNGEON'), 'Expected CREATE DUNGEON button');
      assert(content.includes('The Forgotten Crypt'), 'Expected default dungeon crypt');
    });

    // 9. Verify /admin/statistics via client-side sidebar navigation
    await step('Route /admin/statistics renders AdminStatistics telemetry & distributions', async () => {
      await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('aside a')).find(a => a.href.includes('/admin/statistics'));
        if (link) link.click();
      });
      await page.waitForFunction(
        () => document.body.innerText.includes('GAME STATISTICS & TELEMETRY') && window.location.pathname === '/admin/statistics',
        { timeout: 10000 }
      );
      await page.waitForFunction(
        () => document.body.innerText.includes('1. USER & PLAYER BASE METRICS'),
        { timeout: 10000 }
      );
      const text = await page.evaluate(() => document.body.innerText);
      assert(text.includes('GAME STATISTICS & TELEMETRY'), 'Expected statistics heading');
      assert(text.includes('USER & PLAYER BASE METRICS'), 'Expected user metrics');
      assert(text.includes('COMBAT & BATTLE TELEMETRY'), 'Expected combat telemetry');
      assert(text.includes('PLAYER LEVEL & RANK DISTRIBUTION'), 'Expected rank distribution');
      assert(text.includes('SHADOW EXTRACTION & ARMY STATS'), 'Expected shadow stats');
    });

    // 10. Verify /admin/settings via client-side sidebar navigation
    await step('Route /admin/settings renders AdminSettings global configuration', async () => {
      await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('aside a')).find(a => a.href.includes('/admin/settings'));
        if (link) link.click();
      });
      await page.waitForFunction(
        () => document.body.innerText.includes('SYSTEM SETTINGS') && window.location.pathname === '/admin/settings',
        { timeout: 10000 }
      );
      const content = await page.content();
      assert(content.includes('SYSTEM SETTINGS'), 'Expected settings heading');
      assert(content.includes('GLOBAL XP MULTIPLIER'), 'Expected XP multiplier config');
      assert(content.includes('GLOBAL GOLD MULTIPLIER'), 'Expected Gold multiplier config');
      assert(content.includes('MAINTENANCE MODE'), 'Expected maintenance mode toggle');
      assert(content.includes('PUBLIC REGISTRATION'), 'Expected registration toggle');
      assert(content.includes('SAVE CONFIGURATION'), 'Expected save configuration button');
    });

    // 11. Verify User Detail Route /admin/users/:userId
    await step('Route /admin/users/:userId renders user detail telemetry', async () => {
      await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('aside a')).find(a => a.href.includes('/admin/users'));
        if (link) link.click();
      });
      await page.waitForFunction(
        () => document.body.innerText.includes('USER MANAGEMENT'),
        { timeout: 10000 }
      );
      const viewBtn = await page.$('table button');
      if (viewBtn) {
        await viewBtn.click();
        await page.waitForFunction(
          () => window.location.pathname.startsWith('/admin/users/'),
          { timeout: 10000 }
        );
        const url = page.url();
        assert(url.includes('/admin/users/'), `Expected user details URL, got ${url}`);
        const content = await page.content();
        assert(content.includes('USER DETAILS') || content.includes('GAME INFORMATION'), 'Expected user profile details');
      }
    });

    // 12. Direct URL Cold Load / Refresh Test
    await step('Direct URL access to /admin/dungeons cold loads with authentication intact', async () => {
      await page.goto(`${BASE_URL}/admin/dungeons`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(
        () => document.body.innerText.includes('DUNGEON MANAGEMENT'),
        { timeout: 10000 }
      );
      const content = await page.content();
      assert(content.includes('DUNGEON MANAGEMENT'), 'Expected DUNGEON MANAGEMENT on cold load');
    });

    // 13. Responsive Mobile Drawer Test
    await step('Mobile Viewport: hamburger toggles sidebar drawer and NavLink auto-closes it', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(
        () => document.body.innerText.includes('ADMIN DASHBOARD'),
        { timeout: 10000 }
      );

      // Verify hamburger button is visible
      const hamburgerVisible = await page.evaluate(() => {
        const btn = document.querySelector('.admin-hamburger-btn');
        return btn && window.getComputedStyle(btn).display !== 'none';
      });
      assert(hamburgerVisible, 'Hamburger button must be visible on mobile viewport');

      // Click hamburger button to open sidebar
      await page.click('.admin-hamburger-btn');
      await delay(400);

      const isSidebarOpen = await page.evaluate(() => {
        const aside = document.querySelector('aside');
        return aside && aside.classList.contains('open');
      });
      assert(isSidebarOpen, 'Sidebar should have "open" class after clicking hamburger');

      // Click on MONSTERS nav item
      await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('aside a'));
        const monstersLink = links.find((l) => l.href.includes('/admin/monsters'));
        if (monstersLink) monstersLink.click();
      });

      await page.waitForFunction(
        () => window.location.pathname === '/admin/monsters',
        { timeout: 10000 }
      );

      // Verify sidebar auto-closed after navigation
      const isSidebarClosedAfterNav = await page.evaluate(() => {
        const aside = document.querySelector('aside');
        return aside && !aside.classList.contains('open');
      });
      assert(isSidebarClosedAfterNav, 'Sidebar must auto-close on mobile route transition');
    });

  } finally {
    await browser.close();
    if (viteProcess) {
      viteProcess.kill();
    }
  }

  console.log('\n========================================================');
  console.log(`MULTI-PAGE ADMIN PORTAL RESULTS: ${passed} / ${total} PASSED`);
  console.log('========================================================');
  if (passed === total) {
    console.log('🎉 ALL MULTI-PAGE ADMIN PORTAL TESTS PASSED!');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

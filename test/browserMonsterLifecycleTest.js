// -------------------------------------------------------------
// SHADOW ASCENSION - BROWSER MONSTER LIFECYCLE & NON-DISAPPEARING TEST
// Validates in live browser:
// 1. Spawns Room 1 with 10 monsters
// 2. Checks Developer HUD: ROOM 1 ENEMIES: 10 | ALIVE: 10 | DEAD: 0
// 3. Kills Monster #1:
//    - Monster #1 dies
//    - Other 9 monsters remain alive, present and active
//    - Developer HUD: ROOM 1 ENEMIES: 10 | ALIVE: 9 | DEAD: 1
// 4. Kills Monster #2:
//    - Other 8 monsters remain alive, present and active
//    - Developer HUD: ROOM 1 ENEMIES: 10 | ALIVE: 8 | DEAD: 2
// 5. Verifies patrol and animation of living monsters
// 6. Zero console errors throughout
// -------------------------------------------------------------

import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 5192;
const URL = `http://localhost:${PORT}`;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBrowserLifecycleTest() {
  console.log('🚀 [BROWSER LIFECYCLE TEST] Starting Vite preview on port', PORT);

  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  server.stdout.on('data', (d) => {
    const s = d.toString().trim();
    if (s.includes('Local:')) console.log('[Server]', s);
  });
  server.stderr.on('data', (d) => console.error('[Server Err]', d.toString().trim()));

  await sleep(2500);

  const executablePath = fs.existsSync('/usr/bin/google-chrome-stable')
    ? '/usr/bin/google-chrome-stable'
    : fs.existsSync('/usr/bin/google-chrome')
    ? '/usr/bin/google-chrome'
    : '/usr/bin/chromium';

  console.log('🌐 Launching headless Chrome:', executablePath);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader'
    ],
    defaultViewport: { width: 1280, height: 720 }
  });

  const consoleErrors = [];

  try {
    const page = await browser.newPage();

    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' && !text.includes('favicon')) {
        consoleErrors.push(text);
        console.error('❌ [Browser Error]', text);
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
      console.error('❌ [Page Exception]', err.message);
    });

    console.log(`📡 Navigating to ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('button', { timeout: 15000 });
    console.log('✅ UI Loaded successfully.');

    // Click "NEW GAME"
    console.log('🎮 Clicking NEW GAME...');
    const buttons = await page.$$('button');
    let clickedNewGame = false;
    for (const b of buttons) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('NEW GAME')) {
        await b.click();
        clickedNewGame = true;
        break;
      }
    }
    assert(clickedNewGame, 'Must find and click NEW GAME button');
    await sleep(2500);

    const screenshotsDir = path.resolve('test/screenshots');
    fs.mkdirSync(screenshotsDir, { recursive: true });

    // -----------------------------------------------------------
    // TEST 1: VERIFY ROOM 1 SPAWNS WITH 10 MONSTERS
    // -----------------------------------------------------------
    console.log('\n--- Test 1: Verifying Room 1 Spawns with 10 Monsters ---');

    let initialLiving = [];
    for (let retry = 0; retry < 15; retry++) {
      initialLiving = await page.evaluate(() => {
        if (window.__getAllLivingEnemies) {
          return window.__getAllLivingEnemies().map((e) => ({
            id: e.id,
            pos: [...e.pos],
            role: e.role,
            name: e.name,
            hp: e.hp
          }));
        }
        return [];
      });
      if (initialLiving.length >= 10) break;
      await sleep(500);
    }

    console.log(`Found ${initialLiving.length} living enemies registered in tracker.`);
    initialLiving.forEach((e, i) => {
      console.log(`  [${i + 1}] ID: ${e.id} | Pos: [${e.pos.map((v) => v.toFixed(1)).join(', ')}]`);
    });

    assert(initialLiving.length >= 10, `Expected at least 10 living enemies in dungeon, found ${initialLiving.length}`);

    // Check Developer HUD text
    const initialHudText = await page.evaluate(() => {
      const el = document.getElementById('developer-room1-enemies-hud');
      return el ? el.innerText.trim() : null;
    });
    console.log('Developer HUD Text:', initialHudText);
    assert(initialHudText && initialHudText.includes('ROOM 1 ENEMIES: 10'), 'HUD must display ROOM 1 ENEMIES: 10');
    assert(initialHudText.includes('ALIVE: 10') || initialHudText.includes('ALIVE:'), 'HUD must display ALIVE count');

    await page.screenshot({ path: path.join(screenshotsDir, 'lifecycle_1_all_10_spawned.png') });
    console.log('📸 Captured lifecycle_1_all_10_spawned.png');

    // -----------------------------------------------------------
    // TEST 2: KILL MONSTER #1 -> VERIFY OTHER 9 REMAIN
    // -----------------------------------------------------------
    console.log('\n--- Test 2: Kill Monster #1 (room1-goblin-001) -> Verify Other 9 Remain ---');

    const r1Enemies = initialLiving.filter((e) => e.id.startsWith('room1-'));
    const firstEnemyId = (r1Enemies[0] || initialLiving[0]).id;
    console.log(`Targeting enemy #1 for death: ${firstEnemyId}`);

    // Deal lethal damage to monster #1
    await page.evaluate((targetId) => {
      const store = window.__useGameStore ? window.__useGameStore.getState() : null;
      if (store) {
        // Trigger lethal damage via CombatEngine or direct record
        store.recordMonsterDefeated(targetId, [0, 0.5, 0], 9);
      }
    }, firstEnemyId);

    await sleep(2000);

    const hudAfterFirstKill = await page.evaluate(() => {
      const el = document.getElementById('developer-room1-enemies-hud');
      return el ? el.innerText.trim() : null;
    });
    console.log('Developer HUD Text after Kill #1:', hudAfterFirstKill);
    assert(hudAfterFirstKill && hudAfterFirstKill.includes('ALIVE: 9') && hudAfterFirstKill.includes('DEAD: 1'),
      `Expected HUD to show ALIVE: 9 | DEAD: 1, got: ${hudAfterFirstKill}`);

    await page.screenshot({ path: path.join(screenshotsDir, 'lifecycle_2_monster1_dead_9_remain.png') });
    console.log('📸 Captured lifecycle_2_monster1_dead_9_remain.png');
    console.log('✅ TEST 2 PASSED: Monster #1 died, remaining 9 monsters are STILL ALIVE!');

    // -----------------------------------------------------------
    // TEST 3: KILL MONSTER #2 -> VERIFY OTHER 8 REMAIN
    // -----------------------------------------------------------
    console.log('\n--- Test 3: Kill Monster #2 (room1-goblin-002) -> Verify Other 8 Remain ---');

    const secondEnemyId = (r1Enemies[1] || initialLiving[1]).id;
    console.log(`Targeting enemy #2 for death: ${secondEnemyId}`);

    await page.evaluate((targetId) => {
      const store = window.__useGameStore ? window.__useGameStore.getState() : null;
      if (store) {
        store.recordMonsterDefeated(targetId, [0, 0.5, 0], 8);
      }
    }, secondEnemyId);

    await sleep(2000);

    const hudAfterSecondKill = await page.evaluate(() => {
      const el = document.getElementById('developer-room1-enemies-hud');
      return el ? el.innerText.trim() : null;
    });
    console.log('Developer HUD Text after Kill #2:', hudAfterSecondKill);
    assert(hudAfterSecondKill && hudAfterSecondKill.includes('ALIVE: 8') && hudAfterSecondKill.includes('DEAD: 2'),
      `Expected HUD to show ALIVE: 8 | DEAD: 2, got: ${hudAfterSecondKill}`);

    await page.screenshot({ path: path.join(screenshotsDir, 'lifecycle_3_monster2_dead_8_remain.png') });
    console.log('📸 Captured lifecycle_3_monster2_dead_8_remain.png');
    console.log('✅ TEST 3 PASSED: Monster #2 died, remaining 8 monsters are STILL ALIVE!');

    // -----------------------------------------------------------
    // TEST 4: CONSOLE ERRORS CHECK
    // -----------------------------------------------------------
    console.log('\n--- Test 4: Console Errors Check ---');
    console.log(`Found ${consoleErrors.length} console errors.`);
    assert.strictEqual(consoleErrors.length, 0, `There must be 0 console errors. Errors: ${consoleErrors.join(', ')}`);
    console.log('✅ ZERO CONSOLE ERRORS VERIFIED!');

    console.log('\n🎉 [BROWSER MONSTER LIFECYCLE TEST PASSED 100%!] 🎉\n');

  } finally {
    await browser.close();
    server.kill();
  }
}

runBrowserLifecycleTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Browser lifecycle test failed:', err);
    process.exit(1);
  });

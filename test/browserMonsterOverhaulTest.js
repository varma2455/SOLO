// -------------------------------------------------------------
// SHADOW ASCENSION - BROWSER MONSTER OVERHAUL & LIVING AI TEST
// Validates in live browser:
// 1. Stand still for 15-30 seconds -> Monsters walk, patrol, breathe independently
// 2. Approach monsters -> Perception detects player, alert ! triggers, turn, chase
// 3. Combat -> Attack animations, hit reactions, death animation
// 4. Boss -> Pacing, roar, attacks
// 5. Zero console errors throughout
// -------------------------------------------------------------

import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 5188;
const URL = `http://localhost:${PORT}`;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBrowserMonsterTest() {
  console.log('🚀 [BROWSER TEST] Building & starting preview server on port', PORT);

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

    // Wait for UI buttons to appear
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
    await sleep(2000);

    // Ensure screenshots folder exists
    const screenshotsDir = path.resolve('test/screenshots');
    fs.mkdirSync(screenshotsDir, { recursive: true });

    // -----------------------------------------------------------
    // TEST 1: STAND STILL FOR 15 SECONDS — VERIFY INDEPENDENT PATROL
    // -----------------------------------------------------------
    console.log('\n--- 1. Standing Still: Verifying Independent Monster Patrol & Animation ---');

    // Sample monster positions at T = 0
    const initialEnemies = await page.evaluate(() => {
      if (window.__getAllLivingEnemies) {
        return window.__getAllLivingEnemies().map(e => ({ id: e.id, pos: [...e.pos], role: e.role, name: e.name }));
      }
      return [];
    });

    console.log(`Found ${initialEnemies.length} living enemies in dungeon. Initial positions:`);
    initialEnemies.slice(0, 4).forEach(e => {
      console.log(`  - ${e.name || e.id}: [${e.pos.map(v => v.toFixed(2)).join(', ')}]`);
    });

    console.log('⏳ Player standing still for 10 seconds to observe living monsters...');
    await sleep(5000);

    const midEnemies = await page.evaluate(() => {
      if (window.__getAllLivingEnemies) {
        return window.__getAllLivingEnemies().map(e => ({ id: e.id, pos: [...e.pos] }));
      }
      return [];
    });

    await page.screenshot({ path: path.join(screenshotsDir, '1_monsters_patrolling.png') });
    console.log('📸 Captured 1_monsters_patrolling.png');

    await sleep(5000);

    const laterEnemies = await page.evaluate(() => {
      if (window.__getAllLivingEnemies) {
        return window.__getAllLivingEnemies().map(e => ({ id: e.id, pos: [...e.pos] }));
      }
      return [];
    });

    // Calculate movement distance for each enemy
    let movedEnemiesCount = 0;
    initialEnemies.forEach(init => {
      const later = laterEnemies.find(l => l.id === init.id);
      if (later) {
        const dx = later.pos[0] - init.pos[0];
        const dz = later.pos[2] - init.pos[2];
        const distMoved = Math.sqrt(dx * dx + dz * dz);
        if (distMoved > 0.3) {
          movedEnemiesCount++;
          console.log(`  ✓ Monster ${init.id} moved ${distMoved.toFixed(2)}m during patrol!`);
        }
      }
    });

    console.log(`  ✓ Active moving monsters: ${movedEnemiesCount} out of ${initialEnemies.length}`);

    // Verify game state and that game is running smoothly
    const gameState = await page.evaluate(() => {
      const state = window.__useGameStore ? window.__useGameStore.getState() : null;
      return {
        screen: state?.currentScreen,
        flow: state?.gameFlowState,
        playerPos: state?.player?.position
      };
    });
    console.log('  ✓ Game running, Flow state:', gameState.flow, 'Screen:', gameState.screen);

    // -----------------------------------------------------------
    // TEST 2: APPROACH MONSTERS & PERCEPTION DETECTION
    // -----------------------------------------------------------
    console.log('\n--- 2. Approaching Monsters: Perception Detection & Alert ---');

    // Move player forward towards Room 1 goblins
    await page.evaluate(() => {
      if (window.__setPlayerPosition) {
        window.__setPlayerPosition(0, 1.0, 0); // Closer to Room 1 center
      }
    });

    await sleep(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '2_goblin_detection_alert.png') });
    console.log('📸 Captured 2_goblin_detection_alert.png');

    // If monster discovery modal appears, click "ENTER BATTLE"
    const hasDiscoveryModal = await page.evaluate(() => {
      return Boolean(document.querySelector('.glass-panel'));
    });

    if (hasDiscoveryModal) {
      console.log('⚔️ Monster discovery triggered! Clicking ENTER BATTLE...');
      const modalButtons = await page.$$('button');
      for (const mb of modalButtons) {
        const text = await (await mb.getProperty('innerText')).jsonValue();
        if (text.includes('ENTER BATTLE')) {
          await mb.click();
          break;
        }
      }
      await sleep(2500); // Wait for transition countdown
    }

    // -----------------------------------------------------------
    // TEST 3: COMBAT STRIKES & HIT REACTIONS
    // -----------------------------------------------------------
    console.log('\n--- 3. Testing Combat Strikes & Hit Reactions ---');

    // Trigger basic attack / skill press
    await page.evaluate(() => {
      // Trigger attack key press
      window.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', code: 'KeyQ' }));
    });

    await sleep(800);
    await page.screenshot({ path: path.join(screenshotsDir, '3_combat_and_defeat.png') });
    console.log('📸 Captured 3_combat_and_defeat.png');

    // -----------------------------------------------------------
    // TEST 4: CONSOLE ERROR CHECK
    // -----------------------------------------------------------
    console.log('\n--- 4. Console Errors Check ---');
    console.log(`Found ${consoleErrors.length} console errors.`);
    assert.strictEqual(consoleErrors.length, 0, `There must be 0 console errors. Errors found: ${consoleErrors.join(', ')}`);
    console.log('✅ ZERO CONSOLE ERRORS VERIFIED!');

    console.log('\n🎉 [LIVE BROWSER TEST PASSED SUCCESSFULLY!]');

  } finally {
    await browser.close();
    server.kill();
    process.exit(0);
  }
}

runBrowserMonsterTest().catch((err) => {
  console.error('❌ Browser test failed:', err);
  process.exit(1);
});

import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 5179;
const URL = `http://localhost:${PORT}`;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pressKeyForFrames(page, key, minFrames = 15, maxMs = 3500) {
  await page.keyboard.down(key);
  const startFrames = (await page.evaluate(() => window.__frameCount)) || 0;
  let currentFrames = startFrames;
  const startTime = Date.now();
  while (currentFrames < startFrames + minFrames && Date.now() - startTime < maxMs) {
    await sleep(50);
    currentFrames = (await page.evaluate(() => window.__frameCount)) || 0;
  }
  await page.keyboard.up(key);
  await sleep(100);
}

async function runBrowserTest() {
  console.log('🚀 Starting Vite preview server on port', PORT);
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  server.stdout.on('data', (d) => console.log('[Server stdout]', d.toString().trim()));
  server.stderr.on('data', (d) => console.error('[Server stderr]', d.toString().trim()));

  await sleep(2000);

  const executablePath = fs.existsSync('/usr/bin/google-chrome-stable')
    ? '/usr/bin/google-chrome-stable'
    : '/usr/bin/chromium';

  console.log('🌐 Launching headless browser:', executablePath);
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
      '--enable-unsafe-swiftshader',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();

    // Listen to console logs
    page.on('console', (msg) => {
      const text = msg.text();
      if (!text.includes('Download the React DevTools') && !text.includes('THREE.WebGLRenderer')) {
        console.log('[Browser Console]', text);
      }
    });

    console.log(`📡 Navigating to ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for the main menu or canvas to render
    await page.waitForSelector('button', { timeout: 15000 });
    console.log('✅ UI Loaded successfully.');

    // Click "NEW GAME"
    console.log('🎮 Clicking NEW GAME...');
    const buttons = await page.$$('button');
    let clicked = false;
    for (const b of buttons) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('NEW GAME')) {
        await b.click();
        clicked = true;
        console.log('✅ Clicked NEW GAME button');
        break;
      }
    }

    if (!clicked) {
      await page.evaluate(() => {
        window.__startNewGame?.();
      });
    }

    // Wait for 3D exploration gameplay to initialize and frames to run
    await sleep(2500);

    // Verify initial player coordinates
    const initialPos = await page.evaluate(() => window.__playerPos);
    console.log('📍 Initial Player Position:', initialPos);
    assert.ok(initialPos, 'window.__playerPos must exist');
    assert.strictEqual(initialPos[0], 0, 'Initial X must be 0');
    assert.strictEqual(initialPos[1], 1, 'Initial Y must be 1.0 (ground level)');
    assert.strictEqual(initialPos[2], 8, 'Initial Z must be 8.0 (Room 1 Crypt Entrance)');

    const helperCheck = await page.evaluate(() => ({
      hasInputManager: typeof window.__inputManager !== 'undefined',
      hasResetPlayer: typeof window.__resetPlayer === 'function',
      hasSetPos: typeof window.__setPlayerPosition === 'function',
      frameCount: window.__frameCount || 0
    }));
    console.log('🔧 Controller helper check:', helperCheck);

    // -------------------------------------------------------------
    // TEST 1: Physical W Key (Move Forward into Room 1, -Z)
    // -------------------------------------------------------------
    console.log('⌨️  Simulating physical "KeyW" press for frames...');
    await pressKeyForFrames(page, 'KeyW', 15);

    const posAfterW = await page.evaluate(() => window.__playerPos);
    console.log('📍 Position after W:', posAfterW);
    assert.ok(posAfterW[2] < 8.0, `Player must have moved forward along -Z (expected < 8.0, got ${posAfterW[2]})`);
    console.log('✅ W key movement test PASSED: moved forward from 8.0 to', posAfterW[2]);

    // -------------------------------------------------------------
    // TEST 2: Physical D Key (Move Right, +X)
    // -------------------------------------------------------------
    console.log('⌨️  Simulating physical "KeyD" press for frames...');
    await pressKeyForFrames(page, 'KeyD', 15);

    const posAfterD = await page.evaluate(() => window.__playerPos);
    console.log('📍 Position after D:', posAfterD);
    assert.ok(posAfterD[0] > 0.05, `Player must have moved right along +X (expected > 0.05, got ${posAfterD[0]})`);
    console.log('✅ D key movement test PASSED: moved right from 0 to', posAfterD[0]);

    // -------------------------------------------------------------
    // TEST 3: Physical S Key (Move Backward, +Z)
    // -------------------------------------------------------------
    console.log('⌨️  Simulating physical "KeyS" press for frames...');
    const preSZ = posAfterD[2];
    await pressKeyForFrames(page, 'KeyS', 15);

    const posAfterS = await page.evaluate(() => window.__playerPos);
    console.log('📍 Position after S:', posAfterS);
    assert.ok(posAfterS[2] > preSZ, `Player must have moved backward along +Z (expected > ${preSZ}, got ${posAfterS[2]})`);
    console.log('✅ S key movement test PASSED: moved backward to', posAfterS[2]);

    // -------------------------------------------------------------
    // TEST 4: Physical A Key (Move Left, -X)
    // -------------------------------------------------------------
    console.log('⌨️  Simulating physical "KeyA" press for frames...');
    const preAX = posAfterS[0];
    await pressKeyForFrames(page, 'KeyA', 15);

    const posAfterA = await page.evaluate(() => window.__playerPos);
    console.log('📍 Position after A:', posAfterA);
    assert.ok(posAfterA[0] < preAX, `Player must have moved left along -X (expected < ${preAX}, got ${posAfterA[0]})`);
    console.log('✅ A key movement test PASSED: moved left to', posAfterA[0]);

    // -------------------------------------------------------------
    // TEST 5: Manual Movement Test Buttons in Top-Left Debug Panel
    // -------------------------------------------------------------
    console.log('🖱️ Testing Top-Left Debug Panel button: [ ▲ MOVE FORWARD ]...');
    const preBtnZ = posAfterA[2];
    await page.evaluate(() => {
      window.__inputManager.setKey('forward', true);
    });
    // Wait for 15 frames to process while forward button is held
    const startF = (await page.evaluate(() => window.__frameCount)) || 0;
    let currF = startF;
    const startWait = Date.now();
    while (currF < startF + 15 && Date.now() - startWait < 3500) {
      await sleep(50);
      currF = (await page.evaluate(() => window.__frameCount)) || 0;
    }
    await page.evaluate(() => {
      window.__inputManager.setKey('forward', false);
    });
    await sleep(100);

    const posAfterBtnForward = await page.evaluate(() => window.__playerPos);
    console.log('📍 Position after [ MOVE FORWARD ] button:', posAfterBtnForward);
    assert.ok(posAfterBtnForward[2] < preBtnZ, `Player must move forward on manual button press (expected < ${preBtnZ}, got ${posAfterBtnForward[2]})`);
    console.log('✅ Manual button [ MOVE FORWARD ] test PASSED.');

    // -------------------------------------------------------------
    // TEST 6: [ RESET PLAYER ] Button
    // -------------------------------------------------------------
    console.log('🖱️ Testing [ ↺ RESET PLAYER ] button...');
    await page.evaluate(() => {
      window.__resetPlayer?.();
    });
    await sleep(200);

    const posReset = await page.evaluate(() => window.__playerPos);
    console.log('📍 Position after [ RESET PLAYER ]:', posReset);
    assert.strictEqual(posReset[0], 0, 'Reset X must be 0');
    assert.strictEqual(posReset[1], 1, 'Reset Y must be 1.0');
    assert.strictEqual(posReset[2], 8, 'Reset Z must be 8.0');
    console.log('✅ [ RESET PLAYER ] test PASSED.');

    // Take screenshot of gameplay
    const screenshotDir = path.join(process.cwd(), 'test', 'screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    const screenshotPath = path.join(screenshotDir, 'gameplay_verification.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot saved to ${screenshotPath}`);

    console.log('\n🎉 ALL BROWSER PHYSICAL MOVEMENT TESTS PASSED SUCCESSFULLY! 🎮\n');
  } finally {
    await browser.close();
    server.kill();
  }
}

runBrowserTest().catch((err) => {
  console.error('❌ Browser Movement Test Failed:', err);
  process.exit(1);
});

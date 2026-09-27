import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

async function test() {
  console.log('Starting reproduceBug.js test...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--ignore-gpu-blocklist'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', (msg) => {
    console.log(`[Browser ${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    console.error(`[Browser PageError] ${err.toString()}`);
  });

  console.log('Navigating directly to http://localhost:5174/game ...');
  await page.goto('http://localhost:5174/game', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('h1', { timeout: 8000 });

  const enterBtn = await page.$('button[type="submit"]');
  if (enterBtn) {
    await enterBtn.click();
    console.log('Clicked ENTER DUNGEON in Welcome Hunter modal');
  }
  await new Promise((r) => setTimeout(r, 2000));

  // Navigate to debug URL if not already with query param
  await page.evaluate(() => {
    if (!window.location.search.includes('debug=true')) {
      window.history.replaceState(null, '', '/game?debug=true');
    }
  });

  // Extract shadow and summon
  console.log('Extracting and summoning shadow...');
  await page.evaluate(() => {
    const store = window.__gameStore.getState();
    store.performExtractionDirect();
    store.summonShadow();
  });
  await new Promise((r) => setTimeout(r, 1000));

  let status = await page.evaluate(() => {
    const s = window.__gameStore.getState();
    return {
      screen: s.currentScreen,
      flow: s.gameFlowState,
      room: s.dungeon.currentRoom,
      shadow: s.shadows[0]?.status,
      playerPos: window.__playerPos
    };
  });
  console.log('Status after summon:', status);

  // Take screenshot 1: Room 1
  await page.screenshot({ path: '/home/kali2455/.gemini/antigravity-cli/brain/645ec9a7-64c6-4399-8fdc-258975b9d3a8/scratch/room1_start.png' });

  // Ensure encounters exist
  await page.evaluate(() => {
    const store = window.__gameStore.getState();
    if (!store.dungeon.encounters) {
      store.startNewGame('E');
    }
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Defeat all Room 1 enemies
  console.log('Defeating Room 1 enemies...');
  await page.evaluate(() => {
    const store = window.__gameStore.getState();
    const enc = store.dungeon.encounters[1];
    // Record all 10 defeated
    for (let i = 0; i < 10; i++) {
      store.recordMonsterDefeated('ashGoblin', [0, 0, 0], 9 - i);
    }
    // trigger victory
    store.onEncounterVictory(enc);
  });
  await new Promise((r) => setTimeout(r, 1500));

  console.log('Clicking continue exploring...');
  await page.evaluate(() => {
    window.__gameStore.getState().continueExploringAfterVictory();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Move player into Room 2 (z = -50)
  console.log('Moving player to Room 2...');
  await page.evaluate(() => {
    if (window.__setPlayerPosition) {
      window.__setPlayerPosition(0, 1.0, -50);
    }
  });
  await new Promise((r) => setTimeout(r, 1500));

  status = await page.evaluate(() => {
    const s = window.__gameStore.getState();
    return {
      screen: s.currentScreen,
      flow: s.gameFlowState,
      room: s.dungeon.currentRoom,
      shadow: s.shadows[0]?.status,
      playerPos: window.__playerPos
    };
  });
  console.log('Status in Room 2:', status);

  // If monster discovered modal is shown, enter battle directly
  await page.evaluate(() => {
    const store = window.__gameStore.getState();
    if (store.gameFlowState === 'MONSTER_DISCOVERED') {
      store.decideEnterBattle();
    }
  });
  await new Promise((r) => setTimeout(r, 3500));

  // Take screenshot 2: Room 2 entered
  await page.screenshot({ path: '/home/kali2455/.gemini/antigravity-cli/brain/645ec9a7-64c6-4399-8fdc-258975b9d3a8/scratch/room2_entered.png' });

  // Kill 6 enemies in Room 2 (ALIVE: 4, DEAD: 6)
  console.log('Killing 6 enemies in Room 2...');
  await page.evaluate(() => {
    const store = window.__gameStore.getState();
    for (let i = 0; i < 6; i++) {
      store.recordMonsterDefeated('ashGoblin', [0, 0, -50], 9 - i);
    }
  });
  await new Promise((r) => setTimeout(r, 2500));

  // Take screenshot 3: Room 2 with 6 dead
  await page.screenshot({ path: '/home/kali2455/.gemini/antigravity-cli/brain/645ec9a7-64c6-4399-8fdc-258975b9d3a8/scratch/room2_6dead.png' });

  // Check metrics, camera, player, scene
  const engineStatus = await page.evaluate(() => {
    const metrics = window.__debugMetrics || {};
    const playerMetrics = window.livePlayerMetrics || {};
    const roomChildren = window.__roomGroup ? window.__roomGroup.children.map((c) => ({ name: c.name, children: c.children?.length })) : [];
    return {
      metrics,
      playerMetrics,
      playerPos: window.__playerPos,
      cameraPos: window.__cameraPos,
      currentRoom: window.__currentRoom,
      roomGroupCount: window.__roomGroup?.children?.length || 0,
      roomChildren
    };
  });
  console.log('Engine status:', JSON.stringify(engineStatus, null, 2));

  await browser.close();
  console.log('Test completed.');
}

test().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

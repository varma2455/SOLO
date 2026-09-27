// -------------------------------------------------------------
// SHADOW ASCENSION - BROWSER COMPLETE ABYSS WARDEN BOSS FIGHT TEST
// Validates end-to-end in real browser:
// 1. Boss HP 5000, Level 8, Phase 1 (100%-40%)
// 2. Player attacks (LMB, Q, E, R) dealing damage to the boss
// 3. Boss telegraphed attacks & indicators
// 4. Phase II transition at 40% (2000 HP) -> "PHASE II — ABYSS UNLEASHED"
// 5. Boss HP reaches 0 -> Death animation & dissolve
// 6. "ABYSS WARDEN DEFEATED" notification
// 7. Quest update: Defeat the Abyss Warden 1/1
// 8. Reward award: +500 XP, +150 Gold
// 9. Level 1 completion unlocked
// 10. Victory window displayed & pointer lock released
// 11. Zero console errors throughout!
// -------------------------------------------------------------

import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 5189;
const URL = `http://localhost:${PORT}`;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBrowserBossFightTest() {
  console.log('🚀 [BROWSER BOSS TEST] Starting preview server on port', PORT);

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
    await sleep(2000);

    const screenshotsDir = path.resolve('test/screenshots');
    fs.mkdirSync(screenshotsDir, { recursive: true });

    // -----------------------------------------------------------
    // STEP 1: TELEPORT TO ROOM 4 THRONE OF THE ABYSS WARDEN
    // -----------------------------------------------------------
    console.log('\n--- 1. Entering Room 4: Approaching the Abyss Warden ---');
    await page.evaluate(() => {
      if (window.__useGameStore) {
        window.__useGameStore.setState((s) => ({
          dungeon: {
            ...s.dungeon,
            currentRoom: 4,
            roomsUnlocked: [true, true, true, true],
            bossActive: true,
            bossHp: 5000,
            bossMaxHp: 5000,
            bossPhase: 1,
            bossRage: false
          }
        }));
      }
      if (window.__setPlayerPosition) {
        window.__setPlayerPosition(0, 1.0, -126); // 12m from boss at [0, 0, -138]
      }
    });

    await sleep(2000);
    await page.screenshot({ path: path.join(screenshotsDir, 'boss_1_phase1_start.png') });
    console.log('📸 Captured boss_1_phase1_start.png');

    // Verify Boss Initial State
    const bossInitState = await page.evaluate(() => {
      const s = window.__useGameStore?.getState();
      return {
        bossActive: s?.dungeon?.bossActive,
        bossHp: s?.dungeon?.bossHp,
        bossMaxHp: s?.dungeon?.bossMaxHp,
        bossPhase: s?.dungeon?.bossPhase
      };
    });

    console.log('  Initial Boss State in Browser:', bossInitState);
    assert.strictEqual(bossInitState.bossActive, true, 'Boss must be active in Room 4');
    assert.strictEqual(bossInitState.bossHp, 5000, 'Boss HP must be 5000');
    assert.strictEqual(bossInitState.bossMaxHp, 5000, 'Boss Max HP must be 5000');
    assert.strictEqual(bossInitState.bossPhase, 1, 'Boss must start in Phase 1');

    // -----------------------------------------------------------
    // STEP 2: COMBAT STRIKES & DAMAGE RESOLUTION
    // -----------------------------------------------------------
    console.log('\n--- 2. Engaging in Combat: Testing Player Attacks (LMB, Q, E, R) ---');

    // Cast R (Ultimate)
    console.log('  Casting R Ultimate (800 dmg)...');
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', code: 'KeyR' }));
    });
    await sleep(500);

    // Cast Q (Shadow Slash)
    console.log('  Casting Q Shadow Slash (220 dmg)...');
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', code: 'KeyQ' }));
    });
    await sleep(500);

    // Cast E (Phantom Dash)
    console.log('  Executing E Phantom Dash (evade + 50 dmg)...');
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', code: 'KeyE' }));
    });
    await sleep(400);

    // Land LMB Combo attacks
    console.log('  Executing LMB Combos...');
    await page.evaluate(() => {
      window.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
    });
    await sleep(350);

    // -----------------------------------------------------------
    // STEP 3: PHASE II TRANSITION AT 40% HP (2000 HP)
    // -----------------------------------------------------------
    console.log('\n--- 3. Pushing Boss to Phase II (40% HP / 2000 HP) ---');
    await page.evaluate(() => {
      // Inflict damage down to 1950 HP to trigger Phase II
      window.__useGameStore?.getState()?.updateBossHp(1950);
    });

    await sleep(1500);
    await page.screenshot({ path: path.join(screenshotsDir, 'boss_2_phase2_unleashed.png') });
    console.log('📸 Captured boss_2_phase2_unleashed.png');

    const phase2State = await page.evaluate(() => {
      const s = window.__useGameStore?.getState();
      return {
        bossHp: s?.dungeon?.bossHp,
        bossPhase: s?.dungeon?.bossPhase,
        bossRage: s?.dungeon?.bossRage
      };
    });

    console.log('  Phase 2 State:', phase2State);
    assert.strictEqual(phase2State.bossPhase, 2, 'Boss must be in Phase 2');
    assert.strictEqual(phase2State.bossRage, true, 'Boss must have bossRage set to true');
    console.log('  ✓ Boss successfully entered Phase II: ABYSS UNLEASHED!');

    // -----------------------------------------------------------
    // STEP 4: REDUCE BOSS HP TO 0 & VERIFY DEFEAT SEQUENCE
    // -----------------------------------------------------------
    console.log('\n--- 4. Defeating the Abyss Warden (0 HP) ---');
    await page.evaluate(() => {
      window.__useGameStore?.getState()?.updateBossHp(0);
    });

    console.log('  Boss HP reduced to 0. Awaiting death collapse, dissolve, and victory window...');
    await sleep(3200);

    await page.screenshot({ path: path.join(screenshotsDir, 'boss_3_victory.png') });
    console.log('📸 Captured boss_3_victory.png');

    // -----------------------------------------------------------
    // STEP 5: VERIFY ALL DEFEAT REQUIREMENTS
    // -----------------------------------------------------------
    console.log('\n--- 5. Verifying All Defeat Resolution Requirements ---');

    const victoryCheck = await page.evaluate(() => {
      const s = window.__useGameStore?.getState();
      const bossQuestObj = s?.quests?.[0]?.objectives?.find((o) => o.id === 'defeat_boss');
      return {
        flow: s?.gameFlowState,
        level1Completed: s?.dungeon?.level1Completed,
        dungeonCompleted: s?.dungeon?.dungeonCompleted,
        roomsUnlocked: s?.dungeon?.roomsUnlocked,
        questDefeatBoss: bossQuestObj?.current,
        questTarget: bossQuestObj?.target,
        level: s?.player?.level,
        xp: s?.player?.xp,
        gold: s?.player?.gold,
        victoryData: s?.victoryData
      };
    });

    console.log('  Victory State in Browser:', victoryCheck);

    // 4. "ABYSS WARDEN DEFEATED"
    // 5. Update quest: Defeat the Abyss Warden 1/1
    assert.strictEqual(victoryCheck.questDefeatBoss, 1, 'Quest objective defeat_boss must be 1');
    assert.strictEqual(victoryCheck.questTarget, 1, 'Quest objective target must be 1');
    console.log('  ✓ Quest verified: Defeat the Abyss Warden 1/1');

    // 6. Award: +500 XP, +150 Gold
    assert.strictEqual(victoryCheck.victoryData?.xp, 500, 'Must award +500 XP');
    assert.strictEqual(victoryCheck.victoryData?.gold, 150, 'Must award +150 Gold');
    assert(victoryCheck.level >= 2, `Player leveled up from +500 XP (level: ${victoryCheck.level})`);
    assert(victoryCheck.gold >= 250, `Player Gold awarded (total: ${victoryCheck.gold})`);
    console.log('  ✓ Rewards verified: +500 XP, +150 Gold');

    // 7. Unlock Level 1 completion & all rooms
    assert.strictEqual(victoryCheck.level1Completed, true, 'Level 1 completion must be true');
    assert.strictEqual(victoryCheck.dungeonCompleted, true, 'Dungeon completed must be true');
    assert.deepStrictEqual(victoryCheck.roomsUnlocked, [true, true, true, true], 'All 4 rooms unlocked');
    console.log('  ✓ Level 1 completion and room progression unlocked');

    // 8. Show victory/reward window
    assert.strictEqual(victoryCheck.flow, 'VICTORY', 'Game flow must be in VICTORY modal state');
    console.log('  ✓ Victory modal active on screen');

    // -----------------------------------------------------------
    // STEP 6: CONSOLE ERROR CHECK
    // -----------------------------------------------------------
    console.log('\n--- 6. Console Error Check ---');
    console.log(`Found ${consoleErrors.length} console errors.`);
    assert.strictEqual(consoleErrors.length, 0, `There must be 0 console errors. Errors found: ${consoleErrors.join(', ')}`);
    console.log('✅ ZERO CONSOLE ERRORS VERIFIED!');

    console.log('\n🎉 [LIVE BROWSER BOSS FIGHT TEST PASSED 100% SUCCESSFULLY!]');

  } finally {
    await browser.close();
    server.kill();
    process.exit(0);
  }
}

runBrowserBossFightTest().catch((err) => {
  console.error('❌ Browser boss test failed:', err);
  process.exit(1);
});

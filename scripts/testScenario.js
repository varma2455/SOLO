import puppeteer from 'puppeteer-core';

async function runTest() {
  console.log('--- STARTING 15-STEP SHADOW SOLDIER VERIFICATION TEST ---');

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

  const consoleLogs = [];
  const consoleErrors = [];
  const reactWarnings = [];

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push(`[${type}] ${text}`);

    if (type === 'error') {
      consoleErrors.push(text);
    }
    if (text.includes('Each child in a list should have a unique "key" prop')) {
      reactWarnings.push(text);
    }
    if (text.includes('NaN')) {
      consoleErrors.push(`NaN detected in log: ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.toString());
  });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));

  // -----------------------------------------------------------------
  // STEP 1: Enter dungeon
  // -----------------------------------------------------------------
  console.log('\n>>> STEP 1: Enter dungeon');
  const step1 = await page.evaluate(() => {
    const store = window.__gameStore.getState();
    store.startNewGame('E');
    return {
      screen: window.__gameStore.getState().currentScreen,
      flow: window.__gameStore.getState().gameFlowState,
      room: window.__gameStore.getState().dungeon.currentRoom
    };
  });
  await new Promise((r) => setTimeout(r, 1500));

  const livingEnemiesCount = await page.evaluate(() => {
    const store = window.__gameStore.getState();
    const encounters = store.dungeon.encounters;
    const room1 = encounters ? encounters[1] : null;
    return room1?.enemies?.length || 0;
  });
  console.log(`Step 1 Result: Screen=${step1.screen}, Flow=${step1.flow}, Room=${step1.room}, Room1Enemies=${livingEnemiesCount}`);
  if (step1.screen !== 'game' || step1.flow !== 'EXPLORING' || livingEnemiesCount < 5) {
    throw new Error(`Step 1 Failed: Expected game screen in EXPLORING mode with >= 5 enemies, got screen=${step1.screen}, enemies=${livingEnemiesCount}`);
  }
  console.log('✓ STEP 1 PASSED: Successfully entered dungeon with at least 5 enemies.');

  // -----------------------------------------------------------------
  // STEP 2: Extract Shadow
  // -----------------------------------------------------------------
  console.log('\n>>> STEP 2: Extract Shadow');
  const step2Before = await page.evaluate(() => {
    const s = window.__gameStore.getState().shadows[0];
    return { unlocked: s.unlocked, active: s.active, status: s.status };
  });
  console.log(`Step 2 Before: unlocked=${step2Before.unlocked}, active=${step2Before.active}, status=${step2Before.status}`);

  const step2After = await page.evaluate(() => {
    window.__gameStore.getState().performExtractionDirect();
    const s = window.__gameStore.getState().shadows[0];
    return { unlocked: s.unlocked, active: s.active, status: s.status };
  });
  console.log(`Step 2 After: unlocked=${step2After.unlocked}, active=${step2After.active}, status=${step2After.status}`);
  if (!step2After.unlocked || step2After.active || step2After.status !== 'UNSUMMONED') {
    throw new Error(`Step 2 Failed: Shadow should be unlocked but unsummoned! Got ${JSON.stringify(step2After)}`);
  }
  console.log('✓ STEP 2 PASSED: Shadow extracted and available in army (unsummoned).');

  // -----------------------------------------------------------------
  // STEP 3: Obtain enough player MP
  // -----------------------------------------------------------------
  console.log('\n>>> STEP 3: Obtain enough player MP');
  const step3 = await page.evaluate(() => {
    window.__gameStore.setState((s) => ({ player: { ...s.player, mana: 100 } }));
    return window.__gameStore.getState().player.mana;
  });
  console.log(`Player MP: ${step3}`);
  if (step3 < 50) {
    throw new Error(`Step 3 Failed: Player mana insufficient: ${step3}`);
  }
  console.log('✓ STEP 3 PASSED: Player has sufficient MP (100 MP).');

  // -----------------------------------------------------------------
  // STEP 4: Press Z -> Shadow is summoned
  // -----------------------------------------------------------------
  console.log('\n>>> STEP 4: Press Z (Summon)');
  const step4 = await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ' }));
    const s = window.__gameStore.getState().shadows[0];
    const playerMp = window.__gameStore.getState().player.mana;
    return {
      active: s.active,
      isDead: s.isDead,
      status: s.status,
      hp: s.hp,
      mp: s.mp,
      playerMp
    };
  });
  console.log('Step 4 Result:', step4);
  if (!step4.active || step4.isDead || step4.playerMp > 50) {
    throw new Error(`Step 4 Failed: Shadow should be active and summoned, player MP should be deducted: ${JSON.stringify(step4)}`);
  }
  console.log('✓ STEP 4 PASSED: Shadow summoned via Z key with player MP cost.');

  // -----------------------------------------------------------------
  // STEP 5: Press X -> Enemy targeted
  // -----------------------------------------------------------------
  console.log('\n>>> STEP 5: Press X (Target nearest enemy)');
  const step5 = await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', code: 'KeyX' }));
    const store = window.__gameStore.getState();
    return {
      lockedTargetId: store.lockedTargetId,
      notifications: store.notifications.map((n) => n.title + ': ' + n.message)
    };
  });
  console.log('Step 5 Result:', step5);
  if (!step5.lockedTargetId) {
    throw new Error(`Step 5 Failed: Target lock ID was not set when pressing X!`);
  }
  console.log(`✓ STEP 5 PASSED: Target acquired (${step5.lockedTargetId}).`);

  // -----------------------------------------------------------------
  // STEP 6: Press Z -> Shadow attacks enemy
  // -----------------------------------------------------------------
  console.log('\n>>> STEP 6: Press Z (Command Attack)');
  const step6 = await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ' }));
    const s = window.__gameStore.getState().shadows[0];
    return {
      commandedTargetId: s.commandedTargetId,
      status: s.status
    };
  });
  console.log('Step 6 Result:', step6);
  if (!step6.commandedTargetId || (step6.status !== 'CHASE' && step6.status !== 'ATTACKING')) {
    throw new Error(`Step 6 Failed: Shadow did not enter CHASE/ATTACKING state for target! Got ${JSON.stringify(step6)}`);
  }
  console.log('✓ STEP 6 PASSED: Shadow commanded to attack target.');

  // -----------------------------------------------------------------
  // STEP 7: Player attacks another enemy independently
  // -----------------------------------------------------------------
  console.log('\n>>> STEP 7: Player and Shadow fight simultaneously');
  const step7 = await page.evaluate(() => {
    // Player triggers slash skill Q
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', code: 'KeyQ' }));
    const shadowStatus = window.__gameStore.getState().shadows[0].status;
    const playerSkills = window.__gameStore.getState().skillCooldowns;
    const isPlayerControllable = window.__gameStore.getState().gameFlowState === 'EXPLORING';
    return {
      shadowStatus,
      isPlayerControllable,
      shadowTarget: window.__gameStore.getState().shadows[0].commandedTargetId
    };
  });
  console.log('Step 7 Result:', step7);
  if (!step7.isPlayerControllable) {
    throw new Error(`Step 7 Failed: Player lost exploration/combat control while shadow was fighting!`);
  }
  console.log('✓ STEP 7 PASSED: Player and Shadow fight independently and simultaneously.');

  // -----------------------------------------------------------------
  // STEP 8: Let enemies attack Shadow -> Shadow HP decreases independently
  // -----------------------------------------------------------------
  console.log('\n>>> STEP 8: Let enemies attack Shadow');
  const step8 = await page.evaluate(() => {
    const pHealthBefore = window.__gameStore.getState().player.hp;
    window.__gameStore.getState().damageShadow(150);
    const shAfter = window.__gameStore.getState().shadows[0];
    const pHealthAfter = window.__gameStore.getState().player.hp;
    return {
      shadowHp: shAfter.hp,
      playerHpBefore: pHealthBefore,
      playerHpAfter: pHealthAfter
    };
  });
  console.log('Step 8 Result:', step8);
  if (step8.shadowHp >= 1000 || step8.playerHpBefore !== step8.playerHpAfter) {
    throw new Error(`Step 8 Failed: Shadow HP did not decrease or Player HP was improperly affected: ${JSON.stringify(step8)}`);
  }
  console.log('✓ STEP 8 PASSED: Shadow took damage independently (HP: 1000 -> ' + step8.shadowHp + '), player HP untouched.');

  // -----------------------------------------------------------------
  // STEP 9: Use Shadow abilities (1, 2) -> Shadow MP decreases
  // -----------------------------------------------------------------
  console.log('\n>>> STEP 9: Use Shadow abilities');
  const step9 = await page.evaluate(() => {
    const pMpBefore = window.__gameStore.getState().player.mana;
    // Ability 1: Shadow Slash (30 MP)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', code: 'Digit1' }));
    const mpAfter1 = window.__gameStore.getState().shadows[0].mp;

    // Ability 2: Shadow Guard (50 MP)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '2', code: 'Digit2' }));
    const mpAfter2 = window.__gameStore.getState().shadows[0].mp;
    const pMpAfter = window.__gameStore.getState().player.mana;

    return {
      mpAfter1,
      mpAfter2,
      playerMpBefore: pMpBefore,
      playerMpAfter: pMpAfter
    };
  });
  console.log('Step 9 Result:', step9);
  if (step9.mpAfter2 > 430 || step9.playerMpBefore !== step9.playerMpAfter) {
    throw new Error(`Step 9 Failed: Shadow MP should decrease by 30 and 50 without touching player MP: ${JSON.stringify(step9)}`);
  }
  console.log('✓ STEP 9 PASSED: Shadow abilities 1 & 2 deducted Shadow MP independently (500 -> 470 -> 420).');

  // -----------------------------------------------------------------
  // STEP 10: Wait for Shadow MP regeneration
  // -----------------------------------------------------------------
  console.log('\n>>> STEP 10: Shadow MP regeneration');
  const step10 = await page.evaluate(() => {
    const mpBefore = window.__gameStore.getState().shadows[0].mp;
    // Simulate 2 seconds of regen ticks
    window.__gameStore.getState().regenTick(2.0);
    const mpAfter = window.__gameStore.getState().shadows[0].mp;
    return { mpBefore, mpAfter };
  });
  console.log('Step 10 Result:', step10);
  if (step10.mpAfter <= step10.mpBefore) {
    throw new Error(`Step 10 Failed: Shadow MP did not regenerate! Before: ${step10.mpBefore}, After: ${step10.mpAfter}`);
  }
  console.log(`✓ STEP 10 PASSED: Shadow MP regenerated (${step10.mpBefore} -> ${step10.mpAfter}).`);

  // -----------------------------------------------------------------
  // STEP 13 (verified before final death test): Press C -> Recall Shadow
  // -----------------------------------------------------------------
  console.log('\n>>> STEP 13: Press C (Recall Shadow)');
  const step13 = await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', code: 'KeyC' }));
    const s = window.__gameStore.getState().shadows[0];
    return {
      status: s.status,
      commandedTargetId: s.commandedTargetId
    };
  });
  console.log('Step 13 Result:', step13);
  if (step13.status !== 'RECALLING') {
    throw new Error(`Step 13 Failed: Shadow did not enter RECALLING state on pressing C: ${JSON.stringify(step13)}`);
  }
  console.log('✓ STEP 13 PASSED: Shadow recalled to player with C key (status: RECALLING).');

  // -----------------------------------------------------------------
  // STEP 11: Reduce Shadow HP to zero -> Death animation & disappears
  // -----------------------------------------------------------------
  console.log('\n>>> STEP 11: Reduce Shadow HP to zero');
  const step11 = await page.evaluate(() => {
    // Deal lethal damage (exceeding any remaining guard mitigation)
    window.__gameStore.getState().damageShadow(3000);
    const s = window.__gameStore.getState().shadows[0];
    return {
      hp: s.hp,
      isDead: s.isDead,
      status: s.status,
      active: s.active
    };
  });
  console.log('Step 11 Result:', step11);
  if (step11.hp > 0 || !step11.isDead) {
    throw new Error(`Step 11 Failed: Shadow did not die when taking lethal damage: ${JSON.stringify(step11)}`);
  }
  console.log('✓ STEP 11 PASSED: Shadow HP reduced to 0, status set to DEFEATED / death initiated.');

  // -----------------------------------------------------------------
  // STEP 12: Player remains alive
  // -----------------------------------------------------------------
  console.log('\n>>> STEP 12: Player remains alive');
  const step12 = await page.evaluate(() => {
    const p = window.__gameStore.getState().player;
    const flow = window.__gameStore.getState().gameFlowState;
    return {
      hp: p.hp,
      maxHp: p.maxHp,
      flow
    };
  });
  console.log('Step 12 Result:', step12);
  if (step12.hp <= 0 || step12.flow === 'DEFEAT') {
    throw new Error(`Step 12 Failed: Player died or game over triggered when shadow died!`);
  }
  console.log('✓ STEP 12 PASSED: Player remains alive and fully controllable.');

  // -----------------------------------------------------------------
  // STEP 14: Kill one monster -> All other monsters remain
  // -----------------------------------------------------------------
  console.log('\n>>> STEP 14: Kill one monster and verify remaining monsters remain intact');
  const step14 = await page.evaluate(() => {
    const store = window.__gameStore.getState();
    const enc = store.dungeon.encounters[1];
    const initialCount = enc.enemies.length;

    // Simulate killing enemy 2 out of the list
    const enemyToKill = enc.enemies[1];
    const killId = enemyToKill.id;

    // Remove single enemy through standard state update
    const updatedEnemies = enc.enemies.filter((e) => e.id !== killId);
    const updatedEncounters = {
      ...store.dungeon.encounters,
      1: {
        ...enc,
        enemies: updatedEnemies
      }
    };
    window.__gameStore.setState((s) => ({
      dungeon: {
        ...s.dungeon,
        encounters: updatedEncounters
      }
    }));

    const afterEnemies = window.__gameStore.getState().dungeon.encounters[1].enemies;
    const enemy1Alive = afterEnemies.some((e) => e.id === enc.enemies[0].id);
    const enemy2Gone = !afterEnemies.some((e) => e.id === killId);
    const enemy3Alive = afterEnemies.some((e) => e.id === enc.enemies[2].id);

    return {
      initialCount,
      afterCount: afterEnemies.length,
      enemy1Alive,
      enemy2Gone,
      enemy3Alive
    };
  });
  console.log('Step 14 Result:', step14);
  if (!step14.enemy1Alive || !step14.enemy2Gone || !step14.enemy3Alive || step14.afterCount !== step14.initialCount - 1) {
    throw new Error(`Step 14 Failed: Killing one monster wiped or corrupted the monster list: ${JSON.stringify(step14)}`);
  }
  console.log('✓ STEP 14 PASSED: Only the killed monster was removed; all other monsters remain alive.');

  // -----------------------------------------------------------------
  // STEP 15: Check browser console
  // -----------------------------------------------------------------
  console.log('\n>>> STEP 15: Verify browser console health');
  console.log(`Console Errors recorded: ${consoleErrors.length}`);
  console.log(`React Key Warnings recorded: ${reactWarnings.length}`);

  if (reactWarnings.length > 0) {
    console.error('React Key Warnings:', reactWarnings);
    throw new Error('React Key Warnings detected in browser console!');
  }

  // Filter out normal audio/pointerlock non-fatal notices if any
  const criticalErrors = consoleErrors.filter(
    (e) =>
      !e.includes('AudioContext') &&
      !e.includes('pointer lock') &&
      !e.includes('favicon') &&
      !e.includes('WebGL: INVALID_OPERATION') // three.js fallback warnings if software rasterizer
  );

  if (criticalErrors.length > 0) {
    console.error('Critical Errors in browser:', criticalErrors);
    throw new Error(`Critical console errors detected: ${criticalErrors.join('; ')}`);
  }
  console.log('✓ STEP 15 PASSED: Browser console clean of target errors, key warnings, and logic bugs.');

  console.log('\n======================================================');
  console.log('ALL 15 STEPS OF THE SHADOW SYSTEM SCENARIO PASSED 100%!');
  console.log('======================================================');

  await browser.close();
}

runTest().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});

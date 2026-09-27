import puppeteer from 'puppeteer-core';

async function runTest() {
  console.log('--- STARTING SHADOW COMMAND PANEL UPGRADE TEST SUITE ---');

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

  const consoleErrors = [];
  const reactWarnings = [];

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      consoleErrors.push(text);
    }
    if (text.includes('Each child in a list should have a unique "key" prop')) {
      reactWarnings.push(text);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.toString());
  });

  console.log('Navigating to http://localhost:5173/register ...');
  await page.goto('http://localhost:5173/register', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('input', { timeout: 8000 });
  const inputs = await page.$$('input');
  await inputs[0].type('YESWANTH');
  await inputs[1].type(`panel_hunter_${Date.now()}@ascension.game`);
  await inputs[2].type('hunterPass123!');
  await inputs[3].type('hunterPass123!');
  const submit = await page.$('button[type="submit"]');
  await submit.click();

  await page.waitForFunction(() => window.location.pathname.includes('/game'), { timeout: 15000 });
  const enterBtn = await page.waitForSelector('button ::-p-text(ENTER DUNGEON)', { timeout: 6000 });
  await enterBtn.click();
  await new Promise((r) => setTimeout(r, 1500));

  // 1. Start game
  console.log('\n[TEST 1] Start game & enter dungeon');
  await page.evaluate(() => {
    window.__gameStore.getState().startNewGame('E');
  });
  await new Promise((r) => setTimeout(r, 1500));

  // 2. Verify Shadow Command panel is visible
  console.log('\n[TEST 2] Verify Shadow Command panel is visible on screen');
  const panelVisible = await page.evaluate(() => {
    const panels = Array.from(document.querySelectorAll('div, span, button'));
    const shadowCmdTitle = panels.find((el) => el.textContent && el.textContent.includes('SHADOW COMMAND'));
    return Boolean(shadowCmdTitle);
  });
  console.log(`Shadow Command panel visible: ${panelVisible}`);
  if (!panelVisible) {
    throw new Error('Test 2 Failed: SHADOW COMMAND panel title not visible in DOM!');
  }

  // 3. Shadow should show UNSUMMONED / NOT ACQUIRED
  console.log('\n[TEST 3] Verify initial state is NOT ACQUIRED / UNSUMMONED');
  const initialShadowState = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return {
      hasUnsummoned: bodyText.includes('UNSUMMONED'),
      hasNotAcquired: bodyText.includes('NOT ACQUIRED'),
      hasShadowHp: bodyText.includes('SHADOW HP'),
      hasShadowMp: bodyText.includes('SHADOW MP')
    };
  });
  console.log('Initial text state:', initialShadowState);
  if (!initialShadowState.hasUnsummoned || !initialShadowState.hasShadowHp || !initialShadowState.hasShadowMp) {
    throw new Error(`Test 3 Failed: Missing UNSUMMONED or SHADOW HP/MP labels! Got: ${JSON.stringify(initialShadowState)}`);
  }

  // 4. Extract Shadow
  console.log('\n[TEST 4] Extract Shadow');
  await page.evaluate(() => {
    window.__gameStore.getState().performExtractionDirect();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 5. Verify panel changes to AVAILABLE
  console.log('\n[TEST 5] Verify panel reflects AVAILABLE state');
  const availableState = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return bodyText.includes('AVAILABLE');
  });
  console.log(`Panel displays AVAILABLE: ${availableState}`);
  if (!availableState) {
    throw new Error('Test 5 Failed: Panel did not change to AVAILABLE after extraction!');
  }

  // 6. Obtain enough player MP
  console.log('\n[TEST 6] Ensure Player MP is sufficient (100 MP)');
  await page.evaluate(() => {
    window.__gameStore.setState((s) => ({ player: { ...s.player, mana: 100 } }));
  });

  // 7. Verify Z Button says "SUMMON SHADOW" before summon
  console.log('\n[TEST 7] Verify Z Button displays "SUMMON SHADOW" before summon');
  const zBeforeSummon = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const zBtn = buttons.find((b) => b.textContent && b.textContent.includes('SUMMON SHADOW'));
    return Boolean(zBtn);
  });
  console.log(`Z Button shows SUMMON SHADOW: ${zBeforeSummon}`);
  if (!zBeforeSummon) {
    throw new Error('Test 7 Failed: Z button does not show SUMMON SHADOW when unsummoned!');
  }

  // 8. Press Z to Summon
  console.log('\n[TEST 8] Press Z to summon Shadow');
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ' }));
  });
  await new Promise((r) => setTimeout(r, 600));

  // 9. Verify panel says SUMMONED and Z button changes to COMMAND SHADOW
  console.log('\n[TEST 9] Verify panel says SUMMONED and Z changes to COMMAND SHADOW');
  const postSummonState = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const buttons = Array.from(document.querySelectorAll('button'));
    const zCommandBtn = buttons.find((b) => b.textContent && b.textContent.includes('COMMAND SHADOW'));
    return {
      hasSummoned: bodyText.includes('SUMMONED'),
      hasCommandShadow: Boolean(zCommandBtn)
    };
  });
  console.log('Post-summon state:', postSummonState);
  if (!postSummonState.hasSummoned || !postSummonState.hasCommandShadow) {
    throw new Error(`Test 9 Failed: Expected SUMMONED and COMMAND SHADOW! Got: ${JSON.stringify(postSummonState)}`);
  }

  // 10. Press X to Target
  console.log('\n[TEST 10] Press X to target nearest enemy');
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', code: 'KeyX' }));
  });
  await new Promise((r) => setTimeout(r, 300));
  const targetState = await page.evaluate(() => {
    const store = window.__gameStore.getState();
    const bodyText = document.body.innerText;
    return {
      lockedTargetId: store.lockedTargetId,
      bodyHasTarget: bodyText.includes('TARGET:') && !bodyText.includes('TARGET: NONE')
    };
  });
  console.log('Target state after X:', targetState);
  if (!targetState.lockedTargetId || !targetState.bodyHasTarget) {
    throw new Error(`Test 10 Failed: Enemy target was not acquired! Got: ${JSON.stringify(targetState)}`);
  }

  // 11. Press Z to Command Attack
  console.log('\n[TEST 11] Press Z to command Shadow to attack');
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ' }));
  });
  await new Promise((r) => setTimeout(r, 400));
  const attackCmdState = await page.evaluate(() => {
    const s = window.__gameStore.getState().shadows[0];
    return {
      commandedTargetId: s.commandedTargetId,
      status: s.status
    };
  });
  console.log('Attack command state:', attackCmdState);
  if (!attackCmdState.commandedTargetId || (attackCmdState.status !== 'CHASE' && attackCmdState.status !== 'ATTACKING')) {
    throw new Error(`Test 11 Failed: Shadow did not enter CHASE/ATTACKING state! Got: ${JSON.stringify(attackCmdState)}`);
  }

  // 12. Test Ability 1 (Shadow Slash, 30 MP)
  console.log('\n[TEST 12] Use Ability 1 (Shadow Slash)');
  const mpBefore1 = await page.evaluate(() => window.__gameStore.getState().shadows[0].mp);
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', code: 'Digit1' }));
  });
  await new Promise((r) => setTimeout(r, 200));
  const mpAfter1 = await page.evaluate(() => window.__gameStore.getState().shadows[0].mp);
  console.log(`Ability 1 MP: ${mpBefore1} -> ${mpAfter1}`);
  if (mpAfter1 !== mpBefore1 - 30) {
    throw new Error(`Test 12 Failed: Ability 1 did not deduct 30 Shadow MP! Before: ${mpBefore1}, After: ${mpAfter1}`);
  }

  // 13. Test Ability 2 (Shadow Guard, 50 MP)
  console.log('\n[TEST 13] Use Ability 2 (Shadow Guard)');
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '2', code: 'Digit2' }));
  });
  await new Promise((r) => setTimeout(r, 200));
  const guardState = await page.evaluate(() => {
    const s = window.__gameStore.getState().shadows[0];
    const bodyText = document.body.innerText;
    return {
      mp: s.mp,
      guardActive: s.guardActive,
      statusTextHasGuarding: bodyText.includes('GUARDING')
    };
  });
  console.log('Guard state:', guardState);
  if (!guardState.guardActive || !guardState.statusTextHasGuarding) {
    throw new Error(`Test 13 Failed: Shadow Guard active state / GUARDING status text missing! Got: ${JSON.stringify(guardState)}`);
  }

  // 14. Test Ability 3 (Shadow Step, 40 MP)
  console.log('\n[TEST 14] Use Ability 3 (Shadow Step)');
  const mpBefore3 = await page.evaluate(() => window.__gameStore.getState().shadows[0].mp);
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '3', code: 'Digit3' }));
  });
  await new Promise((r) => setTimeout(r, 200));
  const mpAfter3 = await page.evaluate(() => window.__gameStore.getState().shadows[0].mp);
  console.log(`Ability 3 MP: ${mpBefore3} -> ${mpAfter3}`);
  if (mpAfter3 !== mpBefore3 - 40) {
    throw new Error(`Test 14 Failed: Ability 3 did not deduct 40 MP! Before: ${mpBefore3}, After: ${mpAfter3}`);
  }

  // 15. Test Ability 4 (Dark Strike, 80 MP)
  console.log('\n[TEST 15] Use Ability 4 (Dark Strike)');
  const mpBefore4 = await page.evaluate(() => window.__gameStore.getState().shadows[0].mp);
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '4', code: 'Digit4' }));
  });
  await new Promise((r) => setTimeout(r, 200));
  const mpAfter4 = await page.evaluate(() => window.__gameStore.getState().shadows[0].mp);
  console.log(`Ability 4 MP: ${mpBefore4} -> ${mpAfter4}`);
  if (mpAfter4 !== mpBefore4 - 80) {
    throw new Error(`Test 15 Failed: Ability 4 did not deduct 80 MP! Before: ${mpBefore4}, After: ${mpAfter4}`);
  }

  // 16. Test Recall (Press C)
  console.log('\n[TEST 16] Press C to recall Shadow');
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', code: 'KeyC' }));
  });
  await new Promise((r) => setTimeout(r, 200));
  const recallState = await page.evaluate(() => {
    const s = window.__gameStore.getState().shadows[0];
    const bodyText = document.body.innerText;
    return {
      status: s.status,
      bodyHasRecalling: bodyText.includes('RECALLING')
    };
  });
  console.log('Recall state:', recallState);
  if (recallState.status !== 'RECALLING' || !recallState.bodyHasRecalling) {
    throw new Error(`Test 16 Failed: Expected RECALLING status! Got: ${JSON.stringify(recallState)}`);
  }

  // 17. Test Shadow HP damage and HUD update
  console.log('\n[TEST 17] Let enemies damage Shadow (150 damage)');
  await page.evaluate(() => {
    window.__gameStore.getState().damageShadow(150);
  });
  await new Promise((r) => setTimeout(r, 300));
  const hpDamageState = await page.evaluate(() => {
    const s = window.__gameStore.getState().shadows[0];
    const bodyText = document.body.innerText;
    return {
      hp: s.hp,
      bodyHasHpValue: bodyText.includes(String(s.hp))
    };
  });
  console.log('Damage state:', hpDamageState);
  if (hpDamageState.hp >= 1000 || !hpDamageState.bodyHasHpValue) {
    throw new Error(`Test 17 Failed: Shadow HP was not reduced or not updated on HUD! Got: ${JSON.stringify(hpDamageState)}`);
  }

  // 18. Test Shadow MP Regeneration
  console.log('\n[TEST 18] Shadow MP Regeneration');
  const regenState = await page.evaluate(() => {
    const mpBefore = window.__gameStore.getState().shadows[0].mp;
    window.__gameStore.getState().regenTick(2.0);
    const mpAfter = window.__gameStore.getState().shadows[0].mp;
    return { mpBefore, mpAfter };
  });
  console.log(`Regen MP: ${regenState.mpBefore} -> ${regenState.mpAfter}`);
  if (regenState.mpAfter <= regenState.mpBefore) {
    throw new Error(`Test 18 Failed: Shadow MP did not regenerate! ${JSON.stringify(regenState)}`);
  }

  // 19. Test Collapsible Mode [-] / [+]
  console.log('\n[TEST 19] Test Collapsible mode [-] and [+] on SHADOW COMMAND panel');
  const collapseBtn = await page.$('button[title="Collapse Shadow Command Panel"]');
  if (!collapseBtn) {
    throw new Error('Test 19 Failed: Collapse button not found!');
  }
  await collapseBtn.click();
  await new Promise((r) => setTimeout(r, 300));

  const isHpBarHidden = await page.evaluate(() => !document.body.innerText.includes('SHADOW HP'));
  console.log(`HP bar hidden when collapsed: ${isHpBarHidden}`);

  const expandBtn = await page.$('button[title="Expand Shadow Command Panel"]');
  if (!expandBtn) {
    throw new Error('Test 19 Failed: Expand button not found after collapse!');
  }
  await expandBtn.click();
  await new Promise((r) => setTimeout(r, 300));

  const isHpBarRestored = await page.evaluate(() => document.body.innerText.includes('SHADOW HP'));
  console.log(`HP bar restored when expanded: ${isHpBarRestored}`);

  if (!isHpBarHidden || !isHpBarRestored) {
    throw new Error(`Test 19 Failed: isHpBarHidden=${isHpBarHidden}, isHpBarRestored=${isHpBarRestored}`);
  }

  // 20. Reduce Shadow HP to 0 and verify DEFEATED
  console.log('\n[TEST 20] Reduce Shadow HP to 0 and verify DEFEATED state');
  await page.evaluate(() => {
    window.__gameStore.getState().damageShadow(3000);
  });
  await new Promise((r) => setTimeout(r, 400));
  const defeatedState = await page.evaluate(() => {
    const s = window.__gameStore.getState().shadows[0];
    const bodyText = document.body.innerText;
    const playerHp = window.__gameStore.getState().player.hp;
    return {
      hp: s.hp,
      isDead: s.isDead,
      status: s.status,
      bodyHasDefeated: bodyText.includes('DEFEATED'),
      playerAlive: playerHp > 0
    };
  });
  console.log('Defeated state:', defeatedState);
  if (defeatedState.hp > 0 || !defeatedState.isDead || !defeatedState.bodyHasDefeated || !defeatedState.playerAlive) {
    throw new Error(`Test 20 Failed: Shadow death did not set DEFEATED state or player died! ${JSON.stringify(defeatedState)}`);
  }

  // 21. Verify Console Health
  console.log('\n[TEST 21] Verify zero console errors and zero React key warnings');
  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log(`React Key Warnings: ${reactWarnings.length}`);

  if (reactWarnings.length > 0) {
    throw new Error(`React Key Warnings: ${reactWarnings.join('; ')}`);
  }
  const realErrors = consoleErrors.filter(
    (e) => !e.includes('AudioContext') && !e.includes('pointer lock') && !e.includes('favicon') && !e.includes('WebGL')
  );
  if (realErrors.length > 0) {
    throw new Error(`Real console errors: ${realErrors.join('; ')}`);
  }

  console.log('\n=====================================================================');
  console.log('ALL 21 VERIFICATION CHECKS FOR SHADOW COMMAND PANEL PASSED 100%!');
  console.log('=====================================================================');

  await browser.close();
}

runTest().catch((err) => {
  console.error('\n❌ SHADOW COMMAND TEST FAILED:', err);
  process.exit(1);
});

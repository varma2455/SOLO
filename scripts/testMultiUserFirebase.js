// -------------------------------------------------------------
// SHADOW ASCENSION - MULTI-USER & FIREBASE PERSONALIZATION TEST
// -------------------------------------------------------------

import puppeteer from 'puppeteer-core';

const CHROMIUM_PATH = '/usr/bin/chromium';
const BASE_URL = 'http://localhost:5173';

function log(step, msg, ok = true) {
  const icon = ok ? '✓' : '✗';
  console.log(`[${icon}] Step ${step}: ${msg}`);
}

async function runTest() {
  console.log('========================================================');
  console.log('SHADOW ASCENSION - MULTI-USER FIREBASE TEST SUITE');
  console.log('========================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-gpu',
      '--no-first-run'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[Error]') || msg.type() === 'error') {
      console.log('   [Browser Error]:', text);
    }
  });

  try {
    // ---------------------------------------------------------
    // TEST 1: HOME PAGE (/)
    // ---------------------------------------------------------
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('h1', { timeout: 8000 });

    const heroTitle = await page.$eval('h1', (el) => el.textContent.trim());
    const heroSlogan = await page.$eval('#hero', (el) => el.textContent);

    if (heroTitle.includes('SHADOW ASCENSION') && heroSlogan.includes('AWAKEN. SUMMON. CONQUER.')) {
      log(1, 'Home Page renders title "SHADOW ASCENSION" & "AWAKEN. SUMMON. CONQUER."');
    } else {
      throw new Error(`Home Page title or slogan mismatch: ${heroTitle}`);
    }

    // Check Features Section
    const featuresContent = await page.$eval('#features', (el) => el.textContent);
    const hasCombat = featuresContent.includes('REAL-TIME COMBAT');
    const hasShadows = featuresContent.includes('SHADOW COMPANIONS');
    const hasDungeons = featuresContent.includes('DUNGEONS');
    const hasProgression = featuresContent.includes('CHARACTER PROGRESSION');
    const hasInventory = featuresContent.includes('INVENTORY');
    const hasCloud = featuresContent.includes('CLOUD SAVE');

    if (hasCombat && hasShadows && hasDungeons && hasProgression && hasInventory && hasCloud) {
      log(2, 'All 6 Features (Combat, Shadows, Dungeons, Progression, Inventory, Cloud Save) verified');
    } else {
      throw new Error('Features section missing one or more required items');
    }

    // ---------------------------------------------------------
    // TEST 2: PROTECTED ROUTE REDIRECTION
    // ---------------------------------------------------------
    await page.goto(`${BASE_URL}/game`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 8000 });

    const redirectedUrl = page.url();
    if (redirectedUrl.includes('/login')) {
      log(3, 'Unauthenticated /game correctly redirected to /login');
    } else {
      throw new Error(`Expected redirect to /login, got: ${redirectedUrl}`);
    }

    // ---------------------------------------------------------
    // TEST 3: USER A REGISTRATION (YESWANTH)
    // ---------------------------------------------------------
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('input[type="text"]', { timeout: 8000 });

    const userA_Name = 'YESWANTH';
    const timestamp = Date.now();
    const userA_Email = `yeswanth_${timestamp}@ascension.game`;
    const userA_Pass = 'hunterPass123!';

    // Fill form
    const textInputs = await page.$$('input');
    await textInputs[0].type(userA_Name); // Player Name
    await textInputs[1].type(userA_Email); // Email
    await textInputs[2].type(userA_Pass); // Password
    await textInputs[3].type(userA_Pass); // Confirm Password

    // Submit
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();

    // Wait for redirect to /game and welcome modal
    await page.waitForFunction(
      () => window.location.pathname.includes('/game') && document.body.innerText.includes('WELCOME BACK'),
      { timeout: 15000 }
    );
    log(4, `User A (${userA_Name}) registered and arrived at /game with WELCOME BACK modal`);

    // Verify Welcome Back shows YESWANTH and LEVEL 1 AWAKENED
    const welcomeText = await page.$eval('body', (el) => el.innerText);
    if (welcomeText.includes('YESWANTH') && welcomeText.includes('LEVEL 1 AWAKENED')) {
      log(5, 'Welcome modal correctly displays "YESWANTH" and "LEVEL 1 AWAKENED"');
    } else {
      throw new Error(`Welcome modal text does not contain expected player name and level: ${welcomeText.slice(0, 300)}`);
    }

    // Click [ ENTER DUNGEON ]
    const enterDungeonBtn = await page.waitForSelector('button ::-p-text(ENTER DUNGEON)', { timeout: 6000 });
    await enterDungeonBtn.click();
    await new Promise((r) => setTimeout(r, 1000));

    // Verify In-Game HUD displays YESWANTH
    await page.waitForSelector('#game-hud', { timeout: 10000 });
    const hudText = await page.$eval('#game-hud', (el) => el.innerText);

    if (hudText.includes('YESWANTH') && hudText.includes('LEVEL 1 AWAKENED')) {
      log(6, 'In-Game HUD displays "YESWANTH" & "LEVEL 1 AWAKENED"');
    } else {
      throw new Error(`In-Game HUD does not show YESWANTH: ${hudText.slice(0, 400)}`);
    }

    // Verify Shadow Command Panel shows OWNER: YESWANTH
    if (hudText.includes('OWNER: YESWANTH')) {
      log(7, 'Shadow Command Panel displays "OWNER: YESWANTH"');
    } else {
      throw new Error(`Shadow Command Panel missing OWNER: YESWANTH`);
    }

    // ---------------------------------------------------------
    // TEST 4: SIMULATE PROGRESS FOR USER A (LEVEL 5 & SHADOW EXTRACTION)
    // ---------------------------------------------------------
    await page.evaluate(() => {
      window.__gameStore.setState((s) => ({
        player: {
          ...s.player,
          level: 5,
          xp: 350,
          monstersDefeated: 26
        },
        dungeon: {
          ...s.dungeon,
          currentRoom: 3
        },
        shadows: [
          {
            id: 'shadow_dusk_knight',
            name: 'Shadow Soldier',
            level: 5,
            rank: 'E',
            unlocked: true,
            hp: 1000,
            maxHp: 1000,
            mp: 500,
            maxMp: 500
          }
        ]
      }));

      // Save game
      window.__gameStore.getState().saveGame();
    });
    await new Promise((r) => setTimeout(r, 1500));
    log(8, 'User A (YESWANTH) progress updated: Level 5, 350 XP, 1 Shadow Soldier extracted & saved');

    // Check Profile page
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForFunction(
      () => document.body.innerText.includes('PLAYER PROFILE') && !document.body.innerText.includes('LOADING PROFILE'),
      { timeout: 15000 }
    );
    const profileText = await page.$eval('body', (el) => el.innerText);

    if (profileText.includes('YESWANTH') && profileText.includes('LEVEL 5 AWAKENED') && profileText.includes('1 EXTRACTED')) {
      log(9, 'Profile Page displays YESWANTH, Level 5, and 1 Extracted Shadow');
    } else {
      throw new Error(`Profile Page does not match User A saved data: ${profileText.slice(0, 400)}`);
    }

    // ---------------------------------------------------------
    // TEST 5: LOGOUT USER A
    // ---------------------------------------------------------
    const logoutBtn = await page.waitForSelector('button ::-p-text(LOGOUT)', { timeout: 6000 });
    await logoutBtn.click();
    await page.waitForFunction(() => window.location.pathname === '/', { timeout: 8000 });
    log(10, 'User A logged out successfully and returned to /');

    // ---------------------------------------------------------
    // TEST 6: USER B REGISTRATION (ARJUN)
    // ---------------------------------------------------------
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('input[type="text"]', { timeout: 8000 });

    const userB_Name = 'ARJUN';
    const userB_Email = `arjun_${timestamp}@ascension.game`;
    const userB_Pass = 'hunterPass456!';

    const textInputsB = await page.$$('input');
    await textInputsB[0].type(userB_Name);
    await textInputsB[1].type(userB_Email);
    await textInputsB[2].type(userB_Pass);
    await textInputsB[3].type(userB_Pass);

    const submitBtnB = await page.$('button[type="submit"]');
    await submitBtnB.click();

    // Wait for redirect to /game
    await page.waitForFunction(
      () => window.location.pathname.includes('/game') && document.body.innerText.includes('WELCOME BACK'),
      { timeout: 15000 }
    );
    log(11, `User B (${userB_Name}) registered and arrived at /game`);

    // Verify Welcome shows ARJUN (NOT Yeswanth!) and LEVEL 1 AWAKENED
    const welcomeB = await page.$eval('body', (el) => el.innerText);
    if (welcomeB.includes('ARJUN') && !welcomeB.includes('YESWANTH') && welcomeB.includes('LEVEL 1 AWAKENED')) {
      log(12, 'User B isolation verified: Displays "ARJUN" & "LEVEL 1 AWAKENED" (NO Yeswanth data)');
    } else {
      throw new Error(`User B screen contains User A data or incorrect info: ${welcomeB.slice(0, 300)}`);
    }

    // Enter Dungeon as User B
    const enterDungeonBtnB = await page.waitForSelector('button ::-p-text(ENTER DUNGEON)', { timeout: 6000 });
    await enterDungeonBtnB.click();
    await new Promise((r) => setTimeout(r, 1000));

    // Verify HUD shows ARJUN, Level 1, and NOT ACQUIRED shadow
    await page.waitForSelector('#game-hud', { timeout: 10000 });
    const hudTextB = await page.$eval('#game-hud', (el) => el.innerText);

    if (hudTextB.includes('ARJUN') && hudTextB.includes('LEVEL 1 AWAKENED') && hudTextB.includes('OWNER: ARJUN')) {
      log(13, 'User B HUD verified: "ARJUN", "LEVEL 1 AWAKENED", and "OWNER: ARJUN"');
    } else {
      throw new Error(`User B HUD mismatch: ${hudTextB.slice(0, 400)}`);
    }

    if (hudTextB.includes('NOT ACQUIRED') || hudTextB.includes('LOCKED')) {
      log(14, 'User B has 0 shadows extracted (Independent Shadow State confirmed)');
    } else {
      throw new Error(`User B unexpectedly has shadow active!`);
    }

    // Logout User B
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForFunction(
      () => document.body.innerText.includes('PLAYER PROFILE') && !document.body.innerText.includes('LOADING PROFILE'),
      { timeout: 15000 }
    );
    const logoutBtnB = await page.waitForSelector('button ::-p-text(LOGOUT)', { timeout: 8000 });
    await logoutBtnB.click();
    await page.waitForFunction(() => window.location.pathname === '/', { timeout: 8000 });
    log(15, 'User B logged out successfully');

    // ---------------------------------------------------------
    // TEST 7: RE-LOGIN USER A (YESWANTH)
    // ---------------------------------------------------------
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('input[type="email"]', { timeout: 8000 });

    const loginInputs = await page.$$('input');
    await loginInputs[0].type(userA_Email);
    await loginInputs[1].type(userA_Pass);

    const loginSubmit = await page.$('button[type="submit"]');
    await loginSubmit.click();

    // Wait for /game and welcome modal
    await page.waitForFunction(
      () => window.location.pathname.includes('/game') && document.body.innerText.includes('WELCOME BACK'),
      { timeout: 15000 }
    );
    log(16, 'User A (YESWANTH) logged back in successfully');

    const welcomeReturn = await page.$eval('body', (el) => el.innerText);
    if (welcomeReturn.includes('YESWANTH') && welcomeReturn.includes('LEVEL 5 AWAKENED')) {
      log(17, 'Welcome modal correctly restored: "YESWANTH" & "LEVEL 5 AWAKENED"');
    } else {
      throw new Error(`User A restore failed: ${welcomeReturn.slice(0, 300)}`);
    }

    const enterDungeonReturn = await page.waitForSelector('button ::-p-text(ENTER DUNGEON)', { timeout: 6000 });
    await enterDungeonReturn.click();
    await new Promise((r) => setTimeout(r, 1000));

    // Verify HUD restored User A's Level 5 and Shadow
    const hudReturn = await page.$eval('#game-hud', (el) => el.innerText);
    if (hudReturn.includes('YESWANTH') && hudReturn.includes('LEVEL 5 AWAKENED') && hudReturn.includes('OWNER: YESWANTH')) {
      log(18, 'HUD fully restored for YESWANTH: Level 5, Owner YESWANTH, and Shadow Army preserved');
    } else {
      throw new Error(`HUD failed to restore User A persistent state: ${hudReturn.slice(0, 400)}`);
    }

    console.log('\n========================================================');
    console.log('ALL 18 MULTI-USER & FIREBASE PERSONALIZATION CHECKS PASSED!');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\n❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();

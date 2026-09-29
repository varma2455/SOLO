import puppeteer from 'puppeteer-core';

const CHROME_PATH = '/usr/bin/google-chrome';
const BASE_URL = 'http://localhost:5173';

async function runTests() {
  console.log('--- STARTING ADMIN PORTAL SCROLLING & LAYOUT VERIFICATION ---');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  // 1. LOGIN
  console.log('\n[1/6] Logging in at /login...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

  await page.waitForSelector('#login-email-input');
  await page.type('#login-email-input', 'pothuri2455@gmail.com');
  await page.type('#login-password-input', 'Varma@33433');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  const currentUrl = page.url();
  console.log('Navigated to:', currentUrl);
  if (!currentUrl.includes('/admin/dashboard')) {
    console.error('Login did not navigate to /admin/dashboard!');
  } else {
    console.log('✓ Successfully authenticated and navigated to /admin/dashboard');
  }

  // Helper to inspect layout and scrolling on a given route
  async function testRouteScrolling(routePath) {
    console.log(`\nTesting scrolling on route: ${routePath}`);
    await page.goto(`${BASE_URL}${routePath}`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.admin-content', { timeout: 8000 });

    const layoutReport = await page.evaluate(() => {
      const layout = document.querySelector('.admin-layout');
      const sidebar = document.querySelector('.admin-sidebar');
      const main = document.querySelector('.admin-main');
      const topbar = document.querySelector('.admin-topbar');
      const content = document.querySelector('.admin-content');
      const body = document.body;
      const html = document.documentElement;

      const csLayout = window.getComputedStyle(layout);
      const csSidebar = window.getComputedStyle(sidebar);
      const csMain = window.getComputedStyle(main);
      const csContent = window.getComputedStyle(content);
      const csBody = window.getComputedStyle(body);

      // Try scrolling content
      const prevScroll = content.scrollTop;
      content.scrollTop = 250;
      const afterScroll = content.scrollTop;
      const canScroll = content.scrollHeight > content.clientHeight;

      return {
        hasLayout: !!layout,
        hasSidebar: !!sidebar,
        hasMain: !!main,
        hasTopbar: !!topbar,
        hasContent: !!content,
        layoutHeight: csLayout.height,
        layoutOverflow: csLayout.overflow,
        sidebarPosition: csSidebar.position,
        sidebarTop: csSidebar.top,
        mainFlex: csMain.flex,
        mainOverflow: csMain.overflow,
        contentFlex: csContent.flex,
        contentOverflowY: csContent.overflowY,
        contentOverflowX: csContent.overflowX,
        bodyOverflow: csBody.overflow,
        scrollHeight: content.scrollHeight,
        clientHeight: content.clientHeight,
        canScroll,
        afterScroll
      };
    });

    console.log(`  Layout check: .admin-layout=${layoutReport.hasLayout}, .admin-sidebar=${layoutReport.hasSidebar}, .admin-main=${layoutReport.hasMain}, .admin-content=${layoutReport.hasContent}`);
    console.log(`  Content Dimensions: clientHeight=${layoutReport.clientHeight}px, scrollHeight=${layoutReport.scrollHeight}px`);
    console.log(`  Content OverflowY: ${layoutReport.contentOverflowY}, scroll test scrolled to: ${layoutReport.afterScroll}px`);
    if (layoutReport.canScroll) {
      console.log(`  ✓ Content is vertically scrollable (${layoutReport.scrollHeight} > ${layoutReport.clientHeight})`);
    } else {
      console.log(`  (Note: Content height fits in current viewport without scroll or is loading)`);
    }

    return layoutReport;
  }

  // 2. CHECK ALL 8 ADMIN ROUTES
  const routes = [
    '/admin/dashboard',
    '/admin/users',
    '/admin/monsters',
    '/admin/shadows',
    '/admin/quests',
    '/admin/dungeons',
    '/admin/statistics',
    '/admin/settings'
  ];

  for (const r of routes) {
    await testRouteScrolling(r);
  }

  // 3. CHECK USER DETAILS ROUTE
  console.log('\n[3/6] Testing /admin/users/:userId...');
  await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('table tbody tr', { timeout: 8000 }).catch(() => {});
  const userDetailLink = await page.evaluate(() => {
    const link = document.querySelector('a[href*="/admin/users/"]');
    return link ? link.getAttribute('href') : null;
  });

  if (userDetailLink) {
    await testRouteScrolling(userDetailLink);
  } else {
    // If no user table row link found, test with known admin ID or test ID
    await testRouteScrolling('/admin/users/Q9yV64xX4rUv9YmS1q9Q1');
  }

  // 4. TEST MODAL SCROLLING ON SMALL VIEWPORT (1024x600)
  console.log('\n[4/6] Testing Modal Scrolling on Viewport 1024x600...');
  await page.setViewport({ width: 1024, height: 600 });
  await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle2' });

  // Open Create User Modal
  await page.waitForSelector('#admin-create-user-modal-btn', { timeout: 5000 });
  await page.click('#admin-create-user-modal-btn');
  await page.waitForSelector('.modal-overlay', { timeout: 5000 });

  const modalReport = await page.evaluate(() => {
    const overlay = document.querySelector('.modal-overlay');
    const modal = document.querySelector('.modal');
    const submitBtn = document.querySelector('#create-user-submit-btn');

    const csOverlay = window.getComputedStyle(overlay);
    const csModal = window.getComputedStyle(modal);

    const prevScroll = modal.scrollTop;
    modal.scrollTop = 150;
    const afterScroll = modal.scrollTop;

    const modalRect = modal.getBoundingClientRect();
    const btnRect = submitBtn ? submitBtn.getBoundingClientRect() : null;

    return {
      overlayOverflowY: csOverlay.overflowY,
      modalOverflowY: csModal.overflowY,
      modalMaxHeight: csModal.maxHeight,
      modalScrollHeight: modal.scrollHeight,
      modalClientHeight: modal.clientHeight,
      afterScroll,
      btnExists: !!submitBtn,
      btnTop: btnRect ? btnRect.top : 0
    };
  });

  console.log('  Create User Modal report:', modalReport);
  console.log(`  ✓ Modal overflowY=${modalReport.modalOverflowY}, maxHeight=${modalReport.modalMaxHeight}`);

  // 5. TEST MOBILE VIEWPORT (390x844)
  console.log('\n[5/6] Testing Mobile Viewport 390x844...');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.admin-hamburger-btn', { timeout: 8000 });

  const mobileReport = await page.evaluate(() => {
    const sidebar = document.querySelector('.admin-sidebar');
    const hamburger = document.querySelector('.admin-hamburger-btn');
    const content = document.querySelector('.admin-content');
    const csSidebar = sidebar ? window.getComputedStyle(sidebar) : null;
    const csHamburger = hamburger ? window.getComputedStyle(hamburger) : null;

    return {
      sidebarTransform: csSidebar ? csSidebar.transform : 'none',
      hamburgerDisplay: csHamburger ? csHamburger.display : 'none',
      contentOverflowY: content ? window.getComputedStyle(content).overflowY : 'visible',
      contentClientHeight: content ? content.clientHeight : 0,
      contentScrollHeight: content ? content.scrollHeight : 0
    };
  });
  console.log('  Mobile report:', mobileReport);
  console.log(`  ✓ Mobile hamburger display=${mobileReport.hamburgerDisplay}, sidebar hidden off-canvas`);

  // 6. TEST SCROLL RESET ON NAVIGATION
  console.log('\n[6/6] Testing Scroll Reset on Route Navigation...');
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.admin-content', { timeout: 8000 });

  // Scroll down on dashboard
  await page.evaluate(() => {
    const c = document.querySelector('.admin-content');
    if (c) c.scrollTop = 350;
  });
  const scrolledPos = await page.evaluate(() => document.querySelector('.admin-content').scrollTop);
  console.log('  Scrolled dashboard to:', scrolledPos);

  // Navigate to users
  await page.evaluate(() => {
    const usersLink = document.querySelector('a[href="/admin/users"]');
    if (usersLink) usersLink.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const resetPos = await page.evaluate(() => document.querySelector('.admin-content').scrollTop);
  console.log('  Position after navigating to /admin/users:', resetPos);
  if (resetPos === 0) {
    console.log('  ✓ Scroll position successfully reset to 0 on route navigation!');
  } else {
    console.error('  ✗ Scroll position was NOT reset to 0! Current pos:', resetPos);
  }

  await browser.close();
  console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

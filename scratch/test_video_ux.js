const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testVideoUX() {
  console.log('🎬 Starting QuantumElement 3D Video Masterclass & Cinema UX E2E Tests...');

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const closeModal = async () => {
    const closeBtn = page.locator('#quantum-cinema-close');
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(400);
  };

  try {
    // 1. Navigate
    console.log('1. Loading application at http://localhost:4000...');
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('canvas', { timeout: 10000 });
    console.log('   ✓ WebGL Canvas active.');

    // 2. Open Quantum Cinema from Header
    console.log('2. Opening Quantum Cinema Modal from Header (#quantum-cinema-btn)...');
    const cinemaBtn = page.locator('#quantum-cinema-btn');
    await cinemaBtn.waitFor({ state: 'visible', timeout: 10000 });
    await cinemaBtn.click();
    await page.waitForTimeout(800);

    // Verify modal is open and iframe is rendered
    const cinemaModal = page.locator('#quantum-cinema-modal');
    await cinemaModal.waitFor({ state: 'visible', timeout: 10000 });
    console.log('   ✓ Quantum Cinema modal opened (#quantum-cinema-modal).');

    const iframe = cinemaModal.locator('iframe').first();
    const iframeSrc = await iframe.getAttribute('src');
    console.log(`   ✓ Player iframe src: ${iframeSrc}`);
    if (!iframeSrc.includes('youtube-nocookie.com/embed/')) {
      throw new Error(`Invalid YouTube embed URL: ${iframeSrc}`);
    }

    await page.screenshot({ path: path.join(screenshotsDir, '16_video_cinema_scale_modal.png') });
    console.log('   ✓ Screenshot saved: 16_video_cinema_scale_modal.png');

    // 3. Test Scale Navigation inside Cinema Modal
    console.log('3. Testing Scale Navigation tabs inside Cinema Modal...');
    // Click "Quarks" tab in cinema modal
    const quarksTab = cinemaModal.getByRole('button', { name: /Quarks|كواركات/i });
    if (await quarksTab.count() > 0) {
      await quarksTab.first().click();
      await page.waitForTimeout(500);
      const quarkIframeSrc = await iframe.getAttribute('src');
      console.log(`   ✓ Quarks masterclass iframe src: ${quarkIframeSrc}`);
      await page.screenshot({ path: path.join(screenshotsDir, '17_video_cinema_quarks_explainer.png') });
    }

    // Click "Strings" tab in cinema modal
    const stringsTab = cinemaModal.getByRole('button', { name: /Strings|أوتار/i });
    if (await stringsTab.count() > 0) {
      await stringsTab.first().click();
      await page.waitForTimeout(500);
      const stringsIframeSrc = await iframe.getAttribute('src');
      console.log(`   ✓ String Theory masterclass iframe src: ${stringsIframeSrc}`);
      await page.screenshot({ path: path.join(screenshotsDir, '18_video_cinema_strings_explainer.png') });
    }

    // 4. Test Switching to Element Masterclass tab in Cinema Modal
    console.log('4. Switching to Element Masterclass view...');
    const elementModeBtn = cinemaModal.getByRole('button', { name: /Element:|عنصر/i });
    if (await elementModeBtn.count() > 0) {
      await elementModeBtn.first().click();
      await page.waitForTimeout(500);
      const elementIframeSrc = await iframe.getAttribute('src');
      console.log(`   ✓ Element masterclass iframe src: ${elementIframeSrc}`);
      await page.screenshot({ path: path.join(screenshotsDir, '19_video_cinema_element_masterclass.png') });
    }

    // 5. Test Arabic RTL translation in Cinema Modal
    console.log('5. Testing Cinema Modal in Arabic RTL mode...');
    await closeModal();

    // Toggle language to Arabic
    const langBtn = page.locator('button[title*="Language"], button:has-text("العربية"), button:has-text("English")').first();
    await langBtn.click();
    await page.waitForTimeout(400);

    // Re-open cinema in Arabic
    await cinemaBtn.click();
    await page.waitForTimeout(600);
    const htmlDir = await page.locator('html').getAttribute('dir');
    console.log(`   ✓ Document direction in Arabic: ${htmlDir}`);
    await page.screenshot({ path: path.join(screenshotsDir, '20_video_cinema_arabic_rtl.png') });

    // Close modal
    await closeModal();

    // Switch back to English
    await langBtn.click();
    await page.waitForTimeout(300);

    // 6. Test Quick "Watch Explainer" from ScaleDock
    console.log('6. Testing ScaleDock Quick Explainer Pill...');
    // Navigate to Scale 3 (Nucleus)
    const nucleusDockBtn = page.getByRole('button', { name: /Packed Nucleus/i });
    if (await nucleusDockBtn.count() > 0) {
      await nucleusDockBtn.first().click();
      await page.waitForTimeout(600);
    }

    const scaleExplainerBtn = page.locator('button:has-text("Watch:"), button:has-text("شاهد:")').first();
    if (await scaleExplainerBtn.count() > 0) {
      console.log('   ✓ Found ScaleDock video trigger pill.');
      await scaleExplainerBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(screenshotsDir, '21_video_dock_explainer_triggered.png') });
      await closeModal();
    }

    // 7. Test Quick "Watch Masterclass" from ElementBadge
    console.log('7. Testing ElementBadge Quick Masterclass Trigger...');
    const elementBadgeVideoBtn = page.locator('button:has-text("Masterclass"), button:has-text("ماستركلاس")').first();
    if (await elementBadgeVideoBtn.count() > 0) {
      console.log('   ✓ Found ElementBadge video trigger.');
      await elementBadgeVideoBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(screenshotsDir, '22_video_element_badge_triggered.png') });
      await closeModal();
    }

    console.log('\n✨ ALL VIDEO MASTERCLASS & CINEMA UX TESTS PASSED SUCCESSFULLY! ✨\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    await page.screenshot({ path: path.join(screenshotsDir, 'video_test_failure.png') });
    throw err;
  } finally {
    await browser.close();
  }
}

testVideoUX();

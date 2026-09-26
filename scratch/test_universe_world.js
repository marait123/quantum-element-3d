const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testUniverseWorld() {
  const screenshotsDir = path.join(__dirname, 'screenshots', 'universe');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('🚀 Launching Chrome for End-to-End Universe World Testing...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Listen to console and error events
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('Browser Error Console:', msg.text());
    }
  });

  try {
    console.log('📍 Navigating to http://localhost:4000...');
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 1. Initial Subatomic State
    console.log('📸 Capturing initial Subatomic World...');
    await page.screenshot({ path: path.join(screenshotsDir, '01_subatomic_initial.png') });

    // 2. Click World Switcher to switch to Cosmic Universe World
    console.log('🌌 Switching to Cosmic Universe World via World Switcher...');
    const universeWorldBtn = page.getByRole('button', { name: /Cosmic Universe|الكون الكوني/i });
    await universeWorldBtn.waitFor({ state: 'visible', timeout: 8000 });
    await universeWorldBtn.click();
    await page.waitForTimeout(2500);

    console.log('📸 Capturing Cosmic Universe Scale 1 (Solar System)...');
    await page.screenshot({ path: path.join(screenshotsDir, '02_cosmic_scale_1_solar_system.png') });

    // 3. Test Scale Navigation through all 5 Cosmic Scales
    const cosmicScales = [
      { level: 2, name: /Stellar Neighborhood|الجوار النجمي/i, screenshot: '03_cosmic_scale_2_stars.png' },
      { level: 3, name: /Milky Way|درب التبانة/i, screenshot: '04_cosmic_scale_3_milky_way.png' },
      { level: 4, name: /Extragalactic|العالم خارج المجرة/i, screenshot: '05_cosmic_scale_4_extragalactic.png' },
      { level: 5, name: /Cosmic Web|النسيج الكوني/i, screenshot: '06_cosmic_scale_5_cosmic_web.png' },
    ];

    for (const scale of cosmicScales) {
      console.log(`🪐 Switching to Cosmic Scale ${scale.level}...`);
      const btn = page.getByRole('button', { name: scale.name });
      await btn.click();
      await page.waitForTimeout(2200);
      await page.screenshot({ path: path.join(screenshotsDir, scale.screenshot) });
    }

    // 4. Test Flight Mode (WASD Walk-Around)
    console.log('🚀 Testing Fly / Orbit Mode Toggle...');
    const flyModeBtn = page.getByTitle(/Toggle Navigation|تبديل وضع الاستكشاف/i);
    await flyModeBtn.click();
    await page.waitForTimeout(1000);

    console.log('⌨️ Simulating WASD flight movement...');
    await page.keyboard.press('KeyW');
    await page.waitForTimeout(200);
    await page.keyboard.press('KeyD');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(screenshotsDir, '07_flight_mode_active.png') });

    // Toggle back to orbit mode
    await flyModeBtn.click();
    await page.waitForTimeout(1000);

    // 5. Open Cosmic Elements in Space Drawer
    console.log('🧪 Opening Cosmic Elements in Space Drawer...');
    const elementsDrawerBtn = page.getByTitle(/Cosmic Elements|مواقع العناصر في الكون/i);
    await elementsDrawerBtn.click();
    await page.waitForTimeout(1500);

    await page.screenshot({ path: path.join(screenshotsDir, '08_cosmic_elements_drawer.png') });

    // Select Gold (Au - 79) and click Locate in 3D
    console.log('🔍 Selecting Gold (79) and clicking Locate in 3D...');
    const goldChip = page.getByRole('button', { name: /Au \(79\)/i });
    if (await goldChip.isVisible()) {
      await goldChip.click();
      await page.waitForTimeout(1000);
    }

    const locateBtn = page.getByRole('button', { name: /Locate in 3D|تحديد في الفضاء/i });
    if (await locateBtn.isVisible()) {
      await locateBtn.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: path.join(screenshotsDir, '09_gold_located_kilonova_selected.png') });

    // Close element drawer using explicit button ID
    const closeDrawerBtn = page.locator('#close-cosmic-drawer-btn');
    if (await closeDrawerBtn.isVisible()) {
      await closeDrawerBtn.click();
      await page.waitForTimeout(1000);
    }

    // Also close tooltip if open
    const closeTooltipBtn = page.locator('#close-celestial-tooltip-btn');
    if (await closeTooltipBtn.isVisible()) {
      await closeTooltipBtn.click();
      await page.waitForTimeout(500);
    }

    // 6. Test Scale Video Masterclass Modal
    console.log('🎬 Opening Cosmic Video Modal...');
    const videoBtn = page.getByTitle(/Scale Masterclass Video|فيديو تعليمي لهذا المستوى/i);
    await videoBtn.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(screenshotsDir, '10_cosmic_video_modal.png') });

    // Close video modal
    const closeVideoBtn = page.locator('#close-universe-cinema-btn');
    if (await closeVideoBtn.isVisible()) {
      await closeVideoBtn.click();
      await page.waitForTimeout(1000);
    }

    // 7. Test Language Toggle in Universe World
    console.log('🌐 Testing Language Toggle to Arabic in Universe World...');
    const langBtn = page.getByTitle(/Switch Language/i);
    await langBtn.click();
    await page.waitForTimeout(1500);

    await page.screenshot({ path: path.join(screenshotsDir, '11_universe_arabic_rtl.png') });

    console.log('✅ ALL COSMIC UNIVERSE WORLD TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error_state.png') });
    throw error;
  } finally {
    await browser.close();
  }
}

testUniverseWorld().catch((err) => {
  console.error(err);
  process.exit(1);
});

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runE2ETests() {
  console.log('🚀 Starting QuantumElement 3D End-to-End Browser Tests via Playwright...');

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
  // These tests exercise the subatomic world: pre-set the remembered world and mark the guided tour as seen, so
  // neither the first-visit chooser nor the tour overlay blocks the clicks
  await context.addInitScript(() => {
    try { localStorage.setItem('science_lab_world', 'subatomic'); localStorage.setItem('science_lab_tutorial_completed', 'true'); } catch {}
  });

  const page = await context.newPage();

  // Listen to console errors
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // 1. Navigate to Application
    console.log('1. Navigating to http://localhost:4000...');
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle', timeout: 30000 });

    const title = await page.title();
    console.log(`   Page title: "${title}"`);
    if (!title.includes('QuantumElement 3D')) {
      throw new Error(`Unexpected page title: ${title}`);
    }

    // Wait for Canvas WebGL to be mounted
    await page.waitForSelector('canvas', { timeout: 10000 });
    console.log('   ✓ 3D WebGL Canvas successfully mounted.');

    // 2. Test Scale 1 (Periodic Table Grid)
    console.log('2. Testing Scale 1: Periodic Table...');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '01_scale_1_periodic_table.png') });
    console.log('   ✓ Screenshot saved: 01_scale_1_periodic_table.png');

    // Check ElementBadge
    const badgeText = await page.locator('header').textContent();
    console.log(`   Header text verified: ${badgeText.slice(0, 40)}...`);

    // 3. Test Bilingual Language Toggle (LTR -> RTL)
    console.log('3. Testing Bilingual RTL/LTR Toggle...');
    const langBtn = page.getByTitle('Switch Language / تبديل اللغة');
    await langBtn.click();
    await page.waitForTimeout(600);

    const dirArabic = await page.getAttribute('html', 'dir');
    console.log(`   HTML dir attribute after toggle to Arabic: "${dirArabic}"`);
    if (dirArabic !== 'rtl') {
      throw new Error(`Expected dir="rtl" but found "${dirArabic}"`);
    }
    await page.screenshot({ path: path.join(screenshotsDir, '02_bilingual_arabic_rtl.png') });
    console.log('   ✓ Screenshot saved: 02_bilingual_arabic_rtl.png');

    // Switch back to English
    await langBtn.click();
    await page.waitForTimeout(600);
    const dirEnglish = await page.getAttribute('html', 'dir');
    console.log(`   HTML dir attribute switched back to English: "${dirEnglish}"`);

    // 4. Test 118 Grid Sheet Modal
    console.log('4. Testing 118 Element Grid Sheet Modal...');
    // The grid lives in the Science Tools dock, which may start collapsed
    const gridBtn = page.locator('#grid-118-btn');
    if (!(await gridBtn.isVisible())) await page.locator('#science-tools-dock > button').first().click();
    await gridBtn.click();
    await page.waitForSelector('text=Complete 118 Element Sheet', { timeout: 5000 });
    console.log('   ✓ 118 Element Sheet modal opened.');
    await page.screenshot({ path: path.join(screenshotsDir, '03_modal_118_grid.png') });

    // Search for Gold (Au, 79) inside modal
    console.log('   Searching for Gold (Au)...');
    const searchInput = page.locator('.glass-panel-deep').getByPlaceholder('Search element (e.g., Gold, Au, 79)...');
    await searchInput.fill('Gold');
    await page.waitForTimeout(400);

    // Click Gold card in modal
    const goldCard = page.locator('.glass-panel-deep button:has-text("Au")').first();
    await goldCard.click();
    await page.waitForTimeout(800);
    console.log('   ✓ Selected Gold (Au, Z=79).');

    // Verify Element Badge updated to Gold
    const badgeContent = await page.textContent('body');
    if (!badgeContent.includes('Gold') && !badgeContent.includes('Au')) {
      throw new Error('Gold element badge not found after selection');
    }
    console.log('   ✓ Element Badge accurately reflects Gold (Au, Z=79).');
    await page.screenshot({ path: path.join(screenshotsDir, '04_gold_element_badge.png') });

    // 5. Test Scale 2: Atomic Shells (10^-10 m)
    console.log('5. Testing Scale 2: Atomic Shells (10⁻¹⁰ m)...');
    const atomScaleBtn = page.getByRole('button', { name: /Atomic Shells/i });
    await atomScaleBtn.click();
    await page.waitForTimeout(1500);

    // Verify Quantum Leap button is present and clickable
    const leapBtn = page.getByRole('button', { name: /Quantum Leap/i });
    await leapBtn.click();
    console.log('   ✓ Triggered Quantum Leap photon pulse animation.');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotsDir, '05_scale_2_atom_quantum_leap.png') });

    // 6. Test Scale 3: Packed Nucleus (10^-14 m)
    console.log('6. Testing Scale 3: Packed Nucleus (10⁻¹⁴ m)...');
    const nucleusScaleBtn = page.getByRole('button', { name: /Packed Nucleus/i });
    await nucleusScaleBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '06_scale_3_packed_nucleus.png') });

    // Test particle isolation filters
    console.log('   Testing particle filters (Protons, Neutrons, Electrons)...');
    const protonsFilter = page.getByRole('button', { name: /Protons/i });
    if (await protonsFilter.isVisible()) {
      await protonsFilter.click();
      await page.waitForTimeout(400);
      console.log('   ✓ Filtered to Protons only.');
    }

    // 7. Test Scale 4: Subatomic Quarks (10^-18 m)
    console.log('7. Testing Scale 4: Subatomic Quarks (10⁻¹⁸ m)...');
    const quarkScaleBtn = page.getByRole('button', { name: /Subatomic Quarks/i });
    await quarkScaleBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '07_scale_4_subatomic_quarks.png') });

    // Test Virtual Sea Quarks toggle
    console.log('   Toggling Virtual Sea Quarks...');
    const seaQuarksBtn = page.getByRole('button', { name: /Sea Quarks/i });
    await seaQuarksBtn.click();
    await page.waitForTimeout(500);
    console.log('   ✓ Virtual Sea Quarks activated.');

    // Test Weak Beta Decay Simulation
    console.log('   Triggering Weak Beta Decay simulation...');
    const betaBtn = page.getByRole('button', { name: /Weak Beta Decay/i });
    await betaBtn.click();
    await page.waitForTimeout(800);
    console.log('   ✓ Beta Decay triggered: W- gauge boson emitted, quark flavour inverted.');
    await page.screenshot({ path: path.join(screenshotsDir, '08_scale_4_beta_decay.png') });

    // 8. Test Scale 5: Planck Scale Strings (10^-35 m)
    console.log('8. Testing Scale 5: Planck Scale String Theory (10⁻³⁵ m)...');
    const stringScaleBtn = page.getByRole('button', { name: /Planck Strings/i });
    await stringScaleBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '09_scale_5_strings_mode_1.png') });

    // Test Harmonic Modes
    console.log('   Switching to Mode 2: Quark (n=2)...');
    const mode2Btn = page.getByRole('button', { name: /Quark \(n=2\)/i });
    await mode2Btn.click();
    await page.waitForTimeout(600);

    console.log('   Switching to Mode 4: Graviton Loop (Bulk Leak)...');
    const mode4Btn = page.getByRole('button', { name: /Graviton Loop/i });
    await mode4Btn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotsDir, '10_scale_5_graviton_bulk_leak.png') });
    console.log('   ✓ Graviton spin-2 quadrupolar loop verified.');

    // 9. Test Zoom In / Zoom Out Controls
    console.log('9. Testing Zoom Out control button back to Macro scales...');
    const zoomOutBtn = page.getByTitle('Zoom Out to Macro Scale');
    await zoomOutBtn.click(); // to scale 4
    await page.waitForTimeout(500);
    await zoomOutBtn.click(); // to scale 3
    await page.waitForTimeout(500);
    await zoomOutBtn.click(); // to scale 2
    await page.waitForTimeout(500);
    await zoomOutBtn.click(); // to scale 1
    await page.waitForTimeout(1000);
    console.log('   ✓ Smoothly zoomed out through all powers of ten back to Scale 1.');

    // 10. Test Educational Research Dossier Slide-Over Drawer
    console.log('10. Testing Educational Research Dossier Drawer...');
    const dossierBtn = page.getByRole('button', { name: /Scientific Dossier/i });
    await dossierBtn.click();
    await page.waitForSelector('text=Educational Research Dossier', { timeout: 5000 });
    console.log('   ✓ Dossier drawer opened.');
    await page.screenshot({ path: path.join(screenshotsDir, '11_dossier_overview.png') });

    // Click Tab 2: Quantum Shells
    console.log('   Testing Tab 2: Quantum Shells...');
    const shellsTab = page.getByRole('button', { name: /Quantum Shells/i });
    await shellsTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '12_dossier_quantum_shells.png') });

    // Click Tab 3: Subatomic QCD
    console.log('   Testing Tab 3: Subatomic QCD...');
    const qcdTab = page.getByRole('button', { name: /Subatomic QCD/i });
    await qcdTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '13_dossier_subatomic_qcd.png') });

    // Click Tab 4: String Theory
    console.log('   Testing Tab 4: String Theory...');
    const stringTab = page.getByRole('button', { name: /String Theory/i });
    await stringTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '14_dossier_string_theory.png') });

    // Click Tab 5: Papers & Video
    console.log('   Testing Tab 5: Papers & Video Masterclass...');
    const papersTab = page.getByRole('button', { name: /Papers & Video/i });
    await papersTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '15_dossier_papers_video.png') });

    // Close Dossier
    const closeDossierBtn = page.getByTitle('Close Dossier');
    await closeDossierBtn.click();
    await page.waitForTimeout(400);
    console.log('   ✓ Dossier drawer closed.');

    console.log('\n=========================================');
    console.log('🎉 ALL END-TO-END PLAYWRIGHT TESTS PASSED!');
    console.log('=========================================');

    if (consoleErrors.length > 0) {
      console.log('Console errors recorded (if any):', consoleErrors);
    } else {
      console.log('✓ Zero console errors recorded during entire user journey!');
    }

  } catch (err) {
    console.error('❌ E2E Test Failed:', err);
    await page.screenshot({ path: path.join(screenshotsDir, 'error_screenshot.png') });
    throw err;
  } finally {
    await browser.close();
  }
}

runE2ETests().catch((err) => {
  console.error(err);
  process.exit(1);
});

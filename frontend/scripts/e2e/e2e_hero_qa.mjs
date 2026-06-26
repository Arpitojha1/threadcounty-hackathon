import { chromium } from 'playwright';

(async () => {
  console.log("Starting Landing Page QA Verification...\n");
  const browser = await chromium.launch();

  // ── TEST 1: All sections still render ──────────────────────
  console.log("--- TEST 1: Section rendering check ---");
  const ctx1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx1.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Wait for hero canvas to be present
  const heroCanvas = await page.locator('#hero canvas').count();
  console.log("Hero canvas present:", heroCanvas > 0);

  // Scroll to bottom to trigger lazy sections
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);

  // Check each section
  const sections = [
    { name: "Hero (#hero)", selector: "#hero" },
    { name: "Navbar (nav)", selector: "nav" },
    { name: "Features", selector: "text=Features" },
    { name: "Workflow", selector: "text=How It Works" },
  ];
  
  for (const s of sections) {
    const count = await page.locator(s.selector).count();
    console.log(`  ${s.name}: ${count > 0 ? "FOUND" : "MISSING"}`);
  }

  // Check full body text for key section keywords
  const bodyText = await page.locator('body').innerText();
  const keywords = ["Features", "How It Works", "Testimonial", "Pricing", "Footer"];
  for (const kw of keywords) {
    console.log(`  Body contains "${kw}": ${bodyText.toLowerCase().includes(kw.toLowerCase())}`);
  }

  // Take desktop screenshot
  await page.screenshot({ path: 'hero_desktop.png', fullPage: false });
  console.log("Desktop screenshot saved: hero_desktop.png");

  // ── TEST 2: Mobile viewport ────────────────────────────────
  console.log("\n--- TEST 2: Mobile viewport (375×812) ---");
  await ctx1.close();
  const ctx2 = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mobilePage = await ctx2.newPage();
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  const mobileCanvas = await mobilePage.locator('#hero canvas');
  const mobileCanvasBox = await mobileCanvas.boundingBox();
  console.log("Canvas bounding box:", JSON.stringify(mobileCanvasBox));
  console.log("Canvas fills viewport width:", mobileCanvasBox && mobileCanvasBox.width === 375);
  console.log("Canvas fills viewport height:", mobileCanvasBox && mobileCanvasBox.height === 812);

  // Check for letterboxing (canvas should be full screen, no gaps)
  const heroSection = await mobilePage.locator('#hero');
  const heroBox = await heroSection.boundingBox();
  console.log("Hero section height:", heroBox?.height);

  await mobilePage.screenshot({ path: 'hero_mobile.png', fullPage: false });
  console.log("Mobile screenshot saved: hero_mobile.png");
  await ctx2.close();

  // ── TEST 3: Reduced motion fallback ────────────────────────
  console.log("\n--- TEST 3: prefers-reduced-motion ---");
  const ctx3 = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const rmPage = await ctx3.newPage();
  await rmPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await rmPage.waitForTimeout(2000);

  // In reduced motion, section height should be 100vh (not 400vh)
  const rmHero = await rmPage.locator('#hero');
  const rmHeroBox = await rmHero.boundingBox();
  console.log("Reduced-motion hero height:", rmHeroBox?.height);
  console.log("Is ~100vh (not 400vh):", rmHeroBox && rmHeroBox.height <= 920);

  // Canvas should still be present
  const rmCanvas = await rmPage.locator('#hero canvas').count();
  console.log("Canvas still renders:", rmCanvas > 0);

  // No scroll-hint chevron
  const chevron = await rmPage.locator('#hero svg polyline[points="6 9 12 15 18 9"]').count();
  console.log("Scroll-hint chevron hidden:", chevron === 0);

  await rmPage.screenshot({ path: 'hero_reduced_motion.png', fullPage: false });
  console.log("Reduced-motion screenshot saved: hero_reduced_motion.png");
  await ctx3.close();

  // ── TEST 4: Scroll scrub behavior ──────────────────────────
  console.log("\n--- TEST 4: Scroll scrub & card reveals ---");
  const ctx4 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const scrubPage = await ctx4.newPage();
  await scrubPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  // Wait for frames to load
  await scrubPage.waitForTimeout(5000);

  // Scroll to card 1 milestone (~20% of 400vh = ~720px)
  await scrubPage.evaluate(() => window.scrollTo(0, 720));
  await scrubPage.waitForTimeout(500);
  await scrubPage.screenshot({ path: 'hero_card1.png', fullPage: false });
  console.log("Card 1 screenshot saved (scroll ~20%)");

  // Scroll to card 2 milestone (~48% of 400vh = ~1728px)
  await scrubPage.evaluate(() => window.scrollTo(0, 1728));
  await scrubPage.waitForTimeout(500);
  await scrubPage.screenshot({ path: 'hero_card2.png', fullPage: false });
  console.log("Card 2 screenshot saved (scroll ~48%)");

  // Scroll to card 3 milestone (~72% of 400vh = ~2592px)
  await scrubPage.evaluate(() => window.scrollTo(0, 2592));
  await scrubPage.waitForTimeout(500);
  await scrubPage.screenshot({ path: 'hero_card3.png', fullPage: false });
  console.log("Card 3 screenshot saved (scroll ~72%)");

  await ctx4.close();
  await browser.close();
  console.log("\nAll tests complete.");
})();

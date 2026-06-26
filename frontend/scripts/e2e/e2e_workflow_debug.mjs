import { chromium } from 'playwright';

(async () => {
  console.log("Starting Workflow Debug Script...\n");
  const browser = await chromium.launch();

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  
  console.log("Navigating to http://localhost:3000...");
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  const workflowSection = page.locator('#workflow');
  await workflowSection.waitFor({ state: 'attached' });
  const box = await workflowSection.boundingBox();
  console.log("Workflow bounding box:", JSON.stringify(box));

  if (!box) {
    console.error("Workflow section not found!");
    process.exit(1);
  }

  const startY = box.y; 
  const scrollDistance = box.height - 900; 
  
  console.log(`Workflow starts at Y: ${startY}. Scroll distance to progress=1.0 is ${scrollDistance}px.`);

  const intervals = [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.9, 1.0];
  
  for (const p of intervals) {
    const scrollY = startY + (scrollDistance * p);
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(500);
    
    const count = await page.locator('#workflow .grid').count();
    console.log(`At progress ${p} (scrollY: ${scrollY}): found ${count} grid container`);
    
    if (p === 0.55) {
      const html = await page.evaluate(() => {
        const grid = document.querySelector('#workflow .grid');
        return grid ? grid.innerHTML : 'No grid';
      });
      console.log("GRID HTML at 0.55:\n", html);
    }
    
    await page.screenshot({ path: `workflow_debug_progress_${p.toFixed(2)}.png`, fullPage: false });
    console.log(`Saved workflow_debug_progress_${p.toFixed(2)}.png`);
  }
  
  // Now take the hero screenshot
  await page.evaluate(() => window.scrollTo(0, 720));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'hero_bug_fix_verification.png', fullPage: false });
  console.log("Saved hero_bug_fix_verification.png for Hero validation.");

  await ctx.close();
  await browser.close();
  console.log("Done.");
})();

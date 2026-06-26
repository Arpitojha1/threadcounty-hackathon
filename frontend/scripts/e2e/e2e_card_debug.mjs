import { chromium } from 'playwright';

(async () => {
  console.log("Card milestone debug...\n");
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  // Wait for preload
  await p.waitForTimeout(6000);

  // Get hero section dimensions
  const heroRect = await p.evaluate(() => {
    const el = document.getElementById('hero');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      height: rect.height,
      scrollHeight: document.body.scrollHeight,
      viewportHeight: window.innerHeight,
    };
  });
  console.log("Hero section:", JSON.stringify(heroRect));

  // scrollYProgress goes 0→1 as the container scrolls from "start start" to "end end"
  // That means progress = scrollY / (heroHeight - viewportHeight)
  // For 400vh at 900px viewport: heroHeight = 3600, scrollRange = 3600 - 900 = 2700
  
  if (!heroRect) { console.log("Hero not found!"); await b.close(); return; }
  
  const scrollRange = heroRect.height - heroRect.scrollHeight + heroRect.height;
  console.log("Calculated scroll range:", heroRect.height - 900);
  
  // Card 1 target: progress 0.20 → scrollY = 0.20 * (3600 - 900) = 540
  // Card 2 target: progress 0.48 → scrollY = 0.48 * 2700 = 1296
  // Card 3 target: progress 0.72 → scrollY = 0.72 * 2700 = 1944

  const positions = [
    { name: "Card 1 (progress ~0.20)", scrollY: Math.floor(0.20 * (heroRect.height - 900)) },
    { name: "Card 2 (progress ~0.48)", scrollY: Math.floor(0.48 * (heroRect.height - 900)) },
    { name: "Card 3 (progress ~0.72)", scrollY: Math.floor(0.72 * (heroRect.height - 900)) },
  ];

  for (const pos of positions) {
    await p.evaluate((y) => window.scrollTo(0, y), pos.scrollY);
    await p.waitForTimeout(300);
    
    // Check what cards are visible
    const cards = await p.evaluate(() => {
      const panels = document.querySelectorAll('#hero [class*="absolute"][class*="bottom"]');
      const results = [];
      panels.forEach(el => {
        const style = window.getComputedStyle(el);
        const opacity = parseFloat(style.opacity);
        const text = el.textContent?.trim().substring(0, 50);
        results.push({ opacity: opacity.toFixed(2), text });
      });
      return results;
    });
    
    console.log(`\n${pos.name} (scrollY: ${pos.scrollY}):`);
    cards.forEach(card => {
      console.log(`  opacity=${card.opacity} | "${card.text}"`);
    });
    
    await p.screenshot({ path: `hero_debug_${pos.name.replace(/[^a-z0-9]/gi, '_')}.png`, fullPage: false });
  }

  await b.close();
  console.log("\nDone.");
})();

import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({viewport:{width:1440,height:900}});
  const p = await c.newPage();
  await p.goto('http://localhost:3000', {waitUntil:'networkidle'});
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(2000);
  const t = await p.locator('body').innerText();
  
  // Check for sections that didn't match simple keywords
  console.log("Contains ThreadCounty:", t.includes("ThreadCounty") || t.includes("THREAD"));
  console.log("Contains pricing-related:", t.includes("Free") || t.includes("PRICING") || t.includes("month") || t.includes("Choose"));
  
  // Look at footer element specifically
  const footer = await p.locator('footer');
  const footerCount = await footer.count();
  console.log("Footer element present:", footerCount > 0);
  if (footerCount > 0) {
    console.log("Footer text:", await footer.first().innerText());
  }
  
  // Check all major section headings
  const headings = await p.locator('h2').allInnerTexts();
  console.log("All h2 headings found:", headings);
  
  // Count all sections
  const sectionCount = await p.locator('section').count();
  console.log("Total <section> elements:", sectionCount);
  
  await b.close();
})();

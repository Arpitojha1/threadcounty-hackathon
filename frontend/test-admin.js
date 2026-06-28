const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to login...");
  await page.goto('http://localhost:3000/login');
  
  console.log("Logging in...");
  // Fill out the login form
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'password123'); // Assuming standard mock credentials
  
  // Click submit
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard**');
  
  console.log("Navigating to admin...");
  await page.goto('http://localhost:3000/dashboard/admin');
  
  // Wait for the reports table to render
  await page.waitForSelector('text=System Reports');
  await page.waitForTimeout(2000); // Give it a sec to load data
  
  // Check the DOM for the thumbnail
  const thumbnails = await page.$$('img.w-full.h-full.object-cover');
  if (thumbnails.length > 0) {
    console.log("Found thumbnail rendering correctly!");
    const src = await thumbnails[0].getAttribute('src');
    console.log(`Image src: ${src}`);
    
    // Check if we can click it to open the modal
    await thumbnails[0].click();
    await page.waitForSelector('img.object-contain');
    const expandedImg = await page.$('img.object-contain');
    const expandedSrc = await expandedImg.getAttribute('src');
    console.log(`Expanded Image src: ${expandedSrc}`);
    console.log("Thumbnail expands correctly.");
  } else {
    console.log("No thumbnails found.");
  }
  
  await browser.close();
})();

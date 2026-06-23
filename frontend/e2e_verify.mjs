import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

(async () => {
  console.log("Starting e2e verification...");
  const browser = await chromium.launch({ headless: true });

  const randomString = Math.random().toString(36).substring(7);
  const email = `test_playwright_${randomString}@threadcounty.com`;
  const password = 'password123';

  // TEST 0: Direct Dashboard Visit
  console.log("\n--- TEST 0: Direct Dashboard Visit ---");
  let context0 = await browser.newContext();
  let page0 = await context0.newPage();
  await page0.goto('http://localhost:3000/dashboard');
  console.log("Navigated directly. Current URL:", page0.url());
  console.log("Did it redirect to login?", page0.url().includes('/login'));
  await context0.close();

  // SETUP: Sign up
  console.log(`\n--- SETUP: Signing up as ${email} ---`);
  let setupContext = await browser.newContext();
  let setupPage = await setupContext.newPage();
  
  await setupPage.goto('http://localhost:3000/signup');
  await setupPage.fill('input[id="email"]', email);
  await setupPage.fill('input[id="password"]', password);
  await setupPage.fill('input[id="confirmPassword"]', password);
  
  await Promise.all([
    setupPage.waitForNavigation({ url: '**/dashboard*' }),
    setupPage.click('button[type="submit"]')
  ]);
  console.log("Signup successful, redirected to /dashboard.");
  await setupContext.close();

  // TEST 1: Remember Me unchecked -> Session Cookies
  console.log("\n--- TEST 1: Remember Me Unchecked ---");
  let context1 = await browser.newContext();
  let page1 = await context1.newPage();
  
  await page1.goto('http://localhost:3000/login');
  
  await page1.fill('input[id="email"]', email);
  await page1.fill('input[id="password"]', password);
  await page1.uncheck('input[id="remember-me"]');
  
  await Promise.all([
    page1.waitForNavigation({ url: '**/dashboard*' }),
    page1.click('button[type="submit"]')
  ]);

  console.log("Logged in successfully. Inspecting cookies...");
  const cookies = await context1.cookies();
  
  let authCookies = cookies.filter(c => c.name.startsWith("sb-") || c.name === "threadcounty_session_only");
  let allSessionCookies = authCookies.length > 0;
  for (const cookie of authCookies) {
    const isSession = cookie.expires === -1;
    console.log(`Cookie: ${cookie.name} | Expires: ${cookie.expires} | IsSession: ${isSession}`);
    if (!isSession) allSessionCookies = false;
  }
  console.log("RESULT: All auth cookies are session-only:", allSessionCookies);

  console.log("Closing browser context...");
  await context1.close();

  console.log("Reopening browser...");
  let context2 = await browser.newContext();
  let page2 = await context2.newPage();
  
  await page2.goto('http://localhost:3000/dashboard');
  console.log("Navigated to /dashboard. Current URL after redirect:", page2.url());
  console.log("Cookies in context2:", await context2.cookies());
  await page2.screenshot({ path: 'context2.png' });
  console.log("Page 2 Title:", await page2.title());
  console.log("Page 2 body text:", await page2.locator('body').innerText());
  console.log("RESULT: Full-browser-close-and-reopen test passed:", page2.url().includes('/login'));

  // TEST 2: Back-to-back uploads
  console.log("\n--- TEST 2: Back-to-back Uploads ---");
  await page2.goto('http://localhost:3000/login');
  await page2.fill('input[id="email"]', email);
  await page2.fill('input[id="password"]', password);
  // Remember Me is checked by default
  await Promise.all([
    page2.waitForNavigation({ url: '**/dashboard*' }),
    page2.click('button[type="submit"]')
  ]);

  fs.writeFileSync('dummy1.png', 'fake image content 1');
  fs.writeFileSync('dummy2.png', 'fake image content 2');

  await page2.goto('http://localhost:3000/dashboard/upload');
  
  console.log("Uploading Image 1...");
  await page2.setInputFiles('input[type="file"]', 'dummy1.png');
  await Promise.all([
    page2.waitForNavigation({ url: '**/dashboard/results/*' }),
    page2.click('button:has-text("Analyze Fabric")')
  ]);
  const url1 = page2.url();
  console.log("Redirected to:", url1);

  console.log("Navigating back to /dashboard/upload...");
  await page2.goto('http://localhost:3000/dashboard/upload');
  
  const hasPreview = await page2.isVisible('img[alt="Preview"]');
  console.log("Is stale preview visible?", hasPreview);
  
  console.log("Uploading Image 2...");
  await page2.setInputFiles('input[type="file"]', 'dummy2.png');
  await Promise.all([
    page2.waitForNavigation({ url: '**/dashboard/results/*' }),
    page2.click('button:has-text("Analyze Fabric")')
  ]);
  const url2 = page2.url();
  console.log("Redirected to:", url2);
  
  console.log("RESULT: Second upload went to different result ID:", url1 !== url2);

  fs.unlinkSync('dummy1.png');
  fs.unlinkSync('dummy2.png');
  await browser.close();
  console.log("Finished successfully.");
})();

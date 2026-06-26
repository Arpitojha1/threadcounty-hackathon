import { chromium } from 'playwright';

(async () => {
  console.log("Starting Auth QA Cases Test...");
  const browser = await chromium.launch();

  // Test A: Incognito /dashboard test
  console.log("\n--- TEST A: Incognito /dashboard test ---");
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await pageA.goto('http://localhost:3000/dashboard');
  console.log("Navigated directly. Current URL:", pageA.url());
  console.log("Redirected to login?", pageA.url().includes('/login'));
  const bodyTextA = await pageA.locator('body').innerText();
  console.log("Did it flash empty dashboard UI? (Contains 'Welcome' or 'Storage'):", bodyTextA.includes('Welcome') || bodyTextA.includes('Storage'));
  await contextA.close();

  // Test B: Logout then back button test
  console.log("\n--- TEST B: Logout then back button test ---");
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  
  // 1. Signup / Login
  const randomString = Math.random().toString(36).substring(2, 8);
  const email = `test_qa_${randomString}@threadcounty.com`;
  
  await pageB.goto('http://localhost:3000/signup');
  await pageB.fill('input[type="email"]', email);
  await pageB.locator('input[type="password"]').first().fill('password123');
  await pageB.locator('input[type="password"]').nth(1).fill('password123');
  await pageB.click('button:has-text("Create Account")');
  await pageB.waitForURL('**/dashboard');
  console.log("Logged in. Current URL:", pageB.url());
  
  // Wait a bit to ensure client-side cache is populated
  await pageB.waitForTimeout(1000);
  
  // 2. Click Logout
  await pageB.evaluate(() => {
    document.querySelector('form[action="/auth/logout"]').submit();
  });
  await pageB.waitForURL('**/login');
  console.log("Logged out. Current URL:", pageB.url());
  
  // 3. Hit the Back button
  await pageB.goBack();
  console.log("Hit back button. Current URL:", pageB.url());
  
  // Wait for any Next.js client-side navigations that might occur from middleware redirect
  await pageB.waitForTimeout(1000);
  console.log("After waiting. Current URL:", pageB.url());
  
  // Check if we are seeing sensitive data
  const bodyTextB = await pageB.locator('body').innerText();
  console.log("Is dashboard content visible? (Contains 'Welcome' or 'Storage'):", bodyTextB.includes('Welcome') || bodyTextB.includes('Storage'));

  await contextB.close();
  await browser.close();
})();

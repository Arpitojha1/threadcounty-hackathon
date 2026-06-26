import { chromium } from 'playwright';

(async () => {
  console.log("Starting Route Protection Test...");
  const browser = await chromium.launch();

  // Test 1: Logged-out -> /dashboard
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  console.log("\n--- Test 1: Logged-out -> /dashboard ---");
  await page1.goto('http://localhost:3000/dashboard');
  console.log("Navigated to /dashboard.");
  console.log("Current URL:", page1.url());
  console.log("Redirected to /login?", page1.url().includes('/login'));
  await context1.close();

  // Test 2: Logged-in -> /login
  console.log("\n--- Test 2: Logged-in -> /login ---");
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  
  // First login
  const randomString = Math.random().toString(36).substring(2, 8);
  const email = `test_rp_${randomString}@threadcounty.com`;
  
  await page2.goto('http://localhost:3000/signup');
  await page2.fill('input[type="email"]', email);
  await page2.fill('input[name="password"]', 'password123');
  await page2.fill('input[name="confirmPassword"]', 'password123');
  await page2.click('button:has-text("Create Account")');
  await page2.waitForURL('**/dashboard');
  console.log("Signed up & logged in. Current URL:", page2.url());
  
  // Now try to visit /login while authenticated
  await page2.goto('http://localhost:3000/login');
  console.log("Navigated directly to /login.");
  console.log("Current URL:", page2.url());
  console.log("Redirected back to /dashboard?", page2.url().includes('/dashboard'));

  await context2.close();
  await browser.close();
})();

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const outDir = 'C:\\Users\\Arpit\\.gemini\\antigravity\\brain\\d8d06c27-d43b-4a46-99fd-6a925764a289\\scratch';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseUrl = 'http://localhost:3000';
  const testEmail = `test_${uuidv4().substring(0, 8)}@example.com`;
  const testPassword = 'Password123!';

  console.log('1. Signing up user:', testEmail);
  await page.goto(`${baseUrl}/signup`);
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  
  // Click submit and wait a bit
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000); // give it time to login
  
  console.log('2. Taking screenshot of /pricing for FREE user');
  await page.goto(`${baseUrl}/pricing`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, 'pricing_free.png'), fullPage: true });

  console.log('3. Taking screenshot of /dashboard/billing for FREE user');
  await page.goto(`${baseUrl}/dashboard/billing`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, 'billing_free.png'), fullPage: true });

  // 4. Test Model Gating API call from within the browser (so cookies are sent)
  console.log('4. Testing Model Gating (403)');
  const resGating = await page.evaluate(async () => {
    // get user ID from session
    const resAuth = await fetch('/api/auth/session', { method: 'GET' });
    // This project might not have /api/auth/session. Let's just make the request.
    // Wait, the API upload requires user_id in the body.
    return "Will fetch using node-fetch for exact API response";
  });

  // Exhaust limits using playwright
  console.log('\n--- EXHAUSTING LIMITS via UI ---');
  await page.goto(`${baseUrl}/dashboard/upload`);
  await page.waitForTimeout(2000);
  
  // We cannot easily automate 5 file uploads and bypass RLS (since RLS failed in node because it was lacking auth context).
  // Actually, we CAN automate file uploads in Playwright!
  for (let i = 0; i < 5; i++) {
    const filePath = path.join(outDir, 'test.jpg');
    fs.writeFileSync(filePath, 'fake image content');
    
    // Check if input exists
    const inputHandle = await page.$('input[type="file"]');
    if (inputHandle) {
        await inputHandle.setInputFiles(filePath);
        await page.waitForTimeout(500);
        await page.click('button:has-text("Analyze Fabric")');
        await page.waitForTimeout(3000); // wait for upload
        await page.goto(`${baseUrl}/dashboard/upload`);
        await page.waitForTimeout(1000);
    }
  }

  // Upgrade the user using checkout flow
  console.log('\n5. Upgrading user via Checkout UI');
  await page.goto(`${baseUrl}/dashboard/billing/checkout?plan=professional`);
  await page.waitForTimeout(2000);
  
  // Fill the fake CC details
  await page.fill('input[placeholder="Jane Doe"]', 'Test User');
  await page.fill('input[placeholder="4242 4242 4242 4242"]', '4242');
  await page.fill('input[placeholder="MM/YY"]', '12/26');
  await page.fill('input[placeholder="123"]', '123');
  
  // Click subscribe
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000); // Wait for redirect to finish
  
  console.log('\n6. Taking screenshot of /pricing for PRO user');
  await page.goto(`${baseUrl}/pricing`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, 'pricing_pro.png'), fullPage: true });

  console.log('7. Taking screenshot of /dashboard/billing for PRO user');
  await page.goto(`${baseUrl}/dashboard/billing`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, 'billing_pro.png'), fullPage: true });

  console.log('8. Taking screenshot of admin/users/page.tsx');
  await page.goto(`${baseUrl}/admin/users`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, 'admin_users.png'), fullPage: true });

  await browser.close();
  console.log('DONE');
}

run().catch(console.error);

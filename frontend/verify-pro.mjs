import { chromium } from 'playwright';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const outDir = 'C:\\Users\\Arpit\\.gemini\\antigravity\\brain\\d8d06c27-d43b-4a46-99fd-6a925764a289\\scratch';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseUrl = 'http://localhost:3000';
  const testEmail = `test_${uuidv4().substring(0, 8)}@example.com`;
  const testPassword = 'Password123!';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gpsecjzeejxshnyaqcho.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwc2VjanplZWp4c2hueWFxY2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMzIzNzgsImV4cCI6MjA5NzcwODM3OH0.UjYMuOhVT-ilyL1PulQSl8r57WX19jmVA7yHTlEkIKc';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('1. Signing up user for PRO evidence:', testEmail);
  await page.goto(`${baseUrl}/signup`);
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000); 

  // Get user ID
  const { data: { user } } = await supabase.auth.signInWithPassword({ email: testEmail, password: testPassword });
  
  if (user) {
    console.log('Forcing DB update to Professional plan');
    await supabase.from('subscriptions').upsert({
      user_id: user.id,
      plan_tier: 'professional',
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  console.log('2. Taking screenshot of /pricing for PRO user');
  await page.goto(`${baseUrl}/pricing`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, 'pricing_pro.png'), fullPage: true });

  console.log('3. Taking screenshot of /dashboard/billing for PRO user');
  await page.goto(`${baseUrl}/dashboard/billing`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, 'billing_pro.png'), fullPage: true });

  console.log('4. Taking screenshot of admin/users/page.tsx');
  await page.goto(`${baseUrl}/admin/users`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, 'admin_users.png'), fullPage: true });

  await browser.close();
  console.log('DONE');
}

run().catch(console.error);

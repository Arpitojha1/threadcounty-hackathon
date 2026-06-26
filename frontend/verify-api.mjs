import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

async function run() {
  const baseUrl = 'http://localhost:3000';
  const testEmail = `test_${uuidv4().substring(0, 8)}@example.com`;
  const testPassword = 'Password123!';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gpsecjzeejxshnyaqcho.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwc2VjanplZWp4c2hueWFxY2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMzIzNzgsImV4cCI6MjA5NzcwODM3OH0.UjYMuOhVT-ilyL1PulQSl8r57WX19jmVA7yHTlEkIKc';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword
  });

  if (authError) {
    console.error('Auth Error:', authError);
    return;
  }
  
  const userId = authData.user.id;
  const session = authData.session;
  
  console.log(`User created: ${testEmail}`);
  
  // Test Model Gating
  const formData1 = new FormData();
  formData1.append("file", new Blob(["fake image data"], { type: "image/jpeg" }), "fake.jpg");
  formData1.append("user_id", userId);
  formData1.append("ai_model", "precision");

  const res1 = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    body: formData1
  });
  console.log('\n--- MODEL GATING API RESPONSE (403) ---');
  console.log(`Status: ${res1.status}`);
  console.log(`Body: ${await res1.text()}`);

  // Exhaust limits
  console.log('\n--- EXHAUSTING LIMITS (5 uploads) ---');
  for (let i = 0; i < 5; i++) {
    const formData = new FormData();
    formData.append("file", new Blob(["fake image data"], { type: "image/jpeg" }), "fake.jpg");
    formData.append("user_id", userId);
    formData.append("ai_model", "standard");
    await fetch(`${baseUrl}/api/upload`, { method: "POST", body: formData });
    process.stdout.write(".");
  }
  console.log();

  // Test upload limit exceeded
  const formData2 = new FormData();
  formData2.append("file", new Blob(["fake image data"], { type: "image/jpeg" }), "fake.jpg");
  formData2.append("user_id", userId);
  formData2.append("ai_model", "standard");

  const res2 = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    body: formData2
  });
  console.log('\n--- UPLOAD LIMIT API RESPONSE (402) ---');
  console.log(`Status: ${res2.status}`);
  console.log(`Body: ${await res2.text()}`);

  // Upgrade the user using mock-checkout
  console.log('\n--- UPGRADING USER VIA MOCK CHECKOUT ---');
  
  // We need to pass the auth cookie to the mock checkout
  // Let's just create a mock cookie string
  const authCookie = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token=${encodeURIComponent(JSON.stringify([session.access_token, session.refresh_token, null, null, null]))}`;

  const res3 = await fetch(`${baseUrl}/api/billing/mock-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": authCookie
    },
    body: JSON.stringify({ plan: "professional" })
  });
  
  console.log(`Checkout Status: ${res3.status}`);
  console.log(`Checkout Body: ${await res3.text()}`);

  const { data: subData } = await supabase.from('subscriptions').select('*').eq('user_id', userId).single();
  console.log('\n--- SUBSCRIPTIONS TABLE AFTER UPGRADE ---');
  console.log(JSON.stringify(subData, null, 2));

}

run().catch(console.error);

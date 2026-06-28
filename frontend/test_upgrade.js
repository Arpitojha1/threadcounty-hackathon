import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wlrsmojnduiehzhjcxmd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndscnNtb2puZHVpZWh6aGpjeG1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjcxMjksImV4cCI6MjA5ODE0MzEyOX0.aklqDUOSXQ5b_Xp8UAmWK-apxDYbs2fioSCDzEF5xlM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUpgrade() {
  const email = `testuser${Date.now()}@example.com`;
  console.log(`Signing up ${email}...`);
  // Sign up a new user
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: 'password123'
  });

  if (error) {
    console.error("Signup failed:", error);
    return;
  }

  const session = data.session;
  console.log("Logged in!");

  // Call the Next.js API using fetch, passing the auth token as Authorization header
  try {
    const res = await fetch("http://localhost:3000/api/billing/mock-checkout", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}` 
      },
      body: JSON.stringify({ plan: 'student' })
    });

    const status = res.status;
    const bodyText = await res.text();

    console.log("--- REQUEST EVIDENCE ---");
    console.log("POST /api/billing/mock-checkout");
    console.log("Payload:", JSON.stringify({ plan: 'student' }));
    
    console.log("\n--- RESPONSE EVIDENCE ---");
    console.log(`Status: ${status}`);
    console.log(`Body: ${bodyText}`);
  } catch (err) {
    console.error("Fetch failed", err);
  }
}

testUpgrade();

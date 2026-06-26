import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// For reading profiles, we might be blocked by RLS if not logged in.
// Let's just try to fetch a profile using the anon key. If RLS allows read, we get a user ID.
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("1. Finding a user in profiles...");
  const { data: profiles, error: pError } = await supabase.from('profiles').select('id').limit(1);
  
  let userId;
  if (profiles && profiles.length > 0) {
    userId = profiles[0].id;
    console.log(`Found User ID in profiles: ${userId}`);
  } else {
    console.error("No profiles found or RLS blocked read.", pError);
    return;
  }

  console.log("2. Creating dummy image file...");
  const testImagePath = path.join(process.cwd(), "test-image.png");
  // 1x1 transparent png
  const buffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
  fs.writeFileSync(testImagePath, buffer);

  console.log("3. Uploading via FastAPI endpoint...");
  const formData = new FormData();
  const fileBlob = new Blob([buffer], { type: 'image/png' });
  formData.append("file", fileBlob, "test-image.png");
  formData.append("user_id", userId);

  try {
    const res = await fetch("http://127.0.0.1:8000/api/upload", {
      method: "POST",
      body: formData
    });
    
    if (!res.ok) {
      console.error("FastAPI Error:", await res.text());
      return;
    }

    const data = await res.json();
    console.log("FastAPI Response:", JSON.stringify(data, null, 2));

    const reportId = data.report.id;

    console.log("4. Verifying persistence in Supabase...");
    // Since we are using anon key, RLS on reports might block us from reading if it checks auth.uid() == user_id.
    // We will attempt it anyway.
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .select('*, uploads(image_url)')
      .eq('id', reportId)
      .single();
    
    if (reportError) {
      console.error("Report lookup error (likely RLS):", reportError);
    } else {
      console.log("Row in Supabase:");
      console.log("ID:", reportData.id);
      console.log("Fabric Type:", reportData.fabric_type);
      console.log("Confidence Score:", reportData.confidence_score);
      console.log("User ID:", reportData.user_id);
      
      if (reportData.user_id === userId) {
        console.log("SUCCESS: user_id exactly matches!");
      } else {
        console.error("ERROR: user_id mismatch!");
      }
    }
  } catch(e) {
    console.error("Exception:", e);
  } finally {
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }
}

run();

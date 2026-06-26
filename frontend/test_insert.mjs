import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testInsert() {
  console.log("Testing insert on contact_messages...");
  const { data, error } = await supabase.from('contact_messages').insert([
    { name: 'Test', email: 'test@example.com', message: 'Test message' }
  ]).select();

  if (error) {
    console.error("Insert failed:", error.message);
  } else {
    console.log("Insert succeeded!", data);
  }
}

testInsert();

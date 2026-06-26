import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars from frontend/.env.local and backend/.env
const envVars = {};
['.env.local', '../backend/.env'].forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8');
    content.split('\n').forEach(line => {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) {
        envVars[key.trim()] = rest.join('=').trim();
      }
    });
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'] || envVars['SUPABASE_URL'];
const serviceRoleKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials in env files.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runTest() {
  console.log("=== STARTING LIVE TEST ===");
  
  // Get a real user ID to satisfy foreign key constraints
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr || !usersData.users || usersData.users.length === 0) {
    console.error("Failed to fetch users or no users found. Error:", usersErr);
    process.exit(1);
  }
  const userId = usersData.users[0].id;
  
  console.log(`\n1. Creating test upload and report for real user ${userId}...`);
  const { data: upload, error: uploadErr } = await supabase
    .from('uploads')
    .insert({
      user_id: userId,
      image_url: 'http://example.com/test_soft_delete.jpg',
      file_name: 'test_soft_delete.jpg',
      file_size: 1337, // recognizable file size
      status: 'completed'
    })
    .select()
    .single();
    
  if (uploadErr) {
    console.error("Failed to insert upload:", uploadErr.message);
    process.exit(1);
  }
  
  const { data: report, error: reportErr } = await supabase
    .from('reports')
    .insert({
      upload_id: upload.id,
      user_id: userId,
      fabric_type: 'Test Soft Delete Fabric',
      confidence_score: 99.9,
    })
    .select()
    .single();

  if (reportErr) {
    console.error("Failed to insert report:", reportErr.message);
    process.exit(1);
  }
  
  console.log(`-> Created report ID: ${report.id}`);

  // Measure Quota (Total Uploads & Storage Usage) before delete
  console.log(`\n2. Measuring quota BEFORE delete...`);
  const { count: uploadsCount, data: storageData } = await supabase
    .from('uploads')
    .select('file_size', { count: 'exact' })
    .eq('user_id', userId);
    
  const totalBytesBefore = storageData.reduce((acc, row) => acc + (row.file_size || 0), 0);
  console.log(`-> Total Uploads (Count): ${uploadsCount}`);
  console.log(`-> Total Storage (Bytes): ${totalBytesBefore}`);

  // Perform Soft Delete
  console.log(`\n3. Performing soft delete on report ID: ${report.id}...`);
  const now = new Date().toISOString();
  const { error: deleteErr } = await supabase
    .from('reports')
    .update({ deleted_at: now })
    .eq('id', report.id);
    
  if (deleteErr) {
    console.error("Failed to soft-delete report:", deleteErr.message);
    process.exit(1);
  }
  console.log(`-> Soft delete mutation completed without errors.`);

  // Verify report has deleted_at set in DB
  console.log(`\n4. Verifying DB row directly (bypassing filters)...`);
  const { data: verifyReport } = await supabase
    .from('reports')
    .select('deleted_at')
    .eq('id', report.id)
    .single();
  console.log(`-> OBSERVED VALUE: DB reports.deleted_at = ${verifyReport.deleted_at}`);
  
  // Verify it drops from History View
  console.log(`\n5. Verifying History View query (WHERE deleted_at IS NULL)...`);
  const { data: historyReports } = await supabase
    .from('reports')
    .select('id')
    .eq('user_id', userId)
    .is('deleted_at', null);
    
  const isVisible = historyReports.some(r => r.id === report.id);
  console.log(`-> OBSERVED VALUE: Is report visible in History query? ${isVisible ? 'YES (FAIL)' : 'NO (SUCCESS)'}`);

  // Measure Quota again
  console.log(`\n6. Measuring quota AFTER delete...`);
  const { count: uploadsCountAfter, data: storageDataAfter } = await supabase
    .from('uploads')
    .select('file_size', { count: 'exact' })
    .eq('user_id', userId);
    
  const totalBytesAfter = storageDataAfter.reduce((acc, row) => acc + (row.file_size || 0), 0);
  console.log(`-> OBSERVED VALUE: Total Uploads (Count): ${uploadsCountAfter} (Change: ${uploadsCountAfter - uploadsCount})`);
  console.log(`-> OBSERVED VALUE: Total Storage (Bytes): ${totalBytesAfter} (Change: ${totalBytesAfter - totalBytesBefore})`);
  
  console.log(`\n=== LIVE TEST COMPLETE ===`);
}

runTest();

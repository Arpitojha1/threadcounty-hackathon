"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function permanentlyDeleteReportAction(reportId: string) {
  const supabase = await createClient();
  
  // 1. Verify caller is an admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return { error: "Unauthorized: Admin access required." };
  }

  // 2. Fetch the report to get the upload_id and image_url
  const { data: report } = await supabase
    .from("reports")
    .select("upload_id, uploads(image_url)")
    .eq("id", reportId)
    .single();

  if (!report) {
    return { error: "Report not found." };
  }

  // 3. Attempt to use Admin client for storage deletion (requires SUPABASE_SERVICE_ROLE_KEY)
  try {
    const adminSupabase = createAdminClient();
    
    // Extract filename from the image_url
    // Assuming URL format: .../storage/v1/object/public/fabric-images/[filename]
    const uploads = report.uploads as any;
    const imageUrl = uploads?.image_url as string;
    if (imageUrl) {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Attempt to delete from storage
      const { error: storageError } = await adminSupabase.storage
        .from('fabric-images')
        .remove([fileName]);
        
      if (storageError) {
        console.error("Storage deletion failed:", storageError);
      }
    }

    // Now delete from database using admin client (to bypass any RLS if needed, though RLS allows it)
    await adminSupabase.from("uploads").delete().eq("id", report.upload_id);
    // Note: Since reports.upload_id has ON DELETE CASCADE, deleting upload will delete report.
    // Otherwise, we delete report explicitly:
    await adminSupabase.from("reports").delete().eq("id", reportId);

  } catch (err: any) {
    // Fallback: If admin client fails (e.g. missing service role key in local dev),
    // we use the regular authenticated client which can delete DB rows because of is_admin() RLS,
    // but might fail to delete storage if no storage RLS is setup for admins.
    console.warn("Admin client unavailable or failed, falling back to authenticated client:", err.message);
    
    const { error: dbError } = await supabase.from("uploads").delete().eq("id", report.upload_id);
    if (dbError) {
      await supabase.from("reports").delete().eq("id", reportId);
    }
  }

  return { success: true };
}

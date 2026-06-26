import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

// This is a standalone mock of the FastAPI backend, allowing the frontend
// to be deployed to Vercel without requiring a live Python backend.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const user_id = formData.get("user_id") as string;

    if (!file || !user_id) {
      return NextResponse.json(
        { detail: "Missing file or user_id" },
        { status: 422 }
      );
    }

    // Initialize admin client to bypass RLS since the backend would use service_role
    // Note: for hackathon, we use anon key but we must ensure policies allow it,
    // OR we use the service_role key if available in env.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const ai_model = formData.get("ai_model") as string || "standard";

    // --- ENTITLEMENT CHECK ---
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('plan_tier')
      .eq('user_id', user_id)
      .single();

    const tier = subData?.plan_tier || 'free';

    // 1. Model Gating
    if (ai_model === 'precision' && tier === 'free') {
      return NextResponse.json(
        { detail: "Access Denied: The Precision Vision model requires a Student or Professional plan. Please upgrade your account." },
        { status: 403 }
      );
    }

    // 2. Upload Limits
    const limits: Record<string, number> = { 'free': 5, 'student': 100, 'professional': 100, 'enterprise': 999999 };
    const limit = limits[tier] || 5;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from("uploads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id)
      .gte("created_at", startOfMonth.toISOString());

    if (count !== null && count >= limit) {
      return NextResponse.json(
        { detail: "Please upgrade your plan to continue uploading." }, // 402 error msg matches client expectations
        { status: 402 }
      );
    }
    // --- END ENTITLEMENT CHECK ---

    // 1. Read file bytes
    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = Buffer.from(arrayBuffer);
    const file_extension = file.name.split(".").pop();

    // 2. Generate unique filename
    const unique_filename = `${user_id}/${uuidv4()}.${file_extension}`;

    // 3. Upload raw image to Supabase Storage Bucket ('fabric-images')
    const { error: uploadError } = await supabase.storage
      .from("fabric-images")
      .upload(unique_filename, fileBytes, {
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("fabric-images")
      .getPublicUrl(unique_filename);
    const image_url = publicUrlData.publicUrl;

    // 4. Insert record into 'uploads' table
    const { data: uploadData, error: uploadDbError } = await supabase
      .from("uploads")
      .insert({
        user_id: user_id,
        image_url: image_url,
        file_name: file.name,
        file_size: fileBytes.length,
        status: "completed",
      })
      .select()
      .single();

    if (uploadDbError) {
      throw new Error(`Uploads DB insert failed: ${uploadDbError.message}`);
    }

    const upload_id = uploadData.id;

    // 5. Mock AI Analysis
    const mockResults = {
      thread_density: 82.4,
      warp_count: 34,
      weft_count: 48,
      fabric_type: "Plain Weave Linen",
      confidence_score: 96.2,
      ai_suggestions: [
        "Weave tension appears uniform across the sample.",
        "No significant surface defects detected.",
      ],
    };

    // 6. Insert record into 'reports' table
    const { data: reportData, error: reportError } = await supabase
      .from("reports")
      .insert({
        upload_id: upload_id,
        user_id: user_id,
        thread_density: mockResults.thread_density,
        warp_count: mockResults.warp_count,
        weft_count: mockResults.weft_count,
        fabric_type: mockResults.fabric_type,
        confidence_score: mockResults.confidence_score,
        ai_suggestions: mockResults.ai_suggestions,
      })
      .select()
      .single();

    if (reportError) {
      throw new Error(`Reports DB insert failed: ${reportError.message}`);
    }

    // 7. Return the final payload
    return NextResponse.json({
      status: "success",
      message: "Image processed successfully",
      image_url: image_url,
      report: reportData,
    });
  } catch (error: any) {
    console.error("Upload mock error:", error);
    return NextResponse.json(
      { detail: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}

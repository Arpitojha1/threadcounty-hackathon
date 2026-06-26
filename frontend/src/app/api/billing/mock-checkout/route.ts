import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    // Explicitly reject anything other than student or professional
    if (plan !== 'student' && plan !== 'professional') {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Since users shouldn't have RLS permissions to arbitrary elevate their own tier,
    // we use the service role key to perform this update safely on the server side.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey);

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

    const { error: updateError } = await adminClient
      .from("subscriptions")
      .upsert(
        { 
          user_id: user.id,
          plan_tier: plan,
          status: 'active',
          current_period_end: currentPeriodEnd.toISOString()
        },
        { onConflict: 'user_id' }
      );

    if (updateError) {
      console.error("Error updating subscription tier:", updateError);
      return NextResponse.json({ error: "Failed to update subscription tier" }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error("Mock checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

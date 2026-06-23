import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /auth/confirm
 *
 * Handles email verification (signup) and password recovery callbacks.
 * Supabase email templates must link here with ?token_hash=...&type=...&next=...
 *
 * IMPORTANT: This route will NOT work with Supabase's default email templates.
 * The Dashboard email templates (Authentication → Email Templates) must be
 * updated to use {{ .TokenHash }} and {{ .SiteURL }}/auth/confirm — see
 * the implementation walkthrough for the exact template HTML to paste.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "email"
    | "recovery"
    | "invite"
    | "magiclink"
    | "signup"
    | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Verification succeeded — redirect to the intended destination
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = next;
      redirectUrl.searchParams.delete("token_hash");
      redirectUrl.searchParams.delete("type");
      redirectUrl.searchParams.delete("next");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Verification failed or missing params — redirect to login with error
  const errorUrl = request.nextUrl.clone();
  errorUrl.pathname = "/login";
  errorUrl.searchParams.set("error", "verification_failed");
  errorUrl.searchParams.delete("token_hash");
  errorUrl.searchParams.delete("type");
  errorUrl.searchParams.delete("next");
  return NextResponse.redirect(errorUrl);
}

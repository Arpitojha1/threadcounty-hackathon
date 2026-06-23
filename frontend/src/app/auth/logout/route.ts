import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /auth/logout
 *
 * Server-side logout — calls signOut() so the session cookie is actually
 * cleared on the server, not just client-side. Redirects to /login.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("threadcounty_session_only");
  return response;
}

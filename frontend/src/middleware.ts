import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { applySessionOnlyRule } from "@/lib/supabase/cookie-utils";

/**
 * Middleware: runs on every matched request.
 *  1. Refreshes the Supabase auth token (reads cookie from request,
 *     writes refreshed token to both request AND response).
 *  2. Route protection:
 *     - Unauthenticated → /dashboard/** redirects to /login
 *     - Authenticated   → /login, /signup, /forgot-password redirects to /dashboard
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const isSessionOnly = request.cookies.get("threadcounty_session_only")?.value === "true";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies to the request so downstream Server Components see them
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Write cookies to the response so the browser gets the updated token
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            const finalOptions = applySessionOnlyRule(options, isSessionOnly);
            supabaseResponse.cookies.set(name, value, finalOptions);
          });
        },
      },
    }
  );

  // Use getUser() for server-side validation — not getSession() which only
  // reads the JWT without verifying with the Auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  console.log(`Middleware visiting ${pathname}. User: ${user?.id || 'none'}. Cookies:`, request.cookies.getAll().map(c => c.name));

  // ── Route protection ────────────────────────────────────────

  // Unauthenticated users trying to access protected routes
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    console.log(`Redirecting unauthenticated user from ${pathname} to /login`);
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Admin users checking
  if (user && pathname.startsWith("/dashboard/admin")) {
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (profile?.is_admin !== true) {
      console.log(`Redirecting unauthorized user from ${pathname} to /dashboard`);
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Authenticated users visiting auth pages — redirect to dashboard
  const authPages = ["/login", "/signup", "/forgot-password"];
  if (user && authPages.includes(pathname)) {
    console.log(`Redirecting authenticated user from ${pathname} to /dashboard`);
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Static assets with common extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

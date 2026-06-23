import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Reads/writes cookies via Next.js cookies() API.
 *
 * CRITICAL: Always call this function inside each request handler / Server
 * Component / Server Action. NEVER store the returned client at module scope
 * or in a variable that persists across requests — that leaks one user's
 * session into another user's request under serverless warm-instance reuse.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — can't write cookies here.
            // The middleware handles token refresh and cookie writing instead.
          }
        },
      },
    }
  );
}

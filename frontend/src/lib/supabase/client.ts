import { createBrowserClient } from "@supabase/ssr";

import { applySessionOnlyRule } from "./cookie-utils";

/**
 * Creates a Supabase client for use in Client Components (browser-side).
 *
 * Returns a NEW instance each call — do not cache or store at module scope.
 * @supabase/ssr's createBrowserClient handles cookie-based auth automatically.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined;
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? match[2] : undefined;
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return;
          const isSessionOnly = document.cookie.includes('threadcounty_session_only=true');
          const finalOptions = applySessionOnlyRule({ ...options }, isSessionOnly);
          
          let cookieStr = `${name}=${value}`;
          if (finalOptions.domain) cookieStr += `; domain=${finalOptions.domain}`;
          if (finalOptions.path) cookieStr += `; path=${finalOptions.path}`;
          if (finalOptions.expires) cookieStr += `; expires=${finalOptions.expires.toUTCString()}`;
          if (finalOptions.maxAge) cookieStr += `; max-age=${finalOptions.maxAge}`;
          if (finalOptions.sameSite) cookieStr += `; samesite=${finalOptions.sameSite}`;
          if (finalOptions.secure) cookieStr += `; secure`;
          document.cookie = cookieStr;
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return;
          let cookieStr = `${name}=; max-age=0`;
          if (options.domain) cookieStr += `; domain=${options.domain}`;
          if (options.path) cookieStr += `; path=${options.path}`;
          document.cookie = cookieStr;
        }
      }
    }
  );
}

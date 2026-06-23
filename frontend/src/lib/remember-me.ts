"use client";

import { useEffect, useCallback, useRef } from "react";

/**
 * REMEMBER ME — Cross-Tab Session Management (Option A)
 * =====================================================
 * Uses localStorage (shared across all tabs in the same origin) instead of
 * sessionStorage (per-tab) so that "remember me" state is consistent:
 *
 * - When "Remember Me" is CHECKED (default): no flag is set → standard
 *   Supabase session persistence via refresh tokens in cookies.
 *
 * - When "Remember Me" is UNCHECKED: a localStorage key
 *   `threadcounty_session_only` is set to "true" on login. When ANY tab
 *   is closed, the `beforeunload` handler checks if there are other tabs
 *   still open (tracked via a shared counter in localStorage). When the
 *   LAST tab closes, signOut() is called to end the session.
 *
 * Cross-tab coordination:
 *   - A `threadcounty_tab_count` key tracks how many tabs are open.
 *   - Each tab increments on mount, decrements on unload.
 *   - signOut() only fires when the last tab closes AND session_only=true.
 *   - The `storage` event listener ensures all tabs react to state changes
 *     (e.g., if one tab logs out, others detect it immediately).
 */

const STORAGE_KEY_SESSION_ONLY = "threadcounty_session_only";
const STORAGE_KEY_TAB_COUNT = "threadcounty_tab_count";

/** Call on login when "Remember Me" is unchecked */
export function markSessionOnly() {
  localStorage.setItem(STORAGE_KEY_SESSION_ONLY, "true");
}

/** Call on login when "Remember Me" is checked (or to clear the flag) */
export function clearSessionOnly() {
  localStorage.removeItem(STORAGE_KEY_SESSION_ONLY);
}

/** Check if this session is marked as session-only */
export function isSessionOnly(): boolean {
  return localStorage.getItem(STORAGE_KEY_SESSION_ONLY) === "true";
}

/**
 * Hook: manages tab counting and session-only logout.
 * Mount this in the root auth-aware layout (e.g., dashboard layout).
 */
export function useRememberMe() {
  const hasRegistered = useRef(false);

  const incrementTabCount = useCallback(() => {
    const current = parseInt(
      localStorage.getItem(STORAGE_KEY_TAB_COUNT) || "0",
      10
    );
    localStorage.setItem(STORAGE_KEY_TAB_COUNT, String(current + 1));
  }, []);

  const decrementTabCount = useCallback(() => {
    const current = parseInt(
      localStorage.getItem(STORAGE_KEY_TAB_COUNT) || "1",
      10
    );
    const next = Math.max(0, current - 1);
    localStorage.setItem(STORAGE_KEY_TAB_COUNT, String(next));
    return next;
  }, []);

  useEffect(() => {
    if (hasRegistered.current) return;
    hasRegistered.current = true;

    incrementTabCount();

    const handleBeforeUnload = () => {
      const remaining = decrementTabCount();

      // Only sign out when the LAST tab closes and session is marked session-only
      if (remaining === 0 && isSessionOnly()) {
        // Synchronously wipe localStorage items
        localStorage.removeItem(STORAGE_KEY_SESSION_ONLY);
        localStorage.removeItem(STORAGE_KEY_TAB_COUNT);

        // Clear any Supabase-related keys in localStorage
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("sb-")) {
            localStorage.removeItem(key);
          }
        });

        // Force expiration of cookies directly
        document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        // Clear any other cookies starting with "sb-"
        document.cookie.split(";").forEach((c) => {
          const name = c.split("=")[0].trim();
          if (name.startsWith("sb-")) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
      }
    };

    // Listen for storage changes from other tabs (e.g., logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_SESSION_ONLY && e.newValue === null) {
        // Another tab cleared session-only flag (e.g., via logout) — no action needed
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [incrementTabCount, decrementTabCount]);
}

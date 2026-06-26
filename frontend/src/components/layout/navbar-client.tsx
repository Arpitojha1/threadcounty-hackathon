"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion, useScroll, useMotionValueEvent } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
const springTransition = { type: "spring", stiffness: 400, damping: 25 } as const;
const sharpTransition = { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const };

type NavbarClientProps = {
  userEmail?: string | null;
};

const LOGGED_OUT_LINKS = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing" }
];

const LOGGED_IN_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "History", href: "/dashboard/history" },
  { label: "Billing", href: "/dashboard/billing" }
];

export function NavbarClient({ userEmail }: NavbarClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll detection only applies on the landing page
  useMotionValueEvent(scrollY, "change", (y) => {
    if (pathname === "/") {
      setIsScrolled(y > 100);
    }
  });

  /* Sync initial state from <html> class on mount */
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDark = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const isLoggedIn = !!userEmail;
  const showSolid = pathname !== "/" || isScrolled;
  const textColor = showSolid ? "text-loom-iron dark:text-muslin" : "text-muslin";

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        showSolid ? "bg-muslin dark:bg-loom-iron shadow-sm border-b border-loom-iron/5 dark:border-muslin/5" : "bg-transparent",
        textColor
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Logo ─────────────────────────────────────── */}
        <a href="/" className="flex items-baseline gap-0 font-display text-xl uppercase tracking-wide">
          <span>THREAD</span>
          <span className="text-shuttle-red">COUNTY</span>
        </a>

        {/* ── Desktop nav links ────────────────────────── */}
        <ul className="hidden items-center gap-8 md:flex">
          {(!isLoggedIn ? LOGGED_OUT_LINKS : LOGGED_IN_LINKS).map((link) => (
            <li key={link.href}>
              <motion.a
                href={link.href}
                initial="initial"
                whileHover="hover"
                className="relative group block font-sans text-sm font-medium px-3 py-1.5"
              >
                <span className="relative z-10 opacity-80 group-hover:opacity-100 group-hover:text-muslin transition-all duration-200">
                  {link.label}
                </span>
                {!prefersReducedMotion ? (
                  <motion.div
                    variants={{
                      initial: { opacity: 0, y: 6 },
                      hover: { opacity: 1, y: 0 },
                    }}
                    transition={springTransition}
                    className="absolute inset-0 bg-shuttle-red clip-cut-btn z-0"
                  />
                ) : (
                  <div className="absolute inset-0 bg-shuttle-red clip-cut-btn z-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </motion.a>
            </li>
          ))}
        </ul>

        {/* ── Right side ───────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className={cn(
              "flex h-9 w-9 items-center justify-center transition-colors hover:text-shuttle-red",
              showSolid ? "text-loom-iron/70 dark:text-muslin/70" : "text-muslin/80"
            )}
          >
            {dark ? (
              /* Sun icon */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
                strokeLinejoin="miter"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              /* Moon icon */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
                strokeLinejoin="miter"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {!isLoggedIn ? (
            /* Logged out CTA */
            <>
              <a
                href="/login"
                className={cn(
                  "hidden md:inline-flex items-center justify-center font-sans text-sm font-medium transition-colors hover:text-shuttle-red mr-2"
                )}
              >
                Login
              </a>
              <motion.a
                href="/login"
                initial="initial"
                whileHover="hover"
                className={cn(
                  "hidden md:inline-flex items-center justify-center relative",
                  "px-5 py-2 font-sans text-sm font-semibold overflow-hidden group",
                  prefersReducedMotion ? "bg-shuttle-red text-muslin clip-cut-btn hover:opacity-90 transition-opacity" : "text-shuttle-red hover:text-muslin transition-colors duration-300"
                )}
              >
                {!prefersReducedMotion && (
                  <motion.div
                    variants={{
                      initial: {
                        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                        backgroundColor: "rgba(232, 73, 46, 0.05)",
                      },
                      hover: {
                        clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)",
                        backgroundColor: "rgba(232, 73, 46, 1)",
                      },
                    }}
                    transition={sharpTransition}
                    className="absolute inset-0 -z-10"
                  />
                )}
                Get Started
              </motion.a>
            </>
          ) : (
            /* Logged in Actions */
            <div className={cn("hidden md:flex items-center gap-4 ml-2 border-l pl-4", showSolid ? "border-loom-iron/10 dark:border-muslin/10" : "border-muslin/20")}>
              <span className={cn("font-mono text-xs tracking-wider truncate max-w-[150px]", showSolid ? "text-concrete-grey" : "text-muslin/80")}>
                {userEmail}
              </span>
              <a
                href="/dashboard/profile"
                className={cn(
                  "font-sans text-sm font-medium transition-colors hover:text-shuttle-red mr-2"
                )}
              >
                Profile
              </a>
              <form action="/auth/logout" method="POST">
                <motion.button
                  type="submit"
                  initial="initial"
                  whileHover="hover"
                  className={cn(
                    "relative overflow-hidden group px-4 py-2 font-sans text-sm font-medium",
                    prefersReducedMotion ? "bg-shuttle-red text-muslin clip-cut-btn hover:opacity-90 transition-opacity" : "text-shuttle-red hover:text-muslin transition-colors duration-300"
                  )}
                >
                  {!prefersReducedMotion && (
                    <motion.div
                      variants={{
                        initial: {
                          clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                          backgroundColor: "rgba(232, 73, 46, 0.05)",
                        },
                        hover: {
                          clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)",
                          backgroundColor: "rgba(232, 73, 46, 1)",
                        },
                      }}
                      transition={sharpTransition}
                      className="absolute inset-0 -z-10"
                    />
                  )}
                  Sign Out
                </motion.button>
              </form>
            </div>
          )}

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            className={cn(
              "flex h-9 w-9 items-center justify-center md:hidden transition-colors"
            )}
          >
            {mobileOpen ? (
              /* X icon */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              /* Menu icon */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ──────────────────────────────── */}
      <div
        className={cn(
          "overflow-hidden transition-[max-height] duration-300 ease-in-out md:hidden",
          "bg-muslin dark:bg-loom-iron text-loom-iron dark:text-muslin",
          "border-t border-loom-iron/10 dark:border-muslin/10",
          mobileOpen ? "max-h-80" : "max-h-0"
        )}
      >
        <ul className="flex flex-col gap-1 px-4 py-4">
          {(!isLoggedIn ? LOGGED_OUT_LINKS : LOGGED_IN_LINKS).map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={closeMobile}
                className={cn(
                  "block py-3 font-sans text-base font-medium",
                  "text-loom-iron/80 dark:text-muslin/80",
                  "transition-colors hover:text-shuttle-red"
                )}
              >
                {link.label}
              </a>
            </li>
          ))}

          {!isLoggedIn ? (
            <>
              <li>
                <a
                  href="/login"
                  onClick={closeMobile}
                  className={cn(
                    "block py-3 font-sans text-base font-medium",
                    "text-loom-iron/80 dark:text-muslin/80",
                    "transition-colors hover:text-shuttle-red"
                  )}
                >
                  Login
                </a>
              </li>
              <li className="pt-2">
                <a
                  href="/login"
                  onClick={closeMobile}
                  className={cn(
                    "clip-cut-btn inline-flex bg-shuttle-red px-5 py-2.5",
                    "font-sans text-sm font-semibold text-muslin",
                    "transition-opacity hover:opacity-90"
                  )}
                >
                  Get Started
                </a>
              </li>
            </>
          ) : (
            <>
              <li>
                <a
                  href="/dashboard/profile"
                  onClick={closeMobile}
                  className={cn(
                    "block py-3 font-sans text-base font-medium",
                    "text-loom-iron/80 dark:text-muslin/80",
                    "transition-colors hover:text-shuttle-red"
                  )}
                >
                  Profile
                </a>
              </li>
              <li className="pt-2 border-t border-loom-iron/10 dark:border-muslin/10 mt-2">
                <span className="block py-2 font-mono text-xs text-concrete-grey tracking-wider truncate">
                  {userEmail}
                </span>
                <form action="/auth/logout" method="POST">
                  <button
                    type="submit"
                    className={cn(
                      "mt-2 clip-cut-btn inline-flex bg-shuttle-red px-5 py-2.5",
                      "font-sans text-sm font-semibold text-muslin",
                      "transition-opacity hover:opacity-90"
                    )}
                  >
                    Sign Out
                  </button>
                </form>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

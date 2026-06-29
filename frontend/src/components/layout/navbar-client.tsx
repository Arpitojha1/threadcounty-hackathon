"use client";
import Link from "next/link";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion, useScroll, useMotionValueEvent, useMotionValue, useTransform, useSpring } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const springTransition = { type: "spring", stiffness: 400, damping: 25 } as const;
const sharpTransition = { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const };

type NavbarClientProps = {
  userEmail?: string | null;
};

const LOGGED_OUT_LINKS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#workflow" },
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

  const loggedInLinks = LOGGED_IN_LINKS;

  // Track overlap with dark sections
  const [sections, setSections] = useState<{ top: number; bottom: number }[]>([]);
  const darkProgress = useMotionValue(0);

  // Update section positions on mount, resize, and DOM changes
  useEffect(() => {
    const updateSections = () => {
      const els = document.querySelectorAll('[data-navbar-theme="dark"]');
      const newSections = Array.from(els).map((el) => {
        const rect = el.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        return {
          top: absoluteTop,
          bottom: absoluteTop + rect.height,
        };
      });
      setSections(newSections);
    };

    updateSections();
    const t1 = setTimeout(updateSections, 100);
    const t2 = setTimeout(updateSections, 1000);

    window.addEventListener("resize", updateSections);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(updateSections);
      observer.observe(document.body);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", updateSections);
      observer?.disconnect();
    };
  }, [pathname]); // Also re-measure when navigating

  useMotionValueEvent(scrollY, "change", (y) => {
    // If global dark mode is forced on, we lock progress to 1
    if (document.documentElement.classList.contains("dark")) {
      darkProgress.set(1);
      return;
    }

    const navbarHeight = 64; // standard h-16
    const navbarTop = y;
    const navbarBottom = y + navbarHeight;

    let totalOverlap = 0;

    for (const sec of sections) {
      if (sec.bottom > navbarTop && sec.top < navbarBottom) {
        const overlap = Math.min(navbarBottom, sec.bottom) - Math.max(navbarTop, sec.top);
        totalOverlap += overlap;
      }
    }

    // Resolves to 0 in gap zones where totalOverlap = 0
    let progress = Math.min(1, Math.max(0, totalOverlap / navbarHeight));

    // Snap immediately if reduced motion
    if (prefersReducedMotion) {
      progress = Math.round(progress);
    }

    darkProgress.set(progress);
  });

  // Re-trigger calculation when global dark mode changes
  useEffect(() => {
    if (dark) {
      darkProgress.set(1);
    } else {
      // Force re-evaluation of scroll position
      scrollY.set(scrollY.get());
    }
  }, [dark, darkProgress, scrollY]);

  const smoothedProgress = useSpring(darkProgress, { stiffness: 300, damping: 30 });
  const finalProgress = prefersReducedMotion ? darkProgress : smoothedProgress;

  /*
   * Color Interpolations (0 = Light Section, 1 = Dark Section)
   * Light (muslin behind): Text = loom-iron (#161512), Bg = loom-iron-tinted (rgba(22, 21, 18, 0.05)), Border = rgba(22, 21, 18, 0.1)
   * Dark (loom-iron behind): Text = muslin (#F2EDE4), Bg = muslin-tinted (rgba(242, 237, 228, 0.12)), Border = rgba(242, 237, 228, 0.1)
   */
  const textColor = useTransform(finalProgress, [0, 1], ["#161512", "#F2EDE4"]);
  const backgroundColor = useTransform(finalProgress, [0, 1], ["rgba(22, 21, 18, 0.05)", "rgba(242, 237, 228, 0.12)"]);
  const borderColor = useTransform(finalProgress, [0, 1], ["rgba(22, 21, 18, 0.1)", "rgba(242, 237, 228, 0.1)"]);

  const [isDarkThemed, setIsDarkThemed] = useState(false);
  useMotionValueEvent(darkProgress, "change", (v) => {
    setIsDarkThemed(v > 0.5);
  });

  // If mobile drawer is open, we force the navbar's own background to be fully opaque so it matches the drawer
  // This prevents the transparent blur from looking weird above a solid dropdown
  const effectiveBgColor = mobileOpen
    ? (isDarkThemed ? "#161512" : "#F2EDE4")
    : backgroundColor;

  return (
    <motion.nav
      className="fixed inset-x-0 top-0 z-50 transition-[height,max-height] duration-300 backdrop-blur-md"
      style={{
        color: textColor,
        backgroundColor: effectiveBgColor,
        borderBottomWidth: "1px",
        borderBottomColor: borderColor
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Logo ─────────────────────────────────────── */}
        <Link href="/" className="flex items-baseline gap-0 font-display text-xl uppercase tracking-wide">
          <span>THREAD</span>
          <span className="text-shuttle-red">COUNTY</span>
        </Link>

        {/* ── Desktop nav links ────────────────────────── */}
        <ul className="hidden items-center gap-8 md:flex">
          {(!isLoggedIn ? LOGGED_OUT_LINKS : loggedInLinks).map((link) => (
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
            className="flex h-9 w-9 items-center justify-center transition-colors hover:text-shuttle-red opacity-80 hover:opacity-100"
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
              <Link
                href="/login"
                className="hidden md:inline-flex items-center justify-center font-sans text-sm font-medium transition-colors hover:text-shuttle-red mr-2"
              >
                Login
              </Link>
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
            <motion.div className="hidden md:flex items-center gap-4 ml-2 border-l pl-4" style={{ borderLeftColor: borderColor }}>
              <span className="font-mono text-xs tracking-wider truncate max-w-[150px] opacity-70">
                {userEmail}
              </span>
              <Link
                href="/dashboard/profile"
                className="font-sans text-sm font-medium transition-colors hover:text-shuttle-red mr-2"
              >
                Profile
              </Link>
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
            </motion.div>
          )}

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center md:hidden transition-colors"
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
          "overflow-hidden transition-[max-height,background-color,color,border-color] duration-300 ease-in-out md:hidden border-t",
          isDarkThemed ? "bg-loom-iron text-muslin border-muslin/10" : "bg-muslin text-loom-iron border-loom-iron/10",
          mobileOpen ? "max-h-80" : "max-h-0"
        )}
      >
        <ul className="flex flex-col gap-1 px-4 py-4">
          {(!isLoggedIn ? LOGGED_OUT_LINKS : loggedInLinks).map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={closeMobile}
                className={cn(
                  "block py-3 font-sans text-base font-medium transition-colors hover:text-shuttle-red",
                  isDarkThemed ? "text-muslin/80" : "text-loom-iron/80"
                )}
              >
                {link.label}
              </a>
            </li>
          ))}

          {!isLoggedIn ? (
            <>
              <li>
                <Link
                  href="/login"
                  onClick={closeMobile}
                  className={cn(
                    "block py-3 font-sans text-base font-medium transition-colors hover:text-shuttle-red",
                    isDarkThemed ? "text-muslin/80" : "text-loom-iron/80"
                  )}
                >
                  Login
                </Link>
              </li>
              <li className="pt-2">
                <Link
                  href="/login"
                  onClick={closeMobile}
                  className="clip-cut-btn inline-flex bg-shuttle-red px-5 py-2.5 font-sans text-sm font-semibold text-muslin transition-opacity hover:opacity-90"
                >
                  Get Started
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  href="/dashboard/profile"
                  onClick={closeMobile}
                  className={cn(
                    "block py-3 font-sans text-base font-medium transition-colors hover:text-shuttle-red",
                    isDarkThemed ? "text-muslin/80" : "text-loom-iron/80"
                  )}
                >
                  Profile
                </Link>
              </li>
              <li className={cn(
                "pt-2 mt-2 border-t",
                isDarkThemed ? "border-muslin/10" : "border-loom-iron/10"
              )}>
                <span className="block py-2 font-mono text-xs text-concrete-grey tracking-wider truncate">
                  {userEmail}
                </span>
                <form action="/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="mt-2 clip-cut-btn inline-flex bg-shuttle-red px-5 py-2.5 font-sans text-sm font-semibold text-muslin transition-opacity hover:opacity-90"
                  >
                    Sign Out
                  </button>
                </form>
              </li>
            </>
          )}
        </ul>
      </div>
    </motion.nav>
  );
}

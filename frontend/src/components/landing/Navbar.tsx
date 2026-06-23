"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/data/landing";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);

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

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50",
        "bg-muslin/90 dark:bg-loom-iron/90 backdrop-blur-md",
        "border-b border-loom-iron/10 dark:border-muslin/10"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Logo ─────────────────────────────────────── */}
        <a href="/" className="flex items-baseline gap-0 font-display text-xl uppercase tracking-wide">
          <span className="text-loom-iron dark:text-muslin">THREAD</span>
          <span className="text-shuttle-red">COUNTY</span>
        </a>

        {/* ── Desktop nav links ────────────────────────── */}
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={cn(
                  "font-sans text-sm font-medium",
                  "text-loom-iron/70 dark:text-muslin/70",
                  "transition-colors hover:text-shuttle-red"
                )}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* ── Right side: dark toggle + CTA + hamburger ─ */}
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className={cn(
              "flex h-9 w-9 items-center justify-center",
              "text-loom-iron/70 dark:text-muslin/70",
              "transition-colors hover:text-shuttle-red"
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

          {/* CTA — desktop only */}
          <a
            href="/dashboard/upload"
            className={cn(
              "hidden md:inline-flex",
              "clip-cut-btn bg-shuttle-red px-5 py-2",
              "font-sans text-sm font-semibold text-muslin",
              "transition-opacity hover:opacity-90"
            )}
          >
            Get Started
          </a>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            className={cn(
              "flex h-9 w-9 items-center justify-center md:hidden",
              "text-loom-iron dark:text-muslin"
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
          "bg-muslin dark:bg-loom-iron",
          "border-t border-loom-iron/10 dark:border-muslin/10",
          mobileOpen ? "max-h-80" : "max-h-0"
        )}
      >
        <ul className="flex flex-col gap-1 px-4 py-4">
          {NAV_LINKS.map((link) => (
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
          <li className="pt-2">
            <a
              href="/dashboard/upload"
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
        </ul>
      </div>
    </nav>
  );
}

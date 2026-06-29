import Link from "next/link";
import { WeaveGrid } from "@/components/ui/weave-grid";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auth - ThreadCounty",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-loom-iron flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden" data-navbar-theme="dark">
      <WeaveGrid opacity={0.03} color="muslin" density="sparse" />

      {/* Top Logo */}
      <div className="absolute top-8 left-0 right-0 flex justify-center z-10">
        <Link
          href="/"
          className="flex items-baseline gap-0 font-display text-2xl uppercase tracking-wide"
        >
          <span className="text-muslin">THREAD</span>
          <span className="text-shuttle-red">COUNTY</span>
        </Link>
      </div>

      {/* Vertical type treatment (Desktop only) */}
      <div
        className="hidden md:flex fixed left-8 top-1/2 -translate-y-1/2 font-display text-shuttle-red text-xs tracking-widest uppercase select-none z-10"
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          transform: "rotate(180deg) translateY(50%)",
        }}
        aria-hidden="true"
      >
        TEXTILE / INTELLIGENCE
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full">
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
        <p suppressHydrationWarning className="font-mono text-xs text-concrete-grey tracking-wider">
          &copy; {new Date().getFullYear()} ThreadCounty
        </p>
      </div>
    </div>
  );
}

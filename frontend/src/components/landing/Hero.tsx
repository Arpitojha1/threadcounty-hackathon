"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { WeaveGrid } from "@/components/ui/weave-grid";
import { HERO_STATS } from "@/data/landing";

/* Sharp, confident easing — not bouncy */
const ease = [0.25, 0.46, 0.45, 0.94] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease },
  },
};

const fadeRight = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease },
  },
};

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden bg-loom-iron"
    >
      {/* Weave texture behind everything */}
      <WeaveGrid opacity={0.04} color="muslin" density="sparse" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
          {/* ── Left column (60%) ───────────────────────── */}
          <motion.div
            className="flex flex-col gap-8 lg:w-[60%]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Metadata label */}
            <motion.p
              variants={fadeUp}
              className="font-mono text-xs uppercase tracking-widest text-shuttle-red"
            >
              EST. 2026 · TEXTILE INTELLIGENCE
            </motion.p>

            {/* Stacked headline — one word per line */}
            <motion.h1
              variants={fadeUp}
              className={cn(
                "font-display text-7xl uppercase leading-[0.85] text-muslin",
                "md:text-8xl lg:text-9xl"
              )}
            >
              <span className="block">ANALYZE</span>
              <span className="block">EVERY</span>
              <span className="block">THREAD</span>
            </motion.h1>

            {/* Body paragraph */}
            <motion.p
              variants={fadeUp}
              className="max-w-md font-sans text-base leading-relaxed text-concrete-grey md:text-lg"
            >
              Upload a fabric image. Get instant thread density, warp and weft
              counts, fabric classification, and AI confidence scoring — in
              under three seconds.
            </motion.p>

            {/* CTA */}
            <motion.div variants={fadeUp}>
              <a href="/dashboard/upload" className="inline-block">
                <CutCornerPanel
                  variant="shuttle-red"
                  size="btn"
                  corner="tr"
                  className="px-8 py-4 font-sans text-base font-semibold transition-opacity hover:opacity-90"
                >
                  Upload Your First Fabric
                </CutCornerPanel>
              </a>
            </motion.div>
          </motion.div>

          {/* ── Right column (40%) — stat blocks ─────────── */}
          <motion.div
            className="flex flex-col gap-4 lg:w-[40%]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {HERO_STATS.map((stat) => (
              <motion.div key={stat.label} variants={fadeRight}>
                <CutCornerPanel
                  corner="tr"
                  size={stat.highlight ? "lg" : "md"}
                  variant={stat.highlight ? "shuttle-red" : "loom-iron"}
                  bordered={!stat.highlight}
                  className={cn(
                    "flex flex-col gap-1",
                    stat.highlight ? "px-8 py-8" : "px-6 py-5"
                  )}
                >
                  <span
                    className={cn(
                      "font-display uppercase",
                      stat.highlight ? "text-5xl" : "text-4xl",
                      stat.highlight ? "text-muslin" : "text-muslin"
                    )}
                  >
                    {stat.value}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-widest text-muslin/60">
                    {stat.label}
                  </span>
                </CutCornerPanel>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

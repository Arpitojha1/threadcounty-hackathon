"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { FEATURES } from "@/data/landing";

/* Sharp, confident easing */
const ease = [0.25, 0.46, 0.45, 0.94] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease },
  },
};

/*
 * Asymmetric grid span pattern:
 *   Row 1 → 7 / 5
 *   Row 2 → 5 / 7
 */
const spanClasses = [
  "md:col-span-7",
  "md:col-span-5",
  "md:col-span-5",
  "md:col-span-7",
];

export default function Features() {
  return (
    <section
      id="features"
      className="bg-muslin py-24 dark:bg-loom-iron"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Section header ───────────────────────────── */}
        <div className="mb-16">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-shuttle-red">
            CAPABILITIES
          </p>
          <h2 className="font-display text-4xl uppercase text-loom-iron dark:text-muslin md:text-5xl">
            WHAT WE MEASURE
          </h2>
        </div>

        {/* ── Card grid ────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.number}
              className={cn("col-span-1", spanClasses[i])}
              variants={cardVariants}
            >
              <CutCornerPanel
                corner={i % 2 === 0 ? "tr" : "bl"}
                size="lg"
                variant={feature.highlight ? "shuttle-red" : "loom-iron"}
                bordered={!feature.highlight}
                className="flex h-full flex-col gap-4 p-8 md:p-10"
              >
                {/* Number marker */}
                <span
                  className={cn(
                    "font-mono text-xs tracking-widest",
                    feature.highlight
                      ? "text-muslin/50"
                      : "text-muslin/40 dark:text-muslin/40"
                  )}
                >
                  {feature.number}
                </span>

                {/* Title */}
                <h3
                  className={cn(
                    "font-display text-xl uppercase md:text-2xl",
                    feature.highlight
                      ? "text-muslin"
                      : "text-muslin dark:text-muslin"
                  )}
                >
                  {feature.title}
                </h3>

                {/* Description */}
                <p
                  className={cn(
                    "mt-auto font-sans text-sm leading-relaxed",
                    feature.highlight
                      ? "text-muslin/80"
                      : "text-muslin/60 dark:text-muslin/60"
                  )}
                >
                  {feature.description}
                </p>
              </CutCornerPanel>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

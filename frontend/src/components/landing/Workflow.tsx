"use client";

import { motion } from "framer-motion";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { WeaveGrid } from "@/components/ui/weave-grid";
import { WORKFLOW_STEPS } from "@/data/landing";

const cardVariants = [
  "muslin" as const,
  "shuttle-red" as const,
  "muslin" as const,
];

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const cardMotion = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function Workflow() {
  return (
    <section id="workflow" className="relative bg-loom-iron py-24 overflow-hidden">
      <WeaveGrid opacity={0.04} color="muslin" density="normal" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="mb-16">
          <p className="font-mono text-xs text-shuttle-red tracking-widest mb-3">
            PROCESS
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-muslin uppercase">
            HOW IT WORKS
          </h2>
        </div>

        {/* Workflow cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {WORKFLOW_STEPS.map((step, i) => (
            <motion.div key={step.number} variants={cardMotion}>
              <CutCornerPanel
                corner="tr"
                size="lg"
                variant={cardVariants[i]}
                className="p-8 h-full flex flex-col"
              >
                {/* Step number */}
                <span className="font-mono text-sm tracking-widest opacity-60 mb-4">
                  {step.number}
                </span>

                {/* Title */}
                <h3 className="font-display text-2xl uppercase mb-4">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="font-sans text-sm leading-relaxed opacity-80 mb-6">
                  {step.description}
                </p>

                {/* Loading copy (step 2 only) */}
                {step.loadingCopy && (
                  <ul className="mt-auto space-y-2.5">
                    {step.loadingCopy.map((line) => (
                      <li
                        key={line}
                        className="flex items-center gap-2.5 font-mono text-xs tracking-wide"
                      >
                        <span className="inline-block h-1.5 w-1.5 bg-muslin/80 shrink-0" />
                        <span className="opacity-90">{line}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CutCornerPanel>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

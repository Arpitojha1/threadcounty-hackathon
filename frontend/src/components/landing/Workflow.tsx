"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useReducedMotion, useMotionTemplate } from "framer-motion";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { WeaveGrid } from "@/components/ui/weave-grid";
import { WORKFLOW_STEPS } from "@/data/landing";

const cardVariants = [
  "muslin" as const,
  "shuttle-red" as const,
  "muslin" as const,
];

function useStepTransforms(
  progress: any,
  index: number,
  prefersReduced: boolean | null
) {
  // Step 0: reveal [0.0, 0.2]
  // Step 1: reveal [0.33, 0.53]
  // Step 2: reveal [0.66, 0.86]
  
  const revealStart = index * 0.33;
  const revealEnd = revealStart + 0.2;

  // Clip-path reveals from top to bottom (inset(100% 0 0 0) -> inset(0% 0 0 0))
  const insetTop = useTransform(progress, [revealStart, revealEnd], [100, 0], { clamp: true });
  const clipPath = useMotionTemplate`inset(${insetTop}% 0% 0% 0%)`;

  if (prefersReduced) {
    return { clipPath: "inset(0% 0% 0% 0%)" };
  }

  return { clipPath };
}

export default function Workflow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const isReduced = prefersReduced || !isClient;

  return (
    <section 
      id="workflow" 
      ref={containerRef}
      className="relative bg-loom-iron"
      style={{ height: isReduced ? "auto" : "300vh" }}
    >
      <div
        className={
          isReduced
            ? "py-24 relative z-10 mx-auto max-w-7xl px-6"
            : "sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center py-20 relative z-10 mx-auto max-w-7xl px-6"
        }
      >
        <WeaveGrid opacity={0.04} color="muslin" density="normal" />
        
        {/* Section header */}
        <div className="mb-12 md:mb-16 z-20 relative">
          <p className="font-mono text-xs text-shuttle-red tracking-widest mb-3">
            PROCESS
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-muslin uppercase">
            HOW IT WORKS
          </h2>
        </div>

        {/* Workflow cards container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative w-full mx-auto min-h-[400px]">
          {WORKFLOW_STEPS.map((step, i) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const transforms = useStepTransforms(scrollYProgress, i, isReduced);

            return (
              <motion.div 
                key={step.number} 
                className="relative"
                style={transforms}
                initial={isReduced ? { opacity: 0, y: 30 } : undefined}
                whileInView={isReduced ? { opacity: 1, y: 0 } : undefined}
                animate={!isReduced ? { opacity: 1, y: 0 } : undefined}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <motion.div
                  whileHover={!isReduced ? { scale: 1.05 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="h-full"
                >
                  <CutCornerPanel
                    corner="tr"
                    size="lg"
                    variant={cardVariants[i]}
                    className="p-8 h-full flex flex-col shadow-2xl transition-all duration-300 hover:border-shuttle-red"
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
                      <ul className="mt-auto space-y-2.5 mb-6">
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

                    {/* Upload CTA on Card 1 */}
                    {i === 0 && (
                      <div className="mt-auto pt-4">
                        <a
                          href="/dashboard/upload"
                          className="inline-flex items-center justify-center bg-shuttle-red px-6 py-2.5 font-sans text-sm font-semibold text-muslin clip-cut-btn transition-colors hover:bg-shuttle-red/90 w-full"
                        >
                          Upload Fabric
                        </a>
                      </div>
                    )}
                  </CutCornerPanel>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

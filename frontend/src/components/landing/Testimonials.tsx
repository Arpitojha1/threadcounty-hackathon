"use client";

import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { mockTestimonials } from "@/lib/mockTestimonials";
import { cn } from "@/lib/utils";

export default function Testimonials() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Sharp, fast, confident easing per SKILL.md
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.4, ease: [0.25, 1, 0.5, 1] as const };

  return (
    <section
      id="testimonials"
      className="bg-muslin dark:bg-[#1E1C18] py-24 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6 relative">
        {/* Invisible overlay to close when clicking outside */}
        {expandedId !== null && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setExpandedId(null)}
            aria-label="Close expanded testimonial"
          />
        )}

        {/* Section header */}
        <div className="mb-16 relative z-10">
          <p className="font-mono text-xs text-shuttle-red tracking-widest mb-3">
            TRUSTED BY
          </p>
          <h2 className="font-display text-4xl md:text-5xl uppercase text-loom-iron dark:text-muslin">
            WHAT THEY SAY
          </h2>
        </div>

        {/* Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-40">
          {mockTestimonials.map((testimonial, index) => {
            const isExpanded = expandedId === testimonial.id;
            const isOtherExpanded = expandedId !== null && !isExpanded;

            // Alternate default backgrounds for asymmetric stat-block look
            const defaultVariant = index % 3 === 0 ? "concrete-grey" : "muslin";
            const variant = isExpanded ? "shuttle-red" : defaultVariant;

            return (
              <div key={testimonial.id} className="relative w-full h-[280px]">
                <motion.div
                  layout
                  initial={false}
                  onClick={() => setExpandedId(isExpanded ? null : testimonial.id)}
                  animate={{
                    scale: isOtherExpanded ? 0.95 : 1,
                    opacity: isOtherExpanded ? 0.6 : 1,
                  }}
                  transition={transition}
                  className={cn(
                    "cursor-pointer origin-center transition-shadow",
                    isExpanded ? "absolute z-50 shadow-2xl" : "absolute z-10"
                  )}
                  style={
                    isExpanded
                      ? {
                          width: "calc(100% + 32px)",
                          height: "calc(100% + 48px)",
                          top: "-24px",
                          left: "-16px",
                        }
                      : {
                          width: "100%",
                          height: "100%",
                          top: "0px",
                          left: "0px",
                        }
                  }
                >
                  <CutCornerPanel
                    corner="tr"
                    size={isExpanded ? "lg" : "md"}
                    variant={variant}
                    bordered
                    className="p-8 h-full flex flex-col transition-colors duration-300"
                  >
                    {/* Quotation mark */}
                    <span
                      className={cn(
                        "font-display text-5xl leading-none select-none mb-2 transition-colors",
                        isExpanded ? "opacity-50" : "text-shuttle-red"
                      )}
                      aria-hidden="true"
                    >
                      &ldquo;
                    </span>

                    {/* Quote */}
                    <motion.p
                      layout="position"
                      transition={transition}
                      className={cn(
                        "font-sans italic text-lg leading-relaxed mb-6 flex-1 transition-all overflow-hidden",
                        isExpanded ? "line-clamp-none" : "line-clamp-3"
                      )}
                    >
                      {testimonial.quote}
                    </motion.p>

                    {/* Attribution */}
                    <motion.div layout="position" transition={transition} className="mt-auto">
                      <p
                        className={cn(
                          "font-mono tracking-widest transition-all",
                          isExpanded ? "text-base font-bold" : "text-xs font-semibold"
                        )}
                      >
                        {testimonial.name}
                      </p>
                      <p
                        className={cn(
                          "font-mono tracking-wider mt-1 transition-all opacity-80",
                          isExpanded ? "text-sm" : "text-xs"
                        )}
                      >
                        {testimonial.role}
                      </p>
                    </motion.div>
                  </CutCornerPanel>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

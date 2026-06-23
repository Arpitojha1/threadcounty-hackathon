"use client";

import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { PRICING_TIERS } from "@/data/landing";
import { cn } from "@/lib/utils";

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const cardMotion = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="bg-muslin dark:bg-loom-iron py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="mb-16">
          <p className="font-mono text-xs text-shuttle-red tracking-widest mb-3">
            PLANS
          </p>
          <h2 className="font-display text-4xl md:text-5xl uppercase text-loom-iron dark:text-muslin">
            SIMPLE PRICING
          </h2>
        </div>

        {/* Pricing cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {PRICING_TIERS.map((tier) => (
            <motion.div
              key={tier.name}
              variants={cardMotion}
              className={cn(tier.highlight && "md:-my-4 md:z-10")}
            >
              <CutCornerPanel
                corner="tr"
                size="lg"
                variant={tier.highlight ? "shuttle-red" : "loom-iron"}
                bordered={!tier.highlight}
                className={cn(
                  "p-8 flex flex-col",
                  tier.highlight && "md:py-12"
                )}
              >
                {/* Tier name */}
                <span className="font-mono text-xs tracking-widest uppercase opacity-70 mb-4">
                  {tier.name}
                </span>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-display text-5xl">{tier.price}</span>
                  {tier.period && (
                    <span className="font-mono text-sm opacity-70">
                      {tier.period}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="font-sans text-sm opacity-70 mb-8">
                  {tier.description}
                </p>

                {/* Feature list */}
                <ul className="space-y-3 mb-10 flex-1">
                  {tier.features.map((feature) => (
                    <li
                      key={feature.text}
                      className="flex items-center gap-3 font-sans text-sm"
                    >
                      {feature.included ? (
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            tier.highlight
                              ? "text-muslin"
                              : "text-dye-indigo"
                          )}
                          strokeWidth={2.5}
                        />
                      ) : (
                        <Minus
                          className="h-4 w-4 shrink-0 text-concrete-grey"
                          strokeWidth={2}
                        />
                      )}
                      <span
                        className={cn(
                          !feature.included && "text-concrete-grey"
                        )}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <button
                  className={cn(
                    "clip-cut-btn w-full py-3 px-6 font-sans font-semibold text-sm tracking-wide transition-colors",
                    tier.highlight
                      ? "bg-muslin text-shuttle-red hover:bg-muslin/90"
                      : "bg-shuttle-red text-muslin hover:bg-shuttle-red/90"
                  )}
                >
                  {tier.cta}
                </button>
              </CutCornerPanel>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

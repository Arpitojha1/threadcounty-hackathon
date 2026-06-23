"use client";

import { motion } from "framer-motion";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { TESTIMONIALS } from "@/data/landing";

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const cardMotion = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="bg-muslin dark:bg-[#1E1C18] py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="mb-16">
          <p className="font-mono text-xs text-shuttle-red tracking-widest mb-3">
            TRUSTED BY
          </p>
          <h2 className="font-display text-4xl md:text-5xl uppercase text-loom-iron dark:text-muslin">
            WHAT THEY SAY
          </h2>
        </div>

        {/* Asymmetric grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {/* Card 1 — takes 2/3 on desktop */}
          <motion.div className="md:col-span-8" variants={cardMotion}>
            <TestimonialCard testimonial={TESTIMONIALS[0]} />
          </motion.div>

          {/* Cards 2 & 3 — stack in remaining 1/3 */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <motion.div variants={cardMotion}>
              <TestimonialCard testimonial={TESTIMONIALS[1]} />
            </motion.div>
            <motion.div variants={cardMotion}>
              <TestimonialCard testimonial={TESTIMONIALS[2]} />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
}) {
  return (
    <CutCornerPanel
      corner="tr"
      size="md"
      variant="loom-iron"
      bordered
      className="p-8 h-full flex flex-col"
    >
      {/* Quotation mark */}
      <span
        className="font-display text-5xl leading-none text-shuttle-red select-none mb-2"
        aria-hidden="true"
      >
        &ldquo;
      </span>

      {/* Quote */}
      <p className="font-sans italic text-lg text-muslin leading-relaxed mb-8 flex-1">
        {testimonial.quote}
      </p>

      {/* Attribution */}
      <div>
        <p className="font-sans font-semibold text-muslin">
          {testimonial.name}
        </p>
        <p className="font-mono text-xs tracking-wider text-concrete-grey mt-1">
          {testimonial.role} · {testimonial.company}
        </p>
      </div>
    </CutCornerPanel>
  );
}

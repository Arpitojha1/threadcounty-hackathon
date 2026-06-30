"use client";
import Link from "next/link";

import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { PRICING_TIERS } from "@/data/pricing";
import { cn } from "@/lib/utils";

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="py-24 sm:py-32 bg-muslin relative"
    >
      <div className="w-full max-w-[1400px] mx-auto px-6">

        {/* Section Header */}
        <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="font-mono text-xs tracking-widest text-concrete-grey mb-4 uppercase">
              SIMPLE PRICING
            </h2>
            <p className="font-display text-4xl sm:text-5xl uppercase text-loom-iron leading-none">
              Start free. <br />
              Scale <span className="text-shuttle-red">instantly</span>.
            </p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 group flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-loom-iron hover:text-shuttle-red transition-colors"
          >
            <span>Compare all features</span>
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {PRICING_TIERS.map((tier) => {
            const isPro = tier.id === 'professional';
            const isEnterprise = tier.id === 'enterprise';

            let variant: "muslin" | "shuttle-red" | "loom-iron" | "concrete-grey" = "muslin";
            if (isPro) variant = "shuttle-red";
            else if (isEnterprise) variant = "loom-iron";

            return (
              <div key={tier.id} className={cn("w-full h-full flex", isPro ? "xl:-mt-4" : "")}>
                <CutCornerPanel
                  variant={variant}
                  size="lg"
                  className={cn(
                    "p-12 relative flex flex-col w-full min-h-[520px]",
                    variant === "loom-iron" ? "text-muslin" : variant === "shuttle-red" ? "text-muslin" : "text-loom-iron"
                  )}
                >
                  {isPro && (
                    <div className="absolute top-4 left-0 bg-muslin text-shuttle-red font-mono text-xs uppercase tracking-widest px-4 py-1.5 translate-x-2 -translate-y-2 border border-loom-iron/10 shadow-sm z-10 clip-cut-btn">
                      Recommended
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="font-display text-2xl uppercase mb-2">{tier.name}</h3>
                    <p className={cn("font-sans text-sm", variant === "loom-iron" || variant === "shuttle-red" ? "text-muslin/80" : "text-concrete-grey")}>
                      {tier.description}
                    </p>
                  </div>

                  <div className="mb-6 flex items-baseline gap-2">
                    <span className={cn("font-mono text-5xl font-bold tracking-tight", variant === "shuttle-red" ? "text-muslin" : "")}>
                      {tier.price}
                    </span>
                    <span className={cn("font-mono text-xs uppercase tracking-wider", variant === "loom-iron" || variant === "shuttle-red" ? "text-muslin/70" : "text-concrete-grey")}>
                      {tier.priceNote}
                    </span>
                  </div>

                  <div className={cn(
                    "mb-6 p-4 border clip-cut-tr-md",
                    variant === "shuttle-red" ? "border-muslin/30 bg-muslin/10" : "border-loom-iron/10 bg-loom-iron/5"
                  )}>
                    <div className="font-mono text-xs uppercase tracking-widest mb-1 opacity-70">Capacity</div>
                    <div className="font-mono font-bold">{tier.storageText}</div>
                  </div>

                  <ul className="space-y-4 mb-8 flex-1">
                    {tier.features.slice(0, 4).map((feature, i) => (
                      <li key={i} className={cn("flex items-start gap-3", !feature.included && "opacity-50 line-through")}>
                        <svg className={cn("w-5 h-5 shrink-0 mt-0.5", variant === "shuttle-red" || variant === "loom-iron" ? "text-muslin" : "text-shuttle-red")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="square" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-sans text-sm">{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={tier.id === 'enterprise' ? "/contact" : "/pricing"}
                    className={cn(
                      "w-full text-center block clip-cut-btn py-4 font-sans font-semibold uppercase tracking-wider text-sm transition-opacity hover:opacity-90 mt-auto",
                      variant === "shuttle-red" ? "bg-muslin text-shuttle-red" :
                        variant === "loom-iron" ? "bg-shuttle-red text-muslin border-none" :
                          "bg-loom-iron text-muslin"
                    )}
                  >
                    {tier.id === 'enterprise' ? "Contact Sales" : "Get Started"}
                  </a>
                </CutCornerPanel>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

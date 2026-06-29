"use client";

import { useState } from "react";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { cn } from "@/lib/utils";
import { PRICING_TIERS, PricingTierId } from "@/data/pricing";

interface PricingClientProps {
  currentTier?: PricingTierId | null;
}

export function PricingClient({ currentTier = null }: PricingClientProps) {
  const [studentCertified, setStudentCertified] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: "",
  });

  const handleSubscribe = (tierId: PricingTierId) => {
    if (tierId === 'free' && currentTier === 'free') return;
    
    // Enterprise routing
    if (tierId === 'enterprise') {
      window.location.href = "/contact?plan=enterprise";
      return;
    }
    
    // Student routing
    if (tierId === 'student') {
      if (!studentCertified) {
        setToast({ visible: true, message: "Please certify your student status first." });
        setTimeout(() => setToast({ visible: false, message: "" }), 3000);
        return;
      }
      window.location.href = "/dashboard/billing/checkout?plan=student";
      return;
    }
    
    // Free (if logged out) or Pro routing
    if (tierId === 'free' && !currentTier) {
      window.location.href = "/login";
      return;
    }
    
    if (tierId === 'professional') {
      window.location.href = "/dashboard/billing/checkout?plan=professional";
      return;
    }
  };

  return (
    <div className="relative w-full max-w-[1400px] mx-auto px-6 py-24 sm:py-32">
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4">
          <CutCornerPanel variant="muslin" size="sm" className="px-6 py-4 shadow-2xl border border-loom-iron/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-shuttle-red animate-pulse" />
              <p className="font-sans text-sm font-medium text-loom-iron">
                {toast.message}
              </p>
            </div>
          </CutCornerPanel>
        </div>
      )}

      <div className="text-center max-w-3xl mx-auto mb-20">
        <h1 className="font-display text-5xl sm:text-6xl uppercase text-loom-iron mb-6">
          Pricing that <span className="text-shuttle-red">scales</span>
        </h1>
        <p className="font-sans text-lg text-concrete-grey">
          Start for free, upgrade when you need higher volume or professional capabilities. No hidden fees.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        {PRICING_TIERS.map((tier) => {
          const isCurrent = currentTier === tier.id;
          const isPro = tier.id === 'professional';
          const isEnterprise = tier.id === 'enterprise';
          const isStudent = tier.id === 'student';
          
          let variant: "muslin" | "shuttle-red" | "loom-iron" | "concrete-grey" = "muslin";
          if (isPro) variant = "shuttle-red";
          else if (isEnterprise) variant = "loom-iron";

          return (
            <div key={tier.id} className={cn("w-full h-full flex", isPro ? "xl:-mt-4" : "")}>
              <CutCornerPanel
                variant={variant}
                size="lg"
                className={cn(
                  "p-8 relative flex flex-col w-full min-h-[500px]",
                  variant === "loom-iron" ? "text-muslin" : variant === "shuttle-red" ? "text-muslin" : "text-loom-iron",
                  isCurrent ? "border-4 border-dye-indigo shadow-lg" : ""
                )}
              >
                {/* Badges */}
                {isPro && !isCurrent && (
                  <div className="absolute top-4 right-8 bg-muslin text-shuttle-red font-mono text-xs uppercase tracking-widest px-4 py-1.5 border border-loom-iron/10 shadow-sm z-10 clip-cut-btn">
                    Most Popular
                  </div>
                )}
                
                {isStudent && !isCurrent && (
                  <div className="absolute top-4 right-8 bg-concrete-grey text-muslin font-mono text-xs uppercase tracking-widest px-3 py-1 border border-loom-iron/10 shadow-sm z-10 clip-cut-btn">
                    Self-Certified
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute top-4 right-8 bg-dye-indigo text-muslin font-mono text-xs uppercase tracking-widest px-4 py-1.5 shadow-sm z-10 clip-cut-btn">
                    Current Plan
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

                {/* Storage highlight block */}
                <div className={cn(
                  "mb-6 p-4 border clip-cut-tr-md",
                  variant === "shuttle-red" ? "border-muslin/30 bg-muslin/10" : "border-loom-iron/10 bg-loom-iron/5"
                )}>
                  <div className="font-mono text-xs uppercase tracking-widest mb-1 opacity-70">Capacity</div>
                  <div className="font-mono font-bold">{tier.storageText}</div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {tier.features.map((feature, i) => (
                    <li key={i} className={cn("flex items-start gap-3", !feature.included && "opacity-50 line-through")}>
                      <svg className={cn("w-5 h-5 shrink-0 mt-0.5", variant === "shuttle-red" || variant === "loom-iron" ? "text-muslin" : "text-shuttle-red")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-sans text-sm">{feature.text}</span>
                    </li>
                  ))}
                </ul>

                {/* Self-certification checkbox for Student tier */}
                {isStudent && (
                  <label className="flex items-start gap-3 mb-6 cursor-pointer group relative z-20">
                    <div className="relative flex items-center justify-center w-5 h-5 shrink-0 mt-0.5 border-2 border-loom-iron/30 group-hover:border-shuttle-red transition-colors bg-white">
                      <input 
                        type="checkbox" 
                        className="opacity-0 absolute inset-0 cursor-pointer"
                        checked={studentCertified}
                        onChange={(e) => setStudentCertified(e.target.checked)}
                      />
                      {studentCertified && (
                        <div className="w-2.5 h-2.5 bg-shuttle-red" />
                      )}
                    </div>
                    <span className="font-sans text-xs text-concrete-grey leading-tight group-hover:text-loom-iron transition-colors">
                      I confirm I am a current student. I understand this is a self-certified honor system.
                    </span>
                  </label>
                )}

                {/* Mock Model Selector for Pro Tier */}
                {isPro && (
                  <div className="mb-6 p-4 border border-muslin/30 bg-muslin/5">
                    <div className="font-mono text-xs uppercase tracking-widest text-muslin/70 mb-3">Model Select Preview</div>
                    <div className="flex gap-2 relative z-20">
                      <button className="flex-1 bg-muslin text-shuttle-red font-sans text-xs font-semibold py-2 px-2 text-center border border-transparent">
                        Standard Vision
                      </button>
                      <button className="flex-1 bg-transparent text-muslin font-sans text-xs font-semibold py-2 px-2 text-center border border-muslin/30 hover:border-muslin/50 transition-colors">
                        Precision Vision
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={isCurrent}
                  className={cn(
                    "w-full clip-cut-btn py-4 font-sans font-semibold uppercase tracking-wider text-sm transition-opacity hover:opacity-90 mt-auto relative z-20",
                    isCurrent ? "bg-dye-indigo text-muslin cursor-not-allowed" : 
                    variant === "shuttle-red" ? "bg-muslin text-shuttle-red" :
                    variant === "loom-iron" ? "bg-shuttle-red text-muslin border-none" :
                    "bg-loom-iron text-muslin",
                    isStudent && !studentCertified && !isCurrent ? "opacity-50 cursor-not-allowed" : ""
                  )}
                >
                  {isCurrent ? "Current Plan" : 
                   isEnterprise ? "Contact Sales" : 
                   (tier.id === 'free' && !currentTier) ? "Sign Up Free" :
                   (!currentTier) ? "Sign up to upgrade" :
                   "Upgrade"}
                </button>
              </CutCornerPanel>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";

import { useSearchParams } from "next/navigation";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { PRICING_TIERS } from "@/data/pricing";

export function BillingClient({ subscription, usage }: { subscription: any; usage: number }) {
  const searchParams = useSearchParams();
  const success = searchParams.get("success")?.startsWith("upgrade");
  const canceled = searchParams.get("canceled") === "true";

  const plan = subscription?.plan_tier || "free";
  const status = subscription?.status || "active";
  const currentPeriodEnd = subscription?.current_period_end;

  const limits: Record<string, number | null> = {
    free: 5,
    student: 100,
    professional: 100,
    enterprise: null,
  };
  const limit = limits[plan];

  const usagePercent = limit ? Math.min((usage / limit) * 100, 100) : 0;
  const isNearLimit = limit && usagePercent >= 80;
  const isAtLimit = limit && usagePercent >= 100;

  const currentTierData = PRICING_TIERS.find(t => t.id === plan) || PRICING_TIERS[0];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 pb-24">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-4xl uppercase text-loom-iron mb-2">Billing & Usage</h1>
        <p className="font-sans text-concrete-grey">Manage your subscription and view monthly usage.</p>
      </div>

      {success && (
        <div className="bg-dye-indigo/10 border-l-4 border-dye-indigo p-4">
          <p className="text-dye-indigo font-medium">You've successfully upgraded. Your upload limit has been updated.</p>
        </div>
      )}

      {canceled && (
        <div className="bg-concrete-grey/10 border-l-4 border-concrete-grey p-4">
          <p className="text-loom-iron font-medium">No worries — you can upgrade anytime.</p>
        </div>
      )}

      <CutCornerPanel variant="muslin" className="p-8 border border-loom-iron/10 shadow-sm relative overflow-hidden">
        {plan === "professional" && (
          <div className="absolute top-0 right-0 w-2 h-full bg-shuttle-red" />
        )}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-concrete-grey mb-2">Current Plan</div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl uppercase text-loom-iron">{currentTierData.name}</span>
              {status !== "active" && (
                <span className="text-sm font-medium text-shuttle-red">({status})</span>
              )}
            </div>
            {currentPeriodEnd && (
              <p className="text-sm text-concrete-grey mt-2">
                Renews on {new Date(currentPeriodEnd).toLocaleDateString('en-US')}
              </p>
            )}
          </div>

          <div className="flex-1 max-w-md">
            <div className="flex justify-between items-end mb-2">
              <div className="font-mono text-xs uppercase tracking-widest text-concrete-grey">Usage this month</div>
              <div className="font-mono text-sm font-medium">
                {usage} / {limit === null ? "Unlimited" : limit}
              </div>
            </div>
            {limit !== null && (
              <>
                <Progress 
                  value={usagePercent} 
                  className="h-2 bg-concrete-grey/20" 
                  indicatorClassName={cn(isAtLimit ? "bg-shuttle-red" : isNearLimit ? "bg-madder" : "bg-loom-iron")}
                />
                {isAtLimit && (
                  <p className="text-xs text-shuttle-red mt-2">You have reached your monthly limit.</p>
                )}
              </>
            )}
          </div>
        </div>
      </CutCornerPanel>

      <div>
        <h2 className="font-display text-2xl uppercase text-loom-iron mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {PRICING_TIERS.map((tier) => {
            const isCurrent = plan === tier.id;
            const isPro = tier.id === 'professional';
            const isEnterprise = tier.id === 'enterprise';
            const isStudent = tier.id === 'student';

            let variant: "muslin" | "shuttle-red" | "loom-iron" = "muslin";
            if (isPro) variant = "shuttle-red";
            else if (isEnterprise) variant = "loom-iron";

            return (
              <div key={tier.id} className={cn("w-full h-full flex", isPro ? "xl:-mt-4" : "")}>
                <CutCornerPanel 
                  variant={variant} 
                  className={cn(
                    "p-8 relative flex flex-col w-full min-h-[500px]", 
                    variant === "shuttle-red" ? "text-muslin" : 
                    variant === "loom-iron" ? "text-muslin" : "text-loom-iron",
                    isCurrent ? "border-4 border-dye-indigo shadow-lg" : ""
                  )}
                >
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
                  <div className="mb-6 mt-2">
                    <h3 className={cn("font-display text-2xl uppercase", variant === "shuttle-red" ? "text-muslin" : "")}>{tier.name}</h3>
                    <div className={cn("mt-2 flex items-baseline gap-2", variant === "shuttle-red" ? "text-muslin" : "")}>
                      <span className="font-mono text-5xl font-bold tracking-tight">{tier.price}</span>
                      <span className={cn("font-mono text-xs uppercase tracking-wider", variant === "shuttle-red" || variant === "loom-iron" ? "text-muslin/70" : "text-concrete-grey")}>
                        {tier.priceNote}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "mb-6 p-4 border clip-cut-tr-md",
                    variant === "shuttle-red" ? "border-muslin/30 bg-muslin/10" : "border-loom-iron/10 bg-loom-iron/5"
                  )}>
                    <div className="font-mono text-xs uppercase tracking-widest mb-1 opacity-70">Capacity</div>
                    <div className="font-mono font-bold text-sm">{tier.storageText}</div>
                  </div>
                  <ul className={cn("text-sm space-y-4 mb-8 flex-1", variant === "shuttle-red" ? "text-muslin/90" : variant === "loom-iron" ? "text-muslin/80" : "text-concrete-grey")}>
                    {tier.features.map((f, i) => (
                      <li key={i} className={cn("flex items-start gap-3", !f.included && "opacity-50 line-through")}>
                        <svg className={cn("w-5 h-5 shrink-0 mt-0.5", variant === "shuttle-red" || variant === "loom-iron" ? "text-muslin" : "text-shuttle-red")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="square" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-sans text-sm">{f.text}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {isCurrent ? (
                    <button disabled className={cn(
                      "w-full py-4 font-sans text-sm font-semibold uppercase tracking-wider clip-cut-btn cursor-not-allowed mt-auto relative z-20",
                      "bg-dye-indigo text-muslin"
                    )}>
                      Current Plan
                    </button>
                  ) : isEnterprise ? (
                    <Link href="/contact" className={cn(
                      "w-full text-center block py-4 transition-colors font-sans text-sm font-semibold uppercase tracking-wider clip-cut-btn mt-auto relative z-20",
                      variant === "loom-iron" ? "border-2 border-muslin text-muslin hover:bg-muslin hover:text-loom-iron" : "border-2 border-loom-iron text-loom-iron hover:bg-loom-iron hover:text-muslin"
                    )}>
                      Contact Sales
                    </Link>
                  ) : (
                    <a 
                      href={tier.id === 'free' ? "/contact" : `/dashboard/billing/checkout?plan=${tier.id}`}
                      className={cn(
                        "w-full text-center block py-4 transition-colors font-sans text-sm font-semibold uppercase tracking-wider clip-cut-btn mt-auto relative z-20",
                        variant === "shuttle-red" ? "bg-muslin text-shuttle-red hover:bg-muslin/90" : "bg-loom-iron text-muslin hover:bg-loom-iron/90"
                      )}
                    >
                      {tier.id === 'free' ? "Downgrade" : "Upgrade"}
                    </a>
                  )}
                </CutCornerPanel>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

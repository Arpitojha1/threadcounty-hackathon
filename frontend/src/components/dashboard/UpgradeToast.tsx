"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { PRICING_TIERS } from "@/data/pricing";

export function UpgradeToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [planName, setPlanName] = useState("");

  useEffect(() => {
    const success = searchParams.get("success");
    if (success && success.startsWith("upgrade_")) {
      const planId = success.replace("upgrade_", "");
      const tier = PRICING_TIERS.find(t => t.id === planId);
      if (tier) {
        setPlanName(tier.name);
        setShow(true);
        // Clear param from URL without reload
        router.replace("/dashboard", { scroll: false });
        
        // Hide after 5 seconds
        setTimeout(() => setShow(false), 5000);
      }
    }
  }, [searchParams, router]);

  if (!show) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4">
      <CutCornerPanel variant="muslin" size="sm" className="px-6 py-4 shadow-2xl border border-shuttle-red/20 bg-shuttle-red">
        <div className="flex items-center gap-3 text-muslin">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="square" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="font-sans text-sm font-medium">
            You're now on the {planName} plan.
          </p>
        </div>
      </CutCornerPanel>
    </div>
  );
}

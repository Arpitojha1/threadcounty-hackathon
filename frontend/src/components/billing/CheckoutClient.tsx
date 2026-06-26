"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { cn } from "@/lib/utils";

interface CheckoutClientProps {
  plan: string;
  planName: string;
  planPrice: string;
  priceNote: string;
}

export function CheckoutClient({ plan, planName, planPrice, priceNote }: CheckoutClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/mock-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process checkout");
      }

      // Success, redirect to dashboard with success param
      router.push(`/dashboard?success=upgrade_${plan}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <CutCornerPanel variant="muslin" size="lg" className="p-8">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Order Summary */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-loom-iron/10 pb-8 md:pb-0 md:pr-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-concrete-grey mb-6">Order Summary</h2>
          <div className="mb-4">
            <h3 className="font-display text-2xl uppercase mb-1">{planName} Plan</h3>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold tracking-tight">{planPrice}</span>
              <span className="font-mono text-xs uppercase tracking-wider text-concrete-grey">{priceNote}</span>
            </div>
          </div>
          <div className="p-4 bg-madder/10 border border-madder/20 mt-8">
            <p className="font-sans text-xs text-madder font-medium leading-relaxed">
              This is a demo checkout for hackathon judging purposes. No payment is processed.
            </p>
          </div>
        </div>

        {/* Payment Form */}
        <div className="w-full md:w-2/3">
          <h2 className="font-mono text-xs uppercase tracking-widest text-concrete-grey mb-6">Payment Details</h2>
          
          {error && (
            <div className="bg-madder/10 border border-madder/30 text-madder text-sm p-3 mb-6 font-sans">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-loom-iron/70 mb-2">Name on Card</label>
              <input 
                type="text" 
                required 
                className="w-full bg-transparent border border-loom-iron/20 p-3 font-sans text-loom-iron focus:outline-none focus:border-shuttle-red transition-colors placeholder:text-concrete-grey"
                placeholder="Jane Doe"
              />
            </div>
            
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-loom-iron/70 mb-2">Card Number</label>
              <input 
                type="text" 
                required 
                className="w-full bg-transparent border border-loom-iron/20 p-3 font-mono text-loom-iron focus:outline-none focus:border-shuttle-red transition-colors placeholder:text-concrete-grey"
                placeholder="4242 4242 4242 4242"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block font-mono text-xs uppercase tracking-widest text-loom-iron/70 mb-2">Expiry Date</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-transparent border border-loom-iron/20 p-3 font-mono text-loom-iron focus:outline-none focus:border-shuttle-red transition-colors placeholder:text-concrete-grey"
                  placeholder="MM/YY"
                />
              </div>
              <div className="flex-1">
                <label className="block font-mono text-xs uppercase tracking-widest text-loom-iron/70 mb-2">CVC</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-transparent border border-loom-iron/20 p-3 font-mono text-loom-iron focus:outline-none focus:border-shuttle-red transition-colors placeholder:text-concrete-grey"
                  placeholder="123"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full clip-cut-btn bg-shuttle-red text-muslin py-4 font-sans font-semibold uppercase tracking-wider text-sm transition-all mt-6",
                loading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
              )}
            >
              {loading ? "Processing..." : `Subscribe to ${planName}`}
            </button>
          </form>
        </div>
      </div>
    </CutCornerPanel>
  );
}

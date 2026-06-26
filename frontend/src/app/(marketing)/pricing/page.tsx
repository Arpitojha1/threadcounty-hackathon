import { PricingClient } from "@/components/marketing/PricingClient";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pricing | ThreadCounty",
  description: "ThreadCounty pricing plans. Start for free, upgrade when you need higher volume or professional API access.",
};

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let currentTier = null;
  if (user) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan_tier")
      .eq("user_id", user.id)
      .single();
    currentTier = subscription?.plan_tier || "free";
  }

  return (
    <div className="min-h-screen bg-muslin selection:bg-shuttle-red selection:text-muslin pt-20">
      <PricingClient currentTier={currentTier} />
    </div>
  );
}

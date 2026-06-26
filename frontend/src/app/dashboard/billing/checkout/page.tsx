import { redirect } from "next/navigation";
import { CheckoutClient } from "@/components/billing/CheckoutClient";
import { PRICING_TIERS } from "@/data/pricing";

interface PageProps {
  searchParams: Promise<{ plan?: string }>;
}

export default async function CheckoutPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const plan = resolvedParams.plan;
  
  if (!plan || (plan !== 'student' && plan !== 'professional')) {
    redirect('/pricing');
  }

  const selectedTier = PRICING_TIERS.find(t => t.id === plan);
  if (!selectedTier) {
    redirect('/pricing');
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-4xl uppercase text-loom-iron dark:text-muslin tracking-wide mb-2">
          Checkout
        </h1>
        <p className="font-sans text-sm text-concrete-grey">
          Complete your upgrade to the {selectedTier.name} plan.
        </p>
      </div>
      <CheckoutClient 
        plan={plan} 
        planName={selectedTier.name} 
        planPrice={selectedTier.price} 
        priceNote={selectedTier.priceNote} 
      />
    </div>
  );
}

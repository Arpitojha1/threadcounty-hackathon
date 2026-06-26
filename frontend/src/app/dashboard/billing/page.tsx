import { createClient } from "@/lib/supabase/server";
import { BillingClient } from "@/components/billing/BillingClient";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing | ThreadCounty",
  description: "Manage your subscription and billing.",
};

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch usage for current month unconditionally from 'uploads'
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: uploadsThisMonth } = await supabase
    .from("uploads")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth.toISOString());

  return (
    <div className="w-full h-full flex flex-col p-6 sm:p-12">
      <BillingClient 
        subscription={subscription} 
        usage={uploadsThisMonth || 0} 
      />
    </div>
  );
}

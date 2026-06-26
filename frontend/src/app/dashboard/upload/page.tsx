import { createClient } from "@/lib/supabase/server";
import { UploadClient } from "@/components/upload/UploadClient";
import { redirect } from "next/navigation";

export default async function UploadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's tier to enforce UI limits (model selection)
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_tier")
    .eq("user_id", user.id)
    .single();

  const tier = subscription?.plan_tier || "free";

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-4xl uppercase text-loom-iron dark:text-muslin tracking-wide mb-2">
          ANALYZE FABRIC
        </h1>
        <p className="font-sans text-sm text-concrete-grey">
          Upload a clear, macro-level image of your fabric. Our AI will analyze the weave structure, thread density, and classify the material.
        </p>
      </div>

      <UploadClient userId={user.id} tier={tier} />
    </div>
  );
}

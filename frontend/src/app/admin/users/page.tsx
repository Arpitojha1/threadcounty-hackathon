import { createClient } from "@/lib/supabase/server";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { redirect } from "next/navigation";
import { UsersClient } from "./UsersClient";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profiles joined with subscriptions and uploads count.
  // Wait, Supabase js doesn't easily do exact count aggregation in a single nested join without RPC.
  // Let's fetch profiles and subscriptions. We can fetch upload counts separately or just do it in the client component.
  
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select(`
      id,
      username,
      full_name,
      role,
      created_at,
      subscriptions(plan_tier)
    `)
    .order("created_at", { ascending: false });

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
  }

  // Format data
  const formattedUsers = (profiles || []).map((p: any) => ({
    id: p.id,
    username: p.username,
    full_name: p.full_name,
    role: p.role,
    created_at: p.created_at,
    tier: p.subscriptions?.[0]?.plan_tier || 'free',
  }));

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="font-display text-4xl uppercase text-muslin tracking-wide mb-2">
          Manage Users
        </h1>
        <p className="font-sans text-sm text-concrete-grey">
          View all registered users and adjust their subscription tiers.
        </p>
      </div>

      <CutCornerPanel variant="muslin" size="sm" bordered className="bg-muslin/5">
        <UsersClient initialUsers={formattedUsers} />
      </CutCornerPanel>
    </div>
  );
}

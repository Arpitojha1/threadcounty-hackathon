import { createClient } from "@/lib/supabase/server";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Basic security check (Middleware should catch this, but good to be safe)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Run queries in parallel
  const [
    { count: totalUsers },
    { data: subscriptions },
    { count: totalReports },
    { data: reports },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("plan_tier"),
    supabase.from("reports").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("fabric_type, created_at")
  ]);

  // Aggregate subscription tiers
  const tierCounts: Record<string, number> = {
    free: 0,
    student: 0,
    professional: 0,
    enterprise: 0,
  };
  
  if (subscriptions) {
    subscriptions.forEach(sub => {
      const tier = sub.plan_tier as string;
      if (tierCounts[tier] !== undefined) {
        tierCounts[tier]++;
      }
    });
  }

  // Aggregate fabric types
  const fabricCounts: Record<string, number> = {};
  if (reports) {
    reports.forEach(r => {
      const type = r.fabric_type || 'Unknown';
      fabricCounts[type] = (fabricCounts[type] || 0) + 1;
    });
  }

  // Sort fabric types by count
  const sortedFabrics = Object.entries(fabricCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl uppercase text-muslin tracking-wide mb-2">
          Platform Overview
        </h1>
        <p className="font-sans text-sm text-concrete-grey">
          High-level statistics and usage metrics across all accounts.
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CutCornerPanel variant="muslin" size="sm" bordered className="p-6">
          <h3 className="font-mono text-xs uppercase tracking-widest text-concrete-grey mb-2">Total Users</h3>
          <p className="font-display text-5xl text-loom-iron">{totalUsers || 0}</p>
        </CutCornerPanel>

        <CutCornerPanel variant="muslin" size="sm" bordered className="p-6">
          <h3 className="font-mono text-xs uppercase tracking-widest text-concrete-grey mb-2">Total Reports Analyzed</h3>
          <p className="font-display text-5xl text-loom-iron">{totalReports || 0}</p>
        </CutCornerPanel>
      </div>

      {/* Tier Distribution */}
      <div className="mt-8">
        <h2 className="font-display text-xl uppercase text-muslin tracking-wide mb-4 border-b border-muslin/10 pb-2">
          Subscription Tiers
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(tierCounts).map(([tier, count]) => (
            <div key={tier} className="bg-muslin/5 border border-muslin/10 p-4 relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="font-mono text-xs uppercase tracking-widest text-concrete-grey mb-1">{tier}</h4>
                <p className="font-display text-3xl text-muslin group-hover:text-shuttle-red transition-colors">{count}</p>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fabric Type Distribution */}
      <div className="mt-8">
        <h2 className="font-display text-xl uppercase text-muslin tracking-wide mb-4 border-b border-muslin/10 pb-2">
          Analyzed Fabrics
        </h2>
        {sortedFabrics.length === 0 ? (
          <div className="text-center py-12 bg-muslin/5 border border-muslin/10">
            <p className="font-sans text-concrete-grey">No reports analyzed yet.</p>
          </div>
        ) : (
          <div className="bg-muslin/5 border border-muslin/10 overflow-hidden">
            <table className="w-full text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-muslin/10 bg-muslin/5">
                  <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs">Fabric Type</th>
                  <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {sortedFabrics.map(([type, count]) => (
                  <tr key={type} className="border-b border-muslin/5 hover:bg-muslin/10 transition-colors">
                    <td className="py-3 px-4 text-muslin">{type}</td>
                    <td className="py-3 px-4 text-muslin text-right font-mono">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

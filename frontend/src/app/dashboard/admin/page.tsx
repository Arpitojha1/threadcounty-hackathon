import { createClient } from "@/lib/supabase/server";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { redirect } from "next/navigation";
import { UsersTableClient } from "./users-table-client";
import { ReportsTableClient } from "./reports-table-client";

export default async function AdminDashboardPage() {
  // EXPLICIT CHECK: Using the session-aware server client, not the anon-key client.
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Double check admin role here for safety (even though middleware intercepts)
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profile?.is_admin !== true) {
    redirect("/dashboard");
  }

  // Fetch total users
  const { count: totalUsers, error: countError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  // Fetch profiles
  const { data: profiles, error: usersError } = await supabase
    .from("profiles")
    .select("id, full_name, created_at")
    .order("created_at", { ascending: false });

  // Fetch subscriptions
  const { data: subscriptions, error: subsError } = await supabase
    .from("subscriptions")
    .select("user_id, plan_tier");

  // Fetch reports
  const { data: rawReports, error: reportsError } = await supabase
    .from("reports")
    .select("id, fabric_type, confidence_score, created_at, user_id, deleted_at, image_url")
    .order("created_at", { ascending: false });

  // 1. Fetch total uploads (count)
  const { count: totalUploads, error: uploadsCountError } = await supabase
    .from("uploads")
    .select("id", { count: "exact", head: true });

  // 5. Fetch storage usage
  const { data: uploadsStorageData, error: storageError } = await supabase
    .from("uploads")
    .select("file_size_bytes");

  // Merge them in application code
  const users = (profiles || []).map((p: any) => {
    const sub = (subscriptions || []).find((s: any) => s.user_id === p.id);
    return {
      ...p,
      tier: sub?.plan_tier || 'free'
    };
  });

  const reports = (rawReports || []).map((r: any) => {
    const userProfile = profiles?.find((p: any) => p.id === r.user_id);
    return {
      ...r,
      profiles: userProfile ? { full_name: userProfile.full_name } : null
    };
  });

  // Handle any potential RLS/query errors gracefully
  const hasError = !!countError || !!usersError || !!subsError || !!reportsError || !!uploadsCountError || !!storageError;

  // Calculate Reports Stats
  const totalReports = rawReports?.length || 0;
  const activeReports = rawReports?.filter(r => r.deleted_at === null).length || 0;
  const deletedReports = totalReports - activeReports;

  // Calculate Average Confidence
  const scores = rawReports?.map(r => r.confidence_score).filter(s => s != null) || [];
  const avgConfidence = scores.length > 0 ? (scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1) : "0";

  // Calculate Tier Distribution
  const tierCounts = (subscriptions || []).reduce((acc: any, sub: any) => {
    const t = sub.plan_tier || 'free';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, { free: 0, student: 0, professional: 0, enterprise: 0 });

  // Calculate Total Storage Bytes
  const totalBytes = uploadsStorageData?.reduce((sum, row) => sum + (row.file_size_bytes || 0), 0) || 0;
  
  // Storage formatting helper reused from per-user dashboard logic
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl uppercase text-muslin tracking-wide mb-2">
          Admin Dashboard
        </h1>
        <p className="font-sans text-sm text-concrete-grey">
          View-only access to platform users and statistics.
        </p>
      </div>

      {hasError ? (
        <CutCornerPanel variant="shuttle-red" size="sm" bordered className="p-6">
          <h3 className="font-mono text-xs uppercase tracking-widest text-shuttle-red mb-2">Error Loading Data</h3>
          <p className="font-sans text-sm text-muslin">
            There was a problem accessing the administration data. Please check if your account has the correct permissions.
          </p>
          <pre className="mt-4 p-4 bg-black/50 text-xs font-mono text-concrete-grey overflow-auto rounded">
            {JSON.stringify({ countError, usersError, subsError, reportsError }, null, 2)}
          </pre>
        </CutCornerPanel>
      ) : (
        <>
          {/* Platform Analytics - Asymmetric Stat Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <CutCornerPanel variant="shuttle-red" size="sm" bordered className="p-6 md:col-span-2">
              <h3 className="font-mono text-xs uppercase tracking-widest text-muslin/70 mb-2">Total Uploads (All-Time)</h3>
              <p className="font-display text-5xl text-muslin">{totalUploads || 0}</p>
              <p className="font-sans text-xs text-muslin/50 mt-2 max-w-xs">Platform-wide total, across all users. Not period-scoped.</p>
            </CutCornerPanel>
            
            <CutCornerPanel variant="muslin" size="sm" bordered className="p-6 md:col-span-1">
              <h3 className="font-mono text-xs uppercase tracking-widest text-concrete-grey mb-2">Total Users</h3>
              <p className="font-display text-4xl text-loom-iron">{totalUsers || 0}</p>
            </CutCornerPanel>

            <CutCornerPanel variant="muslin" size="sm" bordered className="p-6 md:col-span-1">
              <h3 className="font-mono text-xs uppercase tracking-widest text-concrete-grey mb-2">Storage Used</h3>
              <p className="font-display text-4xl text-loom-iron">{formatBytes(totalBytes)}</p>
            </CutCornerPanel>

            <CutCornerPanel variant="muslin" size="sm" bordered className="p-6 md:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="font-mono text-xs uppercase tracking-widest text-concrete-grey mb-2">Report Health</h3>
                <p className="font-display text-5xl text-loom-iron">{totalReports}</p>
                <p className="font-sans text-sm text-concrete-grey mt-1">Total Reports Analyzed</p>
              </div>
              <div className="flex gap-6 mt-6 border-t border-muslin/10 pt-4">
                <div>
                  <p className="font-mono text-xl text-loom-iron">{activeReports}</p>
                  <p className="font-sans text-xs text-concrete-grey uppercase tracking-wider">Active</p>
                </div>
                <div>
                  <p className="font-mono text-xl text-loom-iron">{deletedReports}</p>
                  <p className="font-sans text-xs text-concrete-grey uppercase tracking-wider">Soft-Deleted</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-mono text-xl text-shuttle-red">{avgConfidence}%</p>
                  <p className="font-sans text-xs text-concrete-grey uppercase tracking-wider">Avg Confidence</p>
                </div>
              </div>
            </CutCornerPanel>

            <CutCornerPanel variant="muslin" size="sm" bordered className="p-6 md:col-span-2">
              <h3 className="font-mono text-xs uppercase tracking-widest text-concrete-grey mb-4">Tier Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="font-display text-3xl text-loom-iron">{tierCounts.free}</p>
                  <p className="font-mono text-[10px] text-concrete-grey uppercase mt-1">Free</p>
                </div>
                <div>
                  <p className="font-display text-3xl text-loom-iron">{tierCounts.student}</p>
                  <p className="font-mono text-[10px] text-concrete-grey uppercase mt-1">Student</p>
                </div>
                <div>
                  <p className="font-display text-3xl text-loom-iron">{tierCounts.professional}</p>
                  <p className="font-mono text-[10px] text-concrete-grey uppercase mt-1">Pro</p>
                </div>
                <div>
                  <p className="font-display text-3xl text-loom-iron">{tierCounts.enterprise}</p>
                  <p className="font-mono text-[10px] text-concrete-grey uppercase mt-1">Enterprise</p>
                </div>
              </div>
            </CutCornerPanel>
          </div>

          {/* Users List */}
          <div className="mt-8">
            <h2 className="font-display text-xl uppercase text-muslin tracking-wide mb-4 border-b border-muslin/10 pb-2">
              Registered Users
            </h2>
            
            <UsersTableClient initialUsers={users} />
          </div>

          {/* Reports List */}
          <div className="mt-12">
            <h2 className="font-display text-xl uppercase text-muslin tracking-wide mb-4 border-b border-muslin/10 pb-2">
              System Reports
            </h2>
            
            <ReportsTableClient initialReports={reports} />
          </div>
        </>
      )}
    </div>
  );
}

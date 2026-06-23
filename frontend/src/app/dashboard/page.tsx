import { createClient } from "@/lib/supabase/server";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { UserInformation } from "@/components/dashboard/UserInformation";
import { TotalUploads } from "@/components/dashboard/TotalUploads";
import { StorageUsage } from "@/components/dashboard/StorageUsage";
import { RecentReports } from "@/components/dashboard/RecentReports";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Notifications } from "@/components/dashboard/Notifications";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch data concurrently
  const [
    { count: uploadsCount, data: storageData },
    { data: reportsData }
  ] = await Promise.all([
    supabase
      .from("uploads")
      .select("file_size", { count: "exact" })
      .eq("user_id", user.id),
    supabase
      .from("reports")
      .select("id, fabric_type, confidence_score, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  const totalBytes = storageData?.reduce((acc, row) => acc + (row.file_size || 0), 0) || 0;
  const recentReports = reportsData || [];

  // Construct timeline from reports
  const timelineItems = recentReports.map((r) => ({
    id: r.id,
    type: "report" as const,
    title: r.fabric_type || "Analysis",
    date: r.created_at
  }));

  return (
    <div className="w-full space-y-6">
      <WelcomeSection email={user.email || ""} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 h-48">
          <UserInformation createdAt={user.created_at} />
        </div>
        <div className="md:col-span-1 h-48">
          <TotalUploads count={uploadsCount || 0} />
        </div>
        <div className="md:col-span-1 h-48">
          <StorageUsage bytesUsed={totalBytes} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64">
            <QuickActions />
          </div>
          <div>
            <RecentReports reports={recentReports} />
          </div>
          <div>
            <ActivityTimeline items={timelineItems} />
          </div>
        </div>
        <div className="lg:col-span-1 h-96 sticky top-24">
          <Notifications />
        </div>
      </div>
    </div>
  );
}

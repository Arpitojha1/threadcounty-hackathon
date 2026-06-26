import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminReportsClient } from "./AdminReportsClient";

export default async function AdminReportsPage(props: { searchParams: Promise<{ user_id?: string }> }) {
  const searchParams = await props.searchParams;
  const filterUserId = searchParams.user_id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch reports joined with uploads and profiles
  let query = supabase
    .from("reports")
    .select(`
      id,
      fabric_type,
      confidence_score,
      created_at,
      deleted_at,
      uploads (
        image_url,
        file_name
      ),
      profiles (
        username,
        full_name
      )
    `)
    .order("created_at", { ascending: false });

  if (filterUserId) {
    query = query.eq("user_id", filterUserId);
  }

  const { data: reports, error } = await query;

  if (error) {
    console.error("Error fetching admin reports:", error);
  }

  const formattedReports = (reports || []).map((r: any) => ({
    id: r.id,
    fabric_type: r.fabric_type,
    confidence_score: r.confidence_score,
    created_at: r.created_at,
    deleted_at: r.deleted_at,
    image_url: r.uploads?.image_url,
    file_name: r.uploads?.file_name,
    username: r.profiles?.username || 'Unknown',
  }));

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="font-display text-4xl uppercase text-muslin tracking-wide mb-2">
          Global Uploads
        </h1>
        <p className="font-sans text-sm text-concrete-grey">
          View and manage all fabric analysis reports across the platform.
        </p>
      </div>

      <AdminReportsClient initialReports={formattedReports} filterUserId={filterUserId} />
    </div>
  );
}

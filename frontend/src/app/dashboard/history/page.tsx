import { createClient } from "@/lib/supabase/server";
import { HistoryClient } from "@/components/history/HistoryClient";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // We fetch reports and join with uploads to get the image_url
  const { data: reports, error } = await supabase
    .from("reports")
    .select(`
      id,
      fabric_type,
      confidence_score,
      created_at,
      ai_suggestions,
      uploads (
        image_url,
        file_name
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching history:", error);
  }

  // Format data for the client component
  const formattedReports = (reports || []).map((r: any) => ({
    id: r.id,
    fabric_type: r.fabric_type,
    confidence_score: r.confidence_score,
    created_at: r.created_at,
    ai_suggestions: r.ai_suggestions,
    image_url: r.uploads?.image_url,
    file_name: r.uploads?.file_name
  }));

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="font-display text-4xl uppercase text-loom-iron dark:text-muslin tracking-wide mb-2">
          ANALYSIS HISTORY
        </h1>
        <p className="font-sans text-sm text-concrete-grey">
          Review, search, and manage your past fabric analyses.
        </p>
      </div>

      <HistoryClient initialReports={formattedReports} />
    </div>
  );
}

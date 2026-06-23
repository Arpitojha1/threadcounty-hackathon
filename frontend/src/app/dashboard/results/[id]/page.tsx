import { createClient } from "@/lib/supabase/server";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: report, error } = await supabase
    .from("reports")
    .select(`
      id,
      fabric_type,
      confidence_score,
      thread_density,
      warp_count,
      weft_count,
      ai_suggestions,
      created_at,
      uploads (
        image_url
      )
    `)
    .eq("id", id)
    .single();

  if (error || !report) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-12">
        <CutCornerPanel variant="muslin" size="lg" className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-madder/10 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" className="text-madder">
              <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 className="font-display text-2xl uppercase tracking-wide text-loom-iron mb-2">Report Not Found</h2>
          <p className="font-sans text-concrete-grey mb-8">
            The requested analysis report could not be found, or you do not have permission to view it.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard/history" className="px-6 py-3 font-sans font-medium text-loom-iron border border-loom-iron/20 hover:bg-loom-iron/5 transition-colors">
              View History
            </Link>
            <Link href="/dashboard/upload" className="clip-cut-btn bg-shuttle-red text-muslin px-6 py-3 font-sans font-semibold hover:opacity-90 transition-opacity">
              Upload New
            </Link>
          </div>
        </CutCornerPanel>
      </div>
    );
  }

  // Ensure ai_suggestions is parsed if it came back as a string, or map it directly if array
  let suggestions: string[] = [];
  if (Array.isArray(report.ai_suggestions)) {
    suggestions = report.ai_suggestions;
  } else if (typeof report.ai_suggestions === 'string') {
    try {
      suggestions = JSON.parse(report.ai_suggestions);
    } catch {
      // split by something or just wrap
      suggestions = [report.ai_suggestions];
    }
  }

  const confidencePercent = Math.round(report.confidence_score || 0);
  const imageUrl = Array.isArray(report.uploads) ? report.uploads[0]?.image_url : (report.uploads as any)?.image_url;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl uppercase text-loom-iron dark:text-muslin tracking-wide mb-2">
            {report.fabric_type || "Unknown Fabric"}
          </h1>
          <p className="font-mono text-sm text-concrete-grey tracking-wider uppercase">
            Analysis completed on {new Date(report.created_at).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric'
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/history" className="px-4 py-2 font-sans text-sm font-medium text-concrete-grey hover:text-loom-iron dark:hover:text-muslin transition-colors">
            &larr; Back to History
          </Link>
          <Link href="/dashboard/upload" className="clip-cut-btn bg-shuttle-red text-muslin px-4 py-2 font-sans text-sm font-semibold hover:opacity-90 transition-opacity">
            Analyze Another
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Image */}
        <div className="lg:col-span-5">
          <CutCornerPanel variant="transparent" bordered size="sm" className="p-4 bg-white dark:bg-[#1E1C18] border-loom-iron/10 dark:border-muslin/10">
            <div className="aspect-square relative bg-loom-iron/5 dark:bg-muslin/5 flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <img src={imageUrl} alt="Uploaded fabric" className="w-full h-full object-cover" />
              ) : (
                <span className="font-mono text-concrete-grey text-sm uppercase">No Image Available</span>
              )}
            </div>
          </CutCornerPanel>
        </div>

        {/* Right Column: Data */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Confidence Score Bar */}
          <CutCornerPanel variant="muslin" size="sm" className="p-6">
            <div className="flex justify-between items-end mb-3">
              <h3 className="font-sans font-semibold text-loom-iron uppercase tracking-widest text-xs">AI Confidence Match</h3>
              <span className="font-mono text-xl font-bold text-shuttle-red">{confidencePercent}%</span>
            </div>
            <div className="w-full h-2 bg-loom-iron/10 overflow-hidden">
              <div 
                className="h-full bg-shuttle-red transition-all duration-1000 ease-out" 
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
          </CutCornerPanel>

          {/* Measurements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <CutCornerPanel variant="transparent" bordered size="sm" className="p-6 bg-white dark:bg-[#1E1C18] border-loom-iron/10 dark:border-muslin/10">
              <h4 className="font-sans text-xs font-semibold text-concrete-grey uppercase tracking-widest mb-4">Thread Density</h4>
              <p className="font-mono text-3xl text-loom-iron dark:text-muslin">
                {report.thread_density ? report.thread_density.toFixed(1) : "—"}
              </p>
              <p className="font-mono text-[10px] text-concrete-grey mt-1">per cm²</p>
            </CutCornerPanel>

            <CutCornerPanel variant="transparent" bordered size="sm" className="p-6 bg-white dark:bg-[#1E1C18] border-loom-iron/10 dark:border-muslin/10">
              <h4 className="font-sans text-xs font-semibold text-concrete-grey uppercase tracking-widest mb-4">Warp Count</h4>
              <p className="font-mono text-3xl text-loom-iron dark:text-muslin">
                {report.warp_count || "—"}
              </p>
              <p className="font-mono text-[10px] text-concrete-grey mt-1">threads</p>
            </CutCornerPanel>

            <CutCornerPanel variant="transparent" bordered size="sm" className="p-6 bg-white dark:bg-[#1E1C18] border-loom-iron/10 dark:border-muslin/10">
              <h4 className="font-sans text-xs font-semibold text-concrete-grey uppercase tracking-widest mb-4">Weft Count</h4>
              <p className="font-mono text-3xl text-loom-iron dark:text-muslin">
                {report.weft_count || "—"}
              </p>
              <p className="font-mono text-[10px] text-concrete-grey mt-1">threads</p>
            </CutCornerPanel>
          </div>

          {/* AI Suggestions */}
          <CutCornerPanel variant="loom-iron" size="sm" className="p-8">
            <h3 className="font-display text-xl uppercase tracking-wide text-muslin mb-6 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" className="text-shuttle-red"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              Structural Analysis
            </h3>
            
            {suggestions.length > 0 ? (
              <ul className="space-y-4">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-mono text-shuttle-red mt-0.5">0{i + 1}</span>
                    <p className="font-sans text-muslin/80 leading-relaxed">{s}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-sans text-muslin/60 italic">No structural suggestions provided by the model.</p>
            )}
          </CutCornerPanel>

        </div>
      </div>
    </div>
  );
}

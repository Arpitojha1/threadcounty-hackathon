import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { cn } from "@/lib/utils";

type Report = {
  id: string;
  fabric_type: string;
  confidence_score: number;
  created_at: string;
};

export function RecentReports({ reports }: { reports: Report[] }) {
  if (!reports || reports.length === 0) {
    return (
      <CutCornerPanel variant="muslin" size="sm" bordered className="p-6 h-full">
        <h3 className="font-mono text-xs tracking-widest text-concrete-grey mb-4 uppercase">Recent Reports</h3>
        <p className="font-sans text-sm text-loom-iron/60">No reports generated yet.</p>
      </CutCornerPanel>
    );
  }

  return (
    <CutCornerPanel variant="muslin" size="sm" bordered className="p-6 h-full">
      <h3 className="font-mono text-xs tracking-widest text-concrete-grey mb-6 uppercase">Recent Reports</h3>
      <div className="space-y-4">
        {reports.map((report) => (
          <a
            key={report.id}
            href={`/dashboard/results/${report.id}`}
            className="group block"
          >
            <CutCornerPanel
              variant="transparent"
              interactive
              size="sm"
              className="p-4 bg-white/50 dark:bg-white/5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-lg uppercase text-loom-iron mb-1">
                    {report.fabric_type || "Unknown Fabric"}
                  </p>
                  <p className="font-mono text-xs text-concrete-grey">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center justify-center bg-shuttle-red/10 text-shuttle-red font-mono text-xs px-2 py-1 font-bold">
                    {Math.round(report.confidence_score || 0)}% Match
                  </span>
                </div>
              </div>
            </CutCornerPanel>
          </a>
        ))}
      </div>
    </CutCornerPanel>
  );
}

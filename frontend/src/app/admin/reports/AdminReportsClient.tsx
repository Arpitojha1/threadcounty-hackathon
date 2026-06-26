"use client";

import { useState } from "react";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { permanentlyDeleteReportAction } from "../actions";

type Report = {
  id: string;
  fabric_type: string;
  confidence_score: number;
  created_at: string;
  deleted_at: string | null;
  image_url?: string;
  file_name?: string;
  username: string;
};

export function AdminReportsClient({ initialReports, filterUserId }: { initialReports: Report[], filterUserId?: string }) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState<'soft' | 'permanent'>('soft');
  const [shortIdConfirm, setShortIdConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const initiateDelete = (id: string, mode: 'soft' | 'permanent') => {
    setDeleteId(id);
    setDeleteMode(mode);
    setShortIdConfirm("");
    setError(null);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    const reportToDelete = reports.find(r => r.id === deleteId);
    if (!reportToDelete) return;

    if (deleteMode === 'permanent') {
      const shortId = reportToDelete.id.substring(0, 8);
      if (shortIdConfirm !== shortId) {
        setError(`Please type ${shortId} to confirm permanent deletion.`);
        return;
      }
    }

    setIsDeleting(true);
    setError(null);

    try {
      if (deleteMode === 'soft') {
        const { error: dbError } = await supabase
          .from("reports")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", deleteId);

        if (dbError) throw dbError;

        setReports(prev => prev.map(r => r.id === deleteId ? { ...r, deleted_at: new Date().toISOString() } : r));
      } else {
        // Permanent Delete
        const result = await permanentlyDeleteReportAction(deleteId);
        if (result.error) throw new Error(result.error);

        setReports(prev => prev.filter(r => r.id !== deleteId));
      }
      
      setDeleteId(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete report");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {filterUserId && (
        <div className="bg-loom-iron border border-muslin/20 p-4 mb-4 flex items-center justify-between">
          <p className="font-mono text-sm text-muslin">Filtered by User ID: <span className="text-shuttle-red">{filterUserId}</span></p>
          <a href="/admin/reports" className="text-concrete-grey hover:text-muslin text-xs uppercase tracking-wider font-semibold transition-colors">Clear Filter &times;</a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <CutCornerPanel key={report.id} variant="muslin" size="sm" bordered className={cn("overflow-hidden flex flex-col", report.deleted_at && "opacity-60")}>
            <div className="h-48 bg-loom-iron/5 relative">
              {report.image_url ? (
                <img src={report.image_url} alt={report.fabric_type} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-mono text-xs text-concrete-grey">NO IMAGE</div>
              )}
              {report.deleted_at && (
                <div className="absolute top-0 right-0 bg-madder text-muslin px-2 py-1 font-mono text-[10px] uppercase tracking-wider">
                  Soft Deleted
                </div>
              )}
              <div className="absolute bottom-0 left-0 bg-loom-iron/80 backdrop-blur-sm text-muslin w-full px-3 py-2 flex justify-between items-center">
                <span className="font-sans text-xs font-semibold truncate pr-2">{report.username}</span>
                <span className="font-mono text-[10px] whitespace-nowrap">{Math.round(report.confidence_score)}% MATCH</span>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-lg uppercase text-loom-iron mb-1 line-clamp-1" title={report.fabric_type}>
                  {report.fabric_type || "Unknown Fabric"}
                </h3>
                <p className="font-mono text-[10px] text-concrete-grey mb-4">
                  {new Date(report.created_at).toLocaleDateString()} &middot; ID: {report.id.substring(0, 8)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-auto">
                {!report.deleted_at && (
                  <button
                    onClick={() => initiateDelete(report.id, 'soft')}
                    className="flex-1 px-2 py-1.5 border border-concrete-grey/30 text-loom-iron text-xs font-semibold hover:bg-loom-iron/5 transition-colors"
                  >
                    Soft Delete
                  </button>
                )}
                <button
                  onClick={() => initiateDelete(report.id, 'permanent')}
                  className="flex-1 px-2 py-1.5 bg-madder/10 text-madder text-xs font-semibold hover:bg-madder hover:text-muslin transition-colors"
                >
                  Perm. Delete
                </button>
              </div>
            </div>
          </CutCornerPanel>
        ))}
        {reports.length === 0 && (
          <div className="col-span-full text-center py-12 text-concrete-grey">
            No reports found.
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-loom-iron/80 backdrop-blur-sm p-4">
          <CutCornerPanel variant="muslin" size="sm" bordered className="w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-display text-xl uppercase text-loom-iron mb-2">
              {deleteMode === 'soft' ? 'Soft Delete Report?' : 'Permanently Delete?'}
            </h3>
            
            {deleteMode === 'soft' ? (
              <p className="font-sans text-sm text-concrete-grey mb-6">
                This will mark the report as deleted, hiding it from the user's history, but preserving the data and image for auditing.
              </p>
            ) : (
              <div className="mb-6 space-y-4">
                <p className="font-sans text-sm text-madder font-semibold">
                  WARNING: This action permanently removes the database row and the storage file. It cannot be undone.
                </p>
                <div className="space-y-2">
                  <label className="font-sans text-xs font-semibold text-loom-iron">Type <span className="font-mono bg-loom-iron/10 px-1">{reports.find(r => r.id === deleteId)?.id.substring(0, 8)}</span> to confirm:</label>
                  <input 
                    type="text" 
                    value={shortIdConfirm}
                    onChange={(e) => setShortIdConfirm(e.target.value)}
                    className="w-full border border-loom-iron/20 p-2 font-mono text-sm focus:outline-none focus:border-madder bg-white/50"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-madder/10 border border-madder/30 text-madder text-sm p-3 font-sans">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 font-sans font-semibold text-loom-iron border border-loom-iron/20 hover:bg-loom-iron/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 clip-cut-btn bg-madder text-muslin px-4 py-2 font-sans font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </CutCornerPanel>
        </div>
      )}
    </div>
  );
}

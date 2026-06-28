"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { Trash2, ImageOff, ZoomIn, X } from "lucide-react";

type Report = {
  id: string;
  fabric_type: string;
  confidence_score: number;
  created_at: string;
  user_id: string;
  profiles: { full_name: string | null } | null;
  deleted_at: string | null;
  image_url: string;
};

function AdminImageThumbnail({ url, alt, onClick }: { url: string; alt: string; onClick: () => void }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !url) {
    return (
      <div className="w-12 h-12 bg-muslin/5 border border-muslin/10 flex items-center justify-center flex-shrink-0" title="Image unavailable">
        <ImageOff className="w-4 h-4 text-concrete-grey" />
      </div>
    );
  }

  return (
    <div 
      className="relative w-12 h-12 bg-muslin/5 border border-muslin/10 overflow-hidden flex-shrink-0 cursor-pointer group"
      onClick={onClick}
    >
      <img
        src={url}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <ZoomIn className="w-4 h-4 text-muslin" />
      </div>
    </div>
  );
}

export function ReportsTableClient({ initialReports }: { initialReports: Report[] }) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  
  const supabase = createClient();

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const handleConfirmDelete = async (id: string) => {
    setDeletingId(id);
    setErrorMsg(null);
    
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      
      // Update UI explicitly immediately
      setReports(prev => prev.filter(r => r.id !== id));
      setConfirmDeleteId(null);
    } catch (err: any) {
      let sanitized = "Failed to delete report due to a network or server error.";
      if (err?.message?.includes("row-level security") || err?.code === '42501') {
        sanitized = "You do not have permission to delete this report.";
      }
      setErrorMsg(sanitized);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <CutCornerPanel variant="shuttle-red" size="sm" bordered className="p-4 mb-4">
          <p className="font-sans text-sm text-muslin font-medium">{errorMsg}</p>
        </CutCornerPanel>
      )}
      
      {(!reports || reports.length === 0) ? (
        <div className="text-center py-12 bg-muslin/5 border border-muslin/10">
          <p className="font-sans text-concrete-grey">No reports found.</p>
        </div>
      ) : (
        <div className="bg-muslin/5 border border-muslin/10 overflow-hidden overflow-x-auto">
          <table className="w-full text-left font-sans text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-muslin/10 bg-muslin/5">
                <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs w-16">Image</th>
                <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs">Fabric</th>
                <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs">Confidence</th>
                <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs">Owner</th>
                <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs">Created Date</th>
                <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-muslin/5 hover:bg-muslin/10 transition-colors">
                  <td className="py-3 px-4">
                    <AdminImageThumbnail 
                      url={r.image_url} 
                      alt={r.fabric_type} 
                      onClick={() => setExpandedImageUrl(r.image_url)} 
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-muslin flex items-center gap-2">
                      {r.fabric_type}
                      {r.deleted_at && (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-concrete-grey bg-muslin/5 border border-muslin/10 px-1.5 py-0.5 rounded-sm">
                          Deleted by user
                        </span>
                      )}
                    </div>
                    <div className="text-concrete-grey text-xs mt-0.5 font-mono">{r.id.split('-')[0]}...</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-muslin font-mono">{r.confidence_score}%</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-muslin">{r.profiles?.full_name || 'Unknown User'}</div>
                    <div className="text-concrete-grey text-xs mt-0.5 font-mono" title={r.user_id}>
                      {r.user_id.split('-')[0]}...
                    </div>
                  </td>
                  <td className="py-3 px-4 text-concrete-grey font-mono text-xs">
                    {new Date(r.created_at).toLocaleDateString('en-US')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {confirmDeleteId === r.id ? (
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-xs text-shuttle-red max-w-[200px] text-right whitespace-normal">
                          <strong>Hard delete report?</strong> This removes the report from the user's history but does NOT free their quota or delete the uploaded image.
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={handleCancelDelete}
                            disabled={deletingId === r.id}
                            className="px-2 py-1 bg-muslin/10 text-muslin text-xs uppercase tracking-wider hover:bg-muslin/20 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleConfirmDelete(r.id)}
                            disabled={deletingId === r.id}
                            className="px-2 py-1 bg-shuttle-red/20 text-shuttle-red border border-shuttle-red/50 text-xs uppercase tracking-wider hover:bg-shuttle-red hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {deletingId === r.id ? 'Deleting...' : 'Confirm'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteClick(r.id)}
                        className="text-concrete-grey hover:text-shuttle-red transition-colors p-1 rounded hover:bg-muslin/5"
                        title="Hard Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {expandedImageUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setExpandedImageUrl(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button 
              className="absolute top-4 right-4 p-2 bg-muslin/10 hover:bg-muslin/20 text-muslin transition-colors backdrop-blur-md"
              onClick={() => setExpandedImageUrl(null)}
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={expandedImageUrl} 
              alt="Expanded view" 
              className="max-w-full max-h-full object-contain border border-muslin/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

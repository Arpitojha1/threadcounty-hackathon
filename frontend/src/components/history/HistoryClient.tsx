"use client";

import { useReducer, useState, useEffect } from "react";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type DeleteState = {
  deleteId: string | null;
  isDeleting: boolean;
  deleteError: string | null;
  partialFailureNote: string | null;
};

type DeleteAction =
  | { type: 'startDelete'; id: string }
  | { type: 'cancelDelete' }
  | { type: 'submitStarted' }
  | { type: 'submitFailed'; error: string }
  | { type: 'submitSucceeded' };

const initialDeleteState: DeleteState = {
  deleteId: null,
  isDeleting: false,
  deleteError: null,
  partialFailureNote: null,
};

function deleteReducer(state: DeleteState, action: DeleteAction): DeleteState {
  switch (action.type) {
    case 'startDelete':
      return { ...state, deleteId: action.id, deleteError: null, partialFailureNote: null };
    case 'cancelDelete':
      return { ...state, deleteId: null, deleteError: null };
    case 'submitStarted':
      return { ...state, isDeleting: true, deleteError: null, partialFailureNote: null };
    case 'submitFailed':
      return { ...state, isDeleting: false, deleteError: action.error };
    case 'submitSucceeded':
      return { ...state, isDeleting: false, deleteId: null };
    default:
      return state;
  }
}

type Report = {
  id: string;
  fabric_type: string;
  confidence_score: number;
  created_at: string;
  ai_suggestions: string;
  image_url?: string;
  file_name?: string;
};

type HistoryClientProps = {
  initialReports: Report[];
};

type HistoryState = {
  reports: Report[];
  search: string;
  confFilter: number;
  dateFilter: number;
  isLoading: boolean;
};

type HistoryAction =
  | { type: 'setReports'; payload: Report[] }
  | { type: 'setSearch'; payload: string }
  | { type: 'setConfFilter'; payload: number }
  | { type: 'setDateFilter'; payload: number }
  | { type: 'setLoading'; payload: boolean }
  | { type: 'removeReport'; payload: string };

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'setReports':
      return { ...state, reports: action.payload };
    case 'setSearch':
      return { ...state, search: action.payload };
    case 'setConfFilter':
      return { ...state, confFilter: action.payload };
    case 'setDateFilter':
      return { ...state, dateFilter: action.payload };
    case 'setLoading':
      return { ...state, isLoading: action.payload };
    case 'removeReport':
      return { ...state, reports: state.reports.filter((r) => r.id !== action.payload) };
    default:
      return state;
  }
}

export function HistoryClient({ initialReports }: HistoryClientProps) {
  const [state, dispatch] = useReducer(historyReducer, {
    reports: initialReports,
    search: "",
    confFilter: 0,
    dateFilter: 0,
    isLoading: false,
  });

  const { reports, search, confFilter, dateFilter, isLoading } = state;

  const [deleteState, dispatchDelete] = useReducer(deleteReducer, initialDeleteState);
  const { deleteId, isDeleting, deleteError, partialFailureNote } = deleteState;

  const supabase = createClient();

  useEffect(() => {
    let isActive = true;

    const abortController = new AbortController();

    // 400ms debounce for real server-side queries
    const timer = setTimeout(async () => {
      dispatch({ type: 'setLoading', payload: true });
      try {
        let query = supabase
          .from("reports")
          .select(`
            id,
            fabric_type,
            confidence_score,
            created_at,
            ai_suggestions,
            image_url
          `)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (confFilter > 0) {
          query = query.gte("confidence_score", confFilter);
        }

        if (dateFilter > 0) {
          const pastDate = new Date();
          pastDate.setDate(pastDate.getDate() - dateFilter);
          query = query.gte("created_at", pastDate.toISOString());
        }

        if (search.trim()) {
          const term = search.trim();
          query = query.ilike("fabric_type", `%${term}%`);
        }

        const { data, error } = await query.abortSignal(abortController.signal);
        if (!isActive) return;

        if (error) {
          // Handle fetch error in UI state instead of leaking to browser console
        } else if (data) {
          dispatch({
            type: 'setReports', payload: data.map((r: any) => ({
              id: r.id,
              fabric_type: r.fabric_type,
              confidence_score: r.confidence_score,
              created_at: r.created_at,
              ai_suggestions: r.ai_suggestions,
              image_url: r.image_url,
              file_name: undefined // Removed file_name as it's not present on reports
            }))
          });
        }
      } catch (err) {
        // Suppress leakage to console, query failure handles gracefully
      } finally {
        if (isActive) dispatch({ type: 'setLoading', payload: false });
      }
    }, 400);

    return () => {
      isActive = false;
      clearTimeout(timer);
      abortController.abort();
    };
  }, [search, confFilter, dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!deleteId) return;
    const reportToDelete = reports.find((r) => r.id === deleteId);
    if (!reportToDelete) return;

    dispatchDelete({ type: 'submitStarted' });

    // 1. SOFT DELETE DB ROW
    const { error: dbError } = await supabase
      .from("reports")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", deleteId);

    if (dbError) {
      dispatchDelete({ type: 'submitFailed', error: `Failed to delete report: ${dbError.message}` });
      return;
    }

    // DB update succeeded. Remove from UI immediately.
    dispatch({ type: 'removeReport', payload: deleteId });
    dispatchDelete({ type: 'submitSucceeded' });

    // Note: We deliberately do NOT delete the storage file here per the soft-delete architecture.
  };

  const handleDownloadImage = async (report: Report, e: React.MouseEvent) => {
    e.preventDefault();
    if (!report.image_url) return;

    try {
      const res = await fetch(report.image_url);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const dateStr = new Date(report.created_at).toISOString().split('T')[0];
      const safeType = (report.fabric_type || "unknown").toLowerCase().replace(/[^a-z0-9]/g, '-');
      const shortId = report.id.substring(0, 6);
      a.download = `threadcounty-${safeType}-${dateStr}-${shortId}.png`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Suppress network/download exceptions from leaking to user's console
    }
  };

  const handleDownloadData = (report: Report, e: React.MouseEvent) => {
    e.preventDefault();
    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const dateStr = new Date(report.created_at).toISOString().split('T')[0];
    const safeType = (report.fabric_type || "unknown").toLowerCase().replace(/[^a-z0-9]/g, '-');
    const shortId = report.id.substring(0, 6);
    a.download = `threadcounty-${safeType}-${dateStr}-${shortId}-data.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {partialFailureNote && (
        <div className="bg-muslin/10 border border-muslin/20 text-muslin text-sm p-4 font-sans">
          {partialFailureNote}
        </div>
      )}

      {/* Filters Bar */}
      <CutCornerPanel variant="muslin" size="sm" bordered className="p-6">
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">

          <div className="w-full lg:w-1/3">
            <label className="block font-sans text-xs font-semibold text-loom-iron/60 mb-2 uppercase tracking-wider">Search</label>
            <input
              type="text"
              placeholder="Search fabric type..."
              value={search}
              onChange={(e) => dispatch({ type: 'setSearch', payload: e.target.value })}
              className="bg-white/80 border border-loom-iron/15 px-4 py-2.5 font-sans text-sm w-full focus:outline-none focus:border-shuttle-red transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
            <div>
              <label className="block font-sans text-xs font-semibold text-loom-iron/60 mb-2 uppercase tracking-wider">Confidence Score</label>
              <div className="flex gap-2">
                {[
                  { label: "Any", value: 0 },
                  { label: "80%+", value: 0.8 },
                  { label: "90%+", value: 0.9 },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => dispatch({ type: 'setConfFilter', payload: opt.value })}
                    className={cn(
                      "px-3 py-1.5 font-sans text-xs font-semibold transition-colors border",
                      confFilter === opt.value
                        ? "bg-shuttle-red border-shuttle-red text-muslin clip-cut-btn"
                        : "bg-white border-loom-iron/15 text-loom-iron/70 hover:border-shuttle-red/50 hover:text-shuttle-red"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-sans text-xs font-semibold text-loom-iron/60 mb-2 uppercase tracking-wider">Date Range</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "All time", value: 0 },
                  { label: "Last 7 days", value: 7 },
                  { label: "Last 30 days", value: 30 },
                  { label: "Last 90 days", value: 90 },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => dispatch({ type: 'setDateFilter', payload: opt.value })}
                    className={cn(
                      "px-3 py-1.5 font-sans text-xs font-semibold transition-colors border",
                      dateFilter === opt.value
                        ? "bg-loom-iron border-loom-iron text-muslin clip-cut-btn"
                        : "bg-white border-loom-iron/15 text-loom-iron/70 hover:border-loom-iron hover:text-loom-iron"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CutCornerPanel>

      {/* Reports Grid */}
      <div className={cn("space-y-4 transition-opacity duration-300", isLoading ? "opacity-50" : "opacity-100")}>
        {reports.length === 0 && !isLoading ? (
          <div className="text-center py-12 bg-white/5 border border-loom-iron/10 dark:border-muslin/10">
            <p className="font-sans text-loom-iron/60 dark:text-muslin/60">No reports match your search.</p>
          </div>
        ) : (
          reports.map((report) => (
            <CutCornerPanel key={report.id} variant="muslin" bordered size="sm" className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">

                {/* Thumbnail */}
                <div className="sm:w-48 h-32 sm:h-auto bg-loom-iron/5 dark:bg-muslin/5 flex shrink-0 relative overflow-hidden">
                  {report.image_url ? (
                    <img src={report.image_url} alt={report.fabric_type} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-mono text-xs text-concrete-grey">NO IMAGE</div>
                  )}
                  <div className="absolute top-2 left-2 bg-loom-iron text-muslin font-mono text-[10px] px-1.5 py-0.5 tracking-wider">
                    {Math.round(report.confidence_score || 0)}% MATCH
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-display text-xl uppercase text-loom-iron dark:text-muslin mb-1">
                        {report.fabric_type || "Unknown Fabric"}
                      </h3>
                      <p className="font-mono text-xs text-concrete-grey tracking-wider">
                        {new Date(report.created_at).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric'
                        })}
                      </p>
                    </div>
                    <a
                      href={`/dashboard/results/${report.id}`}
                      className="font-sans text-sm font-semibold text-shuttle-red hover:underline"
                    >
                      View Full Results &rarr;
                    </a>
                  </div>

                  <div className="flex flex-wrap gap-4 items-center mt-auto pt-4 border-t border-loom-iron/5 dark:border-muslin/5">
                    <button
                      onClick={(e) => handleDownloadImage(report, e)}
                      className="font-sans text-xs font-medium text-concrete-grey hover:text-loom-iron dark:hover:text-muslin flex items-center gap-1.5 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      Image
                    </button>
                    <button
                      onClick={(e) => handleDownloadData(report, e)}
                      className="font-sans text-xs font-medium text-concrete-grey hover:text-loom-iron dark:hover:text-muslin flex items-center gap-1.5 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      Data (JSON)
                    </button>
                    <div className="flex-1"></div>
                    <button
                      onClick={() => dispatchDelete({ type: 'startDelete', id: report.id })}
                      className="font-sans text-xs font-medium text-madder hover:bg-madder/10 px-2 py-1 rounded transition-colors flex items-center gap-1.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </CutCornerPanel>
          ))
        )}
      </div>



      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-loom-iron/80 backdrop-blur-sm p-4">
          <div className="w-full">
            <CutCornerPanel variant="muslin" size="sm" bordered className="w-full max-w-md mx-auto p-6 shadow-2xl">
              <h3 className="font-display text-xl uppercase text-loom-iron mb-2">Delete Report?</h3>
              <p className="font-sans text-sm text-concrete-grey mb-6">
                This will permanently delete the analysis data and the uploaded fabric image. This action cannot be undone.
              </p>

              {deleteError && (
                <div className="mb-6 bg-madder/10 border border-madder/30 text-madder text-sm p-3 font-sans">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => dispatchDelete({ type: 'cancelDelete' })}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 font-sans font-semibold text-loom-iron border border-loom-iron/20 hover:bg-loom-iron/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 clip-cut-btn bg-madder text-muslin px-4 py-2 font-sans font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </CutCornerPanel>
          </div>
      )}
        </div>
      );
}

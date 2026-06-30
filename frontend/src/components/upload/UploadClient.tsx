"use client";
import Link from "next/link";

import { useReducer, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { WeaveGrid } from "@/components/ui/weave-grid";
import { cn } from "@/lib/utils";
import { PageLoader } from "@/components/ui/PageLoader";

const LOADING_MESSAGES = [
  "Uploading secure image...",
  "Analyzing weave tension...",
  "Calculating thread density...",
  "Classifying fabric type...",
  "Finalizing AI report..."
];

type UploadState = {
  file: File | null;
  previewUrl: string | null;
  selectedModel: "standard" | "precision";
  isDragging: boolean;
  status: "idle" | "uploading" | "error";
  errorMessage: string | null;
  loadingStep: number;
};

type UploadAction =
  | { type: 'setFile'; file: File | null; previewUrl: string | null }
  | { type: 'setSelectedModel'; model: "standard" | "precision" }
  | { type: 'setIsDragging'; isDragging: boolean }
  | { type: 'setStatus'; status: "idle" | "uploading" | "error" }
  | { type: 'setErrorMessage'; errorMessage: string | null }
  | { type: 'incrementLoadingStep'; max: number }
  | { type: 'reset' }
  | { type: 'startUpload' };

const initialUploadState: UploadState = {
  file: null,
  previewUrl: null,
  selectedModel: "standard",
  isDragging: false,
  status: "idle",
  errorMessage: null,
  loadingStep: 0,
};

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case 'setFile':
      return { ...state, file: action.file, previewUrl: action.previewUrl, status: "idle", errorMessage: null };
    case 'setSelectedModel':
      return { ...state, selectedModel: action.model };
    case 'setIsDragging':
      return { ...state, isDragging: action.isDragging };
    case 'setStatus':
      return { ...state, status: action.status };
    case 'setErrorMessage':
      return { ...state, errorMessage: action.errorMessage };
    case 'incrementLoadingStep':
      return { ...state, loadingStep: state.loadingStep < action.max ? state.loadingStep + 1 : state.loadingStep };
    case 'reset':
      return { ...initialUploadState, selectedModel: state.selectedModel };
    case 'startUpload':
      return { ...state, status: "uploading", errorMessage: null, loadingStep: 0 };
    default:
      return state;
  }
}

export function UploadClient({ userId, tier }: { userId: string, tier: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, dispatch] = useReducer(uploadReducer, initialUploadState);
  const { file, previewUrl, selectedModel, isDragging, status, errorMessage, loadingStep } = state;

  // Cycle loading messages when uploading
  useEffect(() => {
    if (status !== "uploading") return;
    
    const interval = setInterval(() => {
      dispatch({ type: 'incrementLoadingStep', max: LOADING_MESSAGES.length - 1 });
    }, 2000); // Change message every 2 seconds
    
    return () => clearInterval(interval);
  }, [status]);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFile = (selectedFile: File) => {
    dispatch({ type: 'setStatus', status: "idle" });
    dispatch({ type: 'setErrorMessage', errorMessage: null });
    
    if (!selectedFile.type.startsWith("image/")) {
      dispatch({ type: 'setErrorMessage', errorMessage: "Please select a valid image file (JPEG, PNG, etc)." });
      return;
    }

    // Validate file size: 10MB limit
    const maxSizeBytes = 10 * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      dispatch({ type: 'setErrorMessage', errorMessage: "File exceeds 10MB limit. Please upload a smaller image." });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    
    // Revoke previous URL if selecting a new file
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    dispatch({ type: 'setFile', file: selectedFile, previewUrl: URL.createObjectURL(selectedFile) });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dispatch({ type: 'setIsDragging', isDragging: false });
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    
    dispatch({ type: 'startUpload' });
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);
    formData.append("ai_model", selectedModel);
    
    const abortController = new AbortController();
    
    // 30 second hard timeout
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 30000);

    const apiUrlRaw = process.env.NEXT_PUBLIC_API_URL;
    const baseUrl = apiUrlRaw !== undefined ? apiUrlRaw : 'http://127.0.0.1:8000';
    const backendUrl = `${baseUrl}/api/upload`;

    let hasError = false;
    try {
      // Do NOT set Content-Type header. Let the browser set the multipart boundary.
      const response = await fetch(backendUrl, {
        method: "POST",
        body: formData,
        signal: abortController.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle explicit HTTP errors
        let detail = "An unknown error occurred on the server.";
        try {
          const errData = await response.json();
          detail = errData.detail || errData.message || detail;
          if (response.status === 402) {
             throw new Error(`Limit Exceeded: ${detail}`);
          }
          if (response.status === 403) {
             throw new Error(`Access Denied: ${detail}`);
          }
        } catch (e: any) {
          if (e.message?.startsWith("Limit Exceeded") || e.message?.startsWith("Access Denied")) throw e;
        }
        throw new Error(`API Error: ${response.status} - ${detail}`);
      }

      const data = await response.json();
      
      if (data.status === "success" && data.report?.id) {
        // Reset state so component is clean if user navigates back
        resetSelection();
        // Redirect to results view
        router.push(`/dashboard/results/${data.report.id}`);
      } else {
        throw new Error("Unexpected response format from server.");
      }
      
    } catch (err: any) {
      hasError = true;
      clearTimeout(timeoutId);
      
      if (err.name === "AbortError") {
        dispatch({ type: 'setErrorMessage', errorMessage: "This is taking longer than expected. The server may be busy — you can try again." });
      } else if (err.message.startsWith("Limit Exceeded: ")) {
        dispatch({ type: 'setErrorMessage', errorMessage: err.message.replace("Limit Exceeded: ", "") });
      } else if (err.message.startsWith("Access Denied: ")) {
        dispatch({ type: 'setErrorMessage', errorMessage: err.message.replace("Access Denied: ", "") });
      } else if (err.message.includes("API Error")) {
        dispatch({ type: 'setErrorMessage', errorMessage: err.message });
      } else {
        dispatch({ type: 'setErrorMessage', errorMessage: "Network error: Unable to reach the processing server. Ensure the backend is running." });
      }
    } finally {
      dispatch({ type: 'setStatus', status: hasError ? "error" : "idle" });
    }
  };

  const resetSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    dispatch({ type: 'reset' });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <PageLoader isVisible={status === "uploading"} />
      {errorMessage && (
        <div className="bg-madder/10 border border-madder/30 text-madder text-sm p-4 font-sans flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <p>{errorMessage}</p>
          </div>
          {errorMessage.includes("Upgrade to Pro") && (
            <div className="ml-8 mt-2">
              <Link href="/dashboard/billing" className="inline-block bg-madder text-white px-4 py-2 font-medium clip-cut-btn text-xs uppercase tracking-wider hover:bg-madder/90 transition-colors">
                View Plans & Upgrade
              </Link>
            </div>
          )}
        </div>
      )}

      {!file ? (
        // Upload Dropzone
        <div
          onDragOver={(e) => { e.preventDefault(); dispatch({ type: 'setIsDragging', isDragging: true }); }}
          onDragLeave={(e) => { e.preventDefault(); dispatch({ type: 'setIsDragging', isDragging: false }); }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "w-full min-h-[400px] border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-8 text-center",
            "clip-cut-tr-md clip-cut-bl-md",
            isDragging 
              ? "border-shuttle-red bg-shuttle-red/5 scale-[1.01]" 
              : "border-loom-iron/20 dark:border-muslin/20 hover:border-shuttle-red/50 hover:bg-loom-iron/5 dark:hover:bg-muslin/5"
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors",
            isDragging ? "bg-shuttle-red/20 text-shuttle-red" : "bg-loom-iron/10 dark:bg-muslin/10 text-loom-iron/60 dark:text-muslin/60"
          )}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          
          <h3 className="font-display text-2xl uppercase tracking-wide text-loom-iron dark:text-muslin mb-2">
            Select or drop an image
          </h3>
          <p className="font-sans text-concrete-grey max-w-sm">
            High-resolution macro photos work best. Upload JPEG or PNG files up to 10MB.
          </p>
        </div>
      ) : (
        // Preview State
        <CutCornerPanel variant="muslin" bordered size="lg" className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2 aspect-square bg-loom-iron/5 dark:bg-muslin/5 relative overflow-hidden group">
              <WeaveGrid opacity={0.05} color="loom-iron" density="sparse" />
              <img 
                src={previewUrl!} 
                alt="Preview" 
                className="w-full h-full object-cover relative z-10"
              />
              <div className="absolute inset-0 bg-loom-iron/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button 
                  onClick={resetSelection}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-sans font-semibold text-muslin border border-muslin/30 hover:bg-muslin/10 px-4 py-2 transition-colors"
                >
                  Remove Image
                </button>
              </div>
              <button
                onClick={resetSelection}
                className="absolute top-2 right-2 z-30 w-8 h-8 flex items-center justify-center bg-loom-iron text-muslin rounded hover:bg-shuttle-red transition-colors"
                aria-label="Remove selected file"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="w-full md:w-1/2 flex flex-col justify-center">
              <h3 className="font-mono text-xs tracking-widest text-concrete-grey mb-2 uppercase">Selected File</h3>
              <p className="font-display text-xl uppercase text-loom-iron dark:text-muslin break-all mb-1">
                {file.name}
              </p>
              <p className="font-sans text-sm text-loom-iron/60 dark:text-muslin/60 mb-8">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              
              <div className="space-y-4">
                {/* AI Model Chooser */}
                <div className="p-4 border border-muslin/30 bg-loom-iron/5 dark:bg-muslin/5">
                  <div className="font-mono text-xs uppercase tracking-widest text-loom-iron/70 dark:text-muslin/70 mb-3 flex items-center justify-between">
                    <span>AI Model</span>
                    {tier === "free" && (
                      <Link href="/dashboard/billing" className="text-shuttle-red hover:underline ml-2">Upgrade for Precision</Link>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => dispatch({ type: 'setSelectedModel', model: "standard" })}
                      className={cn(
                        "flex-1 font-sans text-xs font-semibold py-2 px-2 text-center border transition-colors",
                        selectedModel === "standard" 
                          ? "bg-shuttle-red text-muslin border-shuttle-red" 
                          : "bg-transparent text-loom-iron dark:text-muslin border-loom-iron/30 dark:border-muslin/30 hover:border-shuttle-red/50"
                      )}
                    >
                      Standard Vision
                    </button>
                    <button 
                      disabled={tier === "free"}
                      onClick={() => dispatch({ type: 'setSelectedModel', model: "precision" })}
                      title={tier === "free" ? "Requires Student or Professional plan" : ""}
                      className={cn(
                        "flex-1 font-sans text-xs font-semibold py-2 px-2 text-center border transition-colors",
                        tier === "free" ? "opacity-50 cursor-not-allowed bg-transparent text-loom-iron/50 dark:text-muslin/50 border-loom-iron/10 dark:border-muslin/10" :
                        selectedModel === "precision" 
                          ? "bg-shuttle-red text-muslin border-shuttle-red" 
                          : "bg-transparent text-loom-iron dark:text-muslin border-loom-iron/30 dark:border-muslin/30 hover:border-shuttle-red/50"
                      )}
                    >
                      Precision Vision
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full clip-cut-btn bg-shuttle-red text-muslin px-6 py-4 font-sans font-semibold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Analyze Fabric
                </button>
                <button
                  onClick={resetSelection}
                  className="w-full px-6 py-3 font-sans font-medium text-concrete-grey hover:text-loom-iron dark:hover:text-muslin transition-colors"
                >
                  Choose a different file
                </button>
              </div>
            </div>
          </div>
        </CutCornerPanel>
      )}
    </div>
  );
}

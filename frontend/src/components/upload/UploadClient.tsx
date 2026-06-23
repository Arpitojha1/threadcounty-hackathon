"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { WeaveGrid } from "@/components/ui/weave-grid";
import { cn } from "@/lib/utils";

const LOADING_MESSAGES = [
  "Uploading secure image...",
  "Analyzing weave tension...",
  "Calculating thread density...",
  "Classifying fabric type...",
  "Finalizing AI report..."
];

export function UploadClient({ userId }: { userId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  
  type Status = "idle" | "uploading" | "error";
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [loadingStep, setLoadingStep] = useState(0);

  // Cycle loading messages when uploading
  useEffect(() => {
    if (status !== "uploading") return;
    
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev));
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
    setStatus("idle");
    setErrorMessage(null);
    
    if (!selectedFile.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, etc).");
      return;
    }

    // Validate file size: 10MB limit
    const maxSizeBytes = 10 * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setErrorMessage("File exceeds 10MB limit. Please upload a smaller image.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    
    // Revoke previous URL if selecting a new file
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    
    setStatus("uploading");
    setErrorMessage(null);
    setLoadingStep(0);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);
    
    const abortController = new AbortController();
    
    // 30 second hard timeout
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 30000);

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/upload`;

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
          detail = errData.detail || detail;
        } catch {
          // Response wasn't JSON
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
      clearTimeout(timeoutId);
      setStatus("error");
      
      if (err.name === "AbortError") {
        setErrorMessage("This is taking longer than expected. The server may be busy — you can try again.");
      } else if (err.message.includes("API Error")) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Network error: Unable to reach the processing server. Ensure the backend is running.");
      }
    }
  };

  const resetSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setStatus("idle");
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (status === "uploading") {
    return (
      <CutCornerPanel variant="muslin" size="lg" className="w-full min-h-[400px] p-8 md:p-12 relative overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Animated Weave Grid Background */}
        <motion.div 
          className="absolute inset-0 z-0 opacity-20"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <WeaveGrid color="shuttle-red" density="dense" />
        </motion.div>

        <div className="relative z-10">
          <div className="w-16 h-16 rounded-full border-4 border-shuttle-red/20 border-t-shuttle-red animate-spin mx-auto mb-8"></div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={loadingStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="font-display text-2xl uppercase tracking-wide text-loom-iron"
            >
              {LOADING_MESSAGES[loadingStep] || "Processing..."}
            </motion.div>
          </AnimatePresence>
          <p className="font-sans text-sm text-loom-iron/60 mt-4 max-w-xs mx-auto">
            Our AI is evaluating the microscopic structures of your fabric. This usually takes a few moments.
          </p>
        </div>
      </CutCornerPanel>
    );
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="bg-madder/10 border border-madder/30 text-madder text-sm p-4 font-sans flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <p>{errorMessage}</p>
        </div>
      )}

      {!file ? (
        // Upload Dropzone
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
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
        <CutCornerPanel variant="transparent" bordered size="lg" className="p-6 bg-white dark:bg-[#1E1C18] border-loom-iron/10 dark:border-muslin/10">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2 aspect-square bg-loom-iron/5 dark:bg-muslin/5 relative overflow-hidden group">
              <WeaveGrid opacity={0.05} color="loom-iron" density="sparse" />
              <img 
                src={previewUrl!} 
                alt="Preview" 
                className="w-full h-full object-cover relative z-10"
              />
              <div className="absolute inset-0 bg-loom-iron/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center">
                <button 
                  onClick={resetSelection}
                  className="font-sans font-semibold text-muslin border border-muslin/30 hover:bg-muslin/10 px-4 py-2 transition-colors"
                >
                  Remove Image
                </button>
              </div>
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

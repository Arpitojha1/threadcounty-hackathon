"use client";

import { useState } from "react";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { cn } from "@/lib/utils";

export function ShareReportButton() {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative inline-block text-left">
      <div 
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <button
          onClick={handleCopy}
          className="px-4 py-2 font-sans text-sm font-medium text-loom-iron border border-loom-iron/20 hover:bg-loom-iron/5 transition-colors flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>

      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 z-50">
          <CutCornerPanel variant="loom-iron" size="sm" className="p-3 text-xs shadow-lg">
            <p className="font-sans text-muslin/90 text-center leading-relaxed">
              This link is private — viewing it requires signing in with the account that created it.
            </p>
          </CutCornerPanel>
        </div>
      )}
    </div>
  );
}

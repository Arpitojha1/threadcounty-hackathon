import { CutCornerPanel } from "@/components/ui/cut-corner-panel";

export function QuickActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 h-full">
      <a href="/dashboard/upload" className="flex-1">
        <CutCornerPanel variant="shuttle-red" size="sm" interactive className="p-6 h-full flex flex-col justify-center items-center text-center transition-transform hover:scale-[1.02]">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" className="text-muslin mb-3">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <span className="font-display text-lg uppercase text-muslin">Upload New Fabric</span>
        </CutCornerPanel>
      </a>
      
      <a href="/dashboard/history" className="flex-1">
        <CutCornerPanel variant="loom-iron" interactive size="sm" className="p-6 h-full flex flex-col justify-center items-center text-center transition-transform hover:scale-[1.02]">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" className="text-muslin mb-3">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          <span className="font-display text-lg uppercase text-muslin">View History</span>
        </CutCornerPanel>
      </a>
    </div>
  );
}

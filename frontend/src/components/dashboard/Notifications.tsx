import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { WeaveGrid } from "@/components/ui/weave-grid";

export function Notifications() {
  return (
    <CutCornerPanel variant="muslin" size="sm" bordered className="p-6 relative overflow-hidden h-full">
      <WeaveGrid opacity={0.05} color="loom-iron" density="sparse" />
      <h3 className="font-mono text-xs tracking-widest text-concrete-grey mb-6 uppercase relative z-10">Notifications</h3>
      
      <div className="flex flex-col items-center justify-center text-center h-[calc(100%-2rem)] relative z-10 py-8">
        <div className="w-12 h-12 rounded-full bg-loom-iron/5 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" className="text-loom-iron/40">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </div>
        <p className="font-sans font-medium text-loom-iron mb-1">No notifications yet</p>
        <p className="font-sans text-sm text-concrete-grey">We'll alert you when there are updates to your analyses.</p>
      </div>
    </CutCornerPanel>
  );
}

import { CutCornerPanel } from "@/components/ui/cut-corner-panel";

export function TotalUploads({ count }: { count: number }) {
  return (
    <CutCornerPanel variant="shuttle-red" size="sm" className="p-6 h-full flex flex-col justify-between">
      <h3 className="font-mono text-xs tracking-widest text-muslin/80 mb-4 uppercase">Total Uploads</h3>
      <div className="mt-auto">
        <p className="font-display text-6xl text-muslin">{count}</p>
        <p className="font-sans text-sm text-muslin/80 mt-2">Fabrics analyzed</p>
      </div>
    </CutCornerPanel>
  );
}

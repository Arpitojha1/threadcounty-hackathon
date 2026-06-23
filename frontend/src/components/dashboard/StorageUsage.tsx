import { CutCornerPanel } from "@/components/ui/cut-corner-panel";

export function StorageUsage({ bytesUsed }: { bytesUsed: number }) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <CutCornerPanel variant="loom-iron" bordered size="sm" className="p-6 h-full">
      <h3 className="font-mono text-xs tracking-widest text-concrete-grey mb-4 uppercase">Storage Usage</h3>
      <div className="mt-auto">
        <p className="font-display text-4xl text-muslin">{formatBytes(bytesUsed)}</p>
        <p className="font-sans text-sm text-muslin/60 mt-2">Fabric images stored</p>
      </div>
    </CutCornerPanel>
  );
}

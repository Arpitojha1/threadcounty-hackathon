import { CutCornerPanel } from "@/components/ui/cut-corner-panel";


export function UserInformation({ createdAt }: { createdAt: string }) {
  const date = new Date(createdAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <CutCornerPanel variant="loom-iron" size="sm" className="p-6 h-full border border-loom-iron/10 dark:border-muslin/10">
      <h3 className="font-mono text-xs tracking-widest text-concrete-grey mb-4 uppercase">User Profile</h3>
      <div className="space-y-4">
        <div>
          <p className="font-sans text-xs text-muslin/60 mb-1">Member Since</p>
          <p className="font-sans text-lg font-medium text-muslin">{formattedDate}</p>
        </div>
        <div>
          <p className="font-sans text-xs text-muslin/60 mb-1">Current Plan</p>
          <p className="font-sans text-lg font-medium text-shuttle-red">Hobby (Free)</p>
        </div>
      </div>
    </CutCornerPanel>
  );
}

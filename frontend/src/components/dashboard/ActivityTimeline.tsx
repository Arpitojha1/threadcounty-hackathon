import { CutCornerPanel } from "@/components/ui/cut-corner-panel";

type TimelineItem = {
  id: string;
  type: "upload" | "report";
  title: string;
  date: string;
};

export function ActivityTimeline({ items }: { items: TimelineItem[] }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <CutCornerPanel variant="transparent" bordered size="sm" className="p-6 h-full border-loom-iron/10 dark:border-muslin/10 bg-white dark:bg-loom-iron">
      <h3 className="font-mono text-xs tracking-widest text-concrete-grey mb-6 uppercase">Activity Feed</h3>
      
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-loom-iron/10 before:to-transparent">
        {items.map((item, i) => (
          <div key={item.id + i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-shuttle-red text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded bg-muslin/50 dark:bg-loom-iron/50 border border-loom-iron/5">
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans font-semibold text-loom-iron dark:text-muslin text-sm">{item.title}</span>
                <span className="font-mono text-xs text-concrete-grey">{new Date(item.date).toLocaleDateString()}</span>
              </div>
              <p className="font-sans text-xs text-concrete-grey">
                {item.type === "report" ? "Fabric analysis completed" : "Fabric image uploaded"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </CutCornerPanel>
  );
}

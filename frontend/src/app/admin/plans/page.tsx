import { PRICING_TIERS } from "@/data/pricing";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { cn } from "@/lib/utils";

export default function AdminPlansPage() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="font-display text-4xl uppercase text-muslin tracking-wide mb-2">
          Subscription Plans
        </h1>
        <p className="font-sans text-sm text-concrete-grey">
          Current platform plan definitions. (Read-only configuration)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {PRICING_TIERS.map((tier) => (
          <CutCornerPanel
            key={tier.id}
            variant="muslin"
            size="sm"
            bordered
            className={cn(
              "p-6 flex flex-col",
              tier.highlight ? "border-shuttle-red bg-shuttle-red/5" : "bg-muslin/5"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-display text-2xl uppercase tracking-wide text-muslin">
                  {tier.name}
                </h2>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-sans text-xl font-bold text-muslin">{tier.price}</span>
                  <span className="font-sans text-xs text-concrete-grey">{tier.priceNote}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-[10px] uppercase tracking-widest text-concrete-grey bg-loom-iron/50 px-2 py-1 rounded">
                  {tier.id}
                </span>
              </div>
            </div>

            <p className="font-sans text-sm text-concrete-grey mb-6 flex-1">
              {tier.description}
            </p>

            <div className="space-y-4">
              <div className="pb-3 border-b border-muslin/10">
                <h4 className="font-mono text-[10px] uppercase tracking-widest text-concrete-grey mb-1">Storage Quota</h4>
                <p className="font-sans text-sm text-muslin font-medium">{tier.storageText}</p>
              </div>

              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-widest text-concrete-grey mb-2">Capabilities</h4>
                <ul className="space-y-2">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {feature.included ? (
                        <svg className="w-4 h-4 text-dye-indigo shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-concrete-grey/50 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      )}
                      <span className={cn("font-sans text-xs", feature.included ? "text-muslin" : "text-concrete-grey/50 line-through")}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CutCornerPanel>
        ))}
      </div>
    </div>
  );
}

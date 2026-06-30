import { cn } from "@/lib/utils";

export function PageLoader({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-loom-iron/90 backdrop-blur-sm pointer-events-auto flex flex-col items-center justify-center text-center">
      <h2 className="font-display text-3xl uppercase tracking-widest text-muslin mb-6">
        ThreadCounty
      </h2>
      <div className="w-12 h-12 rounded-full border-4 border-shuttle-red/20 border-t-shuttle-red animate-spin"></div>
    </div>
  );
}

import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | ThreadCounty",
  description: "Learn about our mission and the technology behind ThreadCounty.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-muslin selection:bg-shuttle-red selection:text-muslin pt-20">
      <div className="w-full max-w-7xl mx-auto px-6 py-24 sm:py-32 space-y-32">

        {/* Story & Mission Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-display text-5xl sm:text-6xl uppercase text-loom-iron mb-6">
              Modernizing <span className="text-shuttle-red">Textile</span> Analysis
            </h1>
            <div className="space-y-6 font-sans text-lg text-loom-iron/80">
              <p>
                ThreadCounty was built to solve a specific, tedious problem in textile manufacturing and research: manually counting thread density under a pick glass.
              </p>
              <p>
                By combining macro photography with computer vision, we reduce a slow, error-prone manual process into a near-instant automated workflow. We aim to equip independent designers, researchers, and large-scale manufacturers with industrial-grade quality control tools that run in a browser.
              </p>
            </div>
          </div>
          <div className="relative">
            <CutCornerPanel variant="loom-iron" size="lg" className="aspect-square p-8 flex flex-col justify-between">
              <div className="font-mono text-xs uppercase tracking-widest text-concrete-grey">
                Our Mission
              </div>
              <div className="font-display text-3xl uppercase text-muslin leading-tight">
                To automate the invisible labor of material verification.
              </div>
            </CutCornerPanel>
            {/* Weave texture background effect */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(#9B9690_1px,transparent_1px)] [background-size:16px_16px] opacity-20 translate-x-4 translate-y-4" />
          </div>
        </section>

        {/* Tech Stack Section */}
        <section>
          <div className="mb-12">
            <h2 className="font-display text-4xl uppercase text-loom-iron mb-4">Under The Hood</h2>
            <p className="font-sans text-concrete-grey max-w-2xl">
              We leverage modern infrastructure to process high-resolution imagery securely and quickly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CutCornerPanel variant="transparent" bordered size="sm" className="p-8 border-loom-iron/10 bg-white">
              <div className="font-mono text-xs uppercase tracking-widest text-shuttle-red mb-4">Frontend</div>
              <h3 className="font-display text-2xl uppercase text-loom-iron mb-4">Next.js & React</h3>
              <p className="font-sans text-sm text-concrete-grey">
                Built on the App Router for optimal performance, utilizing Server Components for fast initial loads and Framer Motion for fluid transitions.
              </p>
            </CutCornerPanel>

            <CutCornerPanel variant="transparent" bordered size="sm" className="p-8 border-loom-iron/10 bg-white">
              <div className="font-mono text-xs uppercase tracking-widest text-shuttle-red mb-4">Backend</div>
              <h3 className="font-display text-2xl uppercase text-loom-iron mb-4">Python FastAPI</h3>
              <p className="font-sans text-sm text-concrete-grey">
                A high-performance asynchronous Python backend dedicated to handling heavy image processing and running our computer vision models.
              </p>
            </CutCornerPanel>

            <CutCornerPanel variant="transparent" bordered size="sm" className="p-8 border-loom-iron/10 bg-white">
              <div className="font-mono text-xs uppercase tracking-widest text-shuttle-red mb-4">Infrastructure</div>
              <h3 className="font-display text-2xl uppercase text-loom-iron mb-4">Supabase</h3>
              <p className="font-sans text-sm text-concrete-grey">
                End-to-end type-safe database, authentication, and blob storage powered by PostgreSQL. Secure by default with row-level security.
              </p>
            </CutCornerPanel>
          </div>
        </section>

        {/* Team Section */}
        <section className="bg-loom-iron -mx-6 px-6 py-24 sm:px-12 sm:py-32" data-navbar-theme="dark">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="font-display text-4xl uppercase text-muslin mb-6">The Team</h2>
              <p className="font-sans text-concrete-grey mb-8">
                ThreadCounty is developed by a dedicated team focused on bridging the gap between traditional textile engineering and modern software.
              </p>
              <div className="font-mono text-xs uppercase tracking-widest text-shuttle-red">
                ThreadCounty Hackathon Team
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="aspect-[3/4] bg-concrete-grey/20 clip-cut-btn overflow-hidden grayscale contrast-125">
                  {/* Placeholder for team photo */}
                  <div className="w-full h-full bg-muslin/5 flex items-center justify-center font-mono text-[10px] text-muslin/30">i dont have any good pics</div>
                </div>
                <div>
                  <div className="font-display text-lg uppercase text-muslin">Arpit Ojha</div>
                  <div className="font-mono text-xs text-concrete-grey">Lead Engineer</div>
                </div>
              </div>

              <div className="space-y-4 mt-12">
                <div className="aspect-[3/4] bg-concrete-grey/20 clip-cut-btn overflow-hidden grayscale contrast-125">
                  {/* Placeholder for team photo */}
                  <div className="w-full h-full bg-muslin/5 flex items-center justify-center font-mono text-[10px] text-muslin/30">PHOTO_02</div>
                </div>
                <div>
                  <div className="font-display text-lg uppercase text-muslin">This is just a place holder</div>
                  <div className="font-mono text-xs text-concrete-grey">Computer Vision</div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

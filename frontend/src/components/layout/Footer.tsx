import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TextPressure from "@/components/TextPressure";

export async function Footer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <footer className="w-full bg-loom-iron text-muslin px-6 md:px-12 py-16 md:py-24" data-navbar-theme="dark">
      <div className="max-w-7xl mx-auto flex flex-col gap-16 md:gap-24">
        
        {/* Top Section */}
        <div className="flex flex-col gap-6">
          <div className="w-full relative h-[60px] sm:h-[80px] md:h-[100px] lg:h-[120px] xl:h-[140px] font-display">
            <TextPressure
              text="THREADCOUNTY"
              flex={true}
              alpha={false}
              stroke={false}
              width={true}
              weight={true}
              italic={false}
              textColor="#F2EDE4"
              minFontSize={36}
            />
          </div>
          <p className="font-sans text-sm md:text-base text-muslin/70">
            AI-powered fabric analysis.
          </p>
        </div>

        {/* Middle Section - Links */}
        <div className="flex gap-16 md:gap-32">
          {/* Column 1 - Product */}
          <div className="flex flex-col gap-4">
            <h3 className="font-mono text-xs text-muslin/40 uppercase tracking-widest mb-2">Product</h3>
            <Link href="/" className="font-sans text-sm text-muslin/80 hover:text-shuttle-red transition-colors">Home</Link>
            <Link href="/pricing" className="font-sans text-sm text-muslin/80 hover:text-shuttle-red transition-colors">Pricing</Link>
            {isLoggedIn && (
              <Link href="/dashboard" className="font-sans text-sm text-muslin/80 hover:text-shuttle-red transition-colors">Dashboard</Link>
            )}
          </div>

          {/* Column 2 - Company */}
          <div className="flex flex-col gap-4">
            <h3 className="font-mono text-xs text-muslin/40 uppercase tracking-widest mb-2">Company</h3>
            <Link href="/about" className="font-sans text-sm text-muslin/80 hover:text-shuttle-red transition-colors">About</Link>
            <Link href="/faq" className="font-sans text-sm text-muslin/80 hover:text-shuttle-red transition-colors">FAQ</Link>
            <Link href="/contact" className="font-sans text-sm text-muslin/80 hover:text-shuttle-red transition-colors">Contact</Link>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-8 md:pt-16 mt-auto">
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 font-mono text-[10px] md:text-xs text-muslin/40 tracking-widest">
            <span suppressHydrationWarning>&copy; ThreadCounty {new Date().getFullYear()}</span>
            <span className="hidden md:inline">&middot;</span>
            <span>All rights reserved.</span>
          </div>
          <div className="font-mono text-[10px] text-muslin/30 tracking-widest uppercase">
            Designed with precision
          </div>
        </div>

      </div>
    </footer>
  );
}

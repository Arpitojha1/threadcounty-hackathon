import { WeaveGrid } from "@/components/ui/weave-grid";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

const socialLinks = [
  { label: "GitHub", href: "https://github.com" },
  { label: "Twitter", href: "https://twitter.com" },
];

export default function Footer() {
  return (
    <footer className="relative bg-loom-iron py-16 overflow-hidden">
      <WeaveGrid opacity={0.03} color="concrete-grey" density="sparse" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* ── Top section ─────────────────────────────── */}
        <div className="flex items-start justify-between mb-16">
          {/* Logo */}
          <div className="font-display text-2xl uppercase tracking-wide">
            <span className="text-muslin">THREAD</span>
            <span className="text-shuttle-red">COUNTY</span>
          </div>

          {/* Vertical type label */}
          <div
            className="hidden md:flex font-display text-shuttle-red text-xs tracking-widest uppercase select-none"
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
            }}
            aria-hidden="true"
          >
            TEXTILE / INTELLIGENCE
          </div>
        </div>

        {/* ── Link columns ────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 mb-16">
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-mono text-xs tracking-widest uppercase text-muslin mb-5">
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="font-sans text-sm text-concrete-grey hover:text-shuttle-red transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ──────────────────────────────── */}
        <div className="border-t border-muslin/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs tracking-wider text-concrete-grey">
            &copy; {new Date().getFullYear()} ThreadCounty. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-concrete-grey hover:text-shuttle-red transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

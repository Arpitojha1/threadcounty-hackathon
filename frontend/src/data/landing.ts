/*
 * Landing page mock data — structured as typed constants for easy swapping.
 * No inline hardcoded strings in JSX.
 */

// ── Features ──────────────────────────────────────────────────
export interface Feature {
  number: string;
  title: string;
  description: string;
  highlight?: boolean; // true = shuttle-red panel
}

export const FEATURES: Feature[] = [
  {
    number: "01",
    title: "Thread Density Analysis",
    description:
      "Measure threads per square centimeter with sub-pixel precision. Upload a macro image and get instant density metrics mapped across the fabric surface.",
    highlight: true,
  },
  {
    number: "02",
    title: "Warp & Weft Counting",
    description:
      "Separate and count warp and weft threads independently. Detect weave pattern irregularities before they become production defects.",
  },
  {
    number: "03",
    title: "Fabric Type Classification",
    description:
      "Automatically classify fabric type — linen, cotton, silk, twill, satin — from a single photograph. No manual spec sheets required.",
  },
  {
    number: "04",
    title: "AI Confidence Scoring",
    description:
      "Every analysis ships with a confidence score so you know exactly how much to trust the measurement. Low-confidence results are flagged for manual review.",
    highlight: true,
  },
];

// ── Workflow Steps ────────────────────────────────────────────
export interface WorkflowStep {
  number: string;
  title: string;
  description: string;
  loadingCopy?: string[]; // fake-progress copy for step 2
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    number: "01",
    title: "Upload",
    description:
      "Drag and drop a macro photograph of your fabric. JPEG, PNG, or WebP — any resolution.",
  },
  {
    number: "02",
    title: "Analyze",
    description:
      "Our vision engine examines every thread intersection, measuring density, direction, and tension.",
    loadingCopy: [
      "Detecting fiber orientation…",
      "Analyzing weave tension…",
      "Calculating thread density…",
      "Counting warp threads…",
      "Counting weft threads…",
      "Classifying fabric type…",
      "Computing confidence score…",
    ],
  },
  {
    number: "03",
    title: "Report",
    description:
      "Get a full analysis report: thread density, warp/weft counts, fabric type, confidence score, and actionable suggestions.",
  },
];

// ── Testimonials ──────────────────────────────────────────────
export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "ThreadCounty cut our fabric QC time by 60%. What used to take a technician with a loupe now takes a photograph.",
    name: "Priya Mehta",
    role: "Quality Director",
    company: "Surat Textiles Ltd.",
  },
  {
    quote:
      "The confidence scoring is what sold us. We know exactly which batches need manual inspection and which can pass through.",
    name: "James Chen",
    role: "Production Manager",
    company: "Pacific Weaving Co.",
  },
  {
    quote:
      "We integrated ThreadCounty into our incoming goods inspection. Supplier disputes dropped to near zero — the data speaks for itself.",
    name: "Amara Osei",
    role: "Head of Procurement",
    company: "Accra Garment Works",
  },
];

// ── Pricing ───────────────────────────────────────────────────
export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: PricingFeature[];
  cta: string;
  highlight?: boolean; // true = shuttle-red card
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For researchers and small-batch testing.",
    features: [
      { text: "10 uploads / month", included: true },
      { text: "Thread density analysis", included: true },
      { text: "Warp & weft counting", included: true },
      { text: "Basic confidence scoring", included: true },
      { text: "AI suggestions", included: false },
      { text: "API access", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Start Free",
  },
  {
    name: "Pro",
    price: "$49",
    period: "/ month",
    description: "For production-scale quality control.",
    features: [
      { text: "500 uploads / month", included: true },
      { text: "Thread density analysis", included: true },
      { text: "Warp & weft counting", included: true },
      { text: "High-precision confidence scoring", included: true },
      { text: "AI suggestions & defect alerts", included: true },
      { text: "API access", included: true },
      { text: "Priority support", included: false },
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For mills, factories, and supply chains.",
    features: [
      { text: "Unlimited uploads", included: true },
      { text: "Thread density analysis", included: true },
      { text: "Warp & weft counting", included: true },
      { text: "High-precision confidence scoring", included: true },
      { text: "AI suggestions & defect alerts", included: true },
      { text: "API access + webhooks", included: true },
      { text: "Dedicated support & SLA", included: true },
    ],
    cta: "Contact Sales",
  },
];

// ── Stats (landing page — capability claims, NOT fabricated aggregates) ──
export interface Stat {
  value: string;
  label: string;
  highlight?: boolean;
}

export const HERO_STATS: Stat[] = [
  {
    value: "4",
    label: "Metrics Per Scan",
    highlight: true,
  },
  {
    value: "<3s",
    label: "Average Analysis Time",
  },
  {
    value: "7+",
    label: "Fabric Types Supported",
  },
];

// ── Nav links ─────────────────────────────────────────────────
export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Pricing", href: "#pricing" },
] as const;

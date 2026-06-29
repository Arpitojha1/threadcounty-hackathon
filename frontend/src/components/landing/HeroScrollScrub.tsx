"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";

/* ═══════════════════════════════════════════════════════════════
 *  TUNABLE CONSTANTS — adjust the look from here only.
 * ═══════════════════════════════════════════════════════════════ */

/** Grayscale amount applied to each frame. Safe range: 0 (off) → 1 (full). */
const GRAYSCALE_AMOUNT = 1;

/** Contrast multiplier. Safe range: 1.0 (none) → 2.0. Values above 1.6
 *  start to blow highlights; 1.2–1.4 crushes shadows nicely. */
const CONTRAST_AMOUNT = 1.35;

/** Grain overlay opacity. Safe range: 0 (off) → 0.15 (heavy).
 *  0.04–0.06 reads as subtle film stock noise. */
const GRAIN_INTENSITY = 0.05;

/* ═══════════════════════════════════════════════════════════════
 *  FRAME CONFIG
 * ═══════════════════════════════════════════════════════════════ */
const FRAME_COUNT = 272;
const FRAME_PATH = "/frames/hero-v2";
const padIndex = (i: number) => String(i).padStart(3, "0");
const frameSrc = (i: number) => `${FRAME_PATH}/frame_${padIndex(i)}.webp`;

/* ═══════════════════════════════════════════════════════════════
 *  GRAIN — precomputed noise pattern drawn at low opacity.
 *  Chosen over per-pixel because a single offscreen canvas blit
 *  is ~60× faster than iterating imageData per frame, and the
 *  visual result is indistinguishable at GRAIN_INTENSITY ≤ 0.10.
 *  We regenerate the pattern each time the canvas resizes for
 *  crisp, non-stretched noise, and we offset it randomly per
 *  drawn frame so it "shimmers" rather than looking static.
 * ═══════════════════════════════════════════════════════════════ */
function createGrainCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() * 255;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/* ═══════════════════════════════════════════════════════════════
 *  CARD MILESTONE CONFIG
 *  ─────────────────────
 *  Each card fades/scales in and back out over a scroll range.
 *  Percentages were chosen so they land on moments where the
 *  garment pose is relatively settled (not mid-motion-blur):
 *
 *  Card 1 — "Weave Structure Detected"
 *    in: 12-18%, hold: 18-28%, out: 28-33%
 *    Rationale: ~frame 16-24, early in the turn, fabric flat/stable.
 *
 *  Card 2 — "Thread Density: 82.4 TPI"
 *    in: 38-44%, hold: 44-54%, out: 54-59%
 *    Rationale: ~frame 52-60, mid-turn plateau before next rotation.
 *
 *  Card 3 — "Confidence Score: 96%"
 *    in: 64-70%, hold: 70-80%, out: 80-85%
 *    Rationale: ~frame 87-95, second plateau, fabric nearly profile.
 * ═══════════════════════════════════════════════════════════════ */
interface CardConfig {
  /** Label / field name */
  label: string;
  /** The value string */
  value: string;
  /** Sub-label (units) */
  unit?: string;
  /** CutCornerPanel variant */
  variant: "shuttle-red" | "muslin" | "concrete-grey";
  /** Whether the value text should render in shuttle-red */
  valueRed: boolean;
  /** Scroll-progress milestone: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd] */
  range: [number, number, number, number];
  /** Position on screen (wrapper class) */
  wrapperClass: string;
  /** SVG Connector anchor points (percentages) */
  anchor?: {
    cx: string;
    cy: string;
    lx: string;
    ly: string;
  };
}

const CARDS: CardConfig[] = [
  {
    label: "Weave Structure",
    value: "Plain Weave",
    unit: "DETECTED",
    variant: "muslin",
    valueRed: false,
    range: [0.12, 0.18, 0.28, 0.33],
    wrapperClass: "absolute left-4 sm:left-8 lg:left-[10%] top-[60%]",
    anchor: {
      cx: "35%", // model's dark coat
      cy: "65%",
      lx: "25%", // line ends near card
      ly: "65%",
    },
  },
  {
    label: "Thread Density",
    value: "82.4",
    unit: "TPI",
    variant: "shuttle-red",
    valueRed: false,
    range: [0.38, 0.44, 0.54, 0.59],
    wrapperClass: "absolute right-4 sm:right-8 lg:right-[10%] top-[60%]",
    anchor: {
      cx: "50%", // model's back
      cy: "70%",
      lx: "75%",
      ly: "65%",
    },
  },
  {
    label: "Confidence Score",
    value: "96%",
    unit: "AI MATCH",
    variant: "concrete-grey",
    valueRed: true,
    range: [0.64, 0.7, 0.8, 0.85],
    wrapperClass: "absolute left-1/2 -translate-x-1/2 bottom-[15%]",
  },
];

/* ═══════════════════════════════════════════════════════════════ */

export default function HeroScrollScrub() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const grainRef = useRef<HTMLCanvasElement | null>(null);
  const lastDrawnRef = useRef(-1);

  const [loadedCount, setLoadedCount] = useState(0);
  const [allLoaded, setAllLoaded] = useState(false);
  const [posterReady, setPosterReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  /* ── Detect prefers-reduced-motion ────────────────────────── */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* ── Draw a single frame to the canvas ────────────────────── */
  const drawFrame = useCallback(
    (index: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const frame = framesRef.current[index];
      if (!frame || !frame.complete || frame.naturalWidth === 0) return;

      const cw = canvas.width;
      const ch = canvas.height;

      // Apply grayscale + contrast via CSS filter on the context
      ctx.filter = `grayscale(${GRAYSCALE_AMOUNT}) contrast(${CONTRAST_AMOUNT})`;

      // Cover-crop: center the image and scale to fill
      const iw = frame.naturalWidth;
      const ih = frame.naturalHeight;
      const scale = Math.max(cw / iw, ch / ih);
      const sw = cw / scale;
      const sh = ch / scale;
      const sx = (iw - sw) / 2;
      const sy = (ih - sh) / 2;

      ctx.drawImage(frame, sx, sy, sw, sh, 0, 0, cw, ch);

      // Reset filter before grain overlay
      ctx.filter = "none";

      // Grain overlay — offset randomly per frame for shimmer effect
      if (grainRef.current && GRAIN_INTENSITY > 0) {
        ctx.globalAlpha = GRAIN_INTENSITY;
        ctx.globalCompositeOperation = "overlay";
        // Random offset so grain doesn't look static across frames
        const ox = Math.floor(Math.random() * 64) - 32;
        const oy = Math.floor(Math.random() * 64) - 32;
        ctx.drawImage(grainRef.current, ox, oy, cw, ch);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      lastDrawnRef.current = index;
    },
    []
  );

  /* ── Preload all frames ───────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    const images: HTMLImageElement[] = [];
    let loaded = 0;

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = frameSrc(i);
      img.onload = () => {
        if (cancelled) return;
        loaded++;
        setLoadedCount(loaded);

        // Once the first frame is loaded, show it as poster
        if (i === 1) {
          setPosterReady(true);
        }
        if (loaded === FRAME_COUNT) {
          setAllLoaded(true);
        }
      };
      img.onerror = () => {
        if (cancelled) return;
        loaded++;
        setLoadedCount(loaded);
        if (loaded === FRAME_COUNT) {
          setAllLoaded(true);
        }
      };
      images.push(img);
    }
    framesRef.current = images;

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Canvas sizing + grain regeneration ───────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      // Regenerate grain at new size so noise stays crisp
      grainRef.current = createGrainCanvas(canvas.width, canvas.height);

      // Redraw the currently-shown frame at the new size
      if (lastDrawnRef.current >= 0) {
        drawFrame(lastDrawnRef.current);
      } else if (posterReady) {
        drawFrame(0);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [posterReady, drawFrame]);

  /* ── Draw poster frame once it loads ──────────────────────── */
  useEffect(() => {
    if (posterReady && lastDrawnRef.current < 0) {
      drawFrame(0);
    }
  }, [posterReady, drawFrame]);

  /* ── For reduced-motion: draw the final frame ─────────────── */
  useEffect(() => {
    if (reducedMotion && allLoaded) {
      drawFrame(FRAME_COUNT - 1);
    }
  }, [reducedMotion, allLoaded, drawFrame]);

  /* ── Scroll-driven frame scrubbing ────────────────────────── */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (reducedMotion || !allLoaded) return;
    const index = Math.min(
      Math.floor(v * FRAME_COUNT),
      FRAME_COUNT - 1
    );
    // Guard: only draw if the frame is actually loaded
    const frame = framesRef.current[index];
    if (frame && frame.complete && frame.naturalWidth > 0) {
      if (index !== lastDrawnRef.current) {
        drawFrame(index);
      }
    }
  });

  /* ── Card transforms ──────────────────────────────────────── */
  const cardTransforms = CARDS.map((card) => {
    const [a, b, c, d] = card.range;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const opacity = useTransform(scrollYProgress, [a, b, c, d], [0, 1, 1, 0]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const scale = useTransform(scrollYProgress, [a, b, c, d], [0.85, 1, 1, 0.85]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const y = useTransform(scrollYProgress, [a, b, c, d], [40, 0, 0, -30]);
    return { opacity, scale, y };
  });

  /* Reduced-motion card transforms — just standard scroll-into-view */
  const reducedCardTransforms = CARDS.map(() => ({
    opacity: undefined as undefined,
    scale: undefined as undefined,
    y: undefined as undefined,
  }));

  const activeTransforms = reducedMotion ? reducedCardTransforms : cardTransforms;

  /* positionClasses removed in favor of wrapperClass */

  /* ── Loading progress ─────────────────────────────────────── */
  const loadPercent = Math.round((loadedCount / FRAME_COUNT) * 100);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative"
      data-navbar-theme="dark"
      style={{ height: reducedMotion ? "100vh" : "400vh" }}
    >
      {/* ── Sticky viewport ────────────────────────────────── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-loom-iron">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Dark vignette overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-loom-iron/80 via-transparent to-loom-iron/40 pointer-events-none" />

        {/* ── Loading indicator ──────────────────────────── */}
        {!allLoaded && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-loom-iron/60 backdrop-blur-sm transition-opacity duration-500">
            <div className="mb-4">
              <span className="font-mono text-xs uppercase tracking-widest text-shuttle-red">
                Loading sequence
              </span>
            </div>
            <div className="w-48 h-0.5 bg-muslin/10 overflow-hidden">
              <div
                className="h-full bg-shuttle-red transition-all duration-200 ease-out"
                style={{ width: `${loadPercent}%` }}
              />
            </div>
            <span className="mt-2 font-mono text-[10px] text-concrete-grey">
              {loadPercent}%
            </span>
          </div>
        )}

        {/* ── Prediction Cards ───────────────────────────── */}
        {CARDS.map((card, i) => {
          const transforms = activeTransforms[i];
          const isReduced = reducedMotion;

          return (
            <div key={card.label} className={`z-20 ${card.wrapperClass}`}>
              {/* Connector SVG */}
              {!isReduced && card.anchor && (
                <motion.svg
                  className="fixed inset-0 w-full h-full pointer-events-none -z-10"
                  style={{ opacity: transforms.opacity }}
                >
                  <line
                    x1={card.anchor.cx}
                    y1={card.anchor.cy}
                    x2={card.anchor.lx}
                    y2={card.anchor.ly}
                    stroke="var(--color-shuttle-red)"
                    strokeWidth="1.5"
                    strokeOpacity="0.8"
                    strokeDasharray="4 4"
                  />
                  <circle
                    cx={card.anchor.cx}
                    cy={card.anchor.cy}
                    r="4"
                    fill="var(--color-shuttle-red)"
                  />
                  <circle
                    cx={card.anchor.cx}
                    cy={card.anchor.cy}
                    r="12"
                    fill="none"
                    stroke="var(--color-shuttle-red)"
                    strokeOpacity="0.4"
                  />
                </motion.svg>
              )}

              <motion.div
                style={
                  isReduced
                    ? {}
                    : {
                        opacity: transforms.opacity,
                        scale: transforms.scale,
                        y: transforms.y,
                      }
                }
                {...(isReduced
                  ? {
                      initial: { opacity: 0, y: 30, scale: 0.9 },
                      whileInView: { opacity: 1, y: 0, scale: 1 },
                      viewport: { once: true, amount: 0.5 },
                      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
                    }
                  : {})}
              >
                <CutCornerPanel
                  variant={card.variant}
                  size="lg"
                  corner="tr"
                  className="px-6 py-5 sm:px-8 sm:py-6 min-w-[220px] sm:min-w-[260px]"
                >
                  {/* Field label */}
                  <span className={`font-mono text-[10px] uppercase tracking-widest block mb-2 ${
                    card.variant === "shuttle-red"
                      ? "text-muslin/70"
                      : card.variant === "muslin"
                      ? "text-concrete-grey"
                      : "text-muslin/70"
                  }`}>
                    {card.label}
                  </span>

                  {/* Value */}
                  <span className={`font-display text-3xl sm:text-4xl uppercase block ${
                    card.valueRed
                      ? "text-shuttle-red"
                      : card.variant === "shuttle-red"
                      ? "text-muslin"
                      : card.variant === "muslin"
                      ? "text-loom-iron"
                      : "text-muslin"
                  }`}>
                    {card.value}
                  </span>

                  {/* Unit / sub-label */}
                  {card.unit && (
                    <span className={`font-mono text-[10px] uppercase tracking-widest block mt-1 ${
                      card.variant === "shuttle-red"
                        ? "text-muslin/60"
                        : card.variant === "muslin"
                        ? "text-concrete-grey"
                        : "text-muslin/60"
                    }`}>
                      {card.unit}
                    </span>
                  )}
                </CutCornerPanel>
              </motion.div>
            </div>
          );
        })}



        {/* ── Scroll hint at very top of section ─────────── */}
        {!reducedMotion && allLoaded && (
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              className="text-muslin/40"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </motion.div>
        )}
      </div>
    </section>
  );
}

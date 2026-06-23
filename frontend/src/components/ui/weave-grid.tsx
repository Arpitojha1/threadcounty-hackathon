import React from "react";
import { cn } from "@/lib/utils";

/*
 * WEAVE GRID TEXTURE
 * ==================
 * SVG-based background texture — thin warp (vertical) and weft (horizontal)
 * lines at slightly irregular intervals. Used as a low-opacity backdrop
 * behind dark (loom-iron) sections.
 *
 * Parameterized with opacity and color props so it can be reused in:
 *   1. Footer / dark section backgrounds (low opacity, subtle)
 *   2. Upload loading-state animation (higher opacity, animated tightening)
 *
 * The texture supports the cut-corner system, never competes with it.
 * It should never appear at full opacity or as a foreground element.
 */

interface WeaveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Opacity of the grid lines. Default: 0.06 */
  opacity?: number;
  /** Line color. Default: "concrete-grey" */
  color?: "concrete-grey" | "muslin" | "loom-iron" | "shuttle-red";
  /** Density variant. Default: "normal" */
  density?: "sparse" | "normal" | "dense";
  /** Whether to animate (for loading states). Default: false */
  animated?: boolean;
  children?: React.ReactNode;
}

const colorMap: Record<string, string> = {
  "concrete-grey": "155, 150, 144",
  muslin: "242, 237, 228",
  "loom-iron": "22, 21, 18",
  "shuttle-red": "232, 73, 46",
};

const spacingMap: Record<string, { x: number; y: number }> = {
  sparse: { x: 40, y: 44 },
  normal: { x: 28, y: 32 },
  dense: { x: 16, y: 20 },
};

export function WeaveGrid({
  opacity = 0.06,
  color = "concrete-grey",
  density = "normal",
  animated = false,
  className,
  children,
  style,
  ...props
}: WeaveGridProps) {
  const rgb = colorMap[color];
  const spacing = spacingMap[density];

  const gridStyle: React.CSSProperties = {
    backgroundImage: `
      linear-gradient(to right, rgba(${rgb}, ${opacity}) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(${rgb}, ${opacity}) 1px, transparent 1px)
    `,
    backgroundSize: `${spacing.x}px ${spacing.y}px`,
    ...(animated
      ? {
          animation: "weave-tighten 3s ease-in-out infinite alternate",
        }
      : {}),
    ...style,
  };

  return (
    <div
      className={cn("absolute inset-0 pointer-events-none", className)}
      style={gridStyle}
      aria-hidden="true"
      {...props}
    >
      {children}
    </div>
  );
}

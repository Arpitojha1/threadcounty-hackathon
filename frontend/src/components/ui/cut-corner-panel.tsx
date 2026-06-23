import React from "react";
import { cn } from "@/lib/utils";

/*
 * CUT-CORNER PANEL
 * ================
 * The defining structural device of the ThreadCounty design system.
 * One corner is cut at 45° via CSS clip-path instead of border-radius.
 *
 * SHADOW POLICY (decided upfront, not per-instance):
 *   clip-path clips box-shadow along with the element, so drop-shadows
 *   on clipped panels either disappear or look broken. This component
 *   uses NO box-shadow. Hierarchy is communicated through bold color
 *   blocking (shuttle-red, concrete-grey, muslin, loom-iron) and
 *   optional 1-2px borders — consistent with the reference direction
 *   which relies on color and scale, not elevation.
 *
 * If shadow is ever genuinely needed: use a wrapper div with the shadow,
 * sized/offset behind the clipped panel. Do not put box-shadow directly
 * on a clipped element.
 */

type CutCorner = "tr" | "bl";
type CutSize = "sm" | "md" | "lg" | "xl" | "btn";
type PanelVariant = "shuttle-red" | "concrete-grey" | "muslin" | "loom-iron" | "transparent";

interface CutCornerPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which corner to cut. Default: "tr" (top-right) */
  corner?: CutCorner;
  /** Cut depth size. Default: "md" */
  size?: CutSize;
  /** Color variant. Default: "muslin" */
  variant?: PanelVariant;
  /** Show a subtle border for separation. Default: false */
  bordered?: boolean;
  /** Element to render as. Default: "div" */
  as?: React.ElementType;
  children: React.ReactNode;
}

const clipClasses: Record<CutCorner, Record<CutSize, string>> = {
  tr: {
    sm: "clip-cut-tr",
    md: "clip-cut-tr-md",
    lg: "clip-cut-tr-lg",
    xl: "clip-cut-tr-xl",
    btn: "clip-cut-btn",
  },
  bl: {
    sm: "clip-cut-bl",
    md: "clip-cut-bl",
    lg: "clip-cut-bl-lg",
    xl: "clip-cut-bl-lg",
    btn: "clip-cut-bl",
  },
};

const variantClasses: Record<PanelVariant, string> = {
  "shuttle-red": "bg-shuttle-red text-muslin",
  "concrete-grey": "bg-concrete-grey text-loom-iron",
  "muslin": "bg-muslin text-loom-iron",
  "loom-iron": "bg-loom-iron text-muslin",
  "transparent": "bg-transparent",
};

const borderClasses: Record<PanelVariant, string> = {
  "shuttle-red": "border border-shuttle-red/30",
  "concrete-grey": "border border-concrete-grey/40",
  "muslin": "border border-loom-iron/10",
  "loom-iron": "border border-muslin/10",
  "transparent": "border border-concrete-grey/20",
};

export function CutCornerPanel({
  corner = "tr",
  size = "md",
  variant = "muslin",
  bordered = false,
  as: Component = "div",
  className,
  children,
  ...props
}: CutCornerPanelProps) {
  return (
    <Component
      className={cn(
        clipClasses[corner][size],
        variantClasses[variant],
        bordered && borderClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

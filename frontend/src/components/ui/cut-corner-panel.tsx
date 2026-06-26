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
 *   optional 1-2px borders.
 *
 * BORDER IMPLEMENTATION:
 *   Because CSS `border` is clipped by `clip-path` (leaving no visible
 *   border along the angled cut), bordered panels use an inset wrapper
 *   technique. The outer element gets the border color as its background,
 *   and an inner absolute div provides the panel color inset by 1px.
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
  /** Add interactive hover states (implies bordered). Default: false */
  interactive?: boolean;
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

const textClasses: Record<PanelVariant, string> = {
  "shuttle-red": "text-muslin",
  "concrete-grey": "text-loom-iron",
  "muslin": "text-loom-iron dark:text-muslin",
  "loom-iron": "text-muslin dark:text-loom-iron",
  "transparent": "",
};

const bgClasses: Record<PanelVariant, string> = {
  "shuttle-red": "bg-shuttle-red",
  "concrete-grey": "bg-concrete-grey",
  "muslin": "bg-muslin dark:bg-loom-iron", // Context-aware inversion
  "loom-iron": "bg-loom-iron dark:bg-muslin",
  "transparent": "bg-transparent",
};

const borderWrapperClasses: Record<PanelVariant, string> = {
  "shuttle-red": "bg-shuttle-red/30",
  "concrete-grey": "bg-concrete-grey/40",
  "muslin": "bg-loom-iron/20 dark:bg-muslin/20",
  "loom-iron": "bg-muslin/20 dark:bg-loom-iron/20",
  "transparent": "bg-concrete-grey/20",
};

export function CutCornerPanel({
  corner = "tr",
  size = "md",
  variant = "muslin",
  bordered = false,
  interactive = false,
  as: Component = "div",
  className,
  children,
  ...props
}: CutCornerPanelProps) {
  const needsBorder = bordered || interactive;

  if (!needsBorder) {
    return (
      <Component
        className={cn(
          clipClasses[corner][size],
          bgClasses[variant],
          textClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }

  // Wrapper approach for true borders on clipped elements
  return (
    <Component
      className={cn(
        "relative z-0 group",
        clipClasses[corner][size],
        borderWrapperClasses[variant], // Outer background acts as border color
        textClasses[variant],
        interactive && "hover:bg-shuttle-red dark:hover:bg-shuttle-red transition-colors duration-300 cursor-pointer",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "absolute inset-[1px] -z-10",
          clipClasses[corner][size],
          bgClasses[variant]
        )}
      />
      {children}
    </Component>
  );
}

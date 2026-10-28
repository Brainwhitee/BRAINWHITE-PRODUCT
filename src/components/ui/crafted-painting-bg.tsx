import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * CraftedPaintingBg
 *
 * A procedural, full-bleed "oil-painting" background rendered as a single
 * self-contained SVG.  It layers:
 *   1. a warm gesso/canvas base,
 *   2. several soft radial "brush washes" (terracotta, sage, ochre, rose, umber),
 *   3. one or two dry-brush drag strokes,
 *   4. a canvas-grain noise overlay (feTurbulence),
 *   5. a subtle vignette.
 *
 * The SVG uses preserveAspectRatio="xMidYMid slice" so it covers any
 * viewport without distortion.  It is intentionally static (no JS) and
 * lightweight – just a fixed backdrop layer.
 */

interface CraftedPaintingBgProps {
  /** Warm palette is the default; "cool" shifts toward muted greens/greys. */
  variant?: "warm" | "cool";
  /** Overall opacity of the entire painting layer. */
  opacity?: number;
  /** Extra CSS classes (e.g. transition for slow drift). */
  className?: string;
}

export function CraftedPaintingBg({
  variant = "warm",
  opacity = 1,
  className,
}: CraftedPaintingBgProps) {
  /* ---------- palette ---------- */
  const palette = {
    warm: {
      canvas: "#E7D9C4",
      wash1: "#B5693F", // terracotta
      wash2: "#6E7D55", // sage
      wash3: "#C99A5C", // ochre
      wash4: "#C68B72", // peach/rose
      wash5: "#6B4F33", // umber
      drag1: "#B08060",
      drag2: "#7A916A",
      vignette: "rgba(60,40,20,0.35)",
    },
    cool: {
      canvas: "#D8DAE0",
      wash1: "#7A8CA0", // slate blue
      wash2: "#8A9B8A", // sage grey
      wash3: "#B0A088", // khaki
      wash4: "#98A8B4", // mist
      wash5: "#5C6A7A", // steel
      drag1: "#8A98A4",
      drag2: "#A8B4A0",
      vignette: "rgba(20,25,35,0.3)",
    },
  }[variant];

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
      style={{ opacity }}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          {/* soft radial washes */}
          <radialGradient id="wp-warm-1" cx="0.3" cy="0.35" r="0.6">
            <stop offset="0%" stopColor={palette.wash1} stopOpacity="0.55" />
            <stop offset="100%" stopColor={palette.wash1} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="wp-warm-2" cx="0.75" cy="0.7" r="0.55">
            <stop offset="0%" stopColor={palette.wash2} stopOpacity="0.45" />
            <stop offset="100%" stopColor={palette.wash2} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="wp-warm-3" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={palette.wash3} stopOpacity="0.4" />
            <stop offset="100%" stopColor={palette.wash3} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="wp-warm-4" cx="0.8" cy="0.2" r="0.45">
            <stop offset="0%" stopColor={palette.wash4} stopOpacity="0.4" />
            <stop offset="100%" stopColor={palette.wash4} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="wp-warm-5" cx="0.45" cy="0.85" r="0.5">
            <stop offset="0%" stopColor={palette.wash5} stopOpacity="0.45" />
            <stop offset="100%" stopColor={palette.wash5} stopOpacity="0" />
          </radialGradient>

          {/* dry-brush drag gradients */}
          <linearGradient id="wp-warm-drag1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={palette.drag1} stopOpacity="0" />
            <stop offset="30%" stopColor={palette.drag1} stopOpacity="0.3" />
            <stop offset="70%" stopColor={palette.drag1} stopOpacity="0.25" />
            <stop offset="100%" stopColor={palette.drag1} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wp-warm-drag2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.drag2} stopOpacity="0" />
            <stop offset="40%" stopColor={palette.drag2} stopOpacity="0.25" />
            <stop offset="100%" stopColor={palette.drag2} stopOpacity="0" />
          </linearGradient>

          {/* canvas grain */}
          <filter id="wp-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="3"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="saturate"
              values="0"
              result="mono"
            />
            <feComponentTransfer in="mono">
              <feFuncA type="linear" slope="0.14" intercept="0" />
            </feComponentTransfer>
          </filter>
        </defs>

        {/* 1. canvas base */}
        <rect width="1200" height="800" fill={palette.canvas} />

        {/* 2. broad brush washes */}
        <ellipse cx="320" cy="260" rx="520" ry="340" fill="url(#wp-warm-1)" />
        <ellipse cx="880" cy="600" rx="460" ry="300" fill="url(#wp-warm-2)" />
        <ellipse cx="600" cy="420" rx="380" ry="300" fill="url(#wp-warm-3)" />
        <ellipse cx="960" cy="180" rx="340" ry="240" fill="url(#wp-warm-4)" />
        <ellipse cx="250" cy="620" rx="420" ry="260" fill="url(#wp-warm-5)" />

        {/* 3. dry-brush drag strokes */}
        <rect x="-100" y="440" width="1400" height="180" fill="url(#wp-warm-drag1)" />
        <rect x="500" y="-100" width="220" height="1000" fill="url(#wp-warm-drag2)" />

        {/* 4. canvas grain overlay */}
        <rect width="1200" height="800" filter="url(#wp-grain)" />

        {/* 5. vignette */}
        <radialGradient id="wp-vignette">
          <stop offset="55%" stopColor="transparent" stopOpacity="0" />
          <stop offset="100%" stopColor={palette.vignette} stopOpacity="1" />
        </radialGradient>
        <rect width="1200" height="800" fill="url(#wp-vignette)" />
      </svg>
    </div>
  );
}

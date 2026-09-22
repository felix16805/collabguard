/**
 * CollabGuard Design Tokens — TypeScript source of truth
 *
 * These mirror the CSS custom properties in globals.css.
 * Use this file to reference token values in:
 *  - Canvas/WebGL rendering (graph node colors, edge colors)
 *  - Motion.dev animation configs (durations, easings)
 *  - Any JS that needs token values (e.g., chart theme config)
 *
 * DO NOT duplicate or override these in ad-hoc style props.
 * If a value isn't here, it doesn't belong in the system yet.
 */

export const colors = {
  // Surfaces (dark theme baseline)
  bg:           "#0D0C0B",
  bgSubtle:     "#0F0E0D",
  surface1:     "#141312",
  surface2:     "#1C1A18",
  surface3:     "#242220",

  // Text
  textPrimary:   "#F5F0E8",
  textSecondary: "#A09890",
  textMuted:     "#6B635C",
  textInverted:  "#0D0C0B",

  // Accent — amber, single, earned
  accent:        "hsl(38 92% 48%)",
  accentHover:   "hsl(38 92% 42%)",
  accentSubtle:  "hsla(38, 92%, 48%, 0.12)",
  accentText:    "hsl(38 92% 65%)",

  // Borders
  border:        "#2A2724",
  borderSubtle:  "#201E1C",
  borderStrong:  "#3D3935",

  // Semantic
  error:         "hsl(4 72% 54%)",
  errorSubtle:   "hsla(4, 72%, 54%, 0.1)",
  warning:       "hsl(38 92% 48%)",
  success:       "hsl(152 58% 42%)",
  successSubtle: "hsla(152, 58%, 42%, 0.1)",

  // Graph-specific
  graph: {
    bg:       "#0A0908",
    nodeDefault: "#3D3935",
    nodeFlagged: "hsl(38 92% 48%)",
    edgeDefault: "rgba(90, 85, 80, 0.4)",
    edgeFlagged: "hsla(38, 92%, 48%, 0.7)",
    clusters: [
      "hsl(38 92% 48%)",   // 0 — amber (primary)
      "hsl(200 72% 55%)",  // 1 — steel blue
      "hsl(152 58% 48%)",  // 2 — sage green
      "hsl(280 55% 60%)",  // 3 — muted violet
      "hsl(340 65% 58%)",  // 4 — dusty rose
      "hsl(25 75% 52%)",   // 5 — terracotta
    ],
  },
} as const;

export const typography = {
  fontDisplay: '"Geist", system-ui, -apple-system, sans-serif',
  fontSans:    '"DM Sans", system-ui, -apple-system, sans-serif',
  fontMono:    '"Geist Mono", "Fira Code", ui-monospace, monospace',
} as const;

export const motion = {
  easeOutExpo:     [0.16, 1, 0.3, 1] as [number, number, number, number],
  easeInOutQuart:  [0.76, 0, 0.24, 1] as [number, number, number, number],
  easeSpring:      [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  durationMicro:   0.12,
  durationStandard: 0.2,
  durationLayout:  0.35,
} as const;

export const radius = {
  xs:   "2px",
  sm:   "4px",
  md:   "8px",
  lg:   "12px",
  xl:   "16px",
  "2xl": "24px",
  full: "9999px",
} as const;

export type ThemeColor = keyof typeof colors;

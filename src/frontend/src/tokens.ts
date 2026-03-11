/**
 * EdUnite Design System — Canonical Token Reference
 *
 * This file is the TypeScript companion to the CSS custom properties
 * defined in `frontend/src/index.css` and the Tailwind theme in
 * `frontend/tailwind.config.js`.
 *
 * PURPOSE:
 *   - Provides typed constants for use in JS/TS contexts where
 *     Tailwind classes cannot be used (e.g., Recharts, Canvas, inline styles).
 *   - Documents the full token inventory for developers.
 *   - Does NOT duplicate or conflict with CSS custom properties.
 *
 * RULE: All new pages and components MUST consume tokens from this file
 * or the corresponding Tailwind utility classes. Never use raw hex values.
 *
 * ============================================================
 * SPACING SCALE (4px base)
 * ============================================================
 * xs  =  4px   → p-xs, m-xs, gap-xs
 * sm  =  8px   → p-sm, m-sm, gap-sm
 * md  = 16px   → p-md, m-md, gap-md
 * lg  = 24px   → p-lg, m-lg, gap-lg
 * xl  = 32px   → p-xl, m-xl, gap-xl
 * 2xl = 48px   → p-2xl, m-2xl, gap-2xl
 * 3xl = 64px   → p-3xl, m-3xl, gap-3xl
 *
 * ============================================================
 * TYPOGRAPHY SCALE
 * ============================================================
 * Font families:
 *   sans    → Inter (body text, UI labels)
 *   display → Plus Jakarta Sans (headings, hero text)
 *   mono    → JetBrains Mono (code)
 *
 * Font sizes (Tailwind class → rem → px):
 *   text-2xs  → 0.625rem → 10px
 *   text-xs   → 0.75rem  → 12px
 *   text-sm   → 0.875rem → 14px
 *   text-base → 1rem     → 16px
 *   text-lg   → 1.125rem → 18px
 *   text-xl   → 1.25rem  → 20px
 *   text-2xl  → 1.5rem   → 24px
 *   text-3xl  → 1.875rem → 30px
 *   text-4xl  → 2.25rem  → 36px
 *   text-5xl  → 3rem     → 48px
 *
 * Heading weights: font-bold (700) or font-extrabold (800)
 * Body weight:     font-normal (400) or font-medium (500)
 * Label weight:    font-medium (500) or font-semibold (600)
 *
 * ============================================================
 * BORDER RADIUS SCALE
 * ============================================================
 * rounded-none → 0px
 * rounded-xs   → 2px
 * rounded-sm   → 4px
 * rounded-md   → 8px   (default)
 * rounded-lg   → 12px
 * rounded-xl   → 16px
 * rounded-2xl  → 24px
 * rounded-full → 9999px
 *
 * ============================================================
 * SHADOW SCALE
 * ============================================================
 * shadow-xs    → subtle lift
 * shadow-sm    → card default
 * shadow-md    → elevated card
 * shadow-lg    → dropdown/popover
 * shadow-xl    → modal
 * shadow-focus → focus ring (purple glow)
 *
 * ============================================================
 * COLOR TOKENS (Tailwind class → CSS var → OKLCH value)
 * ============================================================
 *
 * BRAND / PRIMARY (Deep Purple)
 *   bg-primary              → --color-primary           → oklch(0.45 0.22 290)
 *   bg-primary-hover        → --color-primary-hover     → oklch(0.40 0.22 290)
 *   bg-primary-active       → --color-primary-active    → oklch(0.35 0.22 290)
 *   bg-primary-subtle       → --color-primary-subtle    → oklch(0.95 0.04 290)
 *   text-primary-foreground → --color-primary-foreground→ oklch(1.00 0.00 0)
 *
 * SECONDARY / LAVENDER
 *   bg-secondary            → --color-secondary         → oklch(0.88 0.06 290)
 *   text-secondary-foreground → --color-secondary-foreground
 *
 * NEUTRAL SURFACES
 *   bg-background           → --color-background        → oklch(0.99 0.00 0)
 *   bg-surface              → --color-surface           → oklch(0.97 0.00 0)
 *   bg-surface-raised       → --color-surface-raised    → oklch(1.00 0.00 0)
 *   bg-surface-overlay      → --color-surface-overlay
 *
 * TEXT
 *   text-foreground         → --color-foreground        → oklch(0.15 0.02 290)
 *   text-muted-foreground   → --color-muted-foreground  → oklch(0.50 0.03 290)
 *   text-foreground-subtle  → --color-foreground-subtle → oklch(0.70 0.02 290)
 *
 * BORDERS
 *   border-border           → --color-border            → oklch(0.88 0.02 290)
 *   border-border-strong    → --color-border-strong     → oklch(0.75 0.04 290)
 *
 * SEMANTIC STATES
 *   bg-success / text-success-foreground
 *   bg-warning / text-warning-foreground
 *   bg-destructive / text-destructive-foreground
 *   bg-info / text-info-foreground
 *   (each has a -subtle variant for backgrounds)
 *
 * MUTED / ACCENT (shadcn compat)
 *   bg-muted / text-muted-foreground
 *   bg-accent / text-accent-foreground
 *
 * CARD / POPOVER (shadcn compat)
 *   bg-card / text-card-foreground
 *   bg-popover / text-popover-foreground
 *
 * LEGACY (backward compat — prefer semantic tokens above)
 *   edpurple-{50..900}      → purple scale
 *   lavender-{50..500}      → lavender scale
 */

// ============================================================
// JS/TS color values for non-Tailwind contexts (Recharts, Canvas)
// These mirror the LIGHT MODE CSS custom property values.
// For dark mode support in charts, read the CSS var at runtime.
// ============================================================

export const colors = {
  primary: "oklch(0.45 0.22 290)",
  primaryHover: "oklch(0.40 0.22 290)",
  primaryActive: "oklch(0.35 0.22 290)",
  primarySubtle: "oklch(0.95 0.04 290)",
  primaryForeground: "oklch(1.00 0.00 0)",

  secondary: "oklch(0.88 0.06 290)",
  secondaryForeground: "oklch(0.30 0.15 290)",

  background: "oklch(0.99 0.00 0)",
  surface: "oklch(0.97 0.00 0)",
  surfaceRaised: "oklch(1.00 0.00 0)",

  foreground: "oklch(0.15 0.02 290)",
  foregroundMuted: "oklch(0.50 0.03 290)",
  foregroundSubtle: "oklch(0.70 0.02 290)",

  border: "oklch(0.88 0.02 290)",
  borderStrong: "oklch(0.75 0.04 290)",

  success: "oklch(0.55 0.18 145)",
  successSubtle: "oklch(0.94 0.05 145)",
  warning: "oklch(0.72 0.18 75)",
  warningSubtle: "oklch(0.96 0.05 75)",
  destructive: "oklch(0.55 0.22 25)",
  destructiveSubtle: "oklch(0.95 0.05 25)",
  info: "oklch(0.58 0.18 240)",
  infoSubtle: "oklch(0.94 0.05 240)",

  muted: "oklch(0.94 0.01 290)",
  mutedForeground: "oklch(0.50 0.03 290)",
} as const;

// ============================================================
// SPACING SCALE (numeric px values for non-Tailwind contexts)
// ============================================================
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
} as const;

// ============================================================
// TYPOGRAPHY
// ============================================================
export const typography = {
  fontSans: "Inter, system-ui, -apple-system, sans-serif",
  fontDisplay: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
  fontMono: "JetBrains Mono, Fira Code, monospace",

  // Font size scale (rem)
  size: {
    "2xs": "0.625rem",
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
  },

  // Font weight scale
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
} as const;

// ============================================================
// BORDER RADIUS SCALE
// ============================================================
export const radius = {
  none: "0px",
  xs: "2px",
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "24px",
  full: "9999px",
} as const;

// ============================================================
// SHADOW SCALE
// ============================================================
export const shadows = {
  xs: "0 1px 2px 0 oklch(0.15 0.02 290 / 0.06)",
  sm: "0 1px 3px 0 oklch(0.15 0.02 290 / 0.10), 0 1px 2px -1px oklch(0.15 0.02 290 / 0.06)",
  md: "0 4px 6px -1px oklch(0.15 0.02 290 / 0.10), 0 2px 4px -2px oklch(0.15 0.02 290 / 0.06)",
  lg: "0 10px 15px -3px oklch(0.15 0.02 290 / 0.10), 0 4px 6px -4px oklch(0.15 0.02 290 / 0.06)",
  xl: "0 20px 25px -5px oklch(0.15 0.02 290 / 0.10), 0 8px 10px -6px oklch(0.15 0.02 290 / 0.06)",
  focus: "0 0 0 3px oklch(0.45 0.22 290 / 0.25)",
} as const;

// ============================================================
// CHART COLORS — for Recharts and other visualization libs
// A curated palette derived from the brand tokens
// ============================================================
export const chartColors = {
  primary: "oklch(0.45 0.22 290)", // deep purple
  secondary: "oklch(0.58 0.18 240)", // info blue
  tertiary: "oklch(0.55 0.18 145)", // success green
  quaternary: "oklch(0.72 0.18 75)", // warning amber
  quinary: "oklch(0.55 0.22 25)" /* destructive red */,
  grid: "oklch(0.88 0.02 290)", // border color
  text: "oklch(0.50 0.03 290)", // muted foreground
} as const;

// ============================================================
// COMPONENT STATE CLASSES (documentation)
// Use these Tailwind class patterns for interactive states:
//
// Button primary:
//   bg-primary text-primary-foreground
//   hover:bg-primary-hover
//   active:bg-primary-active
//   focus-visible:shadow-focus
//   disabled:opacity-50 disabled:cursor-not-allowed
//
// Button outline:
//   border border-border bg-surface-raised text-foreground
//   hover:bg-muted
//   focus-visible:shadow-focus
//
// Input:
//   border border-border bg-surface-raised text-foreground
//   placeholder:text-foreground-subtle
//   focus:border-primary focus:shadow-focus
//   disabled:opacity-50
//
// Badge primary:
//   bg-primary-subtle text-primary
//
// Badge success:
//   bg-success-subtle text-success
//
// Badge warning:
//   bg-warning-subtle text-warning-foreground
//
// Badge destructive:
//   bg-destructive-subtle text-destructive
//
// Card:
//   bg-card border border-border rounded-lg shadow-sm
//
// Empty state:
//   flex flex-col items-center justify-center gap-md
//   text-muted-foreground
// ============================================================

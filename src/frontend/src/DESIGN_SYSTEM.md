# EdUnite Design System

> **Single source of truth** for all visual decisions in the EdUnite frontend.
> Every new page, component, and feature MUST consume tokens from this system.
> Never use raw hex values, arbitrary Tailwind colors, or inline color styles.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Color Tokens](#color-tokens)
3. [Spacing Scale](#spacing-scale)
4. [Typography Scale](#typography-scale)
5. [Border Radius Scale](#border-radius-scale)
6. [Shadow Scale](#shadow-scale)
7. [Shared UI Components](#shared-ui-components)
8. [Component States](#component-states)
9. [Enforcement Rules](#enforcement-rules)

---

## Architecture

The design system has three layers:

| Layer | File | Purpose |
|-------|------|---------|
| **CSS Custom Properties** | `frontend/src/index.css` | OKLCH color tokens, spacing vars, shadow vars — the ground truth |
| **Tailwind Theme** | `frontend/tailwind.config.js` | Maps CSS vars to Tailwind utility classes |
| **TypeScript Constants** | `frontend/src/tokens.ts` | Typed values for JS contexts (Recharts, Canvas) |

**Rule:** CSS custom properties in `index.css` are the canonical values. `tailwind.config.js` and `tokens.ts` reference them — never define conflicting values.

---

## Color Tokens

### Brand / Primary (Deep Purple)

| Token | Tailwind Class | CSS Variable | OKLCH Value |
|-------|---------------|--------------|-------------|
| Primary | `bg-primary` / `text-primary` | `--color-primary` | `oklch(0.45 0.22 290)` |
| Primary Hover | `bg-primary-hover` | `--color-primary-hover` | `oklch(0.40 0.22 290)` |
| Primary Active | `bg-primary-active` | `--color-primary-active` | `oklch(0.35 0.22 290)` |
| Primary Subtle | `bg-primary-subtle` | `--color-primary-subtle` | `oklch(0.95 0.04 290)` |
| Primary Foreground | `text-primary-foreground` | `--color-primary-foreground` | `oklch(1.00 0.00 0)` |

### Secondary / Lavender

| Token | Tailwind Class | CSS Variable | OKLCH Value |
|-------|---------------|--------------|-------------|
| Secondary | `bg-secondary` | `--color-secondary` | `oklch(0.88 0.06 290)` |
| Secondary Hover | `bg-secondary-hover` | `--color-secondary-hover` | `oklch(0.83 0.08 290)` |
| Secondary Foreground | `text-secondary-foreground` | `--color-secondary-foreground` | `oklch(0.30 0.15 290)` |

### Neutral Surfaces

| Token | Tailwind Class | CSS Variable | OKLCH Value |
|-------|---------------|--------------|-------------|
| Background | `bg-background` | `--color-background` | `oklch(0.99 0.00 0)` |
| Surface | `bg-surface` | `--color-surface` | `oklch(0.97 0.00 0)` |
| Surface Raised | `bg-surface-raised` | `--color-surface-raised` | `oklch(1.00 0.00 0)` |
| Surface Overlay | `bg-surface-overlay` | `--color-surface-overlay` | `oklch(0.94 0.01 290)` |

### Text / Foreground

| Token | Tailwind Class | CSS Variable | OKLCH Value |
|-------|---------------|--------------|-------------|
| Foreground | `text-foreground` | `--color-foreground` | `oklch(0.15 0.02 290)` |
| Muted Foreground | `text-muted-foreground` | `--color-muted-foreground` | `oklch(0.50 0.03 290)` |
| Subtle Foreground | `text-foreground-subtle` | `--color-foreground-subtle` | `oklch(0.70 0.02 290)` |

### Borders

| Token | Tailwind Class | CSS Variable | OKLCH Value |
|-------|---------------|--------------|-------------|
| Border | `border-border` | `--color-border` | `oklch(0.88 0.02 290)` |
| Border Strong | `border-border-strong` | `--color-border-strong` | `oklch(0.75 0.04 290)` |
| Border Focus | `border-border-focus` | `--color-border-focus` | `oklch(0.45 0.22 290)` |

### Semantic States

| State | Background | Subtle BG | Foreground |
|-------|-----------|-----------|-----------|
| Success | `bg-success` | `bg-success-subtle` | `text-success-foreground` |
| Warning | `bg-warning` | `bg-warning-subtle` | `text-warning-foreground` |
| Destructive | `bg-destructive` | `bg-destructive-subtle` | `text-destructive-foreground` |
| Info | `bg-info` | `bg-info-subtle` | `text-info-foreground` |

### Muted / Accent (shadcn compat)

| Token | Tailwind Class |
|-------|---------------|
| Muted | `bg-muted` / `text-muted-foreground` |
| Accent | `bg-accent` / `text-accent-foreground` |

### Legacy Tokens (backward compat — prefer semantic tokens above)

`edpurple-{50..900}` and `lavender-{50..500}` are preserved for backward compatibility. Prefer semantic tokens in new code.

---

## Spacing Scale

4px base unit. Use Tailwind spacing utilities with these named tokens:

| Token | Tailwind | px value |
|-------|---------|---------|
| `xs` | `p-xs`, `m-xs`, `gap-xs` | 4px |
| `sm` | `p-sm`, `m-sm`, `gap-sm` | 8px |
| `md` | `p-md`, `m-md`, `gap-md` | 16px |
| `lg` | `p-lg`, `m-lg`, `gap-lg` | 24px |
| `xl` | `p-xl`, `m-xl`, `gap-xl` | 32px |
| `2xl` | `p-2xl`, `m-2xl`, `gap-2xl` | 48px |
| `3xl` | `p-3xl`, `m-3xl`, `gap-3xl` | 64px |

---

## Typography Scale

### Font Families

| Role | Family | Usage |
|------|--------|-------|
| `font-sans` | Inter | Body text, UI labels, form inputs |
| `font-display` | Plus Jakarta Sans | Headings, hero text, page titles |
| `font-mono` | JetBrains Mono | Code, IDs, technical values |

### Font Sizes

| Tailwind Class | rem | px | Usage |
|---------------|-----|-----|-------|
| `text-2xs` | 0.625rem | 10px | Micro labels, badges |
| `text-xs` | 0.75rem | 12px | Captions, helper text |
| `text-sm` | 0.875rem | 14px | Secondary text, table cells |
| `text-base` | 1rem | 16px | Body text |
| `text-lg` | 1.125rem | 18px | Large body, card titles |
| `text-xl` | 1.25rem | 20px | Section headings |
| `text-2xl` | 1.5rem | 24px | Page sub-headings |
| `text-3xl` | 1.875rem | 30px | Page headings |
| `text-4xl` | 2.25rem | 36px | Hero headings |
| `text-5xl` | 3rem | 48px | Display headings |

### Font Weights

| Tailwind Class | Weight | Usage |
|---------------|--------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | UI labels, nav items |
| `font-semibold` | 600 | Card titles, form labels |
| `font-bold` | 700 | Headings, CTAs |
| `font-extrabold` | 800 | Display headings |

---

## Border Radius Scale

| Tailwind Class | Value | Usage |
|---------------|-------|-------|
| `rounded-none` | 0px | Tables, full-bleed elements |
| `rounded-xs` | 2px | Micro badges, tags |
| `rounded-sm` | 4px | Buttons (small), inputs |
| `rounded-md` | 8px | Buttons (default), cards |
| `rounded-lg` | 12px | Cards, panels |
| `rounded-xl` | 16px | Large cards, modals |
| `rounded-2xl` | 24px | Feature cards, hero sections |
| `rounded-full` | 9999px | Avatars, pill badges, FABs |

---

## Shadow Scale

| Tailwind Class | Usage |
|---------------|-------|
| `shadow-xs` | Subtle lift, inline elements |
| `shadow-sm` | Default card shadow |
| `shadow-md` | Elevated card, hover state |
| `shadow-lg` | Dropdowns, popovers |
| `shadow-xl` | Modals, dialogs |
| `shadow-focus` | Focus ring (purple glow, 3px) |

---

## Shared UI Components

All shared components are available from `@/components/ui/*` (shadcn/ui).

### Button


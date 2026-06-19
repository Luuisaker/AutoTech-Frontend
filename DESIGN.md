---
name: AutoTech Frontend
description: Frontend de marketplace automotriz financiado — dos caras (conductores/talleres), una plataforma.
colors:
  background: oklch(0.13 0.005 260)
  foreground: oklch(0.97 0.003 260)
  surface: oklch(0.165 0.005 260)
  surface-foreground: oklch(0.97 0.003 260)
  card: oklch(0.165 0.005 260)
  card-foreground: oklch(0.97 0.003 260)
  popover: oklch(0.165 0.005 260)
  popover-foreground: oklch(0.97 0.003 260)
  primary: oklch(0.72 0.165 28)
  primary-foreground: oklch(0.14 0.005 260)
  secondary: oklch(0.22 0.005 260)
  secondary-foreground: oklch(0.97 0.003 260)
  accent: oklch(0.22 0.005 260)
  accent-foreground: oklch(0.97 0.003 260)
  muted: oklch(0.2 0.005 260)
  muted-foreground: oklch(0.65 0.008 260)
  destructive: oklch(0.6 0.2 25)
  destructive-foreground: oklch(0.97 0.003 260)
  border: oklch(0.24 0.005 260)
  border-strong: oklch(0.32 0.005 260)
  input: oklch(0.24 0.005 260)
  ring: oklch(0.72 0.165 28)
typography:
  display:
    fontFamily: Inter Tight, ui-sans-serif, system-ui, sans-serif
    fontWeight: 700
    fontSize: clamp(2rem, 6vw, 4rem)
    lineHeight: 1.05
    letterSpacing: -0.03em
  headline:
    fontFamily: Inter Tight, ui-sans-serif, system-ui, sans-serif
    fontWeight: 600
    fontSize: clamp(1.25rem, 3vw, 2rem)
    lineHeight: 1.15
    letterSpacing: -0.02em
  title:
    fontFamily: Inter Tight, ui-sans-serif, system-ui, sans-serif
    fontWeight: 600
    fontSize: 1.125rem
    lineHeight: 1.3
  body:
    fontFamily: Inter Tight, ui-sans-serif, system-ui, sans-serif
    fontWeight: 400
    fontSize: 0.875rem
    lineHeight: 1.6
  label:
    fontFamily: Inter Tight, ui-sans-serif, system-ui, sans-serif
    fontWeight: 500
    fontSize: 0.75rem
    letterSpacing: 0.05em
    textTransform: uppercase
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  xl: 10px
spacing:
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 3rem
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: label
    rounded: "{rounded.md}"
    padding: 0.5rem 1rem
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: label
    rounded: "{rounded.md}"
    padding: 0.5rem 1rem
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    typography: label
    rounded: "{rounded.md}"
    padding: 0.5rem 1rem
    border: 1px solid "{colors.border}"
  card-default:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: 1.5rem
  input-default:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: 0.5rem 0.75rem
    border: 1px solid "{colors.input}"
---

# Design System: AutoTech Frontend

## 1. Overview

**Creative North Star: "The Automotive Cockpit"**

A premium vehicle's instrument panel at night — deep near-black backgrounds, a single warm coral illuminated accent for decisive actions, and information organized for rapid decision-making. The chassis is unobtrusive dark zinc; interactive elements are revealed by intent.

This system shares the parent AutoTech project's strategic direction (cockpit, premium simplicity, two-sided marketplace) but diverges in palette: the frontend uses **coral as its primary interactive color**, creating a warmer, more action-oriented feel than the parent's steel-blue primary. This gives the frontend a distinctive character — confident, approachable, and immediate.

**Key Characteristics:**

- Near-black background (`oklch(0.13 0.005 260)`) — deep enough for AMOLED-like depth without true `oklch(0 0 0)` to allow subtle surface variation
- Coral primary for all primary actions and focus states; no secondary cool color competes with it
- Dark zinc surfaces (`oklch(0.165 0.005 260)`) for cards, panels, elevated containers
- Flat surfaces by default; shadows appear only on interactive hover states
- Single sans-serif family (Inter Tight) across all roles — display, body, labels, data

## 2. Colors: The Cockpit Palette

A restrained palette built around a single warm primary on a cool dark canvas. Two dominant neutrals (near-black body, dark zinc surfaces) leave visual headroom for the coral primary and occasional semantic colors.

### Primary

- **Action Coral** (`oklch(0.72 0.165 28)`): The dominant interactive color. Used for primary buttons, form focus rings, active navigation, selected states. Higher chroma than the parent's Signal Coral — intentionally warmer and more saturated. Applied sparingly: ≤15% of any screen.

### Neutral

- **Dash Black** (`oklch(0.13 0.005 260)`): Body background. Not pure black — a very dark blue-tinted neutral that reads as black in context but accommodates subtle surface layering above it.
- **Zinc Dark** (`oklch(0.165 0.005 260)`): Card, popover, and elevated surface color. Slightly lighter than the body to establish hierarchy without shadows.
- **Zinc Mid** (`oklch(0.22 0.005 260)`): Secondary surfaces, accent surfaces, muted backgrounds, sidebar.
- **Zinc Edge** (`oklch(0.24 0.005 260)`): Borders, dividers, input strokes. Low contrast intentionally — structure without visual noise.
- **Zinc Edge Strong** (`oklch(0.32 0.005 260)`): Stronger borders for emphasis — elevated cards, panels, container outlines.
- **Gauge White** (`oklch(0.97 0.003 260)`): Primary text, headings, high-emphasis UI. High contrast against dark backgrounds.
- **Dim Gauge** (`oklch(0.65 0.008 260)`): Secondary text, placeholders, disabled content. Maintains ~4.5:1 against dark zinc surfaces.

### Semantic

- **Warning Red** (`oklch(0.6 0.2 25)`): Destructive actions, errors, alerts.

### Named Rules

**The Single Spark Rule.** Coral is the only saturated color in the palette. It occupies ≤15% of any screen. If a button isn't the most important action on the page, it doesn't get coral. Zinc outlines and ghost buttons fill every other role.

## 3. Typography

**Single Family:** Inter Tight (400–800 weights, Google Fonts)
**Fallback:** `ui-sans-serif, system-ui, sans-serif`

**Character:** A compact geometric sans-serif with precise, technical feel — appropriate for instrument-panel data displays and financial interfaces. A single family across all roles reinforces the cockpit's unified instrumentation.

### Hierarchy

- **Display** (700, `clamp(2rem, 6vw, 4rem)`, 1.05, `-0.03em`): Hero headlines only. `text-wrap: balance`. Landing page hero context — not used in authenticated product UI.
- **Headline** (600, `clamp(1.25rem, 3vw, 2rem)`, 1.15, `-0.02em`): Section headings, page titles. `text-wrap: balance`.
- **Title** (600, 1.125rem, 1.3): Card headings, dialog titles, component headings.
- **Body** (400, 0.875rem, 1.6): Primary reading text. Cap line length at 65–75ch. `text-wrap: pretty` to reduce orphans.
- **Label** (500, 0.75rem, `0.05em`, uppercase): Button text, form labels, badges, captions, metadata.

### Named Rules

**The Single Instrument Rule.** One font family for all roles. Hierarchy comes from weight, size, spacing, and case — not from switching typefaces.

## 4. Elevation

Flat by default. Surfaces are distinguished by lightness (dash black → zinc dark → zinc mid), not by shadows.

Shadows appear only as a response to interaction:

- **Hover state**: Subtle `0 4px 12px oklch(0 0 0 / 0.3)` on actionable elements.
- **Modal / Dialog**: `0 8px 32px oklch(0 0 0 / 0.4)` plus black overlay at 60% opacity.
- **Dropdown / Popover**: `0 4px 16px oklch(0 0 0 / 0.35)`.

At rest, no surface casts a shadow.

### Named Rules

**The No-Float Rule.** Cards and surfaces sit flat. Elevation is an interaction signal, not a permanent material property.

## 5. Components

### Buttons

Squared-rectangular with subtle rounding (6px / `rounded-md`). Compact and purposeful, avoiding the pill-button trend.

- **Primary:** Coral fill (`--primary`), near-black text. Hover: `opacity-90`. Focus: ring (2px solid `--ring` with 2px offset).
- **Secondary:** Zinc-mid fill (`--secondary`), gauge-white text. Hover: brighter opacity.
- **Outline:** Transparent fill, 1px `--border` stroke, gauge-white text. Hover: `--secondary` fill.
- **Ghost:** No fill, no border. Hover: `--accent` fill.
- **Destructive:** Warning-red fill, white text.
- **Sizes:** Default h-9 (2.25rem), sm h-8, lg h-10/h-12 (hero CTAs). Icon-only: w-9 h-9.
- **Transitions:** `transition-colors 150ms ease-out`.

### Cards / Containers

Rectangular vessels that separate content from the body without lifting it.

- **Corner Style:** Subtle rounding (6px `rounded-md` or 10px `rounded-xl`).
- **Background:** Zinc Dark (`--card` / `--surface`).
- **Border:** 1px solid Zinc Edge (`--border`) or Zinc Edge Strong (`--border-strong`).
- **Shadow Strategy:** None at rest.
- **Internal Padding:** 1.5rem (p-6).

### Inputs / Fields

Flat inset fields with visible stroke.

- **Style:** No fill (`transparent`), 1px Zinc Edge stroke, 6px radius.
- **Placeholder:** Dim Gauge at full 4.5:1 contrast.
- **Focus:** Coral ring (2px offset).
- **Error:** Warning-red stroke + red-tinted alert below.
- **Disabled:** 50% opacity, no pointer events.

### Navigation (Header)

Sticky top bar with backdrop blur, present on all public surfaces. Brand mark + label on the left, nav links in the center, auth actions on the right.

### Layout Container

Centered max-width 1240px (`container-edge`) with 1.5rem inline padding. Sections are separated by `border-b` bottom borders — the landing page is a vertical stack of bordered sections.

## 6. Structure

### Routes

- `/` — Landing page (`src/routes/index.tsx`)
- `/auth` — Login page with audience selector (`src/routes/auth.tsx`)

### Component Library

- 46 shadcn/ui components in `src/components/ui/`
- Tailwind CSS v4 with `tw-animate-css` for animation utilities
- `lucide-react` for icons (consistent 14-16px sizing in product UI)

## 7. Do's and Don'ts

### Do:

- **Do** use Dash Black as the primary canvas. Content lives in the light, not on a near-white surface.
- **Do** reserve coral for the most important interactive element on a page — typically one button per view.
- **Do** use tonal layering over shadow for surface hierarchy.
- **Do** cap hero headlines at `clamp(2rem, 6vw, 4rem)` and body text at 75ch.
- **Do** use `text-wrap: balance` on h1–h3 and `text-wrap: pretty` on long body copy.
- **Do** animate with `ease-out` curves. Duration 150–300ms for UI transitions.
- **Do** provide `prefers-reduced-motion` alternatives for every animation.

### Don't:

- **Don't** use gradient text. Single solid color always.
- **Don't** use side-stripe colored borders on cards or list items.
- **Don't** use glassmorphism or backdrop blur as a decorative default.
- **Don't** create identical card grids with icon + heading + body text repeated endlessly.
- **Don't** use numbered section markers (01 / 02 / 03) as scaffolding unless the content is an ordered sequence.
- **Don't** let text overflow its container on tablet/mobile. Test every heading at every breakpoint.
- **Don't** use bounce or elastic easings. Exponential ease-out only.
- **Don't** render dropdowns with `position: absolute` inside an `overflow: hidden` container.
- **Don't** write placeholder text below 4.5:1 contrast.
- **Don't** convey information by color alone — pair coral with icon, shape, or text cues (red-green safety).
- **Don't** animate CSS layout properties. Use transform/opacity only.

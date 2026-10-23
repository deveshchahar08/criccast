# DESIGN.md — "Sporty Utility Stream Guide" (from Stitch)

> Source of truth for the KahanDekhun UI. Pasted by Hy from Stitch on Sep 30, 2026.
> Already applied: primary #0284C7 (= Tailwind sky-600), Plus Jakarta Sans,
> canvas #E9F4FE, navy #0B2545, live #EF4444, verified #10B981, free #16A34A,
> card radius 16px, pills rounded-full, tabular-nums on channel numbers,
> custom navy card shadow.

---
name: Sporty Utility Stream Guide
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#3f4850'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#495f82'
  on-secondary: '#ffffff'
  secondary-container: '#bfd5fe'
  on-secondary-container: '#465c7f'
  tertiary: '#006947'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855b'
  on-tertiary-container: '#f5fff6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#d5e3ff'
  secondary-fixed-dim: '#b1c7f0'
  on-secondary-fixed: '#001c3b'
  on-secondary-fixed-variant: '#314769'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '800'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.25rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is engineered for zero-friction discoverability and high-velocity matchday decisions. At its core, the brand fulfills an urgent consumer query: where and how to watch a cricket match right now.

The aesthetic is a hybrid of Modern Clean Utility and Tactile Modern Sport:
- **Tone:** Direct, confident, electric yet orderly, and exceptionally credible.
- **Audience:** Passionate cricket fans navigating fragmented broadcasting ecosystems (linear cable TV vs. OTT subscriptions vs. free-to-air feeds) across mobile and living room screens.
- **Emotional Response:** Immediate relief, clarity, excitement, and total confidence that the stream information is verified, accurate, and current.
- **Design Principles:**
  1. *3-Second Rule:* Match status, participating teams, broadcast channel, and streaming destination must resolve visually within three seconds of viewport entry.
  2. *Atmospheric Daylight:* Crisp stadium daytime skies replaced with a refreshing sky-tinted canvas that prevents eye fatigue while preserving daylight vibrance.
  3. *Zero Clutter Discipline:* Eliminates extraneous stadium metaphors, skeuomorphic pitch textures, or chaotic banners in favor of pure typographical priority and clean status tokens.

## Colors

The palette derives its energy from open-air daytime cricket grounds: luminous ambient atmosphere, disciplined deep navy typography for absolute legibility, and high-frequency functional accents.

- **Canvas & Backgrounds:** The base canvas lives on an airy sky-mist `#E9F4FE`. Primary cards and active surfaces sit on pristine `#FFFFFF` to establish immediate contrast against the tinted backdrop. Subtle container tiers leverage `#F0F8FF` and `#F8FAFC`.
- **Primary Accent (`#0284C7` / `#0369A1`):** Represents connectivity, digital streaming feeds, and action triggers. `#0284C7` is used for primary CTAs, active filters, and primary links. `#0369A1` serves as the high-contrast interactive hover/pressed state.
- **Deep Navy Base (`#0B2545`):** The structural anchor. Replaces harsh true black to eliminate harsh optical vibration while delivering maximum contrast for scores, team designations, and headers.
- **Supporting Neutral (`#475569`):** Slate tone dedicated strictly to secondary match metadata, timing details, series titles, and inactive tab labels.
- **Structural Outlines:** Subtle separation using crisp borders `#E2E8F0` on neutral containers and `#BAE6FD` on highlighted broadcast slots.
- **Functional & Match Status Indicators:**
  - *Live Match Pulse:* `#EF4444` (Crimson Red) paired with `#FEF2F2` tinted badges to denote active real-time balls and ongoing overs.
  - *Verified Broadcast:* `#10B981` (Emerald Green) paired with `#ECFDF5` for confirmed broadcaster feeds.
  - *Free-to-Air / Free Stream:* `#16A34A` (Vibrant Leaf Green) on `#DCFCE7` for unauthenticated or free matches.
  - *Upcoming / Delayed / In Doubt:* `#F59E0B` (Amber Gold) against `#FFFBEB` for weather delays, toss announcements, or impending schedules.

## Typography

The typographic system utilizes **Plus Jakarta Sans** uniformly across display, body, and label roles. Its geometric underpinnings provide crisp modernism, while rounded inner apertures maintain high readability at glanceable mobile distances.

- **Numerics & Score Data:** Numerical values for team scores, overs, run rates, and channel numbers utilize tabular figures (`font-variant-numeric: tabular-nums`) to prevent layout shifting during real-time status pulses.
- **Hierarchy Rules:**
  - Team abbreviations and primary match titles must always employ weights of `700` or `800`.
  - OTT platform names and linear TV guide numbers require `600` weight (`title-md`) to stand distinct from explanatory subscription metadata.
  - Badges, status pills, and time anchors rely on `label-sm` or `label-md` with slight uppercase letter-spacing to deliver tactical authority.

## Layout & Spacing

The layout model is mobile-first, prioritizing quick vertical scanning on handheld screens while cleanly aggregating into a consolidated multi-column dashboard on desktop displays.

- **Grid Structure:**
  - **Mobile (< 768px):** Single-column stacked feed. Canvas margin is locked to `margin` (`1rem`), with match cards running edge-to-edge within safety margins.
  - **Tablet (768px – 1024px):** 6-column fluid structure with `margin-md` (`1.5rem`) and `gutter-md` (`1.25rem`). Allows featured match cards to anchor top viewports while secondary cards arrange as dual-column tiles.
  - **Desktop (> 1024px):** 12-column layout capped at a maximum width of `1200px` centered within `margin-lg` (`2rem`). Match cards span 8 columns, while persistent channel quick-filters and linear TV directory slots take the remaining 4 columns.
- **Rhythm & Flow:**
  - Component internals use `space-sm` (`0.5rem`) for compact badge groupings and `space-md` (`1rem`) between match headers and streaming provider rows.
  - Card-to-card separation maintains `space-lg` (`1.5rem`) on desktop and `space-md` (`1rem`) on handhelds to ensure rapid gesture-friendly thumb scrolling.

## Elevation & Depth

Depth is established via diffused ambient shadows and subtle atmospheric tints, preserving a lightweight and daytime-bright sporting feel without heavy skeuomorphic shading.

- **Base Layer (Level 0):** The foundational viewport canvas bathed in sky-mist `#E9F4FE`.
- **Card Surface (Level 1):** Solid pure white `#FFFFFF` paired with an ultra-soft, custom deep navy tinted shadow:
  `box-shadow: 0 4px 20px -2px rgba(11, 37, 69, 0.06), 0 1px 2px 0 rgba(11, 37, 69, 0.04)`.
  This delivers tactile separation from the sky-blue floor without creating dark, uncalibrated visual weight.
- **Hover & Active Match State (Level 2):** Raised card state upon mouse-over or active expansion:
  `box-shadow: 0 12px 28px -4px rgba(11, 37, 69, 0.10), 0 2px 4px 0 rgba(11, 37, 69, 0.04)`.
  Accompanied by a subtle border shift to `#BAE6FD`.
- **Overlays & Sticky Stream Headers (Level 3):** Fixed navigation, modal filters, and pinned live match ribbons sit at Level 3:
  `box-shadow: 0 20px 32px -8px rgba(11, 37, 69, 0.12)`.
  Incorporates a semi-translucent backdrop filter (`backdrop-filter: blur(12px); background-color: rgba(255, 255, 255, 0.92)`).

## Shapes

The design system enforces a disciplined, friendly, and aerodynamic geometry centered on **Level 2 (Rounded)**:

- **Match Cards & Elevated Containers:** Fixed exactly at `16px` (`1rem` / `rounded-lg`) corner radii to soften the high-density informational tables inside.
- **Status Badges, Filter Chips & Buttons:** Shaped as full pills (`9999px`) to create an unmistakable contrast against square card boundaries, signifying immediate clickability and quick classification.
- **Platform & Team Emblems:** Squircle rounding (`8px` / `0.5rem`) for broadcaster logos and team flag icons, preventing visual harshness while respecting corporate broadcast identity guidelines.

## Components

### Buttons & Interactive Triggers
- **Primary CTA ("Watch Stream"):** Solid `#0284C7` background, pure white `#FFFFFF` text, `title-md` font weight, pill-shaped (`rounded-full`), padded `12px 24px`. On hover: `#0369A1` with an elevated soft glow.
- **Secondary Action ("Set Match Alert" / "Channel Details"):** White `#FFFFFF` background with `1.5px` border in `#E2E8F0`, deep navy `#0B2545` text. On hover: border transitions to `#BAE6FD` with background `#F0F8FF`.

### Match Cards (Core Entity)
- **Container:** Pure `#FFFFFF` surface, `16px` corner radius, `1px` border `#E2E8F0`, padded with `space-lg` (`24px`).
- **Header Slot:** Tournament label in `label-md` uppercase `#475569`, aligned with the Match Status Pill (Live / Upcoming / Concluded).
- **Matchup Row:** Opposing teams displayed with high visual presence—bold team codes (`headline-md`, `#0B2545`), accompanied by `24px` rounded team flags, current overs, and real-time scoreboards.
- **Broadcast Allocation Strip:** A segregated lower section nested within the card, backed with `#F8FAFC` and bounded by a crisp `#E2E8F0` divider line. Displays platform tiles (e.g., OTT App icon + Channel name) alongside badge tokens ("Free", "Subscription Required", "4K HDR").

### Chips & Filter Pills
- **Filter Tabs ("All", "Live Now", "Today", "IPL", "ICC"):** Rounded full pills, padding `8px 16px`. Inactive states take a pure white fill with `#E2E8F0` borders and `#475569` text. Active state takes `#0B2545` background with pure white text, or accent `#0284C7` with white text.
- **Live Indicator Badge:** Crimson `#FEF2F2` background, `#EF4444` bold text, rounded pill with a centered 6px pulsating dot.
- **Free Stream Badge:** Emerald green `#DCFCE7` background, `#16A34A` text, `label-sm` weight, confirming zero-cost viewing.

### Input Fields & Platform Search
- **Search Bar ("Find match, channel, tournament..."):** Pill-shaped or `12px` rounded inputs with `#FFFFFF` background, `1.5px` border in `#E2E8F0`, `space-md` horizontal padding, and `#0B2545` placeholder/text. On focus: border shifts cleanly to `#0284C7` with a `0 0 0 3px rgba(2, 132, 199, 0.15)` optical focus ring.

### TV Channel & Platform Directory List
- Row-based utility layout. Alternating subtle rows or clean dividers (`#E2E8F0`), displaying channel numbers (e.g., "Star Sports 1 HD - Ch 452"), commentary language pills (Hindi, English, Tamil, Telugu), and direct broadcast resolution identifiers.

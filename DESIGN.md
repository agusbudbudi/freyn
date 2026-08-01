# Freyn — Landing Page Style Reference
> White SaaS canvas, one signal blue, pastel semantic badges

**Theme:** light
**Source:** `app/page.js`, `components/TestimonialSlider.js`, `tailwind.config.js`

Freyn's marketing page (`app/page.js`) is a bright, product-forward SaaS landing built on Tailwind's default **slate** neutral scale plus a small custom token set layered in via `tailwind.config.js`. One saturated accent — Signal Blue (`#0080ff`) — carries every primary action and brand highlight; everything else is white/slate. Content leans on realistic in-app UI mockups (dashboard cards, invoice cards, floating status widgets) rather than illustration or photography, wrapped in soft multi-layer shadows (`shadow-card`, `shadow-float`, `shadow-glow-blue`) instead of hard borders alone. Semantic pastel badges (mint/lavender/peach/pink/yellow/blue) tag status and feature chips throughout. Typography is a single family, Inter, loaded at weights 400–900 via `next/font/google` directly in `app/page.js` (not through `next/font` in the root layout).

## Tokens — Colors

### Custom brand tokens (`tailwind.config.js`)

| Name | Value | Token | Role |
|------|-------|-------|------|
| Signal Blue | `#0080ff` | `signal-blue` | Only saturated accent — CTA fills, links, hero highlight pill, active states, section banner background |
| Voltage Violet | `#0050ff` | `voltage-violet` | Defined in config; not currently used on the landing page |
| Sky Wash | `#c5e0fb` | `sky-wash` | Hover border accent on target-audience & testimonial cards (`hover:border-sky-wash`) |
| Pencil Gray | `#8c9baa` | `pencil-gray` | Defined in config; not currently used on the landing page |
| Graphite | `#636f7b` | `graphite` | Defined in config; not currently used on the landing page |
| Ink | `#000000` | `ink` | Defined in config; not currently used on the landing page (slate-900 is used instead) |
| Carbon | `#222222` | `carbon` | Defined in config; not currently used on the landing page |
| Paper | `#ffffff` | `paper` | Defined in config; page uses plain `bg-white` instead |
| Surface BG | `#f8fafc` | `surface-bg` | Defined in config; page uses `bg-slate-50` instead |
| Border Subtle | `#e2e8f0` | `border-subtle` | Defined in config; page uses `border-slate-100`/`border-slate-200` instead |

### Neutral scale actually in use (Tailwind default `slate`)

| Name | Value | Role |
|------|-------|------|
| slate-900 | `#0f172a` | Headings, primary body text, footer wordmark |
| slate-800 | `#1e293b` | Nav "Masuk" link text |
| slate-500 | `#64748b` | Secondary body copy, nav link default state, captions |
| slate-200 | `#e2e8f0` | Mobile menu panel border |
| slate-100 | `#f1f5f9` | Card borders, header border, footer border |
| slate-50 | `#f8fafc` | Sunken card wells, hover backgrounds |
| white | `#ffffff` | Page canvas, card surfaces, button text on blue/ink |

### Semantic pastel badge pairs (fill / text), shared by `Badge` in `app/page.js` and `TestimonialSlider.js`

| Name | Fill | Text | Used for |
|------|------|------|----------|
| yellow | `#fef9c3` | `#a16207` | "Sedang dikerjakan"-style tags, milestone counts |
| mint | `#dcfce7` | `#15803d` | Positive/active/paid/verified states |
| pink | `#ffe4e6` | `#be123c` | Invoice-related tag |
| lavender | `#f3e8ff` | `#6b21a8` | Portfolio / review-ready states |
| peach | `#ffedd5` | `#c2410c` | Service catalog / freelancer tags |
| blue | `#e0f2fe` | `#0369a1` | Result-portal / agency tags |
| amber-500 (Tailwind) | `#f59e0b` | — | 5-star rating icons |

## Tokens — Typography

**Family:** Inter, weights `400 500 600 700 800 900`, loaded via `next/font/google` in `app/page.js` (`variable: --font-inter`), applied with `font-inter` on the page root.
**Icons:** Font Awesome 6.0.0 solid (`fas fa-*`, CDN in root `app/layout.js`) for UI glyphs/arrows/stars; Unicons Line v4 (`uil uil-*`, CDN) for the three target-audience icons.

### Sizes observed on the page

| Role | Size | Weight | Tracking | Line height | Where |
|------|------|--------|----------|-------------|-------|
| Hero H1 | 2.5rem → 3.25rem (md) → 4.25rem (wide) | 700 | -0.05em | 1.02 | Hero headline |
| Hero body | 19px | 400 | -0.015em | 1.55 | Hero subcopy |
| Section H2 | 2rem → 2.75rem/3rem (md) | 700–800 | -0.03em to -0.04em | 1.05–1.25 | Section openers, banners |
| Feature H2 | 1.85rem → 2.35rem (md) | 700 | -0.036em | 1.08 | Feature block headings |
| Card heading | 15–18px | 700 | -0.02em | tight | Card titles, testimonial author |
| Body | 14–16px | 400 | normal | 1.5–1.6 | Card/paragraph copy |
| Caption | 10–13px | 500 | normal | 1.2–1.4 | Meta labels, badge text |
| Step tag | 11px | 600, uppercase | normal | normal | "LANGKAH 1" badges |

## Tokens — Spacing & Shapes

**Base unit:** 4px (Tailwind default scale, used directly — no custom spacing scale defined)
**Density:** comfortable — sections use `py-16` (64px), feature blocks use `p-12` (48px) card padding

### Border Radius (`tailwind.config.js` + arbitrary values on the page)

| Element | Value | Token / class |
|---------|-------|-------|
| buttons | 1600px (full pill) | `rounded-buttons` |
| tags / badges | 1600px (full pill) | `rounded-tags` |
| inputs | 12px | `rounded-inputs` |
| images / mockup frames | 24px | `rounded-images` |
| config "cards" | 16px | `rounded-cards` (defined, unused on landing page) |
| feature/target cards | 20px | `rounded-[20px]` |
| floating mini UI cards | 18px | `rounded-[18px]` |
| inner dashboard cards | 16px | `rounded-2xl` |
| small UI chips | 12px | `rounded-xl` |
| avatars / icon circles | full | `rounded-full` |
| logo container | 8px | `rounded-lg` |

### Shadows (`tailwind.config.js`)

| Name | Value | Token | Used for |
|------|-------|-------|----------|
| card | `0px 10px 30px rgba(0,0,0,0.04), 0px 2px 8px rgba(0,0,0,0.02)` | `shadow-card` | Default resting elevation for all content cards |
| float | `0px 18px 40px -10px rgba(0,0,0,0.06), 0px 1px 3px rgba(0,0,0,0.04)` | `shadow-float` | Hero mockup frame, floating chat/invoice cards, card hover state |
| float-sitemap | `0px 12px 32px rgba(147,197,253,0.25), 0px 18px 40px -10px rgba(0,0,0,0.06), 0px 1px 3px rgba(0,0,0,0.04)` | `shadow-float-sitemap` | Floating "Proyek Aktif" progress card (blue-tinted glow + float) |
| glow-blue | `0px 10px 30px rgba(0,128,255,0.35)` | `shadow-glow-blue` | Hero CTA, nav "Coba Gratis" hover, trust banner, GAET KLIEN chip |
| glow-blue-lg | `0px 12px 32px rgba(0,128,255,0.45)` | `shadow-glow-blue-lg` | Hero CTA hover state |

### Layout

- **Page max-width:** 1200px, centered (`max-w-[1200px] mx-auto`)
- **Custom breakpoints:** `split: 900px`, `wide: 992px` (used instead of Tailwind's default `lg`)
- **Section vertical rhythm:** `py-16` (64px) standard, hero uses `pt-[130px]` to clear the fixed header
- **Feature block padding:** `p-12` (48px), two-column grid `1fr_1.1fr` alternating sides per block
- **Card padding:** 20–24px inner cards, 28px (`p-7`) sunken wells

## Components

### Fixed Nav Header
Fixed full-width bar, `backdrop-blur-lg`, `border-b border-slate-100`, subtle shadow. Background shifts from `bg-white/[0.92]` to `bg-white/[0.98]` + `shadow-card` once the page scrolls past 30px (tracked via `headerBg` state). Contains: 28px logo image in an 8px-radius container + "Freyn" wordmark, centered nav links (slate-500, hover slate-900), and two nav buttons.

### Nav Login Button
Outlined pill (`rounded-buttons`), 1px `border-slate-200`, transparent fill, `text-slate-800` at 14px/500. Hover: `bg-slate-50`.

### Nav CTA Button ("Coba Gratis")
Filled pill, `bg-slate-900` background, white text, 14px/500, small `fa-arrow-right` icon. Hover: `bg-signal-blue` + `shadow-glow-blue`.

### Hero Social Proof Stack
Row of four 30px overlapping circular avatars (`-ml-2`, white ring), next to a 5-star rating (amber-500) with "5.0" bold and "Dipercaya 2,500+ freelancer" caption below in slate-500 11px.

### Hero Highlight Pill (inline text)
`bg-signal-blue text-white` inline span, `rounded-tags`, bold, sits inside the H1 to highlight the key phrase ("proyek freelance").

### Hero CTA Button
Pill (`rounded-buttons`), `bg-signal-blue`, white text, 19px/600, asymmetric padding (`pl-9 pr-[42px]`) with trailing `fa-arrow-right`. Rest state: `shadow-glow-blue`. Hover: lifts `-translate-y-0.5` and shadow deepens to `shadow-glow-blue-lg`.

### Hero Background Glow
Three large blurred radial-gradient circles (`blur-[60px]`, 520–650px diameter) in blue/cyan/purple layered behind the hero content at low opacity — the only place non-brand hues (cyan, purple) appear, purely as decorative atmosphere.

### Hero Dashboard Mockup
White frame, `rounded-images` (24px), `border-slate-100`, `shadow-float`. Browser-style chrome row (3 colored traffic-light dots + fake URL text) above a `bg-slate-50` well containing a 3-column grid of small `shadow-card` status cards (each: bold title, pastel `Badge`, meta caption).

### Floating Mini UI Cards
Absolutely positioned cards scattered around the hero (desktop/`wide` only, `pointer-events-none`): a chat-bubble card, an invoice-summary card (`shadow-float`), and a project-progress card with a distinctive `border-[2.5px] border-[#93c5fd]` + `shadow-float-sitemap` glow and an inline progress bar.

### Pastel Badge
Pill (`rounded-tags`), semibold, one of 6 fill/text pairs (yellow/mint/pink/lavender/peach/blue — see color table). Used both as status tags on UI-mockup cards and as inline highlights within long-form copy (Pitch Intro section).

### Icon Badge (Feature Circles)
44px (`w-11 h-11`) full-circle, pastel fill (mint/lavender/peach), centered Unicons line icon. Used atop the three target-audience cards.

### Target Audience Card
White, `rounded-[20px]`, `border-slate-100`, `shadow-card`. Icon badge → 20px/700 heading → 14px slate-500 body → sunken `bg-slate-50` footer stat row. Hover: lifts `-translate-y-1.5`, shadow escalates to `shadow-float`, border tints `sky-wash`.

### Step Tag ("LANGKAH")
Pill, 1px `border-slate-200`, transparent fill, 11px uppercase — bold step number + slate-500 descriptor, separated by a middot. Sits above each feature block heading.

### Feature Block (alternating 2-column)
White, `rounded-images` (24px), `border-slate-100`, `shadow-card`, `p-12`. Alternates text-left/mockup-right and mockup-left/text-right across the 3 blocks via `wide:order-1`. Text side: step tag → H2 → body → 2-col mini stat grid. Mockup side: `bg-slate-50` well (`rounded-images`, `shadow-card`) stacking 2–3 inner `shadow-card` UI cards (rounded-2xl).

### Enterprise Trust Banner
Full-bleed-within-container block, `bg-signal-blue`, `rounded-images`, white centered text, `shadow-glow-blue`. Contains an inline white-on-blue pill echoing the hero highlight pattern in reverse.

### "GAET KLIEN" Chip Banner
Standalone oversized pill (`rounded-tags`), `bg-signal-blue`, white text, black-weight (900) 2.25rem/3.25rem, `shadow-glow-blue`, followed by a centered slate-500 supporting line.

### Testimonial Card
White, `rounded-[20px]`, `border-slate-100`, `shadow-card`. Header row: 44px circular avatar + name/role, pastel tag top-right. Body: italic-style quote in slate-500. Footer: amber star row + "5.0 / 5.0" bold, separated by a `border-t border-slate-50`. Hover matches Target Audience Card (lift + `shadow-float` + `sky-wash` border).

### Final CTA Split Section
Two-column (`1.2fr_0.8fr`) block: left is an oversized (2rem→2.75rem, weight 800) heading + body + a jumbo hero-style CTA button (bigger padding, 1.75rem→2.25rem text); right is a floating phone screenshot (`drop-shadow`, no card frame).

### Footer
`border-t border-slate-100`, three-column flex: logo+wordmark, copyright text, 3 social icon links (all slate-500).

## Do's and Don'ts

### Do
- Use Signal Blue (`#0080ff`) as the only saturated brand color — everything else is white/slate/pastel.
- Build every button and tag as a full pill (`rounded-buttons` / `rounded-tags`, 1600px radius); reserve smaller radii (12–24px) for cards, inputs, and mockup frames.
- Layer shadows instead of hard borders for elevation: `shadow-card` at rest, `shadow-float` on hover/float, `shadow-glow-blue` only on the primary blue surfaces.
- Use the 6-color pastel `Badge` palette (yellow/mint/pink/lavender/peach/blue) for status tags and inline copy highlights — never invent a 7th hue.
- Represent product value through realistic in-app UI mockups (dashboard cards, invoice snippets, progress bars) rather than illustration or stock photography.
- Alternate feature-block layout direction (text/mockup sides) across consecutive sections so the page doesn't feel like a repeated template.
- Use `hover:-translate-y-*` + shadow escalation + `hover:border-sky-wash` as the standard card hover treatment.

### Don't
- Don't introduce a second saturated brand hue for buttons, links, or active states — the hero's decorative background glow (cyan/purple blurred circles) is the one sanctioned exception, and only as atmosphere, never as a UI color.
- Don't use square corners on any button, tag, or card.
- Don't reach for `pencil-gray`, `graphite`, `ink`, `carbon`, `paper`, `surface-bg`, or `voltage-violet` — they exist in `tailwind.config.js` but the landing page consistently uses Tailwind's default `slate` scale instead. Prefer `slate-900/500/100/50` for new landing-page work to stay consistent with the current file.
- Don't use heavy solid drop shadows on static content; the only allowed shadows are `shadow-card`, `shadow-float`, `shadow-float-sitemap`, and the two `glow-blue` variants.
- Don't let body copy exceed ~19px (hero) or drop below weight 400.
- Don't fill full sections with solid color except the two intentional blue banners (Enterprise Trust Banner, GAET KLIEN chip) — everything else stays white.

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Canvas | `#ffffff` | Page background, section backgrounds |
| 1 | Well | `#f8fafc` (slate-50) | Sunken containers inside feature blocks and the hero mockup |
| 2 | Card | `#ffffff` | Feature cards, testimonial cards, UI mockup cards — `shadow-card` at rest |
| 3 | Floating | `#ffffff` | Hero mockup frame, floating annotation cards — `shadow-float` |
| 4 | Signal | `#0080ff` | CTA fills, trust banner, GAET KLIEN chip — `shadow-glow-blue` |

## Imagery

Imagery is dominated by simulated in-app UI: a browser-chrome-framed dashboard mockup in the hero, three floating status cards around it, and stacked mini UI cards inside each feature block (invoice detail, calendar event, milestone tracker, portfolio thumbnails, service pricing tiers, client database). Real photography appears only as small circular avatar images (testimony-1…5.png) used for social proof and testimonial authors. One raster asset (`/images/phone.png`) appears in the final CTA as a plain drop-shadowed device screenshot, not framed in a card. No illustration or lifestyle photography is used anywhere on the page.

## Layout

Centered, max-width-1200px container throughout. The hero is a centered headline stack over a full-width mockup showcase, with three absolutely-positioned floating cards scattered around it at the `wide` (992px) breakpoint and above — these are hidden below `wide` rather than reflowed. Below the hero: a text-only "Pitch Intro" paragraph section, a 3-card target-audience grid, three alternating two-column feature blocks (`id="features"`), a full-width blue trust banner, a standalone blue chip banner, a 3-column testimonial grid (`id="testimony"`), a split final-CTA section with a phone image (`id="contact"`), and a three-column footer. Sections use custom breakpoints `split` (900px) and `wide` (992px) rather than Tailwind's default `md`/`lg` for the columns that matter most (nav links, floating cards, grids).

## Quick Color Reference
- Text: `#0f172a` (slate-900, headings/primary), `#1e293b` (slate-800, nav login link), `#64748b` (slate-500, body/secondary)
- Background: `#ffffff` (canvas, cards), `#f8fafc` (slate-50, sunken wells)
- Border: `#f1f5f9` (slate-100, default card/header border), `#e2e8f0` (slate-200, mobile menu)
- Accent: `#0080ff` (Signal Blue) — only saturated brand color, all CTAs and highlights
- Hover accent: `#c5e0fb` (Sky Wash) — card border on hover only
- Pastel badges: `#fef9c3`/`#a16207` yellow · `#dcfce7`/`#15803d` mint · `#ffe4e6`/`#be123c` pink · `#f3e8ff`/`#6b21a8` lavender · `#ffedd5`/`#c2410c` peach · `#e0f2fe`/`#0369a1` blue

## Quick Start

### Tailwind config (current, `tailwind.config.js`)

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      screens: {
        split: "900px",
        wide: "992px",
      },
      colors: {
        "signal-blue": "#0080ff",
        "voltage-violet": "#0050ff",
        "sky-wash": "#c5e0fb",
        "pencil-gray": "#8c9baa",
        graphite: "#636f7b",
        ink: "#000000",
        carbon: "#222222",
        paper: "#ffffff",
        "surface-bg": "#f8fafc",
        "border-subtle": "#e2e8f0",
      },
      borderRadius: {
        buttons: "1600px",
        cards: "16px",
        inputs: "12px",
        tags: "1600px",
        images: "24px",
      },
      boxShadow: {
        card: "0px 10px 30px rgba(0, 0, 0, 0.04), 0px 2px 8px rgba(0, 0, 0, 0.02)",
        float: "0px 18px 40px -10px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.04)",
        "glow-blue": "0px 10px 30px rgba(0, 128, 255, 0.35)",
        "glow-blue-lg": "0px 12px 32px rgba(0, 128, 255, 0.45)",
        "float-sitemap": "0px 12px 32px rgba(147, 197, 253, 0.25), 0px 18px 40px -10px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.04)",
      },
      fontFamily: {
        inter: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
    },
  },
  plugins: [],
};
```

### Pastel badge map (`app/page.js` / `components/TestimonialSlider.js`)

```js
const badgeColor = {
  yellow: "bg-[#fef9c3] text-[#a16207]",
  mint: "bg-[#dcfce7] text-[#15803d]",
  pink: "bg-[#ffe4e6] text-[#be123c]",
  lavender: "bg-[#f3e8ff] text-[#6b21a8]",
  peach: "bg-[#ffedd5] text-[#c2410c]",
  blue: "bg-[#e0f2fe] text-[#0369a1]",
};
```

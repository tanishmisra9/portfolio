# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server at localhost:3000
npm run dev:lan    # same, exposed on 0.0.0.0 for LAN testing
npm run build      # production build
npm run lint       # ESLint
npm run clean      # rm -rf .next
```

No test suite.

## Architecture

Next.js 15 App Router, TypeScript, Tailwind CSS. No shadcn/ui — all components are hand-built. Framer Motion for animations; Lenis for smooth scroll; `@vercel/analytics` injected in the root layout.

### Routing

| Route | File |
|---|---|
| `/` | `app/page.tsx` — home, composed of section components |
| `/photos` | `app/photos/page.tsx` — collection index |
| `/photos/[slug]` | `app/photos/[slug]/page.tsx` — statically generated albums |
| `/quotes` | `app/quotes/page.tsx` — generative typographic cloud |

### Data layer

All content lives in `data/*.ts` as typed TypeScript exports. No database, no API, no CMS.

- `data/portfolio.ts` — single `portfolio` object typed as `PortfolioContent` (`types/content.ts`). Only file to edit for resume/bio/project changes.
- `data/photos.ts` — `collections: PhotoCollection[]` plus helpers (`getCollectionBySlug`, `getAllCollectionSlugs`, `getRandomPhotoCandidates`). Adding a new album entry here is sufficient — `generateStaticParams` in the slug page picks it up automatically. The `super-max` collection is always pinned first via `PINNED_FIRST_SLUG`.
- `data/quotes.ts` — `quotes: QuoteEntry[]`. Optional `emphasis: 1 | 2 | 3` biases the size tier in the quote cloud (3 = hero-eligible).

### Component conventions

Pages are React Server Components. Interactivity uses `"use client"` at the component boundary. Section components in `components/sections/` each accept typed props extracted from `portfolio` in `app/page.tsx`.

Framer Motion entrance animations are coordinated via `HomeIntroGateProvider` / `useHomeIntroDone` context (`components/home-intro-gate.tsx`) — sections gate their animation starts until the hero marks itself done.

## Typography

Global fonts loaded in `app/layout.tsx`: Inter (`--font-inter`) and Space Mono (`--font-space-mono`). Two self-hosted fonts in `public/fonts/`: YD Gothic 130 (the `font-sans` base in Tailwind) and ITC American Typewriter (used only on the NYC photo album).

`font-sans` → YD Gothic → Inter → system-ui. `font-display` → Inter. `font-mono` → Space Mono.

The `/quotes` route lazy-loads four additional Google Fonts (Playfair Display, Instrument Serif, Bricolage Grotesque, Familjen Grotesk) scoped to that layout only via `app/quotes/layout.tsx` + `app/quotes/fonts.ts`. These are not available outside the quotes route.

## Photos page

Photos are static assets in `public/photos/<collection-slug>/`. Next.js `<Image>` is used with AVIF + WebP format negotiation. Supply `width`/`height` on `Photo` whenever known for correct aspect-ratio reservation. `Photo.duetWith` renders two images side-by-side in the album view.

`getRandomPhotoCandidates()` flattens all collections except `super-max` and is used on the index page for a hover-preview effect.

## Quotes page

`QuoteCloud` in `components/quotes/quote-cloud.tsx` is a fully client-side greedy skyline packer. On desktop it:

1. Assigns each quote a size tier (0–3) and a typeface treatment based on `emphasis`.
2. Renders all quotes as invisible DOM nodes to measure natural dimensions via `useLayoutEffect` + `ResizeObserver`.
3. Runs `packBlocks` (best of 10 randomized `packOnce` attempts) using a skyline algorithm with a uniform gutter (`PACK_GUTTER_PX = 44px`).
4. Assigns alternating white/dark colours to neighbours via `assignSpreadColors`.
5. Fades quotes in with staggered Framer Motion entrance animations, hero tier leading.

On mobile it falls back to a vertical stack. All placement is randomized client-side after mount (never during SSR) to avoid hydration mismatches.

**Font-swap handling:** the cloud listens to `document.fonts.ready` and `loadingdone` events and re-runs the pack when font metrics change, preventing post-swap overlap.

**Easter egg:** quotes attributed to Max Verstappen navigate to `/photos/super-max` on click.

## Radio easter egg

`RadioKeystrokeListener` (`components/easter-eggs/radio-keystroke-listener.tsx`) plays audio when the user types `bbb` or `boxbox` anywhere outside an input. On mobile, triple-tap within 800 ms triggers the same effect. Samples live in `public/sfx/radio/` and are discovered at runtime by `lib/radio-samples.ts` via `fs.readdir` on the server — adding an audio file to that directory is sufficient, no code change needed. Per-sample gain is normalized against `RADIO_REFERENCE_SAMPLE` (`stupid.mp3`) to level-match volumes.

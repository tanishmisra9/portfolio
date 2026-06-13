# Tanish Misra's Portfolio

Personal portfolio and photography site at [tanishmisra.com](https://tanishmisra.com), built with Next.js, TypeScript, and Tailwind CSS. The home page is a dark, motion-heavy resume-style experience; `/photos` is a separate gallery with curated collections, per-album interactions, and light sound design; `/quotes` is a generative typographic quote cloud that arranges itself differently on every visit.

## Overview

- **Home (`/`)** — Hero, experience, education, skills, certifications, projects, and about/contact
- **Photos (`/photos`)** — Collection grid, interactive header, and “Surprise me!” random photo overlay
- **Album pages (`/photos/[slug]`)** — Static routes generated from `data/photos.ts`
- **Quotes (`/quotes`)** — Generative typographic quote cloud: a skyline-packed mosaic on desktop (different fonts, sizes, and arrangement every visit) and a clean vertical Playfair stack on mobile, both ordered by a per-load shuffle
- **Box Box easter egg** — Global F1 team-radio SFX on any page (desktop: type `bbb` or `boxbox`; mobile: triple-tap within 800ms)
- **Super Max easter egg** — Clicking any Max Verstappen quote on `/quotes` jumps to the Super Max photo album
- **Stack** — Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3, Framer Motion, Lenis
- **Analytics** — Vercel Analytics in production

## Routes

| Route | Description |
| --- | --- |
| `/` | Portfolio home |
| `/photos` | Photography index (Super Max pinned first) |
| `/photos/[slug]` | Album pages — `campus`, `snowfall`, `uk-2025`, `new-york`, `smokies`, `new-year`, `standalone`, `super-max` |
| `/quotes` | Generative typographic quote cloud |

## Photography collections

Eight live collections are defined in [`data/photos.ts`](data/photos.ts):

| Slug | Title | Notes |
| --- | --- | --- |
| `super-max` | Super Max | Pinned first on `/photos`; excluded from Surprise me |
| `campus` | Campus | |
| `snowfall` | Snowfall | Click title → snow burst |
| `uk-2025` | UK 2025 | Click title → flag color sweep |
| `new-york` | New York | Custom I ♥ NY title crossfade |
| `smokies` | Smokies | Click title → fog canvas |
| `new-year` | New Year | Holiday + NYE photos; click title → fireworks |
| `standalone` | Standalones | |

Asset folders under `public/photos/` match collection slugs (`campus`, `snowfall`, `uk-2025`, `new-york`, `smokies`, `new-year`, `standalone`, `super-max`).

## Tech stack

- Next.js 15 · React 19 · TypeScript
- Tailwind CSS 3 · PostCSS · Autoprefixer
- Framer Motion · Lenis · Lucide React
- ESLint 9 (`eslint.config.mjs`) · `@vercel/analytics`

## Project structure

```text
Portfolio/
├── app/
│   ├── layout.tsx          # Root layout, skip link, radio easter egg, SmoothScroll, header
│   ├── page.tsx            # Home page sections
│   ├── globals.css         # Theme, ghost headings, album title animations
│   ├── photos/
│   │   ├── layout.tsx      # Photos metadata + font preloads
│   │   ├── page.tsx        # Photos index
│   │   └── [slug]/page.tsx # Album pages (SSG)
│   ├── quotes/
│   │   ├── fonts.ts        # Route-scoped Playfair Display (next/font)
│   │   ├── layout.tsx      # Quotes metadata + serif font variable
│   │   └── page.tsx        # Renders the quote cloud
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── easter-eggs/        # Box Box radio keystroke + triple-tap listener
│   ├── hero/               # Scatter name, hero motion
│   ├── photos/             # Album UI, canvases, photos header flash
│   ├── quotes/             # quote-cloud.tsx — generative cloud, packing, tooltip
│   ├── sections/           # Home content sections
│   ├── site-header.tsx     # Nav, scroll spy, mobile menu
│   ├── smooth-scroll.tsx   # Lenis wrapper
│   ├── scroll-reveal.tsx
│   └── home-intro-gate.tsx
├── data/
│   ├── portfolio.ts        # Resume-style home content
│   ├── photos.ts           # Collections, images, Surprise me pool
│   └── quotes.ts           # Quote text, attributions, emphasis tiers
├── lib/
│   ├── radio-samples.ts    # Scans public/sfx/radio at build time
│   ├── quotes-motion.ts    # Quote cloud reveal/stagger constants
│   └── …                   # Motion timing helpers
├── public/
│   ├── fonts/              # YD Gothic, ITC American Typewriter
│   ├── photos/             # Image assets by collection
│   └── sfx/                # camera.mp3, passby.mp3, pitstop.mp3, radio/*.mp3
├── types/content.ts
├── next.config.ts          # Image optimization config
├── tailwind.config.ts
└── package.json
```

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
git clone https://github.com/tanishmisra9/portfolio.git
cd portfolio
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To test on other devices on the same network:

```bash
npm run dev:lan
```

### Production build

```bash
npm run build
npm run start
```

### Other scripts

```bash
npm run lint
npm run clean
```

## Editing content

### Portfolio (home page)

Edit [`data/portfolio.ts`](data/portfolio.ts) for hero copy, experience, education, skills, certifications, projects, and about/contact. Shapes are in [`types/content.ts`](types/content.ts).

### Photography

Edit [`data/photos.ts`](data/photos.ts) for:

- Collection titles, descriptions, and cover images
- Photo order, captions, and alt text
- Side-by-side **duet** layouts (`duetWith` on a photo entry)

After adding images, place files under the matching folder in `public/photos/`. Album title interactions are wired in [`components/photos/album-title.tsx`](components/photos/album-title.tsx) (and [`nyc-title.tsx`](components/photos/nyc-title.tsx) for New York).

**Surprise me** on `/photos` draws from all collections except `super-max` via `getRandomPhotoCandidates()`.

### Quotes

Edit [`data/quotes.ts`](data/quotes.ts) — each entry is `{ id, text, attribution?, emphasis? }`. `emphasis` (1–3) biases the size tier: `3` quotes can land in the largest hero tier (capped at one hero per render), `1` skews smaller; it defaults to `1`. Everything else is generated client-side in [`components/quotes/quote-cloud.tsx`](components/quotes/quote-cloud.tsx) on each load, so the same data renders a fresh layout every visit:

- **Desktop** — A greedy skyline bin-packer lays quotes into an interlocking, overlap-free mosaic with sizes intermixed top-to-bottom. Typography is a two-face system (Playfair Display serif, leading; Inter sans, lighter accent) and a two-value colour scheme (bright white / dark grey) that is spread so neighbours alternate. Quotes by the same author are pushed apart. Hovering a quote shows its author in a cursor-following, liquid-glass tooltip.
- **Mobile** — A single vertical Playfair stack with the author formatted beneath each quote, revealed on scroll.

Typeface-to-size pairing, size tiers, colours, gutter, and reveal timing are tunable constants at the top of `quote-cloud.tsx` and in [`lib/quotes-motion.ts`](lib/quotes-motion.ts). The route-scoped serif loads via [`app/quotes/fonts.ts`](app/quotes/fonts.ts).

### Box Box radio easter egg

Team-radio clips live in [`public/sfx/radio/`](public/sfx/radio/). [`lib/radio-samples.ts`](lib/radio-samples.ts) discovers `.mp3` (and other audio) files at build/request time — add a file, rebuild or redeploy, and it joins the pool automatically.

[`components/easter-eggs/radio-keystroke-listener.tsx`](components/easter-eggs/radio-keystroke-listener.tsx) is mounted in the root layout and plays a random clip with:

- **Desktop** — Type `bbb` or `boxbox` anywhere except inputs/textareas (ignored while a clip is already playing; no back-to-back repeats of the same file)
- **Mobile / touch** — Triple-tap anywhere within 800ms

Playback volume is normalized against a reference clip (`stupid.mp3` in [`lib/radio-samples.constants.ts`](lib/radio-samples.constants.ts)). If the radio folder is missing or empty, a small hard-coded fallback list is used instead.

### Metadata and styling

- Site metadata: [`app/layout.tsx`](app/layout.tsx)
- Global styles (ghost section headings, album animations): [`app/globals.css`](app/globals.css)
- Tailwind theme: [`tailwind.config.ts`](tailwind.config.ts)

## Key UX and accessibility

- **Hero** — Click or activate the name for a scatter/reassemble animation; desktop pointer “magnet” on letters
- **Home intro** — Sections reveal after the hero tagline animation (`HomeIntroGateProvider`)
- **Smooth scroll** — Lenis site-wide
- **Ghost headings** — Large section titles use stroke outlines (`.heading-ghost`) for contrast on black; mobile sizes are clamped so long titles (e.g. EXPERIENCE) do not overflow the viewport
- **Skip link** — “Skip to content” in the root layout targets `#main-content`
- **Focus** — Visible focus rings on interactive controls; section headings on the home page are keyboard-focusable where needed
- **Reduced motion** — `prefers-reduced-motion` disables or simplifies animations (hero, album titles, photos header flash)
- **Photos header** — `TANISHTAKESPICS` camera-flash effect on click; outline stays visible during the animation
- **Quotes** — Each quote carries an `aria-label` of its text and author (visual text is `aria-hidden`); the cloud fades/scales in with a tiered stagger, replaced by an instant render under reduced motion; quote text is non-selectable like the page headings
- **Modals** — Surprise overlay and mobile nav use `inert` on main/header while open
- **Logo** — Scrolls to document top via `#top` anchor at the start of `<body>`

## Deployment

Configured for [Vercel](https://vercel.com) with default Next.js settings:

```bash
npm run build
```

Connect the GitHub repository and deploy; image optimization uses AVIF/WebP with long cache TTL (see `next.config.ts`).

## Acknowledgments

Visual design inspired by [Lakshya Chaudhry](https://www.laksh.us).

## License

This project is licensed under the [MIT License](LICENSE).

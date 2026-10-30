# Tanish Misra's Portfolio

Personal portfolio, photography site and blog at [tanishmisra.com](https://tanishmisra.com), built with Next.js, TypeScript and Tailwind CSS. The home page is a motion-heavy resume-style experience; `/photos` is a gallery with curated collections, per-album interactions and light sound design; `/blog` is a markdown blog; `/quotes` is a generative typographic quote cloud that arranges itself differently on every visit.

All content lives in a database and is edited through a built-in, password-protected admin panel (`/admin`) — there is no content to edit in the code.

## Overview

- **Home (`/`)** — Hero, experience, education, skills, certifications, projects, and about/contact
- **Photos (`/photos`)** — Collection grid, interactive header, and a “Surprise me!” random photo overlay
- **Album pages (`/photos/[slug]`)** — One page per collection, each with its own title interaction
- **Blog (`/blog`, `/blog/[slug]`)** — Markdown posts with images, rendered with a scroll-reveal
- **Quotes (`/quotes`)** — A skyline-packed mosaic on desktop (different fonts, sizes and arrangement every visit) and a clean vertical stack on mobile
- **Admin (`/admin`)** — Draft → Publish CMS for everything above, plus the radio easter egg
- **Box Box easter egg** — F1 team-radio clips on any page (desktop: type a trigger word such as `bbb` or `boxbox`; mobile: triple-tap within 800ms)
- **Super Max easter egg** — Clicking any Max Verstappen quote on `/quotes` jumps to the Super Max photo album
- **Light/dark theme** — Dark by default, with a toggle in the header

## Routes

| Route | Description |
| --- | --- |
| `/` | Portfolio home |
| `/photos` | Photography index (Super Max pinned first) |
| `/photos/[slug]` | Album pages (see collections below) |
| `/blog` | Post index |
| `/blog/[slug]` | A single post |
| `/quotes` | Generative typographic quote cloud |
| `/admin/login` | Admin sign-in |
| `/admin` | Admin dashboard → Portfolio, Photos, Quotes, Blog, Radio |

## How content works

```text
 /admin (you edit drafts)  ──►  draft tables (Postgres)
                                      │  click "Publish"
                                      ▼
                          published_snapshot (one JSON row)
                                      │  read by
                                      ▼
                       public pages (/, /photos, /blog, /quotes)
```

- **Drafts and Publish.** Edits in the admin are saved as drafts. Nothing reaches the public site until you click **Publish**, which assembles all drafts into a single snapshot (`lib/admin/publish.ts`) that the public pages read (`lib/site-content.ts`). The header button reads **Up to date** when drafts match what's live and is disabled until you change something.
- **Where things are stored.** Text and structure live in Postgres (Neon, via Drizzle — `db/schema.ts`). Files — photos, blog images, radio clips, the resume — live in Vercel Blob; the database only stores their URLs. Small fixed design assets (fonts, favicons, three UI sounds) stay in `public/`.
- **Radio follows the same rule.** Radio clips and trigger words are drafts too; the radio page outlines anything not yet live with a "New" tag.
- **Uploads go straight to Blob** from the browser (`app/api/admin/blob-upload`, `lib/admin/client-upload.ts`) so large photos aren't limited by Vercel's 4.5MB request-body cap.

## Photography collections

Collections are managed at `/admin/photos`. A few have code-driven title interactions, keyed by slug (`components/photos/album-title.tsx`):

| Slug | Title | Notes |
| --- | --- | --- |
| `super-max` | Super Max | Pinned first on `/photos`; excluded from Surprise me; click title → branded flyby |
| `campus` | Purdue grounds | |
| `snowfall` | Snowfall | Click title → snow burst |
| `uk-2025` | UK | Click title → flag color sweep |
| `new-york` | New York | Custom I ♥ NY title crossfade |
| `smokies` | The Smokies | Click title → fog canvas |
| `new-year` | New Year | Click title → fireworks |
| `standalone` | Standalones | |

**Surprise me** on `/photos` draws from every collection except `super-max` (`lib/random-photo-candidates.ts`).

## Tech stack

- Next.js 15 (App Router) · React 19 · TypeScript
- Postgres ([Neon](https://neon.tech)) with Drizzle ORM · [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- Auth: `iron-session` cookie sessions + `bcryptjs` password hash
- Tailwind CSS 3 · PostCSS · Autoprefixer · `next-themes`
- Framer Motion · Lucide React
- `react-markdown` + `remark-gfm` (blog and bio rendering)
- OpenAI (`gpt-4.1-nano`, optional) for suggested photo alt text
- ESLint 9 · `@vercel/analytics` · `@vercel/speed-insights`

## Project structure

```text
Portfolio/
├── app/
│   ├── layout.tsx          # Root layout, theme provider, skip link, site chrome, analytics
│   ├── page.tsx            # Home page sections
│   ├── globals.css         # Theme tokens, ghost headings, album title animations
│   ├── admin/              # Admin panel: login + protected (portfolio, photos, quotes, blog, radio)
│   ├── api/admin/          # Blob client-upload token route
│   ├── photos/             # Index + [slug] album pages
│   ├── blog/               # Index + [slug] post pages
│   ├── quotes/             # Quote cloud page, route-scoped fonts
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── admin/              # Editors: array/entry lists, bio, certifications, social, uploaders…
│   ├── easter-eggs/        # Box Box radio keystroke + triple-tap listener
│   ├── hero/               # Scatter name, hero motion
│   ├── photos/             # Album UI, title canvases (snow, fog, fireworks), header flash
│   ├── quotes/             # quote-cloud.tsx — generative cloud, packing, tooltip
│   ├── sections/           # Home content sections
│   ├── blog/               # Blog index motion
│   ├── site-header.tsx     # Nav, scroll spy, mobile menu
│   └── …                   # Theme toggle, scroll-reveal, tooltip, markdown, intro gate
├── db/                     # Drizzle schema + client
├── lib/
│   ├── admin/              # Server actions, publish (draft → snapshot), Blob helpers, client upload
│   ├── auth/               # Session + login
│   ├── site-content.ts     # Reads the published snapshot (the public pages' only data source)
│   ├── radio-samples.ts    # Radio clips from the published snapshot (+ local fallback)
│   ├── radio-triggers.ts   # Trigger words from the published snapshot
│   └── …                   # Motion timing, slugs, image helpers
├── public/
│   ├── fonts/              # YD Gothic, ITC American Typewriter
│   └── sfx/                # camera.mp3, passby.mp3, pitstop.mp3, radio/ (4-clip fallback)
├── scripts/                # check-colors.mjs, hash-password.mjs
├── middleware.ts           # Gates /admin/*
├── types/content.ts        # Shared content types
├── drizzle.config.ts
├── next.config.ts          # Image optimization + Blob remote patterns
└── tailwind.config.ts
```

## Getting started

### Prerequisites

- Node.js 18.18 or newer
- npm
- A Postgres database (Neon) and a Vercel Blob store

### Install

```bash
git clone https://github.com/tanishmisra9/portfolio.git
cd portfolio
npm install
```

### Environment variables

Copy `.env.example` to `.env` and fill it in:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token |
| `SESSION_SECRET` | Session encryption key, **at least 32 characters** (`openssl rand -base64 32`) |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password (see below) |
| `OPENAI_API_KEY` | *Optional.* Powers the AI alt-text suggestion in the photo uploader; without it everything still works |

Generate the password hash with:

```bash
npm run admin:hash-password -- "your password"
```

> **`$` escaping.** The script prints the hash with every `$` escaped as `\$`, because Next.js expands `$VAR` in `.env` files. Paste it into `.env` exactly as printed. In **Vercel's** environment-variable UI (which stores values verbatim) paste the **unescaped** form — `$2b$12$…` with no backslashes.

### Set up the database

```bash
npm run db:push     # creates the tables from db/schema.ts
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On a fresh database, sign in at `/admin/login`, add some content and click **Publish** — the public pages read the published snapshot and show an error until the first publish.

To test on other devices on the same network:

```bash
npm run dev:lan
```

### Production build

```bash
npm run build
npm run start
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `dev:lan` | Dev server (`dev:lan` is reachable from other devices) |
| `npm run build` / `start` | Production build / server |
| `npm run lint` | ESLint |
| `npm run check:colors` | Regression check for the light/dark color tokens — run before commits that touch colors |
| `npm run db:push` | Apply `db/schema.ts` to the database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run admin:hash-password` | Generate an admin password hash |
| `npm run clean` | Remove `.next` |

## The admin panel

Sign in at `/admin/login`. Sessions last 12 hours and are enforced both by middleware and inside every server action. Edits are drafts until you **Publish**; a red dot and an “unsaved changes” link flag anything on the page you haven't saved yet.

| Section | What you can do |
| --- | --- |
| **Portfolio** | Hero (two-line subtitle), bio (rich text), experience, education, skills, certifications (including course series), projects (reorder by drag or arrow keys; hide/show with the eye toggle), and social links. Upload a resume PDF here. |
| **Photos** | Create and reorder collections; per collection edit the title/description, upload photos (with upload progress), reorder, and edit alt text and captions. |
| **Quotes** | Add and edit quotes, set each one's size (Standard / Large / Featured), and filter by author. |
| **Blog** | Write posts in markdown, upload images into a post, or drop in an existing `.md` file (its frontmatter and image references are matched against uploaded images). |
| **Radio** | Upload/remove clips (audio only) and add/edit/delete the keystroke trigger words. Goes live on Publish. |

**AI alt text.** When you add photos, each new one gets a suggested alt text from a small OpenAI vision model, styled after the alts already on the site. You can edit it freely; **Reset to suggestion** restores the original without another API call. If the key is missing or the call fails, the reason is shown next to the field and uploads are unaffected.

## Content details

### Quotes

Each quote is `{ text, attribution?, size }` — size (1–3) biases the layout tier: Featured quotes can take the single hero spot, Standard ones skew smaller. Everything else is generated client-side in [`components/quotes/quote-cloud.tsx`](components/quotes/quote-cloud.tsx) on each load, so the same data renders a fresh layout every visit:

- **Desktop** — A greedy skyline bin-packer lays quotes into an interlocking, overlap-free mosaic with sizes intermixed top-to-bottom. Typography is a two-face system (Playfair Display serif, leading; Inter sans, lighter accent) and a two-value colour scheme (bright white / dark grey) spread so neighbours alternate. Quotes by the same author are pushed apart. Hovering a quote shows its author in a cursor-following, liquid-glass tooltip.
- **Mobile** — A single vertical stack with the author beneath each quote, revealed on scroll.

Size tiers, colours, gutter and reveal timing are tunable constants at the top of `quote-cloud.tsx` and in [`lib/quotes-motion.ts`](lib/quotes-motion.ts). The route-scoped serif loads via [`app/quotes/fonts.ts`](app/quotes/fonts.ts).

### Box Box radio easter egg

[`components/easter-eggs/radio-keystroke-listener.tsx`](components/easter-eggs/radio-keystroke-listener.tsx) is mounted in the root layout and plays a random clip:

- **Desktop** — Type any trigger word (default `bbb` or `boxbox`; editable at `/admin/radio`) anywhere except inputs/textareas. It's ignored while a clip is already playing, and the same clip never plays twice in a row.
- **Mobile / touch** — Triple-tap anywhere within 800ms.

Clips are uploaded to Vercel Blob and go live on Publish (read from the published snapshot by [`lib/radio-samples.ts`](lib/radio-samples.ts)); if none are published, a 4-clip fallback in [`public/sfx/radio/`](public/sfx/radio/) is used. Playback volume is normalized against a reference clip (`stupid.mp3`, see [`lib/radio-samples.constants.ts`](lib/radio-samples.constants.ts)).

### Metadata and styling

- Site metadata: [`app/layout.tsx`](app/layout.tsx)
- Global styles and theme tokens: [`app/globals.css`](app/globals.css)
- Tailwind theme: [`tailwind.config.ts`](tailwind.config.ts)

## Key UX and accessibility

- **Hero** — Click or activate the name for a scatter/reassemble animation; desktop pointer “magnet” on letters
- **Home intro** — Sections reveal after the hero tagline animation (`HomeIntroGateProvider`)
- **Scrolling** — Native browser scrolling; sections reveal on scroll via `ScrollReveal`
- **Ghost headings** — Large section titles use stroke outlines (`.heading-ghost`) for contrast; mobile sizes are clamped so long titles don't overflow the viewport
- **Skip link** — “Skip to content” in the root layout targets `#main-content`
- **Focus** — Visible focus rings on interactive controls; section headings on the home page are keyboard-focusable where needed
- **Reduced motion** — `prefers-reduced-motion` disables or simplifies animations (hero, album titles, photos header flash, quote cloud)
- **Photos header** — `TANISHTAKESPICS` camera-flash effect on click
- **Quotes** — Each quote carries an `aria-label` of its text and author (the visual text is `aria-hidden`); the cloud fades/scales in with a tiered stagger
- **Modals** — The Surprise overlay and mobile nav use `inert` on the rest of the page while open
- **Logo** — Scrolls to the top via a `#top` anchor at the start of `<body>`

## Deployment

Deployed on [Vercel](https://vercel.com) from the `main` branch with default Next.js settings; image optimization uses AVIF/WebP with a long cache TTL, and Blob-hosted images are allow-listed in `next.config.ts`.

Things that are easy to miss:

- **Every environment variable must be set in Vercel (Production)**, not just locally — the values in `.env` aren't deployed. A missing `SESSION_SECRET` breaks login; a missing `DATABASE_URL` breaks the public pages.
- **After adding or changing a variable, redeploy** (Deployments → Redeploy). A change only applies to the next build, not the deployment already serving traffic.
- Keep `OPENAI_API_KEY` server-only (never a `NEXT_PUBLIC_` variable).
- Content changes in the admin don't need a deploy — they go live on **Publish**.

## Acknowledgments

Visual design inspired by [Lakshya Chaudhry](https://www.laksh.us).

## License

This project is licensed under the [MIT License](LICENSE).

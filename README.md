# Personal Portfolio

A portfolio built with Next.js, TypeScript, and Tailwind CSS. Dark-only layout with smooth scrolling, Framer Motion animations, and a photography section with interactive per-album title effects.

## Features

- Dark theme
- Responsive layout
- Smooth scroll via Lenis
- Hero typography with scatter/reassemble name animation (Framer Motion)
- Scroll-reveal entrance animations gated behind hero intro completion
- Sections for experience, education, skills + certifications, projects, and about/contact
- Photography section (`/photos`) with nine curated collections
- Per-album interactive title effects: F1 car flyby (Super Max), snowfall burst, fog roll, fireworks canvas, UK flag sweep, and NYC skyline letter morph
- Audio SFX on interactive album titles (preloaded per-route)
- Vercel Analytics
- Content driven from typed data files

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS 3
- **Motion**: Framer Motion
- **Scroll**: Lenis
- **Icons**: Lucide React
- **Analytics**: Vercel Analytics
- **Deployment**: Vercel

## Project Structure

```
Portfolio/
├── app/
│   ├── globals.css
│   ├── icon.svg
│   ├── layout.tsx
│   ├── page.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   └── photos/
│       ├── layout.tsx
│       ├── page.tsx
│       └── [slug]/
│           └── page.tsx
├── components/
│   ├── hero/
│   │   ├── hero.tsx
│   │   ├── hero-name-motion.tsx
│   │   └── scatter-name.tsx
│   ├── photos/
│   │   ├── album-title.tsx
│   │   ├── firework-canvas.tsx
│   │   ├── fog-canvas.tsx
│   │   ├── photo-album-motion.tsx
│   │   ├── photos-header.tsx
│   │   ├── photos-index-motion.tsx
│   │   └── snowfall-canvas.tsx
│   ├── sections/
│   │   ├── about-contact-section.tsx
│   │   ├── education-section.tsx
│   │   ├── experience-section.tsx
│   │   ├── projects-section.tsx
│   │   └── skills-section.tsx
│   ├── home-intro-gate.tsx
│   ├── scroll-reveal.tsx
│   ├── site-header.tsx
│   └── smooth-scroll.tsx
├── data/
│   ├── photos.ts
│   └── portfolio.ts
├── lib/
│   ├── photos-motion.ts
│   └── site-motion.ts
├── public/
│   ├── fonts/
│   │   └── yd-gothic-130.woff2
│   ├── photos/
│   └── *.mp3
├── types/
│   └── content.ts
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/tanishmisra9/portfolio.git
cd portfolio
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To expose the dev server on your local network (e.g. for mobile testing):

```bash
npm run dev:lan
```

### Production

```bash
npm run build
npm run start
```

### Other scripts

```bash
npm run lint      # ESLint
npm run clean     # remove .next (useful after odd dev/build cache issues)
```

## Customization

### Portfolio content

Edit `data/portfolio.ts`. Shape is defined by `PortfolioContent` in `types/content.ts` (`experience`, `education`, `skills`, `certifications`, `projects`, `aboutBio`, `social`, hero copy).

### Photography content

Edit `data/photos.ts`. Each entry in `collections` is a `PhotoCollection` with a `slug`, `title`, `description`, `coverImage`, and `photos` array. The slug also determines which interactive title effect fires — see `components/photos/album-title.tsx` for the effect map.

### Site metadata

Edit `app/layout.tsx` (`metadata.title`, `metadata.description`).

### Theme and typography

Global styles: `app/globals.css`. Tailwind theme extensions: `tailwind.config.ts`. Fonts are loaded in `layout.tsx` (Inter, Space Mono) and via `@font-face` in `globals.css` (YD Gothic 130 — display font used on photo album titles).

## Sections

### Portfolio (`/`)

1. **Hero** — Name with scatter/reassemble animation, subtitle
2. **Experience** — Roles and tags
3. **Education** — Institutions and coursework
4. **Skills** — Grouped skill lists and certifications
5. **Projects** — Descriptions and tech stacks
6. **About** — Bio and social links

### Photography (`/photos`)

Index grid of all collections; each card links to `/photos/[slug]`.

Current collections: Purdue grounds · Snowfall · UK · New York · The Smokies · Winter Holidays · New Year · Standalones · Super Max

## Deployment

Connect the GitHub repo to Vercel and deploy with default Next.js settings. Set the production branch (e.g. `main`) in the project settings. For a custom domain, add it under Project → Domains and apply the DNS records Vercel shows.

## License

This project is licensed under the [MIT License](LICENSE).

## Author

**Tanish Misra**

- GitHub: [@tanishmisra9](https://github.com/tanishmisra9)
- LinkedIn: [tanish-misra](https://linkedin.com/in/tanish-misra)
- Site: [tanishmisra.com](https://tanishmisra.com)

## Inspiration

Layout influenced by [Lakshya Chaudhry](https://www.laksh.us)'s portfolio work.

## Acknowledgments

- [Lucide](https://lucide.dev)
- [Framer Motion](https://www.framer.com/motion)
- [Lenis](https://lenis.darkroom.engineering)
- [Vercel Analytics](https://vercel.com/analytics)

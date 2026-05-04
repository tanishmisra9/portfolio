# Tanish Misra Portfolio

Personal portfolio and photography site built with Next.js, TypeScript, and Tailwind CSS. The project combines a dark, motion-heavy portfolio experience with a separate photography section featuring custom album interactions, route-specific effects, and sound design.

## Overview

- App Router portfolio site built with Next.js 15, React 19, and TypeScript
- Dark-first visual system with smooth scrolling and animated section reveals
- Content-driven home page for experience, education, skills, certifications, projects, and contact details
- Dedicated `/photos` experience with curated collections and custom per-album interactions
- Route-specific visual and audio effects for selected photo collections
- Vercel Analytics integration for production usage tracking

## Current Content

The site currently reflects:

- Purdue CS coursework and campus involvement
- Experience spanning Toyota Connected Technologies, Purdue Electric Racing, The Data Mine, Purdue Electric Vehicle Club, and prior analytics/internship work
- Projects across AI, ML, data systems, and software engineering
- 9 live photography collections:
  `campus`, `snowfall`, `uk-2025`, `new-york`, `smokies`, `holidays-2025`, `new-year`, `standalone`, plus the dedicated `super-max` collection

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 3
- Framer Motion
- Lenis
- Lucide React
- Vercel Analytics

## Project Structure

```text
Portfolio/
├── app/                    # App Router entrypoints, layouts, error states
├── components/
│   ├── hero/               # Landing page hero animations
│   ├── photos/             # Photo album UI and interactive effects
│   └── sections/           # Home page content sections
├── data/
│   ├── portfolio.ts        # Resume-style content for the home page
│   └── photos.ts           # Photo collection metadata and image lists
├── lib/                    # Motion configs and shared helpers
├── public/
│   ├── fonts/              # Local display fonts
│   ├── photos/             # Photography assets
│   └── sfx/                # Audio used by interactive photo titles
├── types/                  # Shared TypeScript content types
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

## Getting Started

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

## Editing Content

### Portfolio content

Update [data/portfolio.ts](/Users/tanishmisra/Code/Portfolio/data/portfolio.ts) to edit:

- hero copy
- experience
- education
- skills and certifications
- projects
- about/contact details

The shared content shape lives in [types/content.ts](/Users/tanishmisra/Code/Portfolio/types/content.ts).

### Photography content

Update [data/photos.ts](/Users/tanishmisra/Code/Portfolio/data/photos.ts) to edit:

- collection titles and descriptions
- cover images
- photo ordering
- captions and alt text
- per-photo duet layouts

Album-specific title effects are wired through the photo components in [components/photos](/Users/tanishmisra/Code/Portfolio/components/photos).

### Metadata and styling

- Site metadata: [app/layout.tsx](/Users/tanishmisra/Code/Portfolio/app/layout.tsx)
- Global styles: [app/globals.css](/Users/tanishmisra/Code/Portfolio/app/globals.css)
- Tailwind theme: [tailwind.config.ts](/Users/tanishmisra/Code/Portfolio/tailwind.config.ts)

## Key UX Details

- Scatter/reassemble hero name animation on the landing page
- Intro-gated reveal behavior for the main homepage sections
- Smooth scrolling across the site with Lenis
- Interactive photo album titles with custom motion and canvas effects
- Audio cues for selected photography interactions

## Deployment

The site is set up for deployment on Vercel. A standard Next.js deployment works out of the box:

```bash
npm run build
```

Then connect the repository to Vercel and deploy with the default framework settings.

## License

This project is licensed under the [MIT License](LICENSE).

# Personal Portfolio

A single-page portfolio built with Next.js, TypeScript, and Tailwind CSS. Dark-first layout with light/dark toggle, smooth scrolling, and Framer Motion on the hero.

## Features

- Dark and light themes with persistent preference
- Responsive layout
- Smooth scroll via Lenis
- Hero typography with interactive motion (Framer Motion)
- Sections for experience, education, skills, certifications, projects, and about/contact
- Content driven from one typed data file

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS 3
- **Motion**: Framer Motion
- **Scroll**: Lenis
- **Icons**: Lucide React
- **Deployment**: Vercel

## Project Structure

```
Portfolio/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── hero/
│   ├── sections/
│   ├── page-enter.tsx
│   ├── site-header.tsx
│   ├── smooth-scroll.tsx
│   └── theme-toggle.tsx
├── data/
│   └── portfolio.ts
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

### Content

Edit `data/portfolio.ts`. Shape is defined by `PortfolioContent` in `types/content.ts` (`experience`, `education`, `skills`, `certifications`, `projects`, `aboutBio`, `social`, hero copy).

### Site metadata

Edit `app/layout.tsx` (`metadata.title`, `metadata.description`).

### Theme and typography

Global styles: `app/globals.css`. Tailwind theme extensions: `tailwind.config.ts`. Fonts are loaded in `layout.tsx` (Inter, Space Mono).

## Sections

1. **Hero** — Name, subtitle, motion treatment
2. **Experience** — Roles and tags
3. **Education** — Institutions and coursework
4. **Skills** — Grouped skill lists
5. **Certifications** — Links to credentials
6. **Projects** — Descriptions and tech stacks
7. **About** — Bio and social links

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

Layout and README structure influenced by [Lakshya Chaudhry](https://www.laksh.us)’s portfolio work.

## Acknowledgments

- [Lucide](https://lucide.dev)
- [Framer Motion](https://www.framer.com/motion)
- [Lenis](https://lenis.darkroom.engineering)

export const PILL_CLASSES =
  "rounded-none border border-border bg-surface px-3 py-1 text-muted select-none cursor-default";

export const GLASS_BUTTON_CLASSES =
  "group relative inline-flex items-center justify-center rounded-none border border-border-strong bg-fg/[0.06] px-6 py-3 font-sans text-xs uppercase tracking-[0.2em] text-fg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_10px_30px_-12px_rgba(0,0,0,0.6)] transition-[border-color,background-color,transform] duration-300 hover:-translate-y-[1px] hover:border-fg/30 hover:bg-fg/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

export const GLASS_BUTTON_SHEEN_CLASSES =
  "pointer-events-none absolute inset-0 rounded-none opacity-0 transition-opacity duration-300 group-hover:opacity-100";

export const GLASS_BUTTON_SHEEN_BACKGROUND =
  "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.13) 0%, transparent 70%)";

export const SECTION_HEADING_BASE =
  "select-none font-display font-extrabold tracking-tight text-fg text-5xl/[1.4] md:text-6xl/[1.4] lg:text-7xl/[1.4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

export const SECTION_HEADING_CLASSES = `${SECTION_HEADING_BASE} mb-3 md:mb-5`;

/** Top-of-page titles (Photos, Blog, Quotes, F1): same solid style as the section headings, one step larger and centered. */
export const PAGE_TITLE_CLASSES =
  "select-none text-center font-display font-extrabold leading-[1.4] tracking-tight text-fg text-[clamp(1.75rem,9vw,6rem)]";

/**
 * Title + subtitle for content pages (blog posts, photo albums): left-aligned, title case, one scale. No text colour
 * on the title: album titles swap colour classes for their effects (uk-flag-fly, .supermax-title phases), so plain
 * titles add `text-fg` themselves. Tight leading (1.15) keeps multi-line titles compact, and `pb-[0.2em]` gives the last line's descenders (g/p/y) room when something clips to the box (filter animations, Safari); written `text-3xl/[1.15]` on every breakpoint because a bare `md:text-4xl` resets line-height. (Section headings stay at 1.4: single line, no padding trick needed.) */
export const CONTENT_TITLE_CLASSES =
  "select-none pb-[0.2em] font-display font-extrabold tracking-tight text-3xl/[1.15] md:text-4xl/[1.15] lg:text-5xl/[1.15]";
export const CONTENT_SUBTITLE_CLASSES = "mt-4 max-w-3xl text-lg text-muted md:text-xl";

/**
 * Admin-only: same type system as the public headings (font-display, extrabold) but at working
 * scale (Title case, solid fill), for dense forms you're editing quickly.
 */
export const ADMIN_SECTION_HEADING_CLASSES =
  "font-display text-2xl/[1.4] font-extrabold tracking-tight text-fg md:text-3xl/[1.4]";

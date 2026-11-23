export const PILL_CLASSES =
  "rounded-none border border-border bg-surface backdrop-blur-md px-3 py-1 text-muted select-none cursor-default";

export const GLASS_BUTTON_CLASSES =
  "group relative inline-flex items-center justify-center rounded-none border border-border-strong bg-fg/[0.06] px-6 py-3 font-sans text-xs uppercase tracking-[0.2em] text-fg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_10px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-[border-color,background-color,transform] duration-300 hover:-translate-y-[1px] hover:border-fg/30 hover:bg-fg/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

export const GLASS_BUTTON_SHEEN_CLASSES =
  "pointer-events-none absolute inset-0 rounded-none opacity-0 transition-opacity duration-300 group-hover:opacity-100";

export const GLASS_BUTTON_SHEEN_BACKGROUND =
  "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.13) 0%, transparent 70%)";

export const SECTION_HEADING_BASE =
  "select-none font-display font-extrabold leading-none tracking-tighter text-fg text-5xl md:text-6xl lg:text-7xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

export const SECTION_HEADING_CLASSES = `${SECTION_HEADING_BASE} mb-8 md:mb-12`;

/** Top-of-page titles (Photos, Blog, Quotes, F1): same solid style as the section headings, one step larger and centered. */
export const PAGE_TITLE_CLASSES =
  "select-none text-center font-display font-extrabold leading-none tracking-tighter text-fg text-[clamp(2.25rem,9vw,6rem)]";

/**
 * Admin-only: same type system as the public ghost headings (font-display, extrabold,
 * uppercase) but at working scale with a solid fill — the public site's outline-stroke
 * treatment is built for showcase content, not dense forms you're editing quickly.
 */
export const ADMIN_SECTION_HEADING_CLASSES =
  "font-display text-2xl font-extrabold uppercase tracking-tight text-fg md:text-3xl";

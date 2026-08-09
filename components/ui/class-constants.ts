export const PILL_CLASSES =
  "rounded-full border border-border bg-surface backdrop-blur-md px-3 py-1 text-muted select-none cursor-default";

export const GLASS_BUTTON_CLASSES =
  "group relative inline-flex items-center justify-center rounded-full border border-border-strong bg-fg/[0.06] px-6 py-3 font-sans text-xs uppercase tracking-[0.2em] text-fg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_10px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-[border-color,background-color,transform] duration-300 hover:-translate-y-[1px] hover:border-fg/30 hover:bg-fg/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

export const GLASS_BUTTON_SHEEN_CLASSES =
  "pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100";

export const GLASS_BUTTON_SHEEN_BACKGROUND =
  "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.13) 0%, transparent 70%)";

export const SECTION_GHOST_HEADING_BASE =
  "section-ghost-heading w-full select-none text-center font-display font-extrabold uppercase leading-none heading-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 md:text-left";

export const SECTION_GHOST_HEADING_CLASSES = `${SECTION_GHOST_HEADING_BASE} mb-8 md:mb-12`;

/** Certifications — no mobile bleed; uses section-ghost-heading-long in globals.css */
export const CERTIFICATIONS_GHOST_HEADING_CLASSES =
  "section-ghost-heading-long select-none text-center font-display font-extrabold uppercase leading-none heading-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 md:text-left";

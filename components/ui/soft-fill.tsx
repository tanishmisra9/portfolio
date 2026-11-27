/**
 * The site's hover for content (cards, entries, skill groups): a soft grey fill rises from the bottom edge. It's
 * HoverFill's rise (components/ui/hover-fill.tsx) at low contrast: fg at 7%, so dark grey in dark mode and light grey
 * in light. Text does not invert; muted text brightens to fg. The full-contrast inverted fill stays for buttons and links.
 *
 * Usage: put SOFT_FILL_GROUP on the container (it must clip its own corners: rounded containers keep their radius) and
 * <SoftFill /> as its first child; add SOFT_BRIGHTEN to muted text that should brighten. Keyboard focus inside the
 * container raises it too. `hover:` only applies on hover-capable devices (hoverOnlyWhenSupported), so a tap on a phone
 * never leaves it stuck. A plain module (no "use client"), so server components can use it.
 */
export const SOFT_FILL_GROUP = "group/soft relative isolate overflow-hidden";

/** Add next to `text-muted` / `text-dim` on text that should brighten with the fill. */
export const SOFT_BRIGHTEN =
  "transition-colors duration-200 group-hover/soft:text-fg group-has-[:focus-visible]/soft:text-fg";

export function SoftFill() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 origin-bottom scale-y-0 bg-fg/[0.07] transition-transform duration-300 ease-out group-hover/soft:scale-y-100 group-has-[:focus-visible]/soft:scale-y-100 motion-reduce:transition-none"
    />
  );
}

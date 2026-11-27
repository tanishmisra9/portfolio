/**
 * Shared look of an Experience / Education entry (a plain module, so the server-rendered Education section can use it).
 * - Mouse: hovering an entry raises a soft grey fill from its bottom edge, the HoverFill rise (components/ui/hover-fill.tsx)
 *   at low contrast: fg at 7%, so dark grey in dark mode and light grey in light. The text does not invert (the
 *   full-contrast inverted fill is for buttons and links only). `hover:` only applies on hover-capable devices
 *   (hoverOnlyWhenSupported), so phones never see it.
 * - Touch: the reading light (SpotlightList) dims every entry but the one in the middle of the screen and hides its tags.
 * -mx-6 + p-6 give the fill room around the text without moving it; the list has no gap, the padding is the spacing.
 */
export const ENTRY_ITEM =
  "group/entry relative isolate -mx-6 overflow-hidden p-6 transition-opacity duration-500 ease-out data-[dim]:opacity-30";
export const ENTRY_TAGS = "transition-opacity duration-500 ease-out group-data-[dim]/entry:opacity-0";
/** Muted text that brightens to fg on hover (date, role, credential). */
export const ENTRY_MUTED = "text-muted transition-colors duration-200 group-hover/entry:text-fg";

/** The rising grey fill; first child of each entry. */
export function EntryFill() {
  return (
    <span
      aria-hidden
      className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-fg/[0.07] transition-transform duration-300 ease-out group-hover/entry:scale-y-100 motion-reduce:transition-none"
    />
  );
}

import { SOFT_BRIGHTEN, SOFT_FILL_GROUP } from "@/components/ui/soft-fill";

/**
 * Shared look of an Experience / Education entry (a plain module, so the server-rendered Education section can use it).
 * - Mouse: the site's content hover, SoftFill (components/ui/soft-fill.tsx); date and role brighten.
 * - Touch: the reading light (SpotlightList) dims every entry but the one in the middle of the screen and hides its tags.
 * -mx-6 + p-6 give the fill room around the text without moving it; the list has no gap, the padding is the spacing.
 */
export const ENTRY_ITEM = `${SOFT_FILL_GROUP} -mx-6 p-6 transition-opacity duration-500 ease-out data-[dim]:opacity-30`;
export const ENTRY_TAGS = "transition-opacity duration-500 ease-out group-data-[dim]/soft:opacity-0";
/** Muted text that brightens to fg on hover (date, role, credential). */
export const ENTRY_MUTED = `text-muted ${SOFT_BRIGHTEN}`;

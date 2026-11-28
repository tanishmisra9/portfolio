import type { Variants } from "framer-motion";

const photosSlideEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

const PHOTOS_ITEM_DURATION_S = 0.38;

/** Stagger between sibling photo rows / index cards (seconds). */
export const PHOTOS_ENTRANCE_STAGGER_S = 0.065;

export function photosEntranceVariants(reduceMotion: boolean | null): {
  root: Variants;
  item: Variants;
  /** Slide-in row that also staggers its direct children (e.g. album cards). */
  gridSection: Variants;
  /**
   * Third slot in `root` stagger: instant handoff so album rows can use `ScrollReveal` timing
   * without an `opacity: 0` wrapper over `next/image`.
   */
  albumGridSlot: Variants;
} {
  if (reduceMotion) {
    const instant: Variants = {
      hidden: { opacity: 1, x: 0 },
      show: {
        opacity: 1,
        x: 0,
        transition: { duration: 0 },
      },
    };
    return {
      root: {
        hidden: {},
        show: {
          transition: { staggerChildren: 0, delayChildren: 0 },
        },
      },
      item: instant,
      // Must animate x back to 0 too: the server can't know the preference and renders the offset `hidden` style,
      // which stays on the hydrated node unless something moves it.
      gridSection: instant,
      albumGridSlot: {
        hidden: {},
        show: {
          transition: { duration: 0 },
        },
      },
    };
  }

  const item: Variants = {
    hidden: { opacity: 0, x: -40 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        duration: PHOTOS_ITEM_DURATION_S,
        ease: photosSlideEase,
      },
    },
  };

  return {
    root: {
      hidden: {},
      show: {
        transition: {
          delayChildren: 0,
          staggerChildren: PHOTOS_ENTRANCE_STAGGER_S,
        },
      },
    },
    item,
    /**
     * Slide only (keep opacity 1): wrapping `opacity: 0` hid lazy `next/image` descendants until
     * Framer finished, so Safari/Chrome often never decoded them — blank album grids.
     */
    gridSection: {
      hidden: { opacity: 1, x: -40 },
      show: {
        opacity: 1,
        x: 0,
        transition: {
          duration: PHOTOS_ITEM_DURATION_S,
          ease: photosSlideEase,
          staggerChildren: PHOTOS_ENTRANCE_STAGGER_S,
          delayChildren: 0,
        },
      },
    },
    albumGridSlot: {
      hidden: {},
      show: {
        transition: { duration: 0 },
      },
    },
  };
}

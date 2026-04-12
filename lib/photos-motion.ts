import type { Variants } from "framer-motion";
import { SITE_HEADER_ENTER_DELAY_S } from "@/lib/site-motion";

export const photosSlideEase: [number, number, number, number] = [
  0.16, 1, 0.3, 1,
];

/** Slide + fade duration for each `item` under `root` (seconds). */
export const PHOTOS_ITEM_DURATION_S = 0.38;
const itemDuration = PHOTOS_ITEM_DURATION_S;
const stagger = 0.065;

/** Stagger between sibling photo rows / index cards (seconds). */
export const PHOTOS_ENTRANCE_STAGGER_S = stagger;

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
      gridSection: {
        hidden: {},
        show: {
          transition: { staggerChildren: 0, delayChildren: 0 },
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

  const item: Variants = {
    hidden: { opacity: 0, x: -40 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        duration: itemDuration,
        ease: photosSlideEase,
      },
    },
  };

  return {
    root: {
      hidden: {},
      show: {
        transition: {
          delayChildren: SITE_HEADER_ENTER_DELAY_S,
          staggerChildren: stagger,
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
          duration: itemDuration,
          ease: photosSlideEase,
          staggerChildren: stagger,
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

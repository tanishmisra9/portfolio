import type { Variants } from "framer-motion";
import { SITE_HEADER_ENTER_DELAY_S } from "@/lib/site-motion";

export const photosSlideEase: [number, number, number, number] = [
  0.16, 1, 0.3, 1,
];

const itemDuration = 0.38;
const stagger = 0.065;

export function photosEntranceVariants(reduceMotion: boolean | null): {
  root: Variants;
  item: Variants;
  /** Slide-in row that also staggers its direct children (e.g. album cards). */
  gridSection: Variants;
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
    };
  }

  /** Opacity 0→1 on rows that contain `<img>` can leave Safari showing a black tile (compositor); slide on `x` only. */
  const item: Variants = {
    hidden: { opacity: 1, x: -40 },
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
  };
}

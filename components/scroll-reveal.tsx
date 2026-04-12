"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { PHOTOS_ENTRANCE_STAGGER_S } from "@/lib/photos-motion";

type Props = {
  children: ReactNode;
  className?: string;
  /** "fade" for headers, "slide" for content items */
  variant?: "fade" | "slide";
  /** When true, skip motion (matches `useReducedMotion()`). */
  reducedMotion?: boolean;
  /**
   * Photo album row index (0-based). With `photoAlbumIntroComplete`, rows stay hidden until
   * headings finish, then each row uses `whileInView` (scroll-synced); the first eight indices
   * only add a short stagger when several rows share the first in-view tick.
   */
  photoAlbumStaggerIndex?: number;
  /**
   * `false` until the album title/description `item` entrance completes; then `true` so the
   * gallery never runs ahead of those headings.
   */
  photoAlbumIntroComplete?: boolean;
};

/** First rows only: small stagger when several share one in-view tick; deeper rows use 0. */
const ALBUM_INTRO_STAGGER_CAP = 8;

export function ScrollReveal({
  children,
  className,
  variant = "slide",
  reducedMotion = false,
  photoAlbumStaggerIndex,
  photoAlbumIntroComplete,
}: Props) {
  const slideEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
  /** Album rows: softer deceleration + a touch longer opacity for a silkier entrance. */
  const albumSlideEase: [number, number, number, number] = [0.2, 0.88, 0.34, 1];
  const albumSlideDistancePx = 56;

  const isAlbumRow = photoAlbumStaggerIndex !== undefined;
  const albumUsesIntroGate = isAlbumRow && photoAlbumIntroComplete !== undefined;
  const albumIntroDone = photoAlbumIntroComplete === true;
  const albumFrozen = albumUsesIntroGate && !albumIntroDone;
  const albumAfterIntro = albumUsesIntroGate && albumIntroDone;

  if (reducedMotion) {
    if (isAlbumRow) {
      return (
        <div
          className={className}
          style={
            photoAlbumIntroComplete === false
              ? { opacity: 0, pointerEvents: "none" }
              : undefined
          }
        >
          {children}
        </div>
      );
    }
    return <div className={className}>{children}</div>;
  }

  /**
   * Album: tighter viewport than before so rows below the fold wait for scroll; still px/% only
   * for Safari IntersectionObserver.
   */
  const albumScrollViewport = {
    once: true as const,
    margin: "10% 0px 18% 0px",
    amount: 0.15,
  };
  const homeViewport = { once: true as const, margin: "-80px" };

  const slideInitial =
    variant === "fade"
      ? { opacity: 0 }
      : isAlbumRow
        ? { opacity: 0, x: -albumSlideDistancePx }
        : { opacity: 0, x: -40 };
  const slideTarget =
    variant === "fade" ? { opacity: 1 } : { opacity: 1, x: 0 };

  const albumTransitionBase = {
    opacity: {
      duration: 0.58,
      ease: albumSlideEase,
    },
    x: {
      duration: 0.5,
      ease: albumSlideEase,
    },
  };

  /** Legacy: stagger index set without intro gate (should not happen from album page). */
  const legacyAlbumDelayS =
    isAlbumRow &&
    !albumUsesIntroGate &&
    photoAlbumStaggerIndex !== undefined &&
    photoAlbumStaggerIndex < ALBUM_INTRO_STAGGER_CAP
      ? photoAlbumStaggerIndex * PHOTOS_ENTRANCE_STAGGER_S
      : undefined;

  /** When several top rows share one in-view tick after intro, stagger only those; deeper rows use 0. */
  const albumInViewStaggerS =
    albumAfterIntro &&
    photoAlbumStaggerIndex !== undefined &&
    photoAlbumStaggerIndex < ALBUM_INTRO_STAGGER_CAP
      ? photoAlbumStaggerIndex * PHOTOS_ENTRANCE_STAGGER_S
      : 0;

  if (albumFrozen) {
    return (
      <motion.div
        className={className}
        initial={slideInitial}
        animate={slideInitial}
        transition={{ duration: 0 }}
      >
        {children}
      </motion.div>
    );
  }

  if (albumAfterIntro) {
    return (
      <motion.div
        className={className}
        initial={slideInitial}
        whileInView={slideTarget}
        viewport={albumScrollViewport}
        transition={{
          ...albumTransitionBase,
          ...(albumInViewStaggerS > 0 ? { delay: albumInViewStaggerS } : {}),
        }}
      >
        {children}
      </motion.div>
    );
  }

  const transition = isAlbumRow
    ? {
        ...albumTransitionBase,
        ...(legacyAlbumDelayS !== undefined ? { delay: legacyAlbumDelayS } : {}),
      }
    : {
        duration: 0.5,
        ease: slideEase,
      };

  return (
    <motion.div
      className={className}
      initial={slideInitial}
      whileInView={slideTarget}
      viewport={isAlbumRow ? albumScrollViewport : homeViewport}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

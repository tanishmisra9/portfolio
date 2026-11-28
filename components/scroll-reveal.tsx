"use client";

import { m as motion, useReducedMotion } from "framer-motion";
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
  /**
   * `false` until the home hero tagline finishes; then `true` so sections below (e.g. experience)
   * do not `whileInView` in ahead of the hero on short viewports.
   */
  homeIntroComplete?: boolean;
};

/** First rows only: small stagger when several share one in-view tick; deeper rows use 0. */
const ALBUM_INTRO_STAGGER_CAP = 8;

export function ScrollReveal({
  children,
  className,
  variant = "slide",
  reducedMotion: reducedMotionProp = false,
  photoAlbumStaggerIndex,
  photoAlbumIntroComplete,
  homeIntroComplete,
}: Props) {
  // The OS preference applies everywhere; the prop stays for callers that force it on.
  const osReduced = useReducedMotion();
  const reducedMotion = reducedMotionProp || !!osReduced;
  const slideEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
  /** Album rows: softer deceleration + a touch longer opacity for a silkier entrance. */
  const albumSlideEase: [number, number, number, number] = [0.2, 0.88, 0.34, 1];
  const albumSlideDistancePx = 56;

  const isAlbumRow = photoAlbumStaggerIndex !== undefined;
  const albumFrozen = isAlbumRow && photoAlbumIntroComplete === false;
  const albumAfterIntro = isAlbumRow && photoAlbumIntroComplete === true;
  const homeFrozen = homeIntroComplete === false;

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

  // Reduced motion: the same motion.div, jumping straight to its end state. The server can't know the preference, so
  // it renders `initial` (hidden, offset). Returning a plain div here left that style on the hydrated node for good
  // (React doesn't patch a mismatched style), and the content stayed invisible. `initial` must not depend on it either.
  if (reducedMotion) {
    const frozen = albumFrozen || homeFrozen;
    return (
      <motion.div
        className={className}
        initial={slideInitial}
        animate={{ opacity: frozen ? 0 : 1, x: 0 }}
        transition={{ duration: 0 }}
        style={frozen ? { pointerEvents: "none" } : undefined}
      >
        {children}
      </motion.div>
    );
  }

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

  if (homeFrozen) {
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
    ? albumTransitionBase
    : { duration: 0.5, ease: slideEase };

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

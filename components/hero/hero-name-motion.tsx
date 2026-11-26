import type { ReactNode } from "react";

type Props = { children: ReactNode };

/**
 * The hero name's slow idle drift (an 18 s loop of a couple of px and a fraction of a degree of skew).
 *
 * Plain CSS keyframes (`hero-drift` / `hero-skew` in globals.css), not Framer: as a Framer animation of x/y/skewX it ran a
 * JS frame loop forever, ~13% of a core on an idle phone (510 ms of main-thread work per 4 s, 60 rAF callbacks a second).
 * CSS transform animations run on the compositor. Two nested elements because CSS has no standalone `skew` property and
 * the translate and skew keep their own keyframe times, as they had in Framer; Framer's easeInOut is CSS ease-in-out.
 * Reduced motion: no animation (globals.css).
 */
export function HeroNameMotion({ children }: Props) {
  return (
    <div className="hero-drift">
      <div className="hero-skew">{children}</div>
    </div>
  );
}

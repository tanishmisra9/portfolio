"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

/** Ease-out curve for wheel + programmatic scroll — softer stop than linear. */
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        smoothWheel: true,
        lerp: 0.3,
        duration: 0.28,
        easing: easeOutCubic,
        wheelMultiplier: 1.35,
        anchors: {
          duration: 0.32,
          easing: easeOutCubic,
        },
      }}
    >
      {children}
    </ReactLenis>
  );
}

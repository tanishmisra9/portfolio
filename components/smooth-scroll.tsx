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
        lerp: 0.23,
        duration: 0.35,
        easing: easeOutCubic,
        wheelMultiplier: 1.3,
        anchors: {
          duration: 0.4,
          easing: easeOutCubic,
        },
      }}
    >
      {children}
    </ReactLenis>
  );
}

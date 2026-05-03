"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useState, type ReactNode } from "react";

/** Ease-out curve for wheel + programmatic scroll — softer stop than linear. */
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (event: MediaQueryListEvent) => {
      setReduceMotion(event.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        smoothWheel: !reduceMotion,
        lerp: reduceMotion ? 1 : 0.3,
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

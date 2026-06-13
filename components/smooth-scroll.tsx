"use client";

import { ReactLenis, type LenisRef } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Ease-out curve for wheel + programmatic scroll — softer stop than linear. */
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const lenisRef = useRef<LenisRef>(null);
  const pathname = usePathname();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (event: MediaQueryListEvent) => {
      setReduceMotion(event.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Lenis owns the scroll position and persists across routes, so a new page
  // can otherwise inherit the previous page's scroll (landing partway down).
  // Snap to the top on route change — but skip when navigating to an in-page
  // anchor (#section) so hash links still scroll to their target.
  useEffect(() => {
    if (window.location.hash) return;
    lenisRef.current?.lenis?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return (
    <ReactLenis
      root
      ref={lenisRef}
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

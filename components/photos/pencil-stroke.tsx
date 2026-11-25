"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { PENCIL } from "@/lib/pencil/config";
import { createStroke } from "@/lib/pencil/stroke";
import type { PencilVoice } from "@/lib/pencil/voice";

type Props = {
  /** The hand-drawn builder's path; null while it is still being measured. */
  d: string | null;
  /** Stroke width in px. */
  base: number;
  /** 0..1 drawn, already ratcheted (never decreases). */
  draw: MotionValue<number>;
  /** The page's pencil voice; omitted (or null) = silent. */
  voice?: RefObject<PencilVoice | null>;
  /** Colour comes from `currentColor` (e.g. `pd-arrow`, `text-fg`). */
  className?: string;
};

/**
 * One pencil stroke: a plain round-capped line drawn by `pathLength` (cheap: the browser only re-dashes one path), and
 * the sound engine voicing it from the real tip. The stroke model (lib/pencil/stroke.ts) is built once per path and
 * only read per frame (a binary search for the tip), so the line costs what it did before the engine.
 *
 * The engine's variable-width graphite line (one path per width level, rebuilt every frame, under an feTurbulence
 * grain filter) was rolled back at the owner's request: the site felt slow and the sound was what they wanted to keep.
 */
export function PencilStroke({ d, base, draw, voice, className = "" }: Props) {
  const stroke = useMemo(() => (d ? createStroke(d, PENCIL.line.sampleStep, PENCIL.sound) : null), [d]);
  const svgRef = useRef<SVGSVGElement>(null);
  // Hidden until the line is minVisible × its width long: a round cap at a near-zero length paints a dot.
  const minFrac = stroke && stroke.length > 0 ? (PENCIL.line.minVisible * base) / stroke.length : 0.001;
  const opacity = useTransform(draw, (v): number => (v >= minFrac ? 1 : 0));

  useEffect(() => {
    if (!stroke) return;
    const minLen = PENCIL.line.minVisible * base;
    // Only the tip's x is read on screen (for pan), and a stroke never moves sideways while the page scrolls, so its
    // left edge is measured once (and on resize), not per frame: a per-frame getBoundingClientRect forces layout.
    let left = svgRef.current?.getBoundingClientRect().left ?? 0;
    const onResize = () => (left = svgRef.current?.getBoundingClientRect().left ?? 0);
    window.addEventListener("resize", onResize);
    let prevLen = -1; // the first value (mount, or a re-measured stroke) never sounds
    let lastT = 0;
    const voiceAt = (v: number) => {
      const len = Math.max(0, Math.min(1, v)) * stroke.length;
      const vc = voice?.current;
      const now = performance.now();
      if (vc && prevLen >= 0 && len > prevLen) {
        const tip = stroke.tipAt(len);
        // dt capped at a few frames: after a pause the first move must not be divided by the whole idle gap.
        const dt = lastT ? Math.min(now - lastT, 50) : 16;
        vc.move({ x: left + tip.x, viewport: window.innerWidth, speed: ((len - prevLen) * 1000) / dt, down: tip.down, curvature: tip.curvature });
        if (prevLen < minLen && len >= minLen) vc.touch();
        for (const at of stroke.turns) if (at > prevLen && at <= len) vc.tick();
      }
      if (len !== prevLen) lastT = now;
      prevLen = len;
    };
    voiceAt(draw.get());
    const off = draw.on("change", voiceAt);
    return () => {
      off();
      window.removeEventListener("resize", onResize);
    };
  }, [stroke, draw, voice, base]);

  if (!d) return null;
  return (
    <svg
      ref={svgRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 size-full overflow-visible ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={base}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path d={d} style={{ pathLength: draw, opacity }} />
    </svg>
  );
}

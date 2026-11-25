"use client";

import { useEffect, useRef, type RefObject } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { followStroke, type PencilMove, type PencilVoice } from "pencil-voice";
import { PENCIL_LINE } from "@/lib/pencil/config";

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
 * One pencil stroke: a plain round-capped line drawn by `pathLength` (cheap: the browser only re-dashes one path),
 * voiced by pencil-voice's `followStroke` from the real tip. The stroke model is built once per path; per change only a
 * binary search and a few AudioParam updates run, and the SVG's screen position is cached (re-read on resize only).
 *
 * The voice is passed as a forwarder that reads the ref on every call: this effect runs before the page's
 * `useIntroSound` effect creates the voice (a child's effects run before its parent's), so capturing `voice.current`
 * here would capture null and stay silent.
 */
export function PencilStroke({ d, base, draw, voice, className = "" }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const lengthRef = useRef(0);
  // Hidden until the line is minVisible × its width long: a round cap at a near-zero length paints a dot.
  const opacity = useTransform(draw, (v): number => {
    const len = lengthRef.current;
    const minFrac = len > 0 ? (PENCIL_LINE.minVisible * base) / len : 0.001;
    return v >= minFrac ? 1 : 0;
  });

  useEffect(() => {
    if (!d) return;
    const lazy = {
      move: (m: PencilMove) => voice?.current?.move(m),
      tick: () => voice?.current?.tick(),
      touch: () => voice?.current?.touch(),
    };
    const pen = followStroke(lazy, d, { element: svgRef.current, touchAt: PENCIL_LINE.minVisible * base });
    lengthRef.current = pen.stroke.length;
    pen.update(draw.get()); // the first value (mount, or a re-measured stroke) never sounds
    const off = draw.on("change", pen.update);
    return () => {
      off();
      pen.dispose();
    };
  }, [d, draw, voice, base]);

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

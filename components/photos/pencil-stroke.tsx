"use client";

import { useEffect, useId, useMemo, useRef, type RefObject } from "react";
import type { MotionValue } from "framer-motion";
import { PENCIL } from "@/lib/pencil/config";
import { createStroke } from "@/lib/pencil/stroke";
import type { PencilVoice } from "@/lib/pencil/voice";

type Props = {
  /** The hand-drawn builder's path (unchanged); null while it is still being measured. */
  d: string | null;
  /** Base stroke width in px. */
  base: number;
  /** 0..1 drawn, already ratcheted (never decreases). */
  draw: MotionValue<number>;
  /** The page's pencil voice; omitted (or null) = silent. */
  voice?: RefObject<PencilVoice | null>;
  /** Varies the width wobble so strokes don't share one rhythm. */
  seed?: number;
  /** Colour comes from `currentColor` (e.g. `pd-arrow`, `text-fg`). */
  className?: string;
};

/**
 * One pencil stroke, drawn as graphite: its width follows the stroke (heavier on downstrokes and where a hand slows,
 * lighter on fast straight runs and upstrokes, tapered where the pen lands and lifts), with a graphite grain. As it
 * draws, the tip's real position, heading and curvature drive the voice: pan from where it is across the screen,
 * brightness from its direction, softness through tight curves, a tick at sharp turns, a touch where the pen lands.
 *
 * Rendered as one round-capped path per width level (a single filled outline tears where the stroke crosses itself
 * or reverses, as the loops and arrowheads do). `d` attributes are set straight from `draw`, with no React re-render.
 */
export function PencilStroke({ d, base, draw, voice, seed = 1, className = "" }: Props) {
  const stroke = useMemo(() => (d ? createStroke(d, base, seed, PENCIL.line, PENCIL.sound) : null), [d, base, seed]);
  const svgRef = useRef<SVGSVGElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const grainId = `pencil-grain-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  // The grain filter's region in user space: the stroke's bounds plus its widest line. A percentage region would clip
  // a perfectly straight stroke, whose bounding box has zero width.
  const region = useMemo(() => {
    if (!stroke || !stroke.pts.length) return null;
    const xs = stroke.pts.map((p) => p[0]);
    const ys = stroke.pts.map((p) => p[1]);
    const pad = Math.max(...stroke.width) + 2;
    const [x, y] = [Math.min(...xs) - pad, Math.min(...ys) - pad];
    return { x, y, width: Math.max(...xs) + pad - x, height: Math.max(...ys) + pad - y };
  }, [stroke]);

  useEffect(() => {
    if (!stroke) return;
    const minLen = PENCIL.line.minVisible * base;
    let prevLen = -1; // the first render (mount, or a re-measured stroke) never sounds
    let lastT = 0;
    const render = (v: number) => {
      const len = Math.max(0, Math.min(1, v)) * stroke.length;
      const shown = len >= minLen ? len : 0;
      stroke.paths(shown).forEach((p, i) => paths.current[i]?.setAttribute("d", p.d));

      const vc = voice?.current;
      const now = performance.now();
      if (vc && prevLen >= 0 && len > prevLen) {
        const tip = stroke.tipAt(len);
        const box = svgRef.current?.getBoundingClientRect();
        // dt capped at a few frames: after a pause the first move must not be divided by the whole idle gap.
        const dt = lastT ? Math.min(now - lastT, 50) : 16;
        vc.move({
          x: (box?.left ?? 0) + tip.x,
          viewport: window.innerWidth,
          speed: ((len - prevLen) * 1000) / dt,
          down: tip.down,
          curvature: tip.curvature,
          pace: tip.speed,
        });
        if (prevLen < minLen && len >= minLen) vc.touch();
        for (const at of stroke.turns) if (at > prevLen && at <= len) vc.tick();
      }
      if (len !== prevLen) lastT = now;
      prevLen = len;
    };
    render(draw.get());
    return draw.on("change", render);
  }, [stroke, draw, voice, base]);

  if (!stroke || !region) return null;
  const grain = PENCIL.line.grain;
  return (
    <svg
      ref={svgRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 size-full overflow-visible ${className}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {grain > 0 && (
        <defs>
          <filter id={grainId} filterUnits="userSpaceOnUse" {...region}>
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed={seed} result="n" />
            {/* alpha = 1 − grain × noise: graphite is never a solid fill. */}
            <feColorMatrix in="n" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${-grain} 0 0 0 1`} result="m" />
            <feComposite in="SourceGraphic" in2="m" operator="in" />
          </filter>
        </defs>
      )}
      <g filter={grain > 0 ? `url(#${grainId})` : undefined}>
        {stroke.levels.map((w, i) => (
          <path
            key={i}
            ref={(el) => {
              paths.current[i] = el;
            }}
            strokeWidth={w}
          />
        ))}
      </g>
    </svg>
  );
}

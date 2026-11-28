"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { TITLE_PHASE, move, type TitlePhase } from "@/lib/state-machines";

/**
 * The /quotes subtitle: from load, the whole sentence flicks through typefaces, fast. Phases are TITLE_PHASE
 * (lib/state-machines.ts).
 */

const CYCLE_MS = 100;
/** Every face is sized to this x-height (font-size-adjust), so the line keeps one optical size as it changes. */
const X_HEIGHT = 0.5;

/**
 * Shown in this order, serif and sans alternating. Only faces the page already loads (app/quotes/fonts.ts,
 * app/layout.tsx), at weights they really ship. `size` trims a face too wide to stay on one line at 320px.
 */
const FACES = [
  { family: "playfair", weight: 400, size: 1 },
  { family: "bricolage", weight: 800, size: 0.95 },
  { family: "instrument-serif", weight: 400, size: 1 },
  { family: "space-mono", weight: 400, size: 0.82 },
  { family: "familjen", weight: 700, size: 1 },
  { family: "inter", weight: 200, size: 1 },
  { family: "poppins", weight: 800, size: 0.9 },
] as const;

export function QuoteSubtitle({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<TitlePhase>("waiting");
  const go = (to: TitlePhase) => setPhase((from) => move(TITLE_PHASE, from, to));
  const [face, setFace] = useState(0);
  const [awake, setAwake] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    go(reduce ? "still" : "cycling");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Nothing changes while the tab is hidden or the line is off screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let onScreen = true;
    const update = () => setAwake(onScreen && !document.hidden);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    io.observe(root);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    if (phase !== "cycling" || !awake || reduce) return;
    const tick = setInterval(() => setFace((f) => (f + 1) % FACES.length), CYCLE_MS);
    return () => clearInterval(tick);
  }, [phase, awake, reduce]);

  // Every face sits in the same grid cell with one showing, so the box is as big as the biggest from the server render
  // on and the cloud below never moves. A hard cut: at this speed a fade would smear faces together.
  const stack = (
    <span aria-hidden="true" className="grid items-center">
      {FACES.map((f, i) => (
        <span
          key={f.family}
          data-face={f.family}
          data-shown={face === i || undefined}
          className={`col-start-1 row-start-1 px-[0.15em] leading-[1.5] ${face === i ? "opacity-100" : "opacity-0"}`}
        >
          <span style={{ fontFamily: `var(--font-${f.family})`, fontWeight: f.weight, fontSize: `${f.size}em`, fontSizeAdjust: X_HEIGHT }}>
            &ldquo;&#8239;{text}&#8239;&rdquo;
          </span>
        </span>
      ))}
    </span>
  );

  return (
    <div ref={rootRef} data-phase={phase} className="relative mt-4 select-none text-[clamp(1.25rem,6vw,2.25rem)] text-muted md:mt-6">
      <p className="sr-only">{text}</p>
      {/* Decided by phase, not `reduce`: the server can't know the preference, so the first render must match it. */}
      {phase === "still" ? (
        stack
      ) : (
        <Tooltip label={phase === "paused" ? "Play fonts" : "Pause fonts"} className="!flex mx-auto w-fit max-w-full">
          {/* Text that changes for more than 5s needs a way to stop it. */}
          <button
            type="button"
            aria-label="Pause the changing font"
            aria-pressed={phase === "paused"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => go(phase === "paused" ? "cycling" : "paused")}
            className="block cursor-pointer rounded-none text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
          >
            {stack}
          </button>
        </Tooltip>
      )}
    </div>
  );
}

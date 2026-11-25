"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PAGE_TITLE_CLASSES } from "@/components/ui/class-constants";

const SHUTTER_DELAY_MS = 330;

/** Global shot count from app/api/shutter; null = unknown (loading or the DB is unreachable), which hides the counter. */
async function shutter(method: "GET" | "POST"): Promise<number | null> {
  try {
    const res = await fetch("/api/shutter", { method, cache: "no-store" });
    const { count } = await res.json();
    return typeof count === "number" ? count : null;
  } catch {
    return null;
  }
}

export function PhotosHeader() {
  const [flashing, setFlashing] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const el = new Audio("/sfx/camera.mp3");
    el.preload = "auto";
    audioRef.current = el;
    shutter("GET").then(setCount);
    return () => {
      audioRef.current = null;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  const handleClick = useCallback(() => {
    if (flashing) return;
    setFlashing(true);

    const shot = shutter("POST");
    const sfx = audioRef.current?.cloneNode() as HTMLAudioElement | undefined;
    if (sfx) {
      sfx.volume = 0.6;
      sfx.onended = () => {
        sfx.src = "";
      };
    }
    timersRef.current.push(
      window.setTimeout(() => {
        sfx?.play().catch(() => {});
        // The counter advances with the shutter, not the click; the server's number also brings in everyone else's shots.
        shot.then((n) => setCount((c) => (c === null ? c : (n ?? c + 1))));
      }, SHUTTER_DELAY_MS),
    );

    timersRef.current.push(
      window.setTimeout(() => setFlashing(false), 800),
    );
  }, [flashing]);

  return (
    <div className="flex flex-col items-center">
      <h1 className={`${PAGE_TITLE_CLASSES} motion-reduce:animate-none ${flashing ? "camera-flash-text" : ""}`}>
        <button
          type="button"
          onClick={handleClick}
          aria-label="tanishtakespics. Take a photo"
          data-shot={flashing ? "on" : "off"}
          className="viewfinder viewfinder-title group/shot relative cursor-pointer px-[0.35em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 focus-visible:ring-offset-8 focus-visible:ring-offset-bg"
        >
          tanishtakespics
          {/* Names the action on hover/focus (the aria-label already says it for screen readers). Hidden while the shutter fires. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-full mt-6 -translate-x-1/2 translate-y-1 whitespace-nowrap font-sans text-sm font-normal uppercase leading-none tracking-wide text-fg opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover/shot:translate-y-0 group-hover/shot:opacity-100 group-focus-visible/shot:translate-y-0 group-focus-visible/shot:opacity-100 group-data-[shot=on]/shot:opacity-0 motion-reduce:transition-none"
          >
            Take a photo
          </span>
          {count !== null && <ExposureCounter count={count} />}
        </button>
      </h1>
    </div>
  );
}

/**
 * Global shot count, like a film camera's frame-counter window: under the bottom-right
 * bracket (whose corner sits at var(--vf-inset) outside the button). Each changed
 * character rolls up; MotionConfig reducedMotion="user" turns the roll into a swap.
 */
function ExposureCounter({ count }: { count: number }) {
  // Keyed from the right, so a new leading digit doesn't re-roll the others.
  const chars = count.toLocaleString("en-US").split("").reverse();
  return (
    <motion.span
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="pointer-events-none absolute right-[var(--vf-inset,-0.6rem)] top-[calc(100%-var(--vf-inset,-0.6rem)+0.6rem)] flex items-baseline whitespace-nowrap font-mono text-xs font-normal leading-[1.4] tracking-normal text-dim tabular-nums"
    >
      <span className="mr-[0.5em]">No.</span>
      {chars
        .map((ch, i) => (
          <span key={i} className="relative inline-block h-[1.4em] overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={ch}
                className="inline-block"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-100%" }}
                transition={{ duration: 0.26, ease: [0.2, 0.9, 0.3, 1] }}
              >
                {ch}
              </motion.span>
            </AnimatePresence>
          </span>
        ))
        .reverse()}
    </motion.span>
  );
}

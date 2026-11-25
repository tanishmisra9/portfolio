"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PAGE_TITLE_CLASSES } from "@/components/ui/class-constants";
import { HALF_PRESS, move, type HalfPress } from "@/lib/state-machines";

const SHUTTER_DELAY_MS = 330;
/** Hold this long and the half-press locks (beep). Matches the af-half keyframe's 0.48s in globals.css. */
const FOCUS_LOCK_MS = 480;

/** Shared text of the viewfinder HUD (exposure, counter): the site's Poppins, dim, overriding the h1's display styles. */
const HUD_TEXT =
  "pointer-events-none absolute flex items-baseline whitespace-nowrap font-sans font-medium normal-case leading-[1.4] tracking-normal text-fg/85 tabular-nums";
/** Under the brackets, which sit at var(--vf-inset) outside the button. */
const BELOW = "top-[calc(100%-var(--vf-inset,-0.6rem)+0.6rem)]";

/** Exposure the readout settles on after each shot (it shuffles through these while "metering"). */
const SHUTTERS = ["1/60", "1/125", "1/250", "1/500", "1/1000", "1/2000"];
const APERTURES = ["f/1.4", "f/1.8", "f/2.8", "f/4", "f/5.6", "f/8"];
const ISOS = [50, 100, 200, 400, 800, 1600];
type Exposure = [number, number, number];
const FIRST_EXPOSURE: Exposure = [2, 1, 1]; // 1/250 f/1.8 ISO 100, fixed so SSR and hydration agree
const METER_STEPS = 6;
const METER_STEP_MS = 50;
const randomExposure = (): Exposure => [SHUTTERS, APERTURES, ISOS].map((l) => Math.floor(Math.random() * l.length)) as Exposure;

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
  const [exposure, setExposure] = useState<Exposure>(FIRST_EXPOSURE);
  const reduceMotion = useReducedMotion();
  const [half, setHalf] = useState<HalfPress>("off");
  const [shotLocked, setShotLocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const beepRef = useRef<HTMLAudioElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const halfTimersRef = useRef<number[]>([]);
  // Focus and exposure locked by a half-press: the click on release shoots with them instead of re-metering.
  const lockedRef = useRef(false);

  useEffect(() => {
    const el = new Audio("/sfx/camera.mp3");
    el.preload = "auto";
    audioRef.current = el;
    const beep = new Audio("/sfx/focus-beep.mp3");
    beep.preload = "auto";
    beepRef.current = beep;
    // Only ever forward: a slow GET landing after a click's POST must not roll the counter back.
    shutter("GET").then((n) => setCount((c) => (n === null ? c : c === null ? n : Math.max(c, n))));
    return () => {
      audioRef.current = null;
      beepRef.current = null;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      halfTimersRef.current.forEach(clearTimeout);
      halfTimersRef.current = [];
    };
  }, []);

  /** Half-press (hold): focus hunts, exposure meters, then both lock with the AF beep at FOCUS_LOCK_MS. */
  const startHalf = useCallback(() => {
    // One half-press at a time: a second start (mouse held + Space, a second finger) would stack another set of timers,
    // beep twice and re-meter. halfTimersRef is non-empty exactly while a half-press is running (endHalf empties it).
    if (flashing || halfTimersRef.current.length) return;
    lockedRef.current = false;
    setHalf((h) => move(HALF_PRESS, h, "focusing"));
    const settle = randomExposure();
    if (!reduceMotion) {
      for (let t = METER_STEP_MS; t < FOCUS_LOCK_MS; t += METER_STEP_MS) {
        halfTimersRef.current.push(window.setTimeout(() => setExposure(randomExposure()), t));
      }
    }
    halfTimersRef.current.push(
      window.setTimeout(() => {
        lockedRef.current = true;
        setExposure(settle);
        setHalf((h) => move(HALF_PRESS, h, "locked"));
        const beep = beepRef.current?.cloneNode() as HTMLAudioElement | undefined;
        if (beep) {
          beep.volume = 0.3; // the clip is ~13 dB hotter than the shutter
          beep.play().catch(() => {});
        }
      }, FOCUS_LOCK_MS),
    );
  }, [flashing, reduceMotion]);

  /** Release (the click that follows takes the shot) or abandon (`cancel`: dragged off, pointer cancelled; no click comes). */
  const endHalf = useCallback((cancel: boolean) => {
    halfTimersRef.current.forEach(clearTimeout);
    halfTimersRef.current = [];
    if (cancel) lockedRef.current = false;
    // A release's click arrives right after it. If none comes (iOS can swallow the click after a long press), drop the
    // lock, or a later unrelated shot (Enter, a quick tap) would reuse this exposure and focus.
    else timersRef.current.push(window.setTimeout(() => (lockedRef.current = false), 300));
    setHalf((h) => (h === "off" ? h : move(HALF_PRESS, h, "off")));
  }, []);

  const handleClick = useCallback(() => {
    if (flashing) return;
    setFlashing(true);
    const locked = lockedRef.current;
    lockedRef.current = false;
    setShotLocked(locked);

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
        // Only ever forward, and a POST that answers before the first GET still shows its (newer) number.
        shot.then((n) => setCount((c) => (n !== null ? Math.max(c ?? n, n) : c === null ? c : c + 1)));
      }, SHUTTER_DELAY_MS),
    );

    // The readout meters (shuffles) from the click and settles as the shutter fires; reduced motion just swaps.
    // After a half-press lock the exposure is already locked (AE lock), so it doesn't re-meter.
    if (!locked) {
      const settle = randomExposure();
      const steps = reduceMotion ? 0 : METER_STEPS;
      for (let k = 1; k <= steps; k++) {
        timersRef.current.push(window.setTimeout(() => setExposure(randomExposure()), k * METER_STEP_MS));
      }
      timersRef.current.push(
        window.setTimeout(() => setExposure(settle), reduceMotion ? 0 : SHUTTER_DELAY_MS),
      );
    }

    timersRef.current.push(
      window.setTimeout(() => setFlashing(false), 800),
    );
  }, [flashing, reduceMotion]);

  return (
    <div className="flex flex-col items-center">
      <h1 className={`${PAGE_TITLE_CLASSES} motion-reduce:animate-none ${flashing ? "camera-flash-text" : ""}`}>
        <button
          type="button"
          onClick={handleClick}
          onPointerDown={(e) => e.button === 0 && startHalf()}
          onPointerUp={() => endHalf(false)}
          onPointerCancel={() => endHalf(true)}
          // Dragged off while held: no click will come. (Touch also fires pointerleave after pointerup, with no buttons down.)
          onPointerLeave={(e) => e.buttons > 0 && endHalf(true)}
          onKeyDown={(e) => e.key === " " && !e.repeat && startHalf()}
          onKeyUp={(e) => e.key === " " && endHalf(false)}
          onBlur={() => endHalf(true)}
          onContextMenu={(e) => e.preventDefault()} // a long press on touch would open the callout
          aria-label="tanishtakespics. Take a photo"
          data-shot={flashing ? "on" : "off"}
          data-half={half}
          data-aflock={flashing && shotLocked ? "" : undefined}
          className="viewfinder viewfinder-title group/shot relative cursor-pointer touch-manipulation px-[0.35em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 focus-visible:ring-offset-8 focus-visible:ring-offset-bg"
        >
          tanishtakespics
          {/* Names the action on hover/focus (the aria-label already says it for screen readers). Hidden while the shutter fires. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-full mt-6 -translate-x-1/2 translate-y-1 whitespace-nowrap font-sans text-sm font-normal uppercase leading-none tracking-wide text-fg opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover/shot:translate-y-0 group-hover/shot:opacity-100 group-focus-visible/shot:translate-y-0 group-focus-visible/shot:opacity-100 group-data-[shot=on]/shot:opacity-0 motion-reduce:transition-none"
          >
            Take a photo
          </span>
          {/* Camera HUD: exposure bottom-left, shot count bottom-right, focus point in the middle (globals.css). */}
          <span aria-hidden className="af-point" />
          <span aria-hidden className={`${HUD_TEXT} ${BELOW} left-[var(--vf-inset,-0.6rem)] gap-[0.8em] text-xs`}>
            <span>{SHUTTERS[exposure[0]]}</span>
            <span>{APERTURES[exposure[1]]}</span>
            <span className="max-sm:hidden">ISO {ISOS[exposure[2]]}</span>
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
      className={`${HUD_TEXT} ${BELOW} right-[var(--vf-inset,-0.6rem)] text-sm`}
    >
      <span className="mr-[0.3em]">No.</span>
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

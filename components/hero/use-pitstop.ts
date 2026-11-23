"use client";

import {
  animate,
  motionValue,
  type AnimationPlaybackControls,
  type MotionValue,
  type ValueAnimationTransition,
} from "framer-motion";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { HERO_PHASE, move, type HeroPhase } from "@/lib/state-machines";

/*
 * Timeline, all in ms from the moment public/sfx/pitstop.mp3 starts playing. The clip (5.24s) is, baked into one file
 * so it starts inside the click gesture: a "whoosh 8" per tire at LAUNCH_MS - 40 (0/0.16/0.32/0.48s; +60 felt late) as
 * the chunks split, then the original Short through ONE filter chain with no gaps: the wheel-gun burst 0.92-1.57s as
 * the tires rejoin, CROSSFADED (0.35s, equal power, 1.40-1.75s) into the car's engine growl (rising from 1.68s to
 * 2.82s) so the two weave together over the same ambience instead of leaving a lull, the drive-off from ~3.15s
 * (engine rev peaks ~3.75s), and a "whoosh 9" that starts at 3.19s and peaks at 4.35s as the name re-enters
 * (re-entry starts at DRIVE_MS + DRIVE_S + ENTER_PAUSE_MS = 4.25s). The burst is one continuous sound, so on top of
 * it sit FOUR synthetic-plus-source impact hits (thump + crack + a slice of the real gun rattle), one per tire at
 * BOLT_MS + SNAP_S (1.00/1.18/1.36/1.54s) = the instant each tire lands, with the burst ducked under each one so
 * they pop. The sounds are mixed in at fixed times: if LAUNCH_MS, BOLT_MS, SNAP_S, DRIVE_MS, DRIVE_S or
 * ENTER_PAUSE_MS change, re-mix the clip.
 */
/** Each tire pops off (starts flying out), one after another; each gets a whoosh 8 in the clip. */
export const LAUNCH_MS = [40, 200, 360, 520] as const;
/** Each tire starts snapping back, in TIRES order: they land SNAP_S (160ms) later at 1.00/1.18/1.36/1.54s, inside the gun burst. */
export const BOLT_MS = [840, 1020, 1200, 1380] as const;
/** The whole name starts sliding off (slowly, then accelerating); it is fastest right around the engine rev peak. */
export const DRIVE_MS = 3350;

/**
 * Every visual is delayed by this much after the audio's `playing` event: that event fires before the sound reaches the
 * speakers (output + mp3 start-up latency, more over Bluetooth), so without it the picture runs early. Override per
 * device with ?pitstopOffset=<ms> in the URL to find the right value.
 */
const SOUND_LATENCY_MS = 200;

const PITSTOP_VOLUME = 0.45;
const LAUNCH_S = 0.2;
/** Drive-off is a gentle ease-in (easeInCubic): a soft start that accelerates away, like a car pulling out. */
const DRIVE_S = 0.55;
const DRIVE_EASE = [0.32, 0, 0.67, 0] as const;
/** Name is off-screen this long after the slide, then re-enters from the left (like the page wraps around). */
const ENTER_PAUSE_MS = 350;
const ENTER_S = 0.3;
/** If the sound hasn't started this long after the click, run the timeline from the click instead. */
const SOUND_START_CAP_MS = 500;

/**
 * A tire slams home: it arrives at speed and stops almost dead (end control point 0.6, was 0.5: ~5% less snappy, so it
 * doesn't hard-cut; raise it toward 1 to soften more), so every landing is still one exact instant (start + SNAP_S) a sound can
 * hit. (The old spring took 150-300ms to settle onto home, which read as mushy and gave the sound nothing to land on.)
 */
const SNAP_S = 0.16;
const snapTween = { duration: SNAP_S, ease: [0.45, 0, 0.8, 0.6] as [number, number, number, number] };

/**
 * Vertical "sauce", all on moments that already have a sound or an exact instant (no continuous bobbing):
 * - each tire is kicked DOWN LAND_KICK_PX at its landing and wobbles back (a jolt that sells the hit);
 * - the name squats DRIVE_SQUAT_PX as it starts to drive off, then lifts DRIVE_LIFT_PX as it accelerates away (negative = up);
 * - the name is kicked ENTER_KICK_PX when it lands from the left, then wobbles back.
 * The wobble is an underdamped spring (damping ratio ~0.35: a couple of shrinking wiggles over ~0.45s). Set a kick to 0 to drop it.
 */
const LAND_KICK_PX = 4;
const DRIVE_SQUAT_PX = 3;
const DRIVE_LIFT_PX = -2;
const ENTER_KICK_PX = 5;
/**
 * Engine rumble: while the clip's growl swells (it peaks at RUMBLE_PEAK_MS audio time) the parked name trembles
 * vertically, RUMBLE_PX at most, RUMBLE_HZ times a second, until the drive squat. Vertical only (an idling engine
 * shakes the chassis up and down; x jitter read as a glitch). Set RUMBLE_PX to 0 to drop it.
 */
const RUMBLE_PX = 2.4; // 1.2 was "not noticeable enough"; keep it under DRIVE_SQUAT_PX so the pull-out still reads bigger
const RUMBLE_HZ = 15; // 30 direction changes a second: ~2 frames each at 60fps, so it can't alias into a wobble
const RUMBLE_PEAK_MS = 2820;
/** velocity: 0 matters: set() doesn't reset a MotionValue's velocity, so without it the wobble inherits the slam's speed. */
const wobbleSpring = { type: "spring" as const, stiffness: 420, damping: 13, mass: 0.6, velocity: 0 };

export type TireMv = { x: MotionValue<number>; y: MotionValue<number> };

/** The four tires: top-left TAN, top-right ISH, bottom-left MIS, bottom-right RA. Each flies off toward its own corner. */
const TIRES = [
  { key: "tl", dx: -1, dy: -1 },
  { key: "tr", dx: 1, dy: -1 },
  { key: "bl", dx: -1, dy: 1 },
  { key: "br", dx: 1, dy: 1 },
] as const;
const LAUNCH_X = 1600;
const LAUNCH_Y = 1000;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function usePitstop(reduceMotion: boolean | null) {
  const mv = useMemo(
    () => ({
      tires: {
        tl: { x: motionValue(0), y: motionValue(0) },
        tr: { x: motionValue(0), y: motionValue(0) },
        bl: { x: motionValue(0), y: motionValue(0) },
        br: { x: motionValue(0), y: motionValue(0) },
      } satisfies Record<(typeof TIRES)[number]["key"], TireMv>,
      /** Whole-name wrapper: slides off right, then re-enters from the left. */
      driveX: motionValue(0),
      driveY: motionValue(0),
    }),
    [],
  );

  const phaseRef = useRef<HeroPhase>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const aliveRef = useRef(true);
  const animsRef = useRef<AnimationPlaybackControls[]>([]);

  useEffect(() => {
    aliveRef.current = true;
    const el = new Audio("/sfx/pitstop.mp3");
    el.preload = "auto";
    el.volume = PITSTOP_VOLUME;
    audioRef.current = el;
    return () => {
      aliveRef.current = false;
      animsRef.current.forEach((a) => a.stop());
      el.pause();
      audioRef.current = null;
    };
  }, []);

  const isIdle = useCallback(() => phaseRef.current === "idle", []);

  const run = useCallback(
    async (resetMagnets: () => void) => {
      if (phaseRef.current !== "idle") return;
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      // Reduced motion: no pit stop at all. The 5s clip (whooshes, wheel guns, engine) with nothing moving read as
      // unexplained noise, and every click restarted it.
      if (reduceMotion) return;

      const go = (to: HeroPhase) => {
        phaseRef.current = move(HERO_PHASE, phaseRef.current, to);
      };
      const tween = (v: MotionValue<number>, target: number, opts: ValueAnimationTransition<number>) => {
        const a = animate(v, target, opts);
        animsRef.current.push(a);
        return a;
      };

      animsRef.current = [];
      go("launch");
      resetMagnets();

      const override = Number(new URLSearchParams(window.location.search).get("pitstopOffset"));
      const latency = Number.isFinite(override) && override > 0 ? override : SOUND_LATENCY_MS;

      const flights = TIRES.map(async ({ key, dx, dy }, i) => {
        await wait(LAUNCH_MS[i] + latency);
        if (!aliveRef.current) return;
        await Promise.all([
          tween(mv.tires[key].x, dx * LAUNCH_X, { duration: LAUNCH_S, ease: "easeIn" }),
          tween(mv.tires[key].y, dy * LAUNCH_Y, { duration: LAUNCH_S, ease: "easeIn" }),
        ]);
      });

      // Anchor the timeline to when the sound really starts, so a slow first load can't desync the snaps.
      // play() runs inside the click gesture (iOS blocks it otherwise); if it's rejected we run silently from the click.
      let anchor = performance.now();
      const started = new Promise<void>((resolve) => {
        if (!audio) return resolve();
        let playing = false;
        const onPlaying = () => {
          playing = true;
          anchor = performance.now();
          resolve();
        };
        audio.addEventListener("playing", onPlaying, { once: true });
        audio.play().catch(() => {
          audio.removeEventListener("playing", onPlaying);
          resolve();
        });
        setTimeout(() => {
          if (playing) return;
          // Too slow to start (cold cache, slow network): run silently from the click. Pause it too, or it would still
          // start late and play ~a second out of sync with every snap.
          audio.removeEventListener("playing", onPlaying);
          audio.pause();
          resolve();
        }, SOUND_START_CAP_MS);
      });

      await Promise.all([...flights, started]);
      if (!aliveRef.current) return;

      const at = (ms: number) => wait(Math.max(0, anchor + ms + latency - performance.now()));

      go("bolt");
      const settled: Promise<unknown>[] = [];
      for (let i = 0; i < TIRES.length; i++) {
        await at(BOLT_MS[i]);
        if (!aliveRef.current) return;
        const t = mv.tires[TIRES[i].key];
        // Slam home, then (at the landing instant) kick down and wobble back.
        settled.push(
          (async () => {
            await Promise.all([tween(t.x, 0, snapTween), tween(t.y, 0, snapTween)]);
            if (!aliveRef.current) return;
            t.y.set(LAND_KICK_PX);
            await tween(t.y, 0, wobbleSpring);
          })(),
        );
      }
      await Promise.all(settled);
      if (!aliveRef.current) return;

      // Engine rumble while the growl swells: a fine vertical tremble of the whole name, from the tires settling until
      // the drive squat (which takes over driveY and stops it). Alternates sign RUMBLE_HZ times a second each way, with
      // a little per-beat jitter so it isn't metronomic, under an envelope that swells to full at the growl's peak.
      const from = performance.now() - anchor - latency; // audio time now
      const span = DRIVE_MS - from;
      if (RUMBLE_PX > 0 && span > 150) {
        const n = Math.max(2, Math.round((span / 1000) * RUMBLE_HZ * 2));
        const ys = Array.from({ length: n + 1 }, (_, i) => {
          if (i === 0 || i === n) return 0; // from rest, and back to rest for the squat
          const p = Math.min(1, ((span * i) / n) / Math.max(1, RUMBLE_PEAK_MS - from));
          const env = p * p * (3 - 2 * p); // smoothstep swell
          return (i % 2 ? 1 : -1) * RUMBLE_PX * env * (0.7 + 0.3 * Math.random());
        });
        // each swing eases in and out (slows into its peak, like a vibration) instead of linear: linear made a triangle
        // wave with instant reversals that read as a mechanical buzz. One ease per segment, explicitly.
        const ease = Array.from({ length: n }, () => "easeInOut" as const);
        animsRef.current.push(animate(mv.driveY, ys, { duration: span / 1000, ease }));
      }
      await at(DRIVE_MS);
      if (!aliveRef.current) return;

      go("drive");
      // Squat as it starts to pull out, lift as it accelerates away (runs alongside the slide).
      const pitch = (async () => {
        await tween(mv.driveY, DRIVE_SQUAT_PX, { duration: 0.18, ease: "easeOut" });
        await tween(mv.driveY, DRIVE_LIFT_PX, { duration: DRIVE_S - 0.18, ease: "easeInOut" });
      })();
      await Promise.all([tween(mv.driveX, window.innerWidth, { duration: DRIVE_S, ease: [...DRIVE_EASE] }), pitch]);
      if (!aliveRef.current) return;
      mv.driveY.set(0); // off-screen, so the reset is invisible

      await wait(ENTER_PAUSE_MS);
      if (!aliveRef.current) return;

      // Same slide as the exit, mirrored: jump to just past the left edge, ease in, then land with a kick and a wobble.
      go("enter");
      mv.driveX.set(-window.innerWidth * 1.15);
      await tween(mv.driveX, 0, { duration: ENTER_S, ease: "easeOut" });
      if (!aliveRef.current) return;
      mv.driveY.set(ENTER_KICK_PX);
      await tween(mv.driveY, 0, wobbleSpring);
      if (!aliveRef.current) return;
      go("idle");
    },
    [mv, reduceMotion],
  );

  return { mv, run, isIdle };
}

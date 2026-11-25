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
 * Timeline, all in ms from the moment public/sfx/pitstop.mp3 starts playing. The clip (4.52s) is, baked into one file
 * so it starts inside the click gesture: a "whoosh 8" per tire at LAUNCH_MS - 40 (0/0.16/0.32/0.48s; +60 felt late) as
 * the chunks split, then the original Short through ONE filter chain with no gaps: the wheel-gun burst 0.92-1.57s as
 * the tires rejoin, CROSSFADED (0.35s, equal power, 1.40-1.75s) into the car's engine growl (rising from 1.68s to
 * 2.29s: the growl was 1.4s, now time-compressed 2x to 0.7s) so the two weave together over the same ambience instead of leaving a lull, the drive-off from ~2.45s
 * (engine rev peaks ~3.05s), and a "whoosh 9" that starts at 2.49s and peaks at 3.65s as the name re-enters
 * (re-entry starts at DRIVE_MS + DRIVE_S + ENTER_PAUSE_MS = 3.55s). The burst is one continuous sound, so on top of
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
export const DRIVE_MS = 2650;

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
const RUMBLE_PEAK_MS = 2285;
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

/**
 * Botched stop: chance (0..1) that a stop is the botched one. About 4 stops in 10 (40% for now; lower it once the novelty wears off). `?botch=1` (or any 0..1) in the URL forces it for testing, like ?pitstopOffset. One tire (random each stop, see BOTCH_TIRES) is
 * cross-threaded: the crew jabs at it again and again, frantically, each failing poke a clack, then finally seats it, and the car takes off. That takes
 * BOTCH_SHIFT_MS longer than a clean stop, and every sound after the gun burst is baked at fixed times, so a botched stop
 * has its own clip (`pitstop-botch.mp3`, built by scripts/pitstop-sfx/build_botch.py): the same audio with BOTCH_SHIFT_MS
 * of frantic gun inserted into the burst, so the growl, drive-off and whoosh 9 all land that much later.
 */
const BOTCH_CHANCE = 0.4;
const BOTCH_SHIFT_MS = 770; // = SHIFT in build_botch.py (0.77)

/** A stop = a clip + the times baked into it. */
type Profile = { src: string; driveMs: number; rumblePeakMs: number };
const NORMAL: Profile = { src: "/sfx/pitstop.mp3", driveMs: DRIVE_MS, rumblePeakMs: RUMBLE_PEAK_MS };
const BOTCH: Profile = {
  src: "/sfx/pitstop-botch.mp3",
  driveMs: DRIVE_MS + BOTCH_SHIFT_MS,
  rumblePeakMs: RUMBLE_PEAK_MS + BOTCH_SHIFT_MS,
};

/**
 * The botched tire's frantic attempts as one keyframe track: [audio-time ms, px from its slot]. The first point is the
 * normal slam, stopping short (lands 1540); then recoil / poke pairs, each poke landing nearer home (70 -> 12px) and
 * sooner after the last (period 150 -> 110ms) = the crew panicking; a back-off and one slower, determined slam (lands
 * 2265) that seats it. EVERY SEGMENT IS >= 50ms (3 frames at 60fps): the first cut had 25-45ms ones that flickered instead
 * of reading as motion. The failing pokes land at 1540, 1690, 1825, 1945, 2055 and the seat at 2265: the hits in
 * build_botch.py (LAND) sit on exactly these instants, so change both together. Segment eases are derived: out =
 * easeOut, in = easeIn, first/last = snap.
 */
const BOTCH_TRACK = [
  [1540, 70], [1590, 106], [1690, 54], [1740, 86], [1825, 40], [1875, 72],
  [1945, 26], [1995, 50], [2055, 12], [2110, 66], [2265, 0],
] as const;
/** Which tire can botch (picked at random each stop). Narrow it, e.g. ["bl", "br"] for only the bottom row. */
const BOTCH_TIRES = ["tl", "tr", "bl", "br"] as const;
/**
 * Random, but never the tire that botched last time: the last one is kept in sessionStorage (this tab only, so it also
 * holds across reloads; it's mentioned on /privacy). Storage can throw (Safari private mode, blocked): then it's plain random.
 */
const LAST_BOTCH_KEY = "pitstop-last-botch";
function pickBotchTire(): (typeof BOTCH_TIRES)[number] {
  let last: string | null = null;
  try {
    last = sessionStorage.getItem(LAST_BOTCH_KEY);
  } catch {}
  const pool = BOTCH_TIRES.filter((k) => k !== last);
  const from = pool.length ? pool : BOTCH_TIRES;
  const pick = from[Math.floor(Math.random() * from.length)];
  try {
    sessionStorage.setItem(LAST_BOTCH_KEY, pick);
  } catch {}
  return pick;
}
/** Approach angle from horizontal, random per stop (the old fixed slope was ~33deg). The tire is also launched along it. */
const BOTCH_ANGLE_DEG = [20, 60] as const;
/** Every point of the track nudges the angle by up to this, so the crew hunts around the nut instead of repeating one line. */
const BOTCH_DRIFT_DEG = 3;
const BOTCH_LAUNCH_PX = 1900; // ~ the length of the normal 1600/1000 launch

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
  const profileRef = useRef<Profile>(NORMAL);

  /**
   * Decide NEXT stop's variant and load only its clip (run() must find the audio ready inside the click, so the dice are
   * rolled ahead of time, not at the click): at the chance this branch will ship with, most visitors never download the
   * longer clip. The roll is per stop and constant for it, not a state, so HERO_PHASE is unchanged.
   */
  const prepare = useCallback(() => {
    // (doesn't pause the previous element: the name is idle ~0.2-0.5s before its clip's whoosh tail ends)
    const q = new URLSearchParams(window.location.search).get("botch");
    const chance = q !== null && Number.isFinite(Number(q)) ? Number(q) : BOTCH_CHANCE;
    const profile = Math.random() < chance ? BOTCH : NORMAL;
    const el = new Audio(profile.src);
    el.preload = "auto";
    el.volume = PITSTOP_VOLUME;
    profileRef.current = profile;
    audioRef.current = el;
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    // Reduced motion never plays a pit stop (run() returns early), so don't download a 55-64KB clip it can't use.
    // Read from matchMedia rather than the hook's value, which may not be settled on the first effect.
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) prepare();
    return () => {
      aliveRef.current = false;
      animsRef.current.forEach((a) => a.stop());
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [prepare]);

  const isIdle = useCallback(() => phaseRef.current === "idle", []);

  const run = useCallback(
    async (resetMagnets: () => void) => {
      if (phaseRef.current !== "idle") return;
      const P = profileRef.current;
      const botched = P === BOTCH;
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      // Reduced motion: no pit stop at all. The 5s clip (whooshes, wheel guns, engine) with nothing moving read as
      // unexplained noise, and every click restarted it.
      if (reduceMotion) return;

      // Per-stop constants (not states): which tire botches, and its approach angle.
      const botchKey = botched ? pickBotchTire() : null;
      const theta = ((BOTCH_ANGLE_DEG[0] + Math.random() * (BOTCH_ANGLE_DEG[1] - BOTCH_ANGLE_DEG[0])) * Math.PI) / 180;
      const launchOf = (key: string) =>
        key === botchKey ? [BOTCH_LAUNCH_PX * Math.cos(theta), BOTCH_LAUNCH_PX * Math.sin(theta)] : [LAUNCH_X, LAUNCH_Y];

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
          tween(mv.tires[key].x, dx * launchOf(key)[0], { duration: LAUNCH_S, ease: "easeIn" }),
          tween(mv.tires[key].y, dy * launchOf(key)[1], { duration: LAUNCH_S, ease: "easeIn" }),
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
      // Bolt order: the botched tire always takes the LAST slot (the clip's frantic section follows the 4th landing), the
      // others keep their natural order, so any tire can botch without touching the audio.
      const order = [...TIRES.filter((x) => x.key !== botchKey), ...TIRES.filter((x) => x.key === botchKey)];
      const minTh = (15 * Math.PI) / 180;
      const maxTh = (65 * Math.PI) / 180;
      const settled: Promise<unknown>[] = [];
      for (let k = 0; k < order.length; k++) {
        await at(BOLT_MS[k]);
        if (!aliveRef.current) return;
        const { key, dx, dy } = order[k];
        const t = mv.tires[key];
        // Every tire is a keyframe track [audio ms, x, y] from where it is now to home. A clean tire is one slam (lands
        // SNAP_S later); the botched one jabs at its slot first, along its per-stop angle that drifts a little per point.
        let th = theta;
        const pts: [number, number, number][] =
          key === botchKey
            ? BOTCH_TRACK.map(([ms, d]) => {
                th = Math.min(maxTh, Math.max(minTh, th + ((Math.random() * 2 - 1) * BOTCH_DRIFT_DEG * Math.PI) / 180));
                return [ms, dx * d * Math.cos(th), dy * d * Math.sin(th)];
              })
            : [[BOLT_MS[k] + SNAP_S * 1000, 0, 0]];
        const t0 = BOLT_MS[k];
        const total = pts[pts.length - 1][0] - t0;
        const dist = (p: number[]) => Math.hypot(p[1], p[2]);
        const opts = {
          duration: total / 1000,
          times: [0, ...pts.map((p) => (p[0] - t0) / total)],
          ease: pts.map((p, j) =>
            j === 0 || j === pts.length - 1 ? snapTween.ease : dist(p) > dist(pts[j - 1]) ? ("easeOut" as const) : ("easeIn" as const),
          ),
        };
        const track = [
          animate(t.x, [t.x.get(), ...pts.map((p) => p[1])], opts),
          animate(t.y, [t.y.get(), ...pts.map((p) => p[2])], opts),
        ];
        animsRef.current.push(...track);
        // Landed: kick down and wobble back (the same for every tire).
        settled.push(
          (async () => {
            await Promise.all(track);
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
      const span = P.driveMs - from;
      if (RUMBLE_PX > 0 && span > 150) {
        const n = Math.max(2, Math.round((span / 1000) * RUMBLE_HZ * 2));
        const ys = Array.from({ length: n + 1 }, (_, i) => {
          if (i === 0 || i === n) return 0; // from rest, and back to rest for the squat
          const p = Math.min(1, ((span * i) / n) / Math.max(1, P.rumblePeakMs - from));
          const env = p * p * (3 - 2 * p); // smoothstep swell
          return (i % 2 ? 1 : -1) * RUMBLE_PX * env * (0.7 + 0.3 * Math.random());
        });
        // each swing eases in and out (slows into its peak, like a vibration) instead of linear: linear made a triangle
        // wave with instant reversals that read as a mechanical buzz. One ease per segment, explicitly.
        const ease = Array.from({ length: n }, () => "easeInOut" as const);
        animsRef.current.push(animate(mv.driveY, ys, { duration: span / 1000, ease }));
      }
      await at(P.driveMs);
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
      prepare(); // roll + load the next stop's clip now, so the next click finds it ready
    },
    [mv, reduceMotion, prepare],
  );

  return { mv, run, isIdle };
}

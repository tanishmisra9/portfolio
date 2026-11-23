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
 * Timeline, all in ms from the moment public/sfx/pitstop.mp3 starts playing. The clip (3.46s) is: guns-off burst
 * 0.03-0.71s (plays while the tires launch), guns-on whine 0.79-1.96s, car drives off from 1.99s. The whine is ONE
 * continuous sound, not 4 hits, so the 4 snaps are spread across it. If the clip is re-cut, re-measure these.
 */
/** Snap-back time of each tire, in TIRES order. */
export const BOLT_MS = [860, 1160, 1460, 1760] as const;
/** The whole name starts sliding off. */
export const DRIVE_MS = 2150;

const PITSTOP_VOLUME = 0.45;
const LAUNCH_S = 0.2;
const DRIVE_S = 0.25;
const FADE_IN_S = 0.4;
const FADE_BLUR_PX = 12;
/** If the sound hasn't started this long after the click, run the timeline from the click instead. */
const SOUND_START_CAP_MS = 500;

const snapSpring = { type: "spring" as const, stiffness: 400, damping: 24, mass: 0.52 };

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
      /** Whole-name wrapper: slide off (x), then blur-fade back in. */
      driveX: motionValue(0),
      fade: motionValue(1),
      blur: motionValue(0),
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
      if (reduceMotion) {
        void audio?.play().catch(() => {});
        return;
      }

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

      const flights = TIRES.flatMap(({ key, dx, dy }) => [
        tween(mv.tires[key].x, dx * LAUNCH_X, { duration: LAUNCH_S, ease: "easeIn" }),
        tween(mv.tires[key].y, dy * LAUNCH_Y, { duration: LAUNCH_S, ease: "easeIn" }),
      ]);

      // Anchor the timeline to when the sound really starts, so a slow first load can't desync the snaps.
      // play() runs inside the click gesture (iOS blocks it otherwise); if it's rejected we run silently from the click.
      let anchor = performance.now();
      const started = new Promise<void>((resolve) => {
        if (!audio) return resolve();
        const onPlaying = () => {
          anchor = performance.now();
          resolve();
        };
        audio.addEventListener("playing", onPlaying, { once: true });
        audio.play().catch(() => {
          audio.removeEventListener("playing", onPlaying);
          resolve();
        });
        setTimeout(() => {
          audio.removeEventListener("playing", onPlaying);
          resolve();
        }, SOUND_START_CAP_MS);
      });

      await Promise.all([...flights, started]);
      if (!aliveRef.current) return;

      const at = (ms: number) => wait(Math.max(0, anchor + ms - performance.now()));

      go("bolt");
      const snaps: ReturnType<typeof tween>[] = [];
      for (let i = 0; i < TIRES.length; i++) {
        await at(BOLT_MS[i]);
        if (!aliveRef.current) return;
        const t = mv.tires[TIRES[i].key];
        snaps.push(tween(t.x, 0, snapSpring), tween(t.y, 0, snapSpring));
      }
      await Promise.all(snaps);
      await at(DRIVE_MS);
      if (!aliveRef.current) return;

      go("drive");
      await tween(mv.driveX, window.innerWidth, { duration: DRIVE_S, ease: "easeIn" });
      if (!aliveRef.current) return;

      go("fadein");
      mv.driveX.set(0);
      mv.fade.set(0);
      mv.blur.set(FADE_BLUR_PX);
      await Promise.all([
        tween(mv.fade, 1, { duration: FADE_IN_S, ease: "easeOut" }),
        tween(mv.blur, 0, { duration: FADE_IN_S, ease: "easeOut" }),
      ]);
      if (!aliveRef.current) return;
      go("idle");
    },
    [mv, reduceMotion],
  );

  return { mv, run, isIdle };
}

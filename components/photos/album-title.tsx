"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SnowfallCanvas,
  type SnowfallCanvasHandle,
} from "@/components/photos/snowfall-canvas";

type Props = {
  title: string;
  slug: string;
};

type AnimPhase = "idle" | "wipe" | "flyout" | "flyin" | "settle";

export function AlbumTitle({ title, slug }: Props) {
  const reduceMotion = useReducedMotion();
  const isSuperMax = slug === "super-max";
  const isSnowfall = slug === "snowfall";
  const interactiveSuperMax = isSuperMax && !reduceMotion;
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const snowfallRef = useRef<SnowfallCanvasHandle>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** Bumps on flyby start so a late pointerdown prime cannot pause real playback. */
  const audioGenerationRef = useRef(0);

  useEffect(() => {
    if (!interactiveSuperMax) return;
    void fetch("/passby.mp3").catch(() => {});
    const el = new Audio("/passby.mp3");
    el.preload = "auto";
    audioRef.current = el;
    return () => {
      audioRef.current = null;
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [interactiveSuperMax]);

  const schedule = useCallback((fn: () => void, ms: number) => {
    timeoutsRef.current.push(setTimeout(fn, ms));
  }, []);

  const playPassby = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0.595;
    a.currentTime = 0;
    void a.play().catch(() => {});
  }, []);

  const startFlyby = useCallback(() => {
    if (!interactiveSuperMax || phase !== "idle") return;

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    audioGenerationRef.current += 1;
    /* Same moment as wipe: avoids pointerdown→click gap where decode makes SFX feel late. */
    playPassby();

    setPhase("wipe");
    schedule(() => setPhase("flyout"), 800);
    schedule(() => setPhase("flyin"), 1400);
    schedule(() => setPhase("settle"), 2200);
    schedule(() => setPhase("idle"), 2800);
  }, [interactiveSuperMax, phase, playPassby, schedule]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 || phase !== "idle") return;
      const a = audioRef.current;
      if (!a) return;
      const gen = audioGenerationRef.current;
      const prev = a.volume;
      a.volume = 0;
      void a
        .play()
        .then(() => {
          if (gen !== audioGenerationRef.current) return;
          a.pause();
          a.currentTime = 0;
          a.volume = prev;
        })
        .catch(() => {
          a.volume = prev;
        });
    },
    [phase],
  );

  const baseClasses =
    "select-none font-display text-6xl font-extrabold uppercase tracking-tighter leading-[1.15] md:text-8xl";

  if (!isSuperMax || reduceMotion) {
    return (
      <>
        <h1
          className={`${baseClasses} py-2 text-white ${isSnowfall && !reduceMotion ? "cursor-pointer" : "cursor-default"}`}
          onClick={isSnowfall && !reduceMotion ? () => snowfallRef.current?.triggerBurst() : undefined}
        >
          {title}
        </h1>
        {isSnowfall && !reduceMotion && <SnowfallCanvas ref={snowfallRef} />}
      </>
    );
  }

  const overflowForPhase =
    phase === "flyout" || phase === "flyin"
      ? "overflow-visible"
      : "overflow-hidden";

  return (
    <div className={`${overflowForPhase} py-2`}>
      <h1
        onPointerDown={onPointerDown}
        onClick={startFlyby}
        className={`${baseClasses} supermax-title relative cursor-pointer whitespace-nowrap`}
        data-phase={phase}
      >
        {title}
      </h1>
    </div>
  );
}

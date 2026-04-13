"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  title: string;
  slug: string;
};

type AnimPhase = "idle" | "wipe" | "flyout" | "flyin" | "settle";

export function AlbumTitle({ title, slug }: Props) {
  const reduceMotion = useReducedMotion();
  const isSuperMax = slug === "super-max";
  const interactiveSuperMax = isSuperMax && !reduceMotion;
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!interactiveSuperMax) return;
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

  const handleClick = useCallback(() => {
    if (!interactiveSuperMax || phase !== "idle") return;

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    if (audioRef.current) {
      const sfx = audioRef.current.cloneNode() as HTMLAudioElement;
      sfx.volume = 0.7;
      sfx.play().catch(() => {});
    }

    setPhase("wipe");
    schedule(() => setPhase("flyout"), 800);
    schedule(() => setPhase("flyin"), 1400);
    schedule(() => setPhase("settle"), 2200);
    schedule(() => setPhase("idle"), 2800);
  }, [interactiveSuperMax, phase, schedule]);

  const baseClasses =
    "select-none font-display text-4xl font-extrabold uppercase tracking-tighter md:text-5xl";

  if (!isSuperMax || reduceMotion) {
    return (
      <h1 className={`${baseClasses} cursor-default text-white`}>{title}</h1>
    );
  }

  const overflowForPhase =
    phase === "flyout" || phase === "flyin"
      ? "overflow-visible"
      : "overflow-hidden";

  return (
    <div className={overflowForPhase}>
      <h1
        onClick={handleClick}
        className={`${baseClasses} supermax-title relative cursor-pointer whitespace-nowrap`}
        data-phase={phase}
      >
        {title}
      </h1>
    </div>
  );
}

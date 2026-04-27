"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { FireworkCanvas } from "@/components/photos/firework-canvas";
import { FogCanvas } from "@/components/photos/fog-canvas";
import { NYCTitle } from "@/components/photos/nyc-title";
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
  const isNewYear = slug === "new-year";
  const isNYC = slug === "new-york";
  const interactiveSuperMax = isSuperMax && !reduceMotion;
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [ukFlying, setUkFlying] = useState(false);
  const [fogActive, setFogActive] = useState(false);
  const [fireworkActive, setFireworkActive] = useState(false);
  const snowfallRef = useRef<SnowfallCanvasHandle>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** Bumps on flyby start so a late pointerdown prime cannot pause real playback. */
  const audioGenerationRef = useRef(0);

  useEffect(() => {
    if (!interactiveSuperMax) return;
    void fetch("/sfx/passby.mp3").catch(() => {});
    const el = new Audio("/sfx/passby.mp3");
    el.preload = "auto";
    audioRef.current = el;
    return () => {
      audioRef.current = null;
    };
  }, [interactiveSuperMax]);

  // Unconditional unmount cleanup so timeouts from any effect (UK flyby,
  // Super Max flyby) don't fire on an unmounted component.
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

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

  const startFog = useCallback(() => {
    if (fogActive) return;
    setFogActive(true);
  }, [fogActive]);

  const startFirework = useCallback(() => {
    if (fireworkActive) return;
    setFireworkActive(true);
  }, [fireworkActive]);

  const getTitleY = useCallback(() => {
    if (!titleRef.current) return window.innerHeight * 0.3;
    const rect = titleRef.current.getBoundingClientRect();
    return rect.top + rect.height / 2;
  }, []);

  const startUKFlyby = useCallback(() => {
    if (ukFlying) return;
    setUkFlying(true);
    timeoutsRef.current.push(setTimeout(() => setUkFlying(false), 2500));
  }, [ukFlying]);

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

  const isLongSingleWordTitle = !title.includes(" ") && title.length >= 10;
  const titleSizeClasses = isLongSingleWordTitle
    ? "text-[clamp(3.35rem,12.4vw,5.4rem)] sm:text-[clamp(3.8rem,12vw,6rem)]"
    : "text-[clamp(4.5rem,15vw,6rem)]";
  const baseClasses =
    `select-none font-display ${titleSizeClasses} font-extrabold uppercase tracking-tighter leading-[1.08] md:text-8xl`;

  if (!isSuperMax || reduceMotion) {
    if (isNYC && !reduceMotion) {
      return <NYCTitle baseClasses={baseClasses} />;
    }

    const effectMap: Record<string, () => void> = {
      "new-year": startFirework,
      smokies: startFog,
      "uk-2025": startUKFlyby,
      snowfall: () => snowfallRef.current?.triggerBurst(),
    };
    const handleClick = !reduceMotion ? effectMap[slug] : undefined;
    const isInteractive = handleClick !== undefined;

    const heading = (
      <h1
        ref={isNewYear ? titleRef : undefined}
        className={`${baseClasses} mx-auto max-w-full py-2 ${
          isInteractive ? "cursor-pointer" : "cursor-default"
        } ${isLongSingleWordTitle ? "[overflow-wrap:anywhere]" : ""} ${
          ukFlying ? "uk-flag-fly" : "text-white"
        }`}
        onClick={handleClick}
      >
        {title}
      </h1>
    );

    return (
      <>
        {heading}
        {isSnowfall && !reduceMotion && <SnowfallCanvas ref={snowfallRef} />}
        {fogActive && (
          <FogCanvas
            active={fogActive}
            onComplete={() => setFogActive(false)}
          />
        )}
        {fireworkActive && (
          <FireworkCanvas
            active={fireworkActive}
            onComplete={() => setFireworkActive(false)}
            titleY={getTitleY()}
          />
        )}
      </>
    );
  }

  const overflowForPhase =
    phase === "flyout" || phase === "flyin"
      ? "overflow-visible"
      : "overflow-hidden";

  return (
    <div className={`${overflowForPhase} py-2`}>
      {/* React 19 hoists this <link> into <head>; only loaded on the Super Max route */}
      <link rel="preload" href="/sfx/passby.mp3" as="audio" type="audio/mpeg" />
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

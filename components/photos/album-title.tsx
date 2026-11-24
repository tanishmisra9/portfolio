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
import { CONTENT_TITLE_CLASSES } from "@/components/ui/class-constants";
import { ANIM_PHASE, move, type AnimPhase } from "@/lib/state-machines";

type Props = {
  title: string;
  slug: string;
};

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

  useEffect(() => {
    if (!interactiveSuperMax) return;
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
    const src = audioRef.current;
    if (!src) return;
    const sfx = src.cloneNode() as HTMLAudioElement;
    sfx.volume = 0.595;
    sfx.onended = () => {
      sfx.src = "";
    };
    void sfx.play().catch(() => {});
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

    playPassby();

    const go = (to: AnimPhase) => setPhase((from) => move(ANIM_PHASE, from, to));
    go("wipe");
    schedule(() => go("flyout"), 800);
    schedule(() => go("flyin"), 1400);
    schedule(() => go("settle"), 2200);
    schedule(() => go("idle"), 2800);
  }, [interactiveSuperMax, phase, playPassby, schedule]);

  const baseClasses = `${CONTENT_TITLE_CLASSES} capitalize`;

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
        className={`${baseClasses} ${
          isInteractive ? "cursor-pointer" : "cursor-default"
        } ${
          ukFlying ? "uk-flag-fly" : "text-fg"
        }`}
      >
        {isInteractive ? (
          <button type="button" onClick={handleClick} className="[font:inherit] [letter-spacing:inherit] [text-transform:inherit] [text-align:inherit] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70">
            {title}
          </button>
        ) : (
          title
        )}
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
    <div className={overflowForPhase}>
      {/* React 19 hoists this <link> into <head>; only loaded on the Super Max route */}
      <link rel="preload" href="/sfx/passby.mp3" as="audio" type="audio/mpeg" />
      <h1
        className={`${baseClasses} supermax-title relative whitespace-nowrap`}
        data-phase={phase}
      >
        <button type="button" onClick={startFlyby} className="[font:inherit] [letter-spacing:inherit] [text-transform:inherit] [text-align:inherit] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70">
          {title}
        </button>
      </h1>
    </div>
  );
}

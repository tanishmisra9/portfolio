"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NYCExplosion } from "@/components/photos/nyc-explosion";

type Phase = "idle" | "swap" | "hold";

type Props = {
  baseClasses: string;
};

const NYC_SWAP_MS = 500;
const NYC_BURST_MS = 900;
const NYC_EXPLOSION_COOLDOWN_MS = 1000;

export function NYCTitle({ baseClasses }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [exploding, setExploding] = useState(false);
  const [explosionKey, setExplosionKey] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);

  const heartRef = useRef<HTMLImageElement>(null);
  const heartPosRef = useRef({ x: 0, y: 0 });
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastExplosionAtRef = useRef(0);

  useEffect(() => {
    const img = new window.Image();
    img.src = "/heart.png";
    img.decoding = "async";
    img.decode?.().catch(() => {});
  }, []);

  useEffect(() => {
    if ("fonts" in document && typeof document.fonts?.load === "function") {
      document.fonts
        .load('500 1em "ITC American Typewriter"', "INYO")
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  const sched = useCallback((fn: () => void, ms: number) => {
    const timeoutId = setTimeout(fn, ms);
    timeoutsRef.current.push(timeoutId);
  }, []);

  const captureHeartPos = useCallback(() => {
    const heartEl = heartRef.current;
    if (!heartEl) return;

    const rect = heartEl.getBoundingClientRect();
    heartPosRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  const triggerExplosion = useCallback(() => {
    captureHeartPos();
    lastExplosionAtRef.current = Date.now();
    setExplosionKey((current) => current + 1);
    setExploding(true);
  }, [captureHeartPos]);

  const handleClick = useCallback(() => {
    if (phase === "swap") {
      return;
    }

    if (phase === "hold") {
      const lastExplosionAt = lastExplosionAtRef.current;
      if (
        lastExplosionAt === 0 ||
        Date.now() - lastExplosionAt < NYC_EXPLOSION_COOLDOWN_MS
      ) {
        return;
      }

      triggerExplosion();
      return;
    }

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setPhase("swap");
    setHasPlayed(true);

    sched(() => {
      setPhase("hold");
    }, NYC_SWAP_MS);

    sched(() => {
      triggerExplosion();
    }, NYC_BURST_MS);
  }, [phase, sched, triggerExplosion]);

  const showILoveNY = phase !== "idle" || hasPlayed;

  return (
    <>
      <h1
        onClick={handleClick}
        className="nyc-title-container relative inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap py-2 text-white"
      >
        <span
          className={`${baseClasses} nyc-title-layer block ${
            showILoveNY ? "scale-95 opacity-0" : "scale-100 opacity-100"
          }`}
          aria-hidden={showILoveNY}
        >
          NEW YORK
        </span>

        <span
          className={`${baseClasses} nyc-title-layer nyc-ilove-text absolute inset-0 flex items-center justify-center ${
            showILoveNY ? "scale-100 opacity-100" : "scale-105 opacity-0"
          }`}
          aria-hidden={!showILoveNY}
        >
          <span className="nyc-typewriter-text">I</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={heartRef}
            src="/heart.png"
            alt=""
            aria-hidden
            className="pointer-events-none mx-[0.15em] h-[0.7em] w-auto select-none"
            decoding="async"
            draggable={false}
            fetchPriority="high"
          />
          <span className="nyc-typewriter-text">NY</span>
        </span>
      </h1>

      {exploding && (
        <NYCExplosion
          key={explosionKey}
          active={true}
          onComplete={() => {
            setExploding(false);
          }}
          heartX={heartPosRef.current.x}
          heartY={heartPosRef.current.y}
        />
      )}
    </>
  );
}

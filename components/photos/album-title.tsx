"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { FireworkCanvas } from "@/components/photos/firework-canvas";
import { FogCanvas } from "@/components/photos/fog-canvas";
import {
  SnowfallCanvas,
  type SnowfallCanvasHandle,
} from "@/components/photos/snowfall-canvas";

type Props = {
  title: string;
  slug: string;
};

type AnimPhase = "idle" | "wipe" | "flyout" | "flyin" | "settle";

type NYCProfile = { scaleY: number; scaleX: number; skew: number };

type RangeProfile = {
  scaleY: [number, number];
  scaleX: [number, number];
  skew: [number, number];
};

/**
 * Distinct skyline silhouettes for the NYC morph. Each template is an 8-tuple
 * matching "NEW YORK" (idx 3 is the space, always identity). On each click we
 * pick a different template than the previous one, then randomise within the
 * picked template — so consecutive clicks both vary in micro detail AND draw a
 * visibly different city profile.
 *
 * Tallest letter in each template is paired with the narrowest scaleX (thin
 * spire); shortest with the widest scaleX (squat low-rise).
 */
const NYC_SKYLINE_TEMPLATES: RangeProfile[][] = [
  // 0: "Spire" — W is the dominant peak, classic Manhattan-style midtown profile.
  [
    { scaleY: [1.30, 1.80], scaleX: [0.92, 1.05], skew: [-3.5,  1.0] },  // N
    { scaleY: [0.35, 0.65], scaleX: [0.85, 0.95], skew: [-1.0,  2.5] },  // E
    { scaleY: [2.55, 3.05], scaleX: [0.72, 0.84], skew: [-5.0, -1.0] },  // W  PEAK SPIRE
    { scaleY: [1.00, 1.00], scaleX: [1.00, 1.00], skew: [ 0.0,  0.0] },  // (space)
    { scaleY: [1.70, 2.20], scaleX: [0.88, 1.00], skew: [ 0.0,  4.0] },  // Y
    { scaleY: [0.25, 0.50], scaleX: [1.18, 1.38], skew: [-2.0,  2.0] },  // O  squat fat
    { scaleY: [1.00, 1.45], scaleX: [0.94, 1.08], skew: [ 0.5,  5.0] },  // R
    { scaleY: [1.50, 1.95], scaleX: [0.86, 0.96], skew: [-4.5,  0.0] },  // K
  ],
  // 1: "Empire" — Y is the mega-peak (Empire State Building), W and K flank it.
  [
    { scaleY: [0.50, 0.85], scaleX: [1.00, 1.15], skew: [ 1.0,  3.5] },  // N  short
    { scaleY: [1.30, 1.70], scaleX: [0.90, 1.00], skew: [-2.5,  1.0] },  // E  mid
    { scaleY: [1.50, 1.95], scaleX: [0.88, 0.98], skew: [-3.5, -0.5] },  // W  tall
    { scaleY: [1.00, 1.00], scaleX: [1.00, 1.00], skew: [ 0.0,  0.0] },  // (space)
    { scaleY: [2.55, 3.10], scaleX: [0.72, 0.84], skew: [-1.5,  4.0] },  // Y  MEGA SPIRE
    { scaleY: [0.40, 0.75], scaleX: [1.10, 1.30], skew: [-2.5,  1.5] },  // O
    { scaleY: [1.40, 1.80], scaleX: [0.92, 1.04], skew: [ 0.5,  5.0] },  // R  tall
    { scaleY: [1.55, 2.00], scaleX: [0.88, 0.98], skew: [-4.5,  0.5] },  // K  tall
  ],
  // 2: "Freedom Tower" — K is the rightmost spire, W is supporting peak.
  [
    { scaleY: [1.20, 1.65], scaleX: [0.92, 1.04], skew: [-2.5,  1.5] },  // N
    { scaleY: [0.35, 0.70], scaleX: [1.10, 1.30], skew: [-1.5,  2.5] },  // E  low
    { scaleY: [1.40, 1.80], scaleX: [0.90, 1.00], skew: [-4.0, -0.5] },  // W  tall
    { scaleY: [1.00, 1.00], scaleX: [1.00, 1.00], skew: [ 0.0,  0.0] },  // (space)
    { scaleY: [0.75, 1.15], scaleX: [0.96, 1.10], skew: [-1.0,  3.0] },  // Y  mid
    { scaleY: [0.30, 0.60], scaleX: [1.15, 1.35], skew: [-2.5,  2.5] },  // O
    { scaleY: [1.10, 1.50], scaleX: [0.94, 1.06], skew: [ 0.5,  4.0] },  // R
    { scaleY: [2.55, 3.05], scaleX: [0.72, 0.84], skew: [-4.0,  1.0] },  // K  PEAK SPIRE
  ],
  // 3: "Asymmetric" — R is the unexpected peak, low-rises on either side.
  [
    { scaleY: [1.35, 1.80], scaleX: [0.90, 1.02], skew: [-4.5,  0.0] },  // N  tall
    { scaleY: [0.45, 0.80], scaleX: [1.05, 1.20], skew: [-1.5,  2.0] },  // E
    { scaleY: [1.05, 1.50], scaleX: [0.94, 1.06], skew: [-2.5,  1.5] },  // W  mid
    { scaleY: [1.00, 1.00], scaleX: [1.00, 1.00], skew: [ 0.0,  0.0] },  // (space)
    { scaleY: [0.40, 0.80], scaleX: [1.05, 1.20], skew: [-1.0,  2.5] },  // Y  low
    { scaleY: [1.10, 1.55], scaleX: [0.94, 1.04], skew: [-1.5,  3.0] },  // O  mid
    { scaleY: [2.55, 3.05], scaleX: [0.74, 0.86], skew: [ 1.0,  5.0] },  // R  PEAK SPIRE
    { scaleY: [1.45, 1.95], scaleX: [0.88, 0.98], skew: [-4.5,  0.5] },  // K  tall
  ],
];

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function profilesFromTemplate(tpl: RangeProfile[]): NYCProfile[] {
  return tpl.map((p) => ({
    scaleY: rand(p.scaleY[0], p.scaleY[1]),
    scaleX: rand(p.scaleX[0], p.scaleX[1]),
    skew: rand(p.skew[0], p.skew[1]),
  }));
}

/**
 * Pick the next template index, avoiding the previous one so consecutive clicks
 * never produce the same silhouette. Returns the chosen index alongside the
 * generated profiles so callers can persist it for the next no-repeat draw.
 */
function generateNYCProfiles(prevTemplateIdx: number): {
  profiles: NYCProfile[];
  templateIdx: number;
} {
  const total = NYC_SKYLINE_TEMPLATES.length;
  let next: number;
  if (prevTemplateIdx < 0 || total <= 1) {
    next = Math.floor(Math.random() * total);
  } else {
    next = Math.floor(Math.random() * (total - 1));
    if (next >= prevTemplateIdx) next += 1;
  }
  return {
    profiles: profilesFromTemplate(NYC_SKYLINE_TEMPLATES[next]),
    templateIdx: next,
  };
}

/** Deterministic median values for SSR / first paint (rect state, not visible). */
const NYC_DEFAULT_PROFILES: NYCProfile[] = NYC_SKYLINE_TEMPLATES[0].map((p) => ({
  scaleY: (p.scaleY[0] + p.scaleY[1]) / 2,
  scaleX: (p.scaleX[0] + p.scaleX[1]) / 2,
  skew: (p.skew[0] + p.skew[1]) / 2,
}));

/**
 * Per-letter morph-out delays (ms). Shuffles the letter indices into a random
 * order so the "domino" cascade hits letters in a different sequence every
 * click — never strictly L→R — then layers per-slot jitter on top so adjacent
 * slots never land on a metronome.
 *
 * 100ms baseStep (≈6 frames at 60fps) keeps each letter's pop visibly distinct
 * from its neighbours while keeping the full cascade snappy. Worst-case slot 7
 * delay ≈ 712ms; +1.2s morph-out ≈ 1912ms total — covered by the 2100ms
 * returning-state hold in startNYCMorph.
 */
const NYC_RETURN_BASE_STEP_MS = 100;
const NYC_RETURN_JITTER_MS = 25;

function generateReturnDelays(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const delays = new Array<number>(length).fill(0);
  order.forEach((letterIdx, slot) => {
    const jitter = (Math.random() - 0.5) * NYC_RETURN_JITTER_MS;
    delays[letterIdx] = Math.max(0, slot * NYC_RETURN_BASE_STEP_MS + jitter);
  });
  return delays;
}

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
  const [nycMorph, setNycMorph] = useState<"rect" | "skyline" | "returning">(
    "rect",
  );
  const [nycProfiles, setNycProfiles] = useState<NYCProfile[]>(NYC_DEFAULT_PROFILES);
  /**
   * Random per-letter delays for the morph-out "domino" cascade. Default is
   * an all-zero array (rect state isn't animating, so values are irrelevant
   * until the first click); regenerated fresh on each click in startNYCMorph.
   */
  const [nycReturnDelays, setNycReturnDelays] = useState<number[]>(() =>
    Array(title.length).fill(0),
  );
  const snowfallRef = useRef<SnowfallCanvasHandle>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** Last NYC skyline template index, so the next click never picks the same one. */
  const nycLastTemplateRef = useRef<number>(-1);
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

  const startNYCMorph = useCallback(() => {
    if (nycMorph !== "rect") return;
    const { profiles, templateIdx } = generateNYCProfiles(
      nycLastTemplateRef.current,
    );
    nycLastTemplateRef.current = templateIdx;
    setNycProfiles(profiles);
    setNycReturnDelays(generateReturnDelays(title.length));
    setNycMorph("skyline");
    /* Three-phase, with morph-in tuned for clear cascading "pops" rather than
       a slow elastic settle that reads as letters floating in the air:
         skyline   0–1400ms : energetic 0.6s-per-letter cascade at 110ms stagger
                              (last letter lands at ~1370ms, ~30ms peak before
                              morph-out — no dead "in the air" hold).
         returning 1400–3500ms : random-order domino retraction with hold-then-fade
                                 colour (vibrancy persists until the very last
                                 frames of each letter's retraction).
       Worst-case morph-out completion: 1400 + 712ms (last cascade slot) +
       1200ms transform = 3312ms — comfortably inside the 3500ms hand-off. */
    schedule(() => setNycMorph("returning"), 1400);
    schedule(() => setNycMorph("rect"), 3500);
  }, [nycMorph, schedule, title.length]);

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

  const baseClasses =
    "select-none font-display text-6xl font-extrabold uppercase tracking-tighter leading-[1.15] md:text-8xl";

  if (!isSuperMax || reduceMotion) {
    const effectMap: Record<string, () => void> = {
      "new-year": startFirework,
      smokies: startFog,
      "uk-2025": startUKFlyby,
      snowfall: () => snowfallRef.current?.triggerBurst(),
      "new-york": startNYCMorph,
    };
    const handleClick = !reduceMotion ? effectMap[slug] : undefined;
    const isInteractive = handleClick !== undefined;
    const useNYC = isNYC && !reduceMotion;

    const titleContent = useNYC
      ? Array.from(title).map((ch, i) => {
          const profile = nycProfiles[i] ?? NYC_DEFAULT_PROFILES[i];
          const returnDelayMs = Math.round(nycReturnDelays[i] ?? 0);
          return (
            <span
              key={i}
              className="nyc-skyline-letter"
              style={
                {
                  ["--nyc-idx" as string]: i,
                  ["--nyc-scale-y" as string]: profile.scaleY.toFixed(3),
                  ["--nyc-scale-x" as string]: profile.scaleX.toFixed(3),
                  ["--nyc-skew" as string]: `${profile.skew.toFixed(2)}deg`,
                  /* Consumed by the returning-state colour AND blur animations
                     (see globals.css) — same delay drives all three (transform,
                     hold-then-fade colour, blur) so they resolve in lockstep. */
                  ["--nyc-return-delay" as string]: `${returnDelayMs}ms`,
                  /* Transform-only delay: morph-in staggers L→R at 110ms so each
                     letter's pop reads as its own beat in the cascade rather than
                     a blurred-together rise; morph-out uses the per-click random
                     domino delay so every retraction lands at a different shuffled
                     cadence. */
                  transitionDelay:
                    nycMorph === "skyline"
                      ? `${i * 110}ms`
                      : `${returnDelayMs}ms`,
                } as React.CSSProperties
              }
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          );
        })
      : title;

    const heading = (
      <h1
        ref={isNewYear ? titleRef : undefined}
        className={`${baseClasses} py-2 ${
          isInteractive ? "cursor-pointer" : "cursor-default"
        } ${ukFlying ? "uk-flag-fly" : "text-white"}${
          useNYC ? " nyc-skyline-morph" : ""
        }`}
        onClick={handleClick}
      >
        {titleContent}
      </h1>
    );

    return (
      <>
        {useNYC ? (
          <div className="nyc-skyline-stage" data-morph={nycMorph}>
            {heading}
          </div>
        ) : (
          heading
        )}
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
      <link rel="preload" href="/passby.mp3" as="audio" type="audio/mpeg" />
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

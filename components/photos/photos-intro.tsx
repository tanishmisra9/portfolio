"use client";

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPencilVoice, type PencilVoice } from "pencil-voice";
import { SITE_PENCIL } from "@/lib/pencil/config";
import { PencilStroke } from "./pencil-stroke";

// One day of light passes over the manifesto, and it always resolves into the page's
// own theme: dark mode is a sunset (page → golden hour → blue hour → night), light mode
// a sunrise (pre-dawn → dawn → golden → daylight). The colours live in theme-scoped
// CSS variables (.photos-day in globals.css, all WCAG-measured); this file only knows
// "layer 0–3" and "text 1–4". One typeface, one display size, nothing scales: the
// motion is light, typing and selection. Every value is scrubbed, so it rewinds.

const v = (name: string) => `var(--pd-${name})`;

// ── Copy (edit freely) ──
const TYPED = "What I believe in.";
type Seg = { t: string; color?: string; select?: boolean };
// One thought in two halves, linked by a drawn arrow where the first one's period would be.
const ANYONE: Seg[] = [{ t: "I think" }, { t: "anyone", select: true }, { t: "can be a photographer" }];
const POCKET: Seg[] = [{ t: "since the best camera is the one in your" }, { t: "pocket.", select: true }];
const NEON = "Mobile photography.";
const PARAGRAPH: Seg[] = [
  { t: "No bag of lenses, no presets, no plan. Just" },
  { t: "rain on glass,", color: v("rain") },
  { t: "night light", color: v("sodium") },
  { t: "and" },
  { t: "golden hour,", color: v("gold") },
  { t: "caught on the way to somewhere else." },
];

// ── Timeline (fractions of the section's scroll distance) ──
type R = readonly [number, number];
const T = {
  l0: [0, 0.03] as R, // light mode: the page dims to pre-dawn only after the stage pins (no dark slab scrolling in)
  type: [0.03, 0.095] as R, // typing starts once it is dark enough to read white text
  l1: [0.12, 0.2] as R, // the light horizon: layer 1 rises up the stage and carries beat 1 out, beat 2 in
  sunset: [0.12, 0.42] as R, // dark mode: the sun sinks through layer 1 (golden hour)
  sunrise: [0.38, 0.66] as R, // light mode: the sun rises through layer 2 (golden morning)
  pair: { in: [0.12, 0.1201] as R, out: [0.61, 0.64] as R }, // revealed by the horizon's mask, not a fade
  anyone: { words: [0.19, 0.25] as R, select: [0.25, 0.29] as R },
  // The arrow: its curl is drawn in place, then the camera follows the pen down to the
  // next phrase through the whole sky change, then the arrowhead's two strokes, in turn.
  curl: [0.295, 0.32] as R,
  travel: [0.32, 0.45] as R,
  head: [0.45, 0.47] as R, // the same stroke carries on into the arrowhead
  l2: [0.34, 0.44] as R,
  sky: 0.38, // the first phrase and the arrow take the second sky's colour here
  pocket: { words: [0.475, 0.53] as R, select: [0.535, 0.575] as R },
  l3: [0.62, 0.68] as R,
  neon: { in: [0.65, 0.68] as R, letters: [0.68, 0.76] as R },
  para: { in: [0.77, 0.79] as R, words: [0.79, 0.94] as R },
};

const SUN = "absolute left-[62%] top-0 aspect-square w-[min(110vmax,1400px)] -translate-x-1/2";
const SUN_GRADIENT = "radial-gradient(closest-side, #ffe3a3 0%, rgba(255,214,140,0.6) 35%, rgba(255,200,120,0) 100%)";

const SIZE = "text-[clamp(2.75rem,7vw,6rem)]/[1.1]";
const DISPLAY = `font-display font-bold tracking-tight text-balance ${SIZE} pb-[0.08em]`;
const BODY = "max-w-[34ch] text-xl/[1.55] font-[300] md:max-w-[54ch] md:text-[1.75rem]/[1.5]";
// Glow strength is a theme variable: lit signs glow at night, not in daylight.
const glow = (c: string) =>
  `0 0 0.35em color-mix(in srgb, ${c} var(--pd-glow), transparent), 0 0 1.2em color-mix(in srgb, ${c} calc(var(--pd-glow) / 2), transparent)`;
// The "Mobile photography." sign: a hotter core, a fuller halo and a wide bloom (it breathes once lit, see NeonSign).
// Still 0 in daylight, where --pd-glow is 0.
const NEON_G = "var(--pd-glow)";
const neonGlow = (c: string) =>
  `0 0 0.2em color-mix(in srgb, ${c} calc(${NEON_G} * 1.3), transparent), 0 0 0.8em color-mix(in srgb, ${c} calc(${NEON_G}), transparent), 0 0 2.2em color-mix(in srgb, ${c} calc(${NEON_G} * 0.6), transparent)`;

/**
 * "Mobile photography." as a lit sign. While its letters switch on, the heading carries the glow itself. Once fully
 * lit, the glow moves to a copy of the text on its own layer (transparent letters, shadows only), and the breathing
 * animates that layer's opacity 1 → 0.55 → 1 (globals.css `.pd-neon-glow`).
 *
 * Performance: the breathing used to animate a custom property inside the three large blurred text-shadows, which
 * repainted those blurs every frame, even while the reader scrolled the note and collections below. Measured on an
 * emulated iPhone 13 (6× CPU): GPU work while scrolling past it fell 421 → 102 ms per 100 frames with it off. An opacity
 * animation runs on the compositor from one rasterised layer, and scaling the layer's opacity scales the shadows' alpha
 * exactly as the old multiplier did, so it looks the same. It also pauses whenever the sign is off screen.
 */
const NEON_GLOW = neonGlow(v("sodium"));

/**
 * Lit or not is written straight to the DOM by `lightNeon` (from the scroll listener), never through React state: a state
 * flip re-rendered the whole intro on that scroll frame, a visible hitch. The same goes for pausing off screen.
 */
function NeonSign({ signRef, children }: { signRef: RefObject<HTMLDivElement | null>; children: ReactNode }) {
  useEffect(() => {
    const glow = signRef.current?.querySelector(".pd-neon-glow");
    if (!glow) return;
    const io = new IntersectionObserver(([e]) => glow.toggleAttribute("data-paused", !e.isIntersecting));
    io.observe(glow);
    return () => io.disconnect();
  }, [signRef]);
  return (
    <div ref={signRef} className="relative">
      {/* Shadows only (transparent letters), behind the real text; same classes, so it wraps identically. */}
      <span
        aria-hidden
        className={`${DISPLAY} pd-neon-glow pointer-events-none absolute inset-0 block select-none text-transparent`}
        style={{ textShadow: NEON_GLOW }}
      >
        {NEON}
      </span>
      <h2 aria-label={NEON} className={`${DISPLAY} pd-neon relative`} style={{ textShadow: NEON_GLOW }}>
        {children}
      </h2>
    </div>
  );
}

/** Lit: the glow moves from the heading's own shadow to the breathing layer (see NeonSign). Writes only on a change. */
function lightNeon(sign: HTMLDivElement | null, lit: boolean) {
  const glow = sign?.querySelector(".pd-neon-glow");
  const h2 = sign?.querySelector<HTMLElement>(".pd-neon");
  if (!glow || !h2 || glow.hasAttribute("data-lit") === lit) return;
  glow.toggleAttribute("data-lit", lit);
  h2.style.textShadow = lit ? "none" : NEON_GLOW;
}

const words = (segs: Seg[]) =>
  segs.flatMap(({ t, color, select }) => t.split(" ").map((w) => ({ w, color, select })));

// ── Pieces ──

type Anchor = "from" | "to" | undefined;
const anchorAttr = (a: Anchor) => (a === "from" ? { "data-arrow-from": "" } : a === "to" ? { "data-arrow-to": "" } : {});

function LitWord({ p, range, color, select, circle, sound, anchor, children }: {
  p: MotionValue<number>; range: R; color?: string; select?: boolean; circle?: R; sound?: SoundRef; anchor?: Anchor; children: string;
}) {
  const opacity = useTransform(p, [...range], [0.15, 1]);
  return (
    <motion.span {...anchorAttr(anchor)} style={{ opacity, color, textShadow: color ? glow(color) : undefined }}>
      {select && circle ? <PencilCircle p={p} range={circle} sound={sound}>{children}</PencilCircle> : children}{" "}
    </motion.span>
  );
}

function LitWords({ p, segs, range, circle, sound, anchor }: {
  p: MotionValue<number>; segs: Seg[]; range: R; circle?: R; sound?: SoundRef; anchor?: "first" | "last";
}) {
  const list = words(segs);
  const step = (range[1] - range[0]) / list.length;
  return (
    <>
      {list.map(({ w, color, select }, i) => (
        <LitWord
          key={i} p={p} range={[range[0] + i * step, range[0] + (i + 1) * step]} color={color} select={select} circle={circle} sound={sound}
          anchor={anchor === "last" && i === list.length - 1 ? "from" : anchor === "first" && i === 0 ? "to" : undefined}
        >
          {w}
        </LitWord>
      ))}
    </>
  );
}

/** A neon tube switching on: off → on → stutter → on. */
const FLICKER = 0.0025; // one step of a letter's off → on → stutter → on
// The last letter's stutter has finished: from here the sign is lit and its glow breathes.
const NEON_LIT = T.neon.letters[1] + 3 * FLICKER;

function NeonLetter({ p, t, children }: { p: MotionValue<number>; t: number; children: string }) {
  const d = FLICKER;
  const opacity = useTransform(p, [t, t + d, t + 2 * d, t + 3 * d], [0.08, 1, 0.35, 1]);
  return <motion.span style={{ opacity }}>{children}</motion.span>;
}

function Typed({ p }: { p: MotionValue<number> }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const caret = useTransform(p, (x): number => (x < T.l1[0] ? 1 : 0));
  // Letters are written straight to the DOM, not through state: a state update per letter was a React commit on that
  // scroll frame (18 per pass).
  const type = (v: number) => {
    const el = textRef.current;
    const k = Math.round(Math.min(1, Math.max(0, (v - T.type[0]) / (T.type[1] - T.type[0]))) * TYPED.length);
    if (el && el.textContent!.length !== k) el.textContent = TYPED.slice(0, k);
  };
  useMotionValueEvent(p, "change", type);
  useLayoutEffect(() => type(p.get()), [p]); // a reload partway down
  return (
    // The heading carries the name (aria-label on its <h2>): a label on a plain <span> is ignored by many screen
    // readers, and the partly typed text is aria-hidden, so the line was read as nothing.
    <span>
      <span ref={textRef} aria-hidden />
      {/* Gone once the horizon starts: a time-driven blink on a line being wiped by scroll is a second rhythm. */}
      <motion.span aria-hidden style={{ opacity: caret }} className="ml-[0.18em] inline-block h-[0.85em] w-[0.09em] translate-y-[0.1em] animate-[caret_1.05s_steps(1,end)_infinite] bg-current" />
    </span>
  );
}

// ── The light horizon (beat 1 → beat 2) ──
// Layer 1 doesn't fade in: it rises up the stage as a soft-edged band of light. Where its
// edge passes "What I believe in." the letters dissolve into it, and "I think anyone…" is
// already there underneath, in the light. One edge drives the sky mask, both text masks
// and the nav's ink, so they can never disagree.
const HORIZON_FEATHER = 18; // % of the stage: half the soft band of the sky's edge
const TEXT_FEATHER = 0.035; // of the stage height: half the band a line dissolves across

/** The horizon's height at scroll x, as % from the stage's top: below the bottom before the
 *  wipe, past the top after it (each by the feather, so both ends are clean). */
const horizonAt = (x: number) =>
  100 + HORIZON_FEATHER - (100 + 2 * HORIZON_FEATHER) * easeInOut(clamp01((x - T.l1[0]) / (T.l1[1] - T.l1[0])));
const inWipe = (x: number) => x >= T.l1[0] && x < T.l1[1];

// Which sky layer is dominant behind the nav: layer 1 once the horizon has passed the top,
// the midpoint of each later crossfade. null before the light-mode pre-dawn has come up
// (the page is still showing) and after the intro.
const skyBehindNav = (x: number): number | null =>
  x < (T.l0[0] + T.l0[1]) / 2 || x >= 1 ? null
  : x < T.l1[1] && horizonAt(x) > 0 ? 0
  : x < (T.l2[0] + T.l2[1]) / 2 ? 1
  : x < (T.l3[0] + T.l3[1]) / 2 ? 2
  : 3;

// The four beats share one grid cell, so invisible later beats sit on top of the
// visible one. Only the visible beat may take the pointer, or a drag-to-copy over
// "anyone" selects the invisible night paragraph instead.
const useHit = (opacity: MotionValue<number>) =>
  useTransform(opacity, (o): "auto" | "none" => (o > 0.5 ? "auto" : "none"));

// ── The linking arrow ──
// Stands in for the first phrase's period and carries the reader to the next screen:
// a loose curl out of "photographer", then a wandering fall down the gutter to "since".
// It is meant to look hand-drawn, so nothing is a clean geometric curve: waypoints get
// seeded jitter, the line is resampled and wobbled, then smoothed (Catmull-Rom).
// The arrowhead is two separate strokes of unequal length, drawn after the line, one
// after the other, like a hand lifting the pen. Measured from the real word boxes, so
// it follows any line break; the seed keeps the shape stable across re-measures.
type Pt = [number, number];
type ArrowPath = { body: string; width: number; curlFrac: number; bodyFrac: number; tipY: number[]; halves: [number, number] };

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Catmull-Rom through the points → one smooth cubic path. */
function smooth(pts: Pt[]) {
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1] ?? pts[i], pts[i], pts[i + 1], pts[i + 2] ?? pts[i + 1]];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function handDrawnArrow(A: Pt, B: Pt, em: number, width: number) {
  const r = rng(11);
  const j = (amt: number) => (r() * 2 - 1) * amt * em;
  const inside = (x: number) => Math.min(width - 0.25 * em, Math.max(0.15 * em, x));
  // The curl loops once, toward open space: right of the word, or back over it when
  // the word ends at the column edge (phones).
  const dir = A[0] + 1.1 * em < width ? 1 : -1;
  const at = (base: Pt, dx: number, dy: number, amt = 0.04): Pt => [inside(base[0] + dir * dx * em + j(amt)), base[1] + dy * em + j(amt)];
  const curl: Pt[] = [A, at(A, 0.38, -0.3), at(A, 0.88, 0.02), at(A, 0.7, 0.58), at(A, 0.28, 0.46), at(A, 0.42, 1.05)];
  // The fall: mostly a tall drop with a loose sway, sweeping left to "since" only near
  // the bottom, so the stroke reads vertical rather than as a diagonal across the page.
  // A J: a tall, loosely swaying drop down the right, then a sweep left near the
  // bottom, then straight down into "since". The camera follows the tip's height
  // (see `tipY`), so on screen the long drop reads as a vertical stroke.
  const start = curl[curl.length - 1];
  const sweepY = B[1] - 1.05 * em; // the sideways run, in the gap just above "since"
  const drop = sweepY - start[1];
  const sway = [0.35, -0.25, 0.3, -0.12].map((s) => s * (0.7 + r() * 0.6));
  const left = B[0] - 0.42 * em; // the corner the pencil rounds before turning in at "since"
  const fall: Pt[] = [
    ...sway.map((sw, k): Pt => [inside(start[0] + sw * em), start[1] + drop * (0.15 + 0.18 * k) + j(0.1)]),
    [inside(start[0] - 0.6 * em), sweepY - 0.1 * em], // the turn
    [(start[0] + left) / 2 + j(0.2), sweepY + j(0.08)], // the sweep
    [left, sweepY + 0.4 * em], // rounding the corner
    [left + 0.06 * em, B[1]], // level with "since": a short straight run in, so the head points at it
  ];
  const way = [...curl, ...fall, B];

  // Sample along a smooth spline through the waypoints (no corners), then add a small
  // perpendicular wobble so even the smooth stretches waver like a real pen.
  const cr = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
    const t2 = t * t;
    const t3 = t2 * t;
    const f = (a: number, b: number, c: number, d: number) =>
      0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
    return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
  };
  const pts: Pt[] = [way[0]];
  let curlEnd = 0;
  for (let i = 0; i < way.length - 1; i++) {
    const [p0, p1, p2, p3] = [way[i - 1] ?? way[i], way[i], way[i + 1], way[i + 2] ?? way[i + 1]];
    const steps = Math.max(2, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / (0.3 * em)));
    for (let k = 1; k <= steps; k++) {
      const [x, y] = cr(p0, p1, p2, p3, k / steps);
      const last = i === way.length - 2 && k === steps;
      pts.push(last ? [x, y] : [x + j(0.012), y + j(0.012)]);
    }
    if (i === curl.length - 2) curlEnd = pts.length - 1;
  }
  let total = 0;
  let curlLen = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (i === curlEnd) curlLen = total;
  }

  const { d: head, len: headLen } = arrowHead(B, pts[pts.length - 3], em, r);
  const all = total + headLen;
  // The tip's height at each 1% of the stroke, so the camera can follow the pencil.
  const tipY: number[] = [];
  let acc = 0;
  let i = 1;
  for (let k = 0; k <= 100; k++) {
    const want = (k / 100) * total;
    while (i < pts.length - 1 && acc + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) < want) {
      acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      i++;
    }
    tipY.push(pts[i][1]);
  }
  return { body: smooth(pts) + head, curlFrac: curlLen / all, bodyFrac: total / all, tipY };
}

/**
 * The arrowhead without lifting the pencil: from the tip `B`, up one side, back down through the tip, out the other
 * side, pointing away from `from` (a point a little back along the line). Sides deliberately unequal, each slightly
 * bowed. Shared by both arrows; it draws from `r` in a fixed order, so a given seed always gives the same head.
 */
function arrowHead(B: Pt, from: Pt, em: number, r: () => number) {
  const j = (amt: number) => (r() * 2 - 1) * amt * em;
  const dl = Math.hypot(B[0] - from[0], B[1] - from[1]) || 1;
  const back: Pt = [(from[0] - B[0]) / dl, (from[1] - B[1]) / dl];
  const wingEnd = (deg: number, len: number): Pt => {
    const a = (deg * Math.PI) / 180;
    return [B[0] + (back[0] * Math.cos(a) - back[1] * Math.sin(a)) * len * em, B[1] + (back[0] * Math.sin(a) + back[1] * Math.cos(a)) * len * em];
  };
  const w1 = wingEnd(31 + r() * 6, 0.42);
  const w2 = wingEnd(-(24 + r() * 6), 0.36);
  const bow = (a: Pt, b: Pt) => `Q ${((a[0] + b[0]) / 2 + j(0.03)).toFixed(1)} ${((a[1] + b[1]) / 2 + j(0.03)).toFixed(1)}, ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  return {
    d: ` ${bow(B, w1)} ${bow(w1, B)} ${bow(B, w2)}`,
    len: 2 * Math.hypot(w1[0] - B[0], w1[1] - B[1]) + Math.hypot(w2[0] - B[0], w2[1] - B[1]),
  };
}

/**
 * The note's pointer ("Here's my work." → the first collection): a small curl past the end of the line, a
 * loosely swaying fall down the gap, then a short straight run so the head points straight down into the cover.
 * Same construction as the intro arrow (seeded jitter, Catmull-Rom, tiny wobble), smaller and with a fixed seed.
 */
function handDrawnPointer(A: Pt, B: Pt, em: number, width: number) {
  const r = rng(23);
  const j = (amt: number) => (r() * 2 - 1) * amt * em;
  const inside = (x: number) => Math.min(width - 0.25 * em, Math.max(0.15 * em, x));
  const dir = A[0] + 0.8 * em < width ? 1 : -1; // loop toward open space, back over the word at the column edge
  const at = (base: Pt, dx: number, dy: number, amt = 0.03): Pt => [inside(base[0] + dir * dx * em + j(amt)), base[1] + dy * em + j(amt)];
  // A cursive loop *below* the line (down, back under itself, crossing, then on down). The intro's hooked curl,
  // shrunk and set beside a full stop, read as a question mark ("seen.?").
  const curl: Pt[] = [A, at(A, 0.22, 0.4), at(A, 0.12, 0.92), at(A, -0.22, 0.86), at(A, -0.12, 0.5), at(A, 0.26, 0.72), at(A, 0.36, 1.25)];
  const start = curl[curl.length - 1];
  const runTop = B[1] - 0.55 * em; // the straight run in, so the head lands vertical
  // One soft arc: a single midpoint, bowed sideways by ~12% of the sweep. Several sway points (the intro arrow's,
  // ±0.3em) kinked into a zig-zag on a short drop; with no bow, the long sweep to the middle read as a ruler line.
  const [dx, dy] = [B[0] - start[0], runTop - start[1]];
  const span = Math.hypot(dx, dy) || 1;
  const bow = 0.12 * span * (0.85 + r() * 0.3) * (dx <= 0 ? 1 : -1); // bulge away from the direction of travel
  const mid: Pt = [start[0] + dx / 2 + (-dy / span) * bow, start[1] + dy / 2 + (dx / span) * bow];
  // The arc as a quadratic through start, mid (at t = 0.5) and runTop, so points and directions can be read along it.
  const ctrl: Pt = [2 * mid[0] - (start[0] + B[0]) / 2, 2 * mid[1] - (start[1] + runTop) / 2];
  const arcAt = (t: number): Pt => {
    const u = 1 - t;
    return [u * u * start[0] + 2 * u * t * ctrl[0] + t * t * B[0], u * u * start[1] + 2 * u * t * ctrl[1] + t * t * runTop];
  };
  const arcDir = (t: number): Pt => {
    const v: Pt = [2 * (1 - t) * (ctrl[0] - start[0]) + 2 * t * (B[0] - ctrl[0]), 2 * (1 - t) * (ctrl[1] - start[1]) + 2 * t * (runTop - ctrl[1])];
    const l = Math.hypot(v[0], v[1]) || 1;
    return [v[0] / l, v[1] / l];
  };
  // Two more cursive loops on the way down (owner: "one to two more loops"). A real cursive loop crosses its own
  // line: the pen runs forward, curls back over itself and carries on (a prolate trochoid: forward speed k < radius R).
  // A circle tangent to the line instead looked like beads stuck on a string. Same turning side as the first loop,
  // sizes a little uneven, like a hand.
  const loopAt = (t: number, R: number): { pts: Pt[]; advance: number } => {
    const P = arcAt(t);
    const d = arcDir(t);
    const n: Pt = [-d[1] * -dir, d[0] * -dir]; // the side the loop turns toward
    const k = 0.38 * R;
    const at = (phi: number): Pt => {
      const along = k * phi + R * Math.sin(phi);
      const side = R * (1 - Math.cos(phi));
      return [P[0] + d[0] * along + n[0] * side, P[1] + d[1] * along + n[1] * side];
    };
    return { pts: [1, 2, 3, 4, 5, 6, 7].map((i) => at((i / 7) * 2 * Math.PI)), advance: 2 * Math.PI * k };
  };
  const loopR = (s: number) => Math.max(0.32 * em, 15) * s * (0.9 + r() * 0.2);
  const l1 = loopAt(0.35, loopR(1));
  const l2 = loopAt(0.66, loopR(0.82));
  const skip = (adv: number) => adv / span; // resume the arc just past where the loop came back to it
  const fall: Pt[] = [
    arcAt(0.18),
    arcAt(0.35),
    ...l1.pts,
    arcAt(0.35 + skip(l1.advance) + 0.06),
    arcAt(0.52),
    arcAt(0.66),
    ...l2.pts,
    arcAt(0.66 + skip(l2.advance) + 0.06),
    arcAt(0.86),
  ].map(([x, y]): Pt => [inside(x), y]);
  const way: Pt[] = [...curl, ...fall, [B[0] + j(0.03), runTop], B];
  const cr = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
    const f = (a: number, b: number, c: number, d: number) =>
      0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
    return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
  };
  const pts: Pt[] = [way[0]];
  let curlEnd = 0;
  for (let i = 0; i < way.length - 1; i++) {
    const [p0, p1, p2, p3] = [way[i - 1] ?? way[i], way[i], way[i + 1], way[i + 2] ?? way[i + 1]];
    const steps = Math.max(2, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / (0.3 * em)));
    for (let k = 1; k <= steps; k++) {
      const [x, y] = cr(p0, p1, p2, p3, k / steps);
      const last = i === way.length - 2 && k === steps;
      pts.push(last ? [x, y] : [x + j(0.012), y + j(0.012)]);
    }
    if (i === curl.length - 2) curlEnd = pts.length - 1;
  }
  let total = 0;
  let curlLen = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (i === curlEnd) curlLen = total;
  }
  const head = arrowHead(B, pts[pts.length - 3], em, r);
  const all = total + head.len;
  return { d: smooth(pts) + head.d, curlFrac: curlLen / all, bodyFrac: total / all, len: all };
}

function useArrowPath(pair: RefObject<HTMLElement | null>) {
  const [path, setPath] = useState<ArrowPath | null>(null);
  useLayoutEffect(() => {
    const el = pair.current;
    if (!el) return;
    const measure = () => {
      const a = el.querySelector("[data-arrow-from]")?.getBoundingClientRect();
      const b = el.querySelector("[data-arrow-to]")?.getBoundingClientRect();
      const halves = [...el.querySelectorAll<HTMLElement>("[data-half]")];
      if (!a || !b || halves.length < 2) return;
      const o = el.getBoundingClientRect();
      const em = parseFloat(getComputedStyle(el).fontSize);
      // A late callback (fonts.ready, the observer) can land after unmount; a removed element has no font size, em is
      // NaN, no points are sampled and the arrowhead read past the array (a page error under reduced motion).
      if (!el.isConnected || !(em > 0)) return;
      // Word boxes are read relative to the element itself, so its own scroll-driven
      // translate cancels out.
      const A: Pt = [a.right - o.left + 0.22 * em, a.top - o.top + a.height * 0.6]; // a little past where the period was
      const B: Pt = [b.left - o.left - 0.18 * em, b.top - o.top + b.height * 0.52]; // left of "since", pointing at it
      const center = (h: HTMLElement) => h.offsetTop + h.offsetHeight / 2;
      setPath({ ...handDrawnArrow(A, B, em, el.clientWidth), width: Math.max(3.5, 0.075 * em), halves: [center(halves[0]), center(halves[1])] });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    let alive = true;
    document.fonts?.ready.then(() => alive && measure());
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [pair]);
  return path;
}

/** The intro arrow, drawn by the pencil engine (graphite line + voice). */
function ArrowSvg({ path, draw, fade, sound }: { path: ArrowPath | null; draw: MotionValue<number>; fade?: MotionValue<number>; sound?: SoundRef }) {
  return <PencilStroke d={path?.body ?? null} base={path?.width ?? 0} draw={draw} fade={fade} voice={sound} className="pd-arrow" />;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Below this the stroke counts as scrolled all the way back to its start (fully faded). */
const INK_GONE = 0.001;

/**
 * Pencil never un-draws (owner); scrolling back up fades it instead (owner: "fade out while scrolling up").
 * - `draw`: the most drawn so far. It only grows while you scroll down, so the scratch only sounds for new ink.
 * - `fade`: how much of the way back over this stroke you've scrolled. Halfway back = 0.5; back at its start = 0. Scroll
 *   down again and it brightens along the same curve; past the old peak, new ink draws at full strength.
 * - Once fully faded, `draw` resets, so the next pass draws the stroke fresh with sound (the follower hears the reset
 *   as a decrease: silent).
 * Both are motion values set in one listener, so nothing re-renders. Words, sky and camera stay scrubbed.
 */
function usePencilInk(src: MotionValue<number>) {
  const draw = useMotionValue(src.get());
  const fade = useMotionValue(1);
  useMotionValueEvent(src, "change", (v) => {
    const peak = draw.get();
    if (v >= peak) {
      draw.set(v);
      fade.set(1);
    } else if (v <= INK_GONE) {
      draw.set(v); // fully faded: reset for a fresh redraw
      fade.set(1);
    } else {
      fade.set(v / peak);
    }
  });
  return { draw, fade };
}


/** How much of the stroke is drawn at scroll x: the curl in place, the fall over the travel, then the head. */
function drawAt(x: number, g: ArrowPath | null) {
  const [fc, fb] = [g?.curlFrac ?? 0.15, g?.bodyFrac ?? 0.95];
  if (x < T.travel[0]) return fc * clamp01((x - T.curl[0]) / (T.curl[1] - T.curl[0]));
  if (x < T.head[0]) return fc + (fb - fc) * easeInOut(clamp01((x - T.travel[0]) / (T.travel[1] - T.travel[0])));
  return fb + (1 - fb) * clamp01((x - T.head[0]) / (T.head[1] - T.head[0]));
}

type SoundRef = RefObject<PencilVoice | null>;

// ── Pencil circles ──
// "anyone" and "pocket." get a loose pencil loop drawn around them by scroll. Unlike the
// arrow (one tuned seed), every page load draws a new loop: where it starts, which way it
// goes, its tilt, wobble and overshoot all vary, so it never looks stamped.
function handDrawnCircle(w: number, h: number, em: number, r: () => number) {
  // A slightly squared loop (superellipse) hugs the word's box, so it clears the word's own
  // corners without reaching into the neighbouring words the way a plain ellipse has to.
  const rx = w / 2 + 0.1 * em;
  const ry = h / 2 + 0.06 * em;
  const sq = (c: number) => Math.sign(c) * Math.abs(c) ** 0.75;
  const cx = w / 2 + (r() - 0.5) * 0.08 * em;
  const cy = h / 2 + 0.03 * em + (r() - 0.5) * 0.06 * em;
  const tilt = ((r() * 2 - 1) * 5 * Math.PI) / 180;
  const dir = r() < 0.5 ? 1 : -1;
  const a0 = ((-160 + r() * 40) * Math.PI) / 180; // starts near the top left, like most hands
  const turns = 1.06 + r() * 0.12; // overshoots past the start instead of closing neatly
  const n = 22;
  const pts: Pt[] = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    const a = a0 + dir * t * turns * 2 * Math.PI;
    const s = 1 + (r() * 2 - 1) * 0.035 + t * 0.07; // drifts outward, so the overshoot doesn't retrace
    const [x, y] = [sq(Math.cos(a)) * rx * s, sq(Math.sin(a)) * ry * s];
    pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]);
  }
  return smooth(pts);
}

/** A word circled in pencil: drawn by scroll over `range`, or fully drawn without `p` (reduced motion). */
function PencilCircle({ p, range, sound, children }: { p?: MotionValue<number>; range?: R; sound?: SoundRef; children: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [path, setPath] = useState<{ d: string; width: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const seed = (Math.random() * 2 ** 31) | 0; // per load, client-only: the path never exists on the server
    const measure = () => {
      const em = parseFloat(getComputedStyle(el).fontSize);
      setPath({ d: handDrawnCircle(el.offsetWidth, el.offsetHeight, em, rng(seed)), width: Math.max(2.5, 0.055 * em) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const done = useMotionValue(1);
  const { draw, fade } = usePencilInk(useTransform(p ?? done, (x) => (range ? clamp01((x - range[0]) / (range[1] - range[0])) : 1)));
  return (
    <span ref={ref} className="relative inline-block">
      {children}
      {path && <PencilStroke d={path.d} base={path.width} draw={draw} fade={fade} voice={sound} className="pd-arrow" />}
    </span>
  );
}

// ── Scrubbed version ──

function ScrollIntro({ sound }: { sound: SoundRef }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // Identity transform on purpose: it keeps every downstream useTransform on the JS path.
  // Fed straight from scrollYProgress, Framer 12 hands opacity to a native ScrollTimeline
  // and multi-stop keyframes came out wrong (a beat at 0.25 opacity at 90% scroll).
  const p = useTransform(scrollYProgress, (v) => v);

  const l0 = useTransform(p, [...T.l0], [0, 1]);
  const stageRef = useRef<HTMLDivElement>(null);
  const b1Ref = useRef<HTMLHeadingElement>(null);
  const l1 = useTransform(p, (x): number => (x < T.l1[0] ? 0 : 1));
  const l1Mask = useTransform(p, (x) => {
    if (!inWipe(x)) return "none";
    const y = horizonAt(x);
    return `linear-gradient(to bottom, transparent ${y - HORIZON_FEATHER}%, #000 ${y + HORIZON_FEATHER}%)`;
  });
  // The same edge in an element's own pixels: text boxes aren't stage-sized, so the edge is
  // measured against them (only during the wipe; the stage is pinned, so this is stable).
  // `below` keeps what the light has reached; otherwise what it hasn't.
  const textMask = (el: HTMLElement | null, x: number, below: boolean) => {
    const stage = stageRef.current;
    if (!inWipe(x) || !el || !stage) return "none";
    const st = stage.getBoundingClientRect();
    const f = st.height * TEXT_FEATHER;
    // Beat 2 surfaces behind the edge by exactly the distance from beat 1's top to the bottom of
    // beat 2's first phrase (plus both feathers): its first ink appears only once beat 1's last
    // ink has gone, at any wrap or screen size. Any overlap read as a double exposure.
    let lag = 0;
    if (below) {
      const top = b1Ref.current?.getBoundingClientRect().top;
      const bottom = el.querySelector("[data-half]")?.getBoundingClientRect().bottom;
      lag = top !== undefined && bottom !== undefined ? Math.max(0, bottom - top) + 2 * f : 0;
    }
    const edge = st.top + (st.height * horizonAt(x)) / 100 + lag - el.getBoundingClientRect().top;
    const [a, b] = below ? ["transparent", "#000"] : ["#000", "transparent"];
    return `linear-gradient(to bottom, ${a} ${edge - f}px, ${b} ${edge + f}px)`;
  };
  const l2 = useTransform(p, [...T.l2], [0, 1]);
  const l3 = useTransform(p, [...T.l3], [0, 1]);
  const sunsetY = useTransform(p, [...T.sunset], ["-25%", "30%"]); // sinks below the horizon
  const sunriseY = useTransform(p, [...T.sunrise], ["35%", "-20%"]); // climbs out of it

  const b1 = useTransform(p, (x): number => (x < T.l1[1] ? 1 : 0)); // the horizon's mask carries it out
  const b1Mask = useTransform(p, (x) => textMask(b1Ref.current, x, false));
  const pair = useTransform(p, [...T.pair.in, ...T.pair.out], [0, 1, 1, 0]);
  const pairRef = useRef<HTMLHeadingElement>(null);
  const pairMask = useTransform(p, (x) => textMask(pairRef.current, x, true));
  const arrow = useArrowPath(pairRef);
  const arrowRef = useRef(arrow);
  arrowRef.current = arrow;
  // The camera: centre the first phrase, then follow the pen down to the second.
  // The camera follows the pencil tip's height between the two phrases: it moves while
  // the pencil falls and holds while it sweeps sideways.
  const trackY = useTransform(p, (x) => {
    const g = arrowRef.current;
    if (!g) return 0;
    const f = clamp01(drawAt(x, g) / g.bodyFrac); // fraction of the line (not the head) drawn
    const y = g.tipY[Math.round(f * 100)];
    const [y0, y1] = [g.tipY[0], g.tipY[100]];
    return -(g.halves[0] + (g.halves[1] - g.halves[0]) * clamp01((y - y0) / (y1 - y0 || 1)));
  });
  // The pen: the curl in place, then the fall at the camera's pace, so the tip stays on screen.
  const { draw, fade: arrowFade } = usePencilInk(useTransform(p, (x) => drawAt(x, arrowRef.current)));
  // Threshold switches (the second sky's colours, the lit sign, the nav's ink) are DOM writes made only when they
  // change. As React state, each flip re-rendered the whole intro on that scroll frame: a visible hitch.
  const signRef = useRef<HTMLDivElement>(null);
  const flip = (x: number) => {
    const pairEl = pairRef.current;
    // Only on a change: rewriting the same attribute still invalidates style, and the horizon's mask then forced a
    // fresh layout reading its rects (layouts per frame doubled while scrolling up through the intro).
    const sky2 = x >= T.sky;
    if (pairEl && (pairEl.dataset.sky === "2") !== sky2) {
      if (sky2) pairEl.dataset.sky = "2";
      else delete pairEl.dataset.sky;
    }
    lightNeon(signRef.current, x >= NEON_LIT);
    // Tell the glass nav which sky is behind it (globals.css picks its ink per theme).
    const root = document.documentElement;
    const visible = skyBehindNav(x);
    if (visible === null) delete root.dataset.pdSky;
    else if (root.dataset.pdSky !== String(visible)) root.dataset.pdSky = String(visible);
  };
  useMotionValueEvent(p, "change", flip);
  useLayoutEffect(() => flip(p.get()), []); // eslint-disable-line react-hooks/exhaustive-deps -- once, after mount
  useEffect(() => () => void delete document.documentElement.dataset.pdSky, []);
  const b4 = useTransform(p, [...T.neon.in], [0, 1]);
  const para = useTransform(p, [...T.para.in], [0, 1]);
  // During the horizon both beats are opaque (their masks do the hiding), so the pointer
  // goes to whichever owns the middle of the stage: beat 1 until the light passes it.
  const beat1Leads = (x: number) => x < T.l1[1] && horizonAt(x) > 50;
  const h1 = useTransform(p, (x): "auto" | "none" => (beat1Leads(x) ? "auto" : "none"));
  const h2 = useTransform([pair, p], ([o, x]: number[]): "auto" | "none" => (o > 0.5 && !beat1Leads(x) ? "auto" : "none"));
  const h4 = useHit(b4);

  const letters = NEON.split("");
  const lStep = (T.neon.letters[1] - T.neon.letters[0]) / letters.length;

  return (
    // Full-bleed breakout: the light has to fill the viewport, not the 6xl column.
    // ponytail: 500svh is a guess at pace; raise it if the beats feel rushed on a trackpad.
    // marginTop pulls the section up over the empty bottom of the first screen (the title sits in its top half, the stage is
    // transparent until the first beat), so the stage pins after ~60svh of scrolling instead of a full screen.
    <section ref={ref} aria-label="Why I take pictures" className="photos-day relative left-1/2 w-screen -translate-x-1/2" style={{ height: "500svh", marginTop: "-40svh" }}>
      {/* Pinned at the very top so the sky runs behind the glass nav. The nav reads on it
          because it switches ink per sky (html[data-pd-sky], see skyBehindNav). */}
      <div ref={stageRef} className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Light layers: opacity and the suns' y animate; layer 1 also rises in behind a mask (the horizon). */}
        <motion.div aria-hidden className="absolute inset-0" style={{ opacity: l0, background: v("l0") }} />
        <motion.div aria-hidden className="absolute inset-0" style={{ opacity: l1, background: v("l1"), maskImage: l1Mask, WebkitMaskImage: l1Mask }}>
          <motion.div className={SUN} style={{ y: sunsetY, opacity: v("sunset"), background: SUN_GRADIENT }} />
        </motion.div>
        <motion.div aria-hidden className="absolute inset-0" style={{ opacity: l2, background: v("l2") }}>
          <motion.div className={SUN} style={{ y: sunriseY, opacity: v("sunrise"), background: SUN_GRADIENT }} />
        </motion.div>
        <motion.div aria-hidden className="absolute inset-0" style={{ opacity: l3, background: v("l3") }} />

        <div className="absolute inset-x-6 bottom-8 top-24 grid grid-cols-[minmax(0,1fr)] items-center md:inset-x-16">
          <div className="relative mx-auto grid h-full w-full max-w-6xl grid-cols-[minmax(0,1fr)] items-center">
            <motion.h2 ref={b1Ref} aria-label={TYPED} style={{ opacity: b1, pointerEvents: h1, color: v("t1"), maskImage: b1Mask, WebkitMaskImage: b1Mask }} className={`${DISPLAY} col-start-1 row-start-1`}>
              <Typed p={p} />
            </motion.h2>

            {/* One heading, two screens: the phrases sit a screen apart on a track, and the
                camera (the track's y) follows the arrow from the first to the second. */}
            <motion.h2
              ref={pairRef}
              style={{ y: trackY, opacity: pair, pointerEvents: h2, maskImage: pairMask, WebkitMaskImage: pairMask }}
              className={`${SIZE} absolute inset-x-0 top-1/2 flex flex-col gap-[120svh]`}
            >
              <span data-half className={`${DISPLAY} pd-b2 block`}>
                <LitWords p={p} segs={ANYONE} range={T.anyone.words} circle={T.anyone.select} sound={sound} anchor="last" />
              </span>
              {/* indented so the arrow can come in from the left and point at "since" */}
              <span data-half className={`${DISPLAY} pd-b3 block pl-[0.9em]`}>
                <LitWords p={p} segs={POCKET} range={T.pocket.words} circle={T.pocket.select} sound={sound} anchor="first" />
              </span>
              <ArrowSvg path={arrow} draw={draw} fade={arrowFade} sound={sound} />
            </motion.h2>

            <motion.div style={{ opacity: b4, pointerEvents: h4, color: v("t4") }} className="col-start-1 row-start-1 flex flex-col gap-8 md:gap-10">
              <NeonSign signRef={signRef}>
                {letters.map((c, i) => (
                  <NeonLetter key={i} p={p} t={T.neon.letters[0] + i * lStep}>{c}</NeonLetter>
                ))}
              </NeonSign>
              <motion.p style={{ opacity: para }} className={BODY}>
                <LitWords p={p} segs={PARAGRAPH} range={T.para.words} />
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Reduced motion: the same day as four static bands, everything lit ──

function Band({ bg, color, children }: { bg?: string; color?: string; children: ReactNode }) {
  return (
    <div className="px-6 py-24 md:px-16 md:py-32" style={{ background: bg, color }}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}

function StaticWords({ segs, anchor }: { segs: Seg[]; anchor?: "first" | "last" }) {
  const list = words(segs);
  return (
    <>
      {list.map(({ w, color, select }, i) => (
        <span
          key={i}
          {...anchorAttr(anchor === "last" && i === list.length - 1 ? "from" : anchor === "first" && i === 0 ? "to" : undefined)}
          style={{ color, textShadow: color ? glow(color) : undefined }}
        >
          {select ? <PencilCircle>{w}</PencilCircle> : w}{" "}
        </span>
      ))}
    </>
  );
}

function StaticPair() {
  const ref = useRef<HTMLHeadingElement>(null);
  const arrow = useArrowPath(ref);
  const full = useMotionValue(1);
  return (
    <h2 ref={ref} data-sky={2} className={`${SIZE} relative flex flex-col gap-[3em]`}>
      <span data-half className={`${DISPLAY} pd-b2 block`}><StaticWords segs={ANYONE} anchor="last" /></span>
      <span data-half className={`${DISPLAY} pd-b3 block pl-[0.9em]`}><StaticWords segs={POCKET} anchor="first" /></span>
      <ArrowSvg path={arrow} draw={full} />
    </h2>
  );
}

function StaticIntro() {
  return (
    <section aria-label="Why I take pictures" className="photos-day relative left-1/2 w-screen -translate-x-1/2">
      <Band bg={v("l0")} color={v("t1")}><h2 className={DISPLAY}>{TYPED}</h2></Band>
      <Band bg={v("l2")}><StaticPair /></Band>
      <Band bg={v("l3")} color={v("t4")}>
        <div className="flex flex-col gap-8 md:gap-10">
          <h2 className={DISPLAY} style={{ textShadow: neonGlow(v("sodium")) }}>{NEON}</h2>
          <p className={BODY}><StaticWords segs={PARAGRAPH} /></p>
        </div>
      </Band>
    </section>
  );
}

/**
 * The page's one pencil sound, shared by the intro and the note before the collections (one AudioContext).
 * Under reduced motion there is none: the scroll versions mount for one beat before the static ones (they swap
 * after mount, and child effects run first), so this checks the preference itself rather than opening an
 * AudioContext and fetching the sample for a visitor who never hears it.
 */
export function useIntroSound(): SoundRef {
  const sound = useRef<PencilVoice | null>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    sound.current = createPencilVoice({ config: SITE_PENCIL });
    return () => {
      sound.current?.dispose();
      sound.current = null;
    };
  }, []);
  return sound;
}

/** Reduced motion, read after mount (see PhotosIntro): the first client render must match the server's. */
function useStill() {
  const reduce = useReducedMotion();
  const [still, setStill] = useState(false);
  useLayoutEffect(() => setStill(!!reduce), [reduce]);
  return still;
}

// ── The note before the collections ──
const NOTE: Seg[] = [{ t: "Here's my work." }];
// Words light from 0.2: before that the heading is still below the fold (lit over 0–0.3 it finished unseen).
const N = { words: [0.2, 0.4] as R, curl: [0.4, 0.52] as R, fall: [0.52, 0.88] as R, head: [0.88, 0.96] as R };

/** How much of the pointer is drawn at note progress x: the curl in place, the eased fall, then the head. */
function noteDrawAt(x: number, g: { curlFrac: number; bodyFrac: number } | null) {
  const [fc, fb] = [g?.curlFrac ?? 0.15, g?.bodyFrac ?? 0.95];
  if (x < N.fall[0]) return fc * clamp01((x - N.curl[0]) / (N.curl[1] - N.curl[0]));
  if (x < N.head[0]) return fc + (fb - fc) * easeInOut(clamp01((x - N.fall[0]) / (N.fall[1] - N.fall[0])));
  return fb + (1 - fb) * clamp01((x - N.head[0]) / (N.head[1] - N.head[0]));
}

/**
 * "Here's my work.": lit word by word, then the pencil draws from the end of the line down into the first
 * collection's cover, scrubbed by scroll, with the scratch. It hands the reader from the intro to the photographs.
 * Normal flow (not pinned), so it reads as a pause, not another stage. Fully drawn under reduced motion.
 */
export function PencilNote({ sound }: { sound: SoundRef }) {
  const ref = useRef<HTMLElement>(null);
  const still = useStill();
  // The drop is very tall (owner: ~3× the first version, then more again), so the head lands with the note's bottom
  // (the cover's top) at the bottom of the screen (95%). The heading scrolls away during the long fall; the line then
  // reads as coming from above, like the intro's arrow. Landing any lower would put the head below the fold.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.95"] });
  // Identity transform (see ScrollIntro): keeps every downstream transform on the JS path.
  const progress = useTransform(scrollYProgress, (v) => v);
  const p = useMotionValue(0);
  useMotionValueEvent(progress, "change", (x) => p.set(still ? 1 : x));
  useEffect(() => p.set(still ? 1 : progress.get()), [still, p, progress]);

  const [path, setPath] = useState<{ d: string; width: number; curlFrac: number; bodyFrac: number; len: number } | null>(null);
  const pathRef = useRef(path);
  pathRef.current = path;
  const measure = useCallback(() => {
    const el = ref.current;
    const a = el?.querySelector("[data-arrow-from]")?.getBoundingClientRect();
    const cover = document.querySelector("[data-collection-tile]")?.getBoundingClientRect();
    if (!el || !a || !cover) return;
    const o = el.getBoundingClientRect();
    const em = parseFloat(getComputedStyle(el.querySelector("h2")!).fontSize);
    if (!el.isConnected || !(em > 0)) return; // a late callback after unmount (see useArrowPath)
    // Below the baseline and clear of the full stop: started inside the line's glyph band, the first millimetre of
    // stroke read as a second full stop ("seen..") and the half-drawn loop as a letter ("seen.q").
    // ...and at least 0.7em inside the column, so the first loop has room: on phones "work." ends at the edge, and a
    // start clamped against it squashed the loop into a hook.
    const A: Pt = [Math.min(a.right - o.left + 0.27 * em, el.clientWidth - 0.7 * em), a.top - o.top + a.height * 0.8 + 0.2 * em];
    // Into the cover, below the end of the line (clamped inside it), ending just above the image.
    // The middle of the page (the cover's centre), at the owner's request: the line sweeps from the end of the heading
    // across the tall gap to centre stage. (In the first, short gap, pulling even an em sideways made a cramped hook.)
    // The first tile spans the whole grid, which sits in the same column as this section, so the cover's centre is
    // this section's centre. Read from layout (clientWidth), not the cover's rect: the tiles slide in on load
    // (x: −40 → 0), and a measurement taken mid-slide (e.g. a reload restored near the note) left the arrow pointing
    // left of centre for good. The slide is horizontal only, so the cover's top (below) is unaffected.
    const bx = el.clientWidth / 2;
    // Clear air above the cover (owner: "it overlaps with the collection"). 0.12em measured 12px at the line's centre,
    // but half the stroke width and the tile's hover/focus frame (-inset-3, 12px above the cover) ate all of it.
    const B: Pt = [bx, cover.top - o.top - Math.max(0.5 * em, 24)];
    setPath({ ...handDrawnPointer(A, B, em, el.clientWidth), width: Math.max(3.5, 0.075 * em) });
  }, []);
  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    const tile = document.querySelector("[data-collection-tile]");
    if (tile) ro.observe(tile);
    let alive = true;
    document.fonts?.ready.then(() => alive && measure());
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [measure]);
  // The tiles slide in on load: measure again once the reader actually reaches the note, long after that settles.
  const remeasured = useRef(false);
  useMotionValueEvent(progress, "change", (x) => {
    if (x > 0 && !remeasured.current) {
      remeasured.current = true;
      measure();
    }
  });

  const { draw, fade } = usePencilInk(useTransform(p, (x) => noteDrawAt(x, pathRef.current)));

  return (
    <section ref={ref} aria-labelledby="pencil-note" className="relative pb-[60svh] pt-[22svh] md:pb-[95svh]">
      <h2 id="pencil-note" className={`${DISPLAY} text-fg`}>
        <LitWords p={p} segs={NOTE} range={N.words} anchor="last" />
      </h2>
      {path && <PencilStroke d={path.d} base={path.width} draw={draw} fade={fade} voice={sound} className="text-fg" />}
    </section>
  );
}

export function PhotosIntro({ sound }: { sound: SoundRef }) {
  // Read after mount, never during render: the server can't know the preference and renders
  // ScrollIntro, so the first client render must too (Framer seeds useReducedMotion from
  // matchMedia on the client, which made reduced-motion visitors hit a hydration mismatch).
  const reduce = useReducedMotion();
  const [staticIntro, setStaticIntro] = useState(false);
  // A layout effect, so the swap lands before the first paint: the 500svh scroll stage is never shown, and the
  // page height settles before the browser restores a reload's scroll position against it.
  useLayoutEffect(() => setStaticIntro(!!reduce), [reduce]);
  return staticIntro ? <StaticIntro /> : <ScrollIntro sound={sound} />;
}

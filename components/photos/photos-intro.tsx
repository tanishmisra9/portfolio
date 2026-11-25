"use client";

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createIntroSound, type IntroSound } from "./intro-sound";

// One day of light passes over the manifesto, and it always resolves into the page's
// own theme: dark mode is a sunset (page → golden hour → blue hour → night), light mode
// a sunrise (pre-dawn → dawn → golden → daylight). The colours live in theme-scoped
// CSS variables (.photos-day in globals.css, all WCAG-measured); this file only knows
// "layer 0–3" and "text 1–4". One typeface, one display size, nothing scales: the
// motion is light, typing and selection. Every value is scrubbed, so it rewinds.

const SELECT = "#0a6cdc"; // iOS-ish selection, both themes; white on it 5.01 (#0a84ff was only 3.65)
const v = (name: string) => `var(--pd-${name})`;

// ── Copy (edit freely) ──
const TYPED = "What I believe in.";
type Seg = { t: string; color?: string; select?: boolean };
// One thought in two halves, linked by a drawn arrow where the first one's period would be.
const ANYONE: Seg[] = [{ t: "I think" }, { t: "anyone", select: true }, { t: "can be a photographer" }];
const POCKET: Seg[] = [{ t: "since the best camera is the one in your" }, { t: "pocket.", select: true }];
const NEON = "Mobile photography.";
const PARAGRAPH: Seg[] = [
  { t: "Everything here was shot on the phone in my pocket. No bag of lenses, no presets to buy. Just" },
  { t: "rain on glass,", color: v("rain") },
  { t: "night light,", color: v("sodium") },
  { t: "golden hour,", color: v("gold") },
  { t: "and one" },
  { t: "clock tower", color: v("tower") },
  { t: "I can't stop photographing. If you have a phone, you already have everything you need." },
];

// ── Timeline (fractions of the section's scroll distance) ──
type R = readonly [number, number];
const T = {
  l0: [0, 0.05] as R, // light mode: the page dims to pre-dawn only after the stage pins (no dark slab scrolling in)
  type: [0.05, 0.115] as R, // typing starts once it is dark enough to read white text
  dayOut: [0.12, 0.15] as R,
  l1: [0.12, 0.2] as R,
  sunset: [0.12, 0.42] as R, // dark mode: the sun sinks through layer 1 (golden hour)
  sunrise: [0.38, 0.66] as R, // light mode: the sun rises through layer 2 (golden morning)
  pair: { in: [0.16, 0.19] as R, out: [0.61, 0.64] as R },
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
const BODY = "max-w-[34ch] text-xl/[1.55] font-[300] md:text-[1.75rem]/[1.5]";
// Glow strength is a theme variable: lit signs glow at night, not in daylight.
const glow = (c: string) =>
  `0 0 0.35em color-mix(in srgb, ${c} var(--pd-glow), transparent), 0 0 1.2em color-mix(in srgb, ${c} calc(var(--pd-glow) / 2), transparent)`;

const words = (segs: Seg[]) =>
  segs.flatMap(({ t, color, select }) => t.split(" ").map((w) => ({ w, color, select })));

// ── Pieces ──

// Live Text selection, grown one character at a time the way dragging the iPhone's
// selection handle does: the block always ends on a glyph boundary (a continuous
// clip-path wipe sliced letters in half mid-scroll). Each letter carries its own
// background, so adjacent letters form one block with no measuring.
const KNOB = "absolute size-[11px]";
const BAR = "absolute inset-y-0 w-[3px]";

function Handles({ start, end, startStyle, endStyle }: {
  start: boolean; end: boolean; startStyle?: { opacity: MotionValue<number> }; endStyle?: { opacity: MotionValue<number> };
}) {
  return (
    <>
      {start && (
        <motion.span aria-hidden style={{ ...startStyle, background: SELECT }} className={`${BAR} -left-[3px]`}>
          <span className={`${KNOB} -left-[4px] -top-[9px]`} style={{ background: SELECT }} />
        </motion.span>
      )}
      {end && (
        <motion.span aria-hidden style={{ ...endStyle, background: SELECT }} className={`${BAR} -right-[3px]`}>
          <span className={`${KNOB} -bottom-[9px] -left-[4px]`} style={{ background: SELECT }} />
        </motion.span>
      )}
    </>
  );
}

function SelectLetter({ p, t, next, until, first, last, children }: {
  p: MotionValue<number>; t: number; next: number; until: number; first: boolean; last: boolean; children: string;
}) {
  // Selected from t until `until`: like iOS, only one selection exists at a time, so an
  // earlier word deselects when the next one is selected.
  const on = (v: number) => v >= t && v < until;
  const background = useTransform(p, (v) => (on(v) ? SELECT : "rgba(0,0,0,0)"));
  const color = useTransform(p, (v) => (on(v) ? "#ffffff" : "inherit"));
  const startOpacity = useTransform(p, (v): number => (on(v) ? 1 : 0));
  // The trailing handle rides the newest selected letter, and stays on the last one.
  const endOpacity = useTransform(p, (v): number => (on(v) && (last || v < next) ? 1 : 0));
  return (
    <motion.span style={{ background, color }} className="relative">
      {children}
      <Handles start={first} end startStyle={{ opacity: startOpacity }} endStyle={{ opacity: endOpacity }} />
    </motion.span>
  );
}

/** Animated when `p`/`range` are given; otherwise drawn fully selected (reduced motion). */
function Selection({ p, range, until = Infinity, children }: { p?: MotionValue<number>; range?: R; until?: number; children: string }) {
  const chars = children.split("");
  if (!p || !range) {
    return (
      <span className="relative text-white" style={{ background: SELECT }}>
        {children}
        <Handles start end />
      </span>
    );
  }
  const step = (range[1] - range[0]) / chars.length;
  return (
    <span>
      {chars.map((c, i) => (
        <SelectLetter key={i} p={p} t={range[0] + i * step} next={range[0] + (i + 1) * step} until={until} first={i === 0} last={i === chars.length - 1}>
          {c}
        </SelectLetter>
      ))}
    </span>
  );
}

type Anchor = "from" | "to" | undefined;
const anchorAttr = (a: Anchor) => (a === "from" ? { "data-arrow-from": "" } : a === "to" ? { "data-arrow-to": "" } : {});

function LitWord({ p, range, color, select, selectRange, selectUntil, anchor, children }: {
  p: MotionValue<number>; range: R; color?: string; select?: boolean; selectRange?: R; selectUntil?: number; anchor?: Anchor; children: string;
}) {
  const opacity = useTransform(p, [...range], [0.15, 1]);
  return (
    <motion.span {...anchorAttr(anchor)} style={{ opacity, color, textShadow: color ? glow(color) : undefined }}>
      {select && selectRange ? <Selection p={p} range={selectRange} until={selectUntil}>{children}</Selection> : children}{" "}
    </motion.span>
  );
}

function LitWords({ p, segs, range, selectRange, selectUntil, anchor }: {
  p: MotionValue<number>; segs: Seg[]; range: R; selectRange?: R; selectUntil?: number; anchor?: "first" | "last";
}) {
  const list = words(segs);
  const step = (range[1] - range[0]) / list.length;
  return (
    <>
      {list.map(({ w, color, select }, i) => (
        <LitWord
          key={i} p={p} range={[range[0] + i * step, range[0] + (i + 1) * step]} color={color} select={select} selectRange={selectRange} selectUntil={selectUntil}
          anchor={anchor === "last" && i === list.length - 1 ? "from" : anchor === "first" && i === 0 ? "to" : undefined}
        >
          {w}
        </LitWord>
      ))}
    </>
  );
}

/** A neon tube switching on: off → on → stutter → on. */
function NeonLetter({ p, t, children }: { p: MotionValue<number>; t: number; children: string }) {
  const d = 0.0025;
  const opacity = useTransform(p, [t, t + d, t + 2 * d, t + 3 * d], [0.08, 1, 0.35, 1]);
  return <motion.span style={{ opacity }}>{children}</motion.span>;
}

function Typed({ p }: { p: MotionValue<number> }) {
  const [n, setN] = useState(0);
  useMotionValueEvent(p, "change", (v) => {
    const k = Math.round(Math.min(1, Math.max(0, (v - T.type[0]) / (T.type[1] - T.type[0]))) * TYPED.length);
    setN(k);
  });
  return (
    <span aria-label={TYPED}>
      <span aria-hidden>{TYPED.slice(0, n)}</span>
      <span aria-hidden className="ml-[0.04em] inline-block h-[0.85em] w-[0.09em] translate-y-[0.1em] animate-[caret_1.05s_steps(1,end)_infinite] bg-current" />
    </span>
  );
}

// Which sky layer is dominant behind the nav: the midpoint of each crossfade. null before
// the light-mode pre-dawn has come up (the page is still showing) and after the intro.
const skyBehindNav = (x: number): number | null =>
  x < (T.l0[0] + T.l0[1]) / 2 || x >= 1 ? null
  : x < (T.l1[0] + T.l1[1]) / 2 ? 0
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

  // The arrowhead without lifting the pencil: from the tip, up one side, back down
  // through the tip, out the other side. Sides deliberately unequal, each slightly bowed.
  const [px, py] = pts[pts.length - 3];
  const dl = Math.hypot(B[0] - px, B[1] - py) || 1;
  const back: Pt = [(px - B[0]) / dl, (py - B[1]) / dl];
  const wingEnd = (deg: number, len: number): Pt => {
    const a = (deg * Math.PI) / 180;
    return [B[0] + (back[0] * Math.cos(a) - back[1] * Math.sin(a)) * len * em, B[1] + (back[0] * Math.sin(a) + back[1] * Math.cos(a)) * len * em];
  };
  const w1 = wingEnd(31 + r() * 6, 0.42);
  const w2 = wingEnd(-(24 + r() * 6), 0.36);
  const bow = (a: Pt, b: Pt) => `Q ${((a[0] + b[0]) / 2 + j(0.03)).toFixed(1)} ${((a[1] + b[1]) / 2 + j(0.03)).toFixed(1)}, ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  const head = ` ${bow(B, w1)} ${bow(w1, B)} ${bow(B, w2)}`;
  const headLen = 2 * Math.hypot(w1[0] - B[0], w1[1] - B[1]) + Math.hypot(w2[0] - B[0], w2[1] - B[1]);
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
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [pair]);
  return path;
}

type Stroke = { pathLength: MotionValue<number>; opacity: MotionValue<number> };

function ArrowSvg({ path, body }: { path: ArrowPath | null; body?: Stroke }) {
  if (!path) return null;
  return (
    <svg aria-hidden className="pd-arrow pointer-events-none absolute inset-0 size-full overflow-visible" fill="none" stroke="currentColor" strokeWidth={path.width} strokeLinecap="round" strokeLinejoin="round">
      <motion.path d={path.body} style={body} />
    </svg>
  );
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** One pen stroke drawn by scroll; hidden until it starts (a round cap at length 0 still paints a dot). */
function useStroke(length: MotionValue<number>): Stroke {
  return { pathLength: length, opacity: useTransform(length, (x): number => (x > 0.001 ? 1 : 0)) };
}

/** How much of the stroke is drawn at scroll x: the curl in place, the fall over the travel, then the head. */
function drawAt(x: number, g: ArrowPath | null) {
  const [fc, fb] = [g?.curlFrac ?? 0.15, g?.bodyFrac ?? 0.95];
  if (x < T.travel[0]) return fc * clamp01((x - T.curl[0]) / (T.curl[1] - T.curl[0]));
  if (x < T.head[0]) return fc + (fb - fc) * easeInOut(clamp01((x - T.travel[0]) / (T.travel[1] - T.travel[0])));
  return fb + (1 - fb) * clamp01((x - T.head[0]) / (T.head[1] - T.head[0]));
}

// ── Scrubbed version ──

function ScrollIntro() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // Identity transform on purpose: it keeps every downstream useTransform on the JS path.
  // Fed straight from scrollYProgress, Framer 12 hands opacity to a native ScrollTimeline
  // and multi-stop keyframes came out wrong (a beat at 0.25 opacity at 90% scroll).
  const p = useTransform(scrollYProgress, (v) => v);

  const l0 = useTransform(p, [...T.l0], [0, 1]);
  const l1 = useTransform(p, [...T.l1], [0, 1]);
  const l2 = useTransform(p, [...T.l2], [0, 1]);
  const l3 = useTransform(p, [...T.l3], [0, 1]);
  const sunsetY = useTransform(p, [...T.sunset], ["-25%", "30%"]); // sinks below the horizon
  const sunriseY = useTransform(p, [...T.sunrise], ["35%", "-20%"]); // climbs out of it

  const b1 = useTransform(p, [...T.dayOut], [1, 0]);
  const pair = useTransform(p, [...T.pair.in, ...T.pair.out], [0, 1, 1, 0]);
  const pairRef = useRef<HTMLHeadingElement>(null);
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
  const draw = useTransform(p, (x) => drawAt(x, arrowRef.current));
  const body = useStroke(draw);
  const sound = useRef<IntroSound | null>(null);
  useEffect(() => {
    sound.current = createIntroSound();
    return () => sound.current?.dispose();
  }, []);
  // The pencil scratches only while the stroke moves, as loud as the pen is fast.
  const lastDraw = useRef({ v: 0, t: 0 });
  useMotionValueEvent(draw, "change", (v) => {
    const now = performance.now();
    const prev = lastDraw.current;
    lastDraw.current = { v, t: now };
    if (prev.t && now > prev.t) sound.current?.scratch((Math.abs(v - prev.v) * 1000) / (now - prev.t));
  });
  const [sky, setSky] = useState<1 | 2>(1);
  useMotionValueEvent(p, "change", (x) => {
    setSky(x >= T.sky ? 2 : 1);
    // Tell the glass nav which sky is behind it (globals.css picks its ink per theme).
    const root = document.documentElement;
    const visible = skyBehindNav(x);
    if (visible === null) delete root.dataset.pdSky;
    else if (root.dataset.pdSky !== String(visible)) root.dataset.pdSky = String(visible);
  });
  useEffect(() => () => void delete document.documentElement.dataset.pdSky, []);
  const b4 = useTransform(p, [...T.neon.in], [0, 1]);
  const para = useTransform(p, [...T.para.in], [0, 1]);
  const [h1, h2, h4] = [useHit(b1), useHit(pair), useHit(b4)];

  const letters = NEON.split("");
  const lStep = (T.neon.letters[1] - T.neon.letters[0]) / letters.length;

  return (
    // Full-bleed breakout: the light has to fill the viewport, not the 6xl column.
    // ponytail: 450svh is a guess at pace; raise it if the beats feel rushed on a trackpad.
    <section ref={ref} aria-label="Why I take pictures" className="photos-day relative left-1/2 w-screen -translate-x-1/2" style={{ height: "500svh" }}>
      {/* Pinned at the very top so the sky runs behind the glass nav. The nav reads on it
          because it switches ink per sky (html[data-pd-sky], see skyBehindNav). */}
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Light layers: only opacity and the suns' y animate. */}
        <motion.div aria-hidden className="absolute inset-0" style={{ opacity: l0, background: v("l0") }} />
        <motion.div aria-hidden className="absolute inset-0" style={{ opacity: l1, background: v("l1") }}>
          <motion.div className={SUN} style={{ y: sunsetY, opacity: v("sunset"), background: SUN_GRADIENT }} />
        </motion.div>
        <motion.div aria-hidden className="absolute inset-0" style={{ opacity: l2, background: v("l2") }}>
          <motion.div className={SUN} style={{ y: sunriseY, opacity: v("sunrise"), background: SUN_GRADIENT }} />
        </motion.div>
        <motion.div aria-hidden className="absolute inset-0" style={{ opacity: l3, background: v("l3") }} />

        <div className="absolute inset-x-6 bottom-8 top-24 grid grid-cols-[minmax(0,1fr)] items-center md:inset-x-16">
          <div className="relative mx-auto grid h-full w-full max-w-6xl grid-cols-[minmax(0,1fr)] items-center">
            <motion.h2 style={{ opacity: b1, pointerEvents: h1, color: v("t1") }} className={`${DISPLAY} col-start-1 row-start-1`}>
              <Typed p={p} />
            </motion.h2>

            {/* One heading, two screens: the phrases sit a screen apart on a track, and the
                camera (the track's y) follows the arrow from the first to the second. */}
            <motion.h2
              ref={pairRef}
              data-sky={sky}
              style={{ y: trackY, opacity: pair, pointerEvents: h2 }}
              className={`${SIZE} absolute inset-x-0 top-1/2 flex flex-col gap-[120svh]`}
            >
              <span data-half className={`${DISPLAY} pd-b2 block`}>
                <LitWords p={p} segs={ANYONE} range={T.anyone.words} selectRange={T.anyone.select} selectUntil={T.pocket.select[0]} anchor="last" />
              </span>
              {/* indented so the arrow can come in from the left and point at "since" */}
              <span data-half className={`${DISPLAY} pd-b3 block pl-[0.9em]`}>
                <LitWords p={p} segs={POCKET} range={T.pocket.words} selectRange={T.pocket.select} anchor="first" />
              </span>
              <ArrowSvg path={arrow} body={body} />
            </motion.h2>

            <motion.div style={{ opacity: b4, pointerEvents: h4, color: v("t4") }} className="col-start-1 row-start-1 flex flex-col gap-8 md:gap-10">
              <h2 aria-label={NEON} className={DISPLAY} style={{ textShadow: glow(v("sodium")) }}>
                {letters.map((c, i) => (
                  <NeonLetter key={i} p={p} t={T.neon.letters[0] + i * lStep}>{c}</NeonLetter>
                ))}
              </h2>
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
          {select ? <Selection>{w}</Selection> : w}{" "}
        </span>
      ))}
    </>
  );
}

function StaticPair() {
  const ref = useRef<HTMLHeadingElement>(null);
  const arrow = useArrowPath(ref);
  return (
    <h2 ref={ref} data-sky={2} className={`${SIZE} relative flex flex-col gap-[3em]`}>
      {/* Final state: only one selection at a time, so "anyone" is no longer selected. */}
      <span data-half className={`${DISPLAY} pd-b2 block`}><StaticWords segs={ANYONE.map((g) => ({ ...g, select: false }))} anchor="last" /></span>
      <span data-half className={`${DISPLAY} pd-b3 block pl-[0.9em]`}><StaticWords segs={POCKET} anchor="first" /></span>
      <ArrowSvg path={arrow} />
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
          <h2 className={DISPLAY} style={{ textShadow: glow(v("sodium")) }}>{NEON}</h2>
          <p className={BODY}><StaticWords segs={PARAGRAPH} /></p>
        </div>
      </Band>
    </section>
  );
}

export function PhotosIntro() {
  return useReducedMotion() ? <StaticIntro /> : <ScrollIntro />;
}

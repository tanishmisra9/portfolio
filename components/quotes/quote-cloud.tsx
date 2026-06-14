"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { QuoteEntry } from "@/data/quotes";
import {
  MAX_START_DELAY_MS,
  QUOTE_FADE_DURATION_S,
  QUOTE_FADE_SCALE_FROM,
  REDUCED_MOTION_FADE_DURATION_S,
} from "@/lib/quotes-motion";

/** Temporary toggle: set true to show the author tag above each quote again. */
const SHOW_ATTRIBUTION = false;

const PLAYFAIR = "var(--font-playfair), Georgia, serif";
const INTER = "var(--font-inter), system-ui, sans-serif";
const INSTRUMENT_SERIF = "var(--font-instrument-serif), Georgia, serif";
const BRICOLAGE = "var(--font-bricolage), system-ui, sans-serif";
const FAMILJEN = "var(--font-familjen), system-ui, sans-serif";

interface Treatment {
  /** Stable key for adjacency de-duplication. */
  id: string;
  fontFamily: string;
  fontStyle: "normal" | "italic";
  weights: number[];
  uppercase: boolean;
  letterSpacing?: string;
}

// Reusable treatments. Playfair is referenced multiple times in the tiers below
// to bias the cloud toward the serif (the "Maybe God…" look). Shared objects are
// fine — applyTreatment only reads from them.
const T_PLAYFAIR: Treatment = { id: "playfair", fontFamily: PLAYFAIR, fontStyle: "normal", weights: [400, 500], uppercase: false };
const T_PLAYFAIR_HERO: Treatment = { ...T_PLAYFAIR, letterSpacing: "-0.01em" };
const T_INTER_LIGHT: Treatment = { id: "inter", fontFamily: INTER, fontStyle: "normal", weights: [200], uppercase: false, letterSpacing: "-0.01em" };
const T_INTER: Treatment = { id: "inter", fontFamily: INTER, fontStyle: "normal", weights: [250], uppercase: false, letterSpacing: "-0.01em" };
// Occasional accent typefaces — Playfair stays dominant in the tiers below.
// Instrument Serif is an upright display serif; Bricolage is a bold display
// sans; Familjen is a clean upright sans. All sentence-case to match the cloud.
const T_INSTRUMENT: Treatment = { id: "instrument", fontFamily: INSTRUMENT_SERIF, fontStyle: "normal", weights: [400], uppercase: false, letterSpacing: "-0.005em" };
const T_BRICOLAGE: Treatment = { id: "bricolage", fontFamily: BRICOLAGE, fontStyle: "normal", weights: [600, 800], uppercase: false, letterSpacing: "-0.02em" };
const T_FAMILJEN: Treatment = { id: "familjen", fontFamily: FAMILJEN, fontStyle: "normal", weights: [400, 700], uppercase: false, letterSpacing: "-0.01em" };

/**
 * Typeface treatments allowed at each size tier. Coupling font/weight to size
 * keeps the cloud feeling designed; the serif leads every tier and the sans is
 * the occasional accent.
 */
const TIER_TREATMENTS: Treatment[][] = [
  // Tier 0 — hero (huge). Upright Playfair only: the crisp, confident look.
  [T_PLAYFAIR_HERO],
  // Tier 1 — large. Serif-led; thin sans, display serif, and bold display accents.
  [T_PLAYFAIR, T_PLAYFAIR, T_PLAYFAIR, T_INTER_LIGHT, T_INSTRUMENT, T_BRICOLAGE],
  // Tier 2 — medium. Serif-led; sans, display serif, and upright sans accents.
  [T_PLAYFAIR, T_PLAYFAIR, T_PLAYFAIR, T_INTER, T_INSTRUMENT, T_FAMILJEN],
  // Tier 3 — small. Serif joins the sans accents here too (tiers are big enough now).
  [T_PLAYFAIR, T_PLAYFAIR, T_INTER, T_FAMILJEN],
];

// Tier 3 is the size floor — no quote renders smaller than the "Under pressure…"
// reference size. The larger tiers step up from there.
const SIZE_TIERS = [
  { fontSize: "clamp(2.9rem, 6.2vw, 5.5rem)", lineHeight: 1.05 },
  { fontSize: "clamp(2.1rem, 4vw, 3.4rem)", lineHeight: 1.12 },
  { fontSize: "clamp(1.7rem, 3vw, 2.4rem)", lineHeight: 1.22 },
  { fontSize: "clamp(1.2rem, 2.1vw, 1.65rem)", lineHeight: 1.4 },
] as const;

/** Tier 0 is reserved for the emphasis-3 hero, handled separately. Distribution
 * leans toward the larger tiers so the cloud reads big. */
const TIER_CANDIDATES: Record<1 | 2 | 3, number[]> = {
  1: [2, 2, 2, 3],
  2: [1, 1, 2, 2],
  3: [1, 1, 2],
};

/** One clear hero per render (reserved for emphasis-3) for an intentional read. */
const MAX_TIER_ONE_PER_RENDER = 1;

/** Reveal cascade: each tier starts ~this much later, so the hero leads. */
const TIER_DELAY_STEP_MS = 420;

/** Two-value contrast only: bright white or dark grey, nothing in between.
 * Colour is assigned after packing (see assignSpreadColors) so neighbours
 * alternate and same-colour quotes never cluster into chunks. */
const QUOTE_WHITE = "#ffffffd5";
const QUOTE_DARK = "#8c8c93bf";

/** How many nearest already-coloured blocks a new block checks to pick the
 * locally-minority colour. */
const COLOR_NEIGHBORS_K = 4;

/** Easter egg: clicking any Max Verstappen quote drives off to the super-max album. */
const EASTER_EGG_AUTHOR = "Max Verstappen";
const EASTER_EGG_HREF = "/photos/super-max";

/** Wrap bound per size tier (ch resolves against each quote's own font size). */
const TIER_MAX_WIDTHS_CH = [14, 20, 26, 32] as const;

/** Uniform gutter between packed blocks (px). */
const PACK_GUTTER_PX = 44;

/** Placement jitter: any candidate within this of the lowest top is eligible. */
const PACK_JITTER_Y_PX = 24;

/** Candidate x positions are scanned at this granularity. */
const PACK_SCAN_STEP_PX = 16;

/** Packing runs this many randomized attempts and keeps the best-scoring cloud. */
const PACK_ATTEMPTS = 10;

/** Same-author blocks should stay this far apart (center-to-center, as a
 * fraction of container width) so a single author's quotes don't cluster. */
const SAME_AUTHOR_DIST_FRACTION = 0.38;

/** Best-of-N cost added per same-author pair that ends up closer than minDist. */
const SAME_AUTHOR_PENALTY_PX = 300;

interface QuoteAssignment {
  quote: QuoteEntry;
  tier: number;
  treatmentId: string;
  fontFamily: string;
  fontStyle: "normal" | "italic";
  fontWeight: number;
  uppercase: boolean;
  letterSpacing?: string;
  delayMs: number;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Apply a tier's treatment to an assignment in place (font/style/weight/case). */
function applyTreatment(assignment: QuoteAssignment, treatment: Treatment) {
  assignment.treatmentId = treatment.id;
  assignment.fontFamily = treatment.fontFamily;
  assignment.fontStyle = treatment.fontStyle;
  assignment.fontWeight = pick(treatment.weights);
  assignment.uppercase = treatment.uppercase;
  assignment.letterSpacing = treatment.letterSpacing;
}

function generateAssignments(quotes: QuoteEntry[]): QuoteAssignment[] {
  let tierOneUsed = 0;

  const assignments: QuoteAssignment[] = shuffle(quotes).map((quote) => {
    const emphasis = quote.emphasis ?? 1;
    let tier: number;
    if (
      emphasis === 3 &&
      tierOneUsed < MAX_TIER_ONE_PER_RENDER &&
      Math.random() < 0.65
    ) {
      tier = 0;
      tierOneUsed += 1;
    } else {
      tier = pick(TIER_CANDIDATES[emphasis]);
    }

    const assignment: QuoteAssignment = {
      quote,
      tier,
      treatmentId: "",
      fontFamily: INTER,
      fontStyle: "normal",
      fontWeight: 400,
      uppercase: false,
      // Tier-biased stagger so the hero leads and supporting type follows.
      delayMs: Math.min(
        tier * TIER_DELAY_STEP_MS + Math.random() * 500,
        MAX_START_DELAY_MS,
      ),
    };
    applyTreatment(assignment, pick(TIER_TREATMENTS[tier]));
    return assignment;
  });

  // One re-roll pass: avoid adjacent quotes sharing a treatment or a size tier.
  for (let i = 1; i < assignments.length; i++) {
    const prev = assignments[i - 1];
    const curr = assignments[i];
    if (curr.treatmentId === prev.treatmentId) {
      const alts = TIER_TREATMENTS[curr.tier].filter(
        (t) => t.id !== prev.treatmentId,
      );
      if (alts.length > 0) applyTreatment(curr, pick(alts));
    }
    if (curr.tier !== 0 && curr.tier === prev.tier) {
      const emphasis = curr.quote.emphasis ?? 1;
      const alts = TIER_CANDIDATES[emphasis].filter((t) => t !== prev.tier);
      if (alts.length > 0) {
        curr.tier = pick(alts);
        applyTreatment(curr, pick(TIER_TREATMENTS[curr.tier]));
      }
    }
  }

  return assignments;
}

interface PackBlock {
  id: string;
  width: number;
  height: number;
  author?: string;
}

interface PackedPosition {
  left: number;
  top: number;
  width: number;
}

interface PackResult {
  positions: Map<string, PackedPosition>;
  height: number;
  /** id → quote colour, assigned post-pack so neighbours alternate. */
  colors: Map<string, string>;
}

interface SkylineSegment {
  x: number;
  width: number;
  y: number;
}

/**
 * Greedy skyline packer. Blocks are inflated by the gutter on both axes and
 * packed into width + gutter, which guarantees uniform ≥gutter gaps and no
 * overlaps. Candidate x positions are scanned at a fine step across the full
 * width (so blocks can nestle mid-span against earlier ones), and any
 * candidate near the lowest resulting top is eligible — picked at random for
 * organic, non-justified edges.
 */
function packOnce(
  blocks: PackBlock[],
  containerWidth: number,
  gutter: number,
  minSameAuthorDist: number,
): PackResult {
  const fieldWidth = containerWidth + gutter;
  let skyline: SkylineSegment[] = [{ x: 0, width: fieldWidth, y: 0 }];
  const positions = new Map<string, PackedPosition>();
  // Centers of already-placed blocks, grouped by author, so a new block can
  // steer away from earlier quotes by the same author.
  const authorCenters = new Map<string, { cx: number; cy: number }[]>();
  let cloudHeight = 0;

  const topFor = (x: number, w: number): number => {
    let top = 0;
    for (const seg of skyline) {
      if (seg.x + seg.width <= x) continue;
      if (seg.x >= x + w) break;
      top = Math.max(top, seg.y);
    }
    return top;
  };

  const occupy = (x: number, w: number, newY: number) => {
    const next: SkylineSegment[] = [];
    for (const seg of skyline) {
      const segEnd = seg.x + seg.width;
      if (segEnd <= x || seg.x >= x + w) {
        next.push(seg);
        continue;
      }
      if (seg.x < x) next.push({ x: seg.x, width: x - seg.x, y: seg.y });
      if (segEnd > x + w) {
        next.push({ x: x + w, width: segEnd - (x + w), y: seg.y });
      }
    }
    next.push({ x, width: w, y: newY });
    next.sort((a, b) => a.x - b.x);
    const merged: SkylineSegment[] = [];
    for (const seg of next) {
      const last = merged[merged.length - 1];
      if (last && last.y === seg.y && last.x + last.width === seg.x) {
        last.width += seg.width;
      } else {
        merged.push({ ...seg });
      }
    }
    skyline = merged;
  };

  for (const block of blocks) {
    const blockWidth = Math.min(block.width, containerWidth);
    const w = blockWidth + gutter;
    const h = block.height + gutter;

    const maxXStart = fieldWidth - w;
    const candidates: { x: number; y: number }[] = [];
    for (let x = 0; x <= maxXStart; x += PACK_SCAN_STEP_PX) {
      candidates.push({ x, y: topFor(x, w) });
    }
    if (
      candidates.length === 0 ||
      candidates[candidates.length - 1].x < maxXStart
    ) {
      candidates.push({ x: maxXStart, y: topFor(maxXStart, w) });
    }

    const bestY = Math.min(...candidates.map((c) => c.y));
    const near = candidates.filter((c) => c.y <= bestY + PACK_JITTER_Y_PX);

    // Distance from a candidate's center to the nearest same-author block.
    const placed = block.author ? authorCenters.get(block.author) : undefined;
    const nearestSameAuthor = (c: { x: number; y: number }): number => {
      if (!placed || placed.length === 0) return Infinity;
      const cx = c.x + blockWidth / 2;
      const cy = c.y + block.height / 2;
      let min = Infinity;
      for (const p of placed) {
        min = Math.min(min, Math.hypot(cx - p.cx, cy - p.cy));
      }
      return min;
    };

    let choice: { x: number; y: number };
    if (placed && placed.length > 0) {
      // Prefer candidates far enough from same-author blocks; if none clear the
      // threshold (tight layout), fall back to the farthest available.
      const farEnough = near.filter(
        (c) => nearestSameAuthor(c) >= minSameAuthorDist,
      );
      if (farEnough.length > 0) {
        choice = farEnough[Math.floor(Math.random() * farEnough.length)];
      } else {
        choice = near.reduce((a, b) =>
          nearestSameAuthor(b) > nearestSameAuthor(a) ? b : a,
        );
      }
    } else {
      choice = near[Math.floor(Math.random() * near.length)];
    }

    positions.set(block.id, {
      left: choice.x,
      top: choice.y,
      width: blockWidth,
    });
    if (block.author) {
      const centers = authorCenters.get(block.author) ?? [];
      centers.push({
        cx: choice.x + blockWidth / 2,
        cy: choice.y + block.height / 2,
      });
      authorCenters.set(block.author, centers);
    }
    occupy(choice.x, w, choice.y + h);
    cloudHeight = Math.max(cloudHeight, choice.y + block.height);
  }

  // Colours are filled in by packBlocks on the winning layout.
  return { positions, height: cloudHeight, colors: new Map() };
}

/**
 * Assign each placed block white or dark so the two colours stay well spread.
 * Walking in reading order, each block takes the minority colour among its
 * nearest already-coloured neighbours (ties broken toward a global 50/50), so
 * same-colour blocks never bunch into chunks.
 */
function assignSpreadColors(
  result: PackResult,
  blocks: PackBlock[],
): Map<string, string> {
  const heightById = new Map(blocks.map((b) => [b.id, b.height]));
  const items = [...result.positions.entries()]
    .map(([id, pos]) => ({
      id,
      cx: pos.left + pos.width / 2,
      cy: pos.top + (heightById.get(id) ?? 0) / 2,
    }))
    .sort((a, b) => a.cy - b.cy || a.cx - b.cx);

  const colors = new Map<string, string>();
  const placed: { id: string; cx: number; cy: number }[] = [];
  let whites = 0;
  let darks = 0;

  for (const it of items) {
    const near = placed
      .map((p) => ({
        color: colors.get(p.id) as string,
        d: Math.hypot(it.cx - p.cx, it.cy - p.cy),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, COLOR_NEIGHBORS_K);

    let nearWhite = 0;
    let nearDark = 0;
    for (const n of near) {
      if (n.color === QUOTE_WHITE) nearWhite += 1;
      else nearDark += 1;
    }

    const color =
      nearWhite === nearDark
        ? whites <= darks
          ? QUOTE_WHITE
          : QUOTE_DARK
        : nearWhite < nearDark
          ? QUOTE_WHITE
          : QUOTE_DARK;

    colors.set(it.id, color);
    if (color === QUOTE_WHITE) whites += 1;
    else darks += 1;
    placed.push(it);
  }

  return colors;
}

/** Count same-author block pairs whose centers end up closer than minDist. */
function sameAuthorClosePairs(
  result: PackResult,
  blocks: PackBlock[],
  minDist: number,
): number {
  const byId = new Map(blocks.map((b) => [b.id, b]));
  const centers: { author: string; cx: number; cy: number }[] = [];
  for (const [id, pos] of result.positions) {
    const block = byId.get(id);
    if (!block?.author) continue;
    centers.push({
      author: block.author,
      cx: pos.left + pos.width / 2,
      cy: pos.top + block.height / 2,
    });
  }
  let pairs = 0;
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      if (centers[i].author !== centers[j].author) continue;
      const d = Math.hypot(centers[i].cx - centers[j].cx, centers[i].cy - centers[j].cy);
      if (d < minDist) pairs += 1;
    }
  }
  return pairs;
}

/**
 * Best-of-N randomized packs, scored on height plus a same-author proximity
 * penalty, then centered horizontally.
 */
function packBlocks(
  blocks: PackBlock[],
  containerWidth: number,
  gutter: number,
): PackResult {
  const minDist = containerWidth * SAME_AUTHOR_DIST_FRACTION;
  // Score on same-author spacing only — not height — so the shuffled order's
  // taller, intermixed layout is kept rather than compacted toward shortest.
  const costOf = (r: PackResult): number =>
    SAME_AUTHOR_PENALTY_PX * sameAuthorClosePairs(r, blocks, minDist);

  let best: PackResult | null = null;
  let bestCost = Infinity;
  for (let i = 0; i < PACK_ATTEMPTS; i++) {
    const attempt = packOnce(blocks, containerWidth, gutter, minDist);
    const cost = costOf(attempt);
    if (cost < bestCost) {
      best = attempt;
      bestCost = cost;
    }
  }
  const result = best as PackResult;

  let minX = Infinity;
  let maxX = -Infinity;
  for (const pos of result.positions.values()) {
    minX = Math.min(minX, pos.left);
    maxX = Math.max(maxX, pos.left + pos.width);
  }
  if (Number.isFinite(minX)) {
    const shift = Math.round((containerWidth - (maxX - minX)) / 2 - minX);
    for (const pos of result.positions.values()) {
      pos.left += shift;
    }
  }
  result.colors = assignSpreadColors(result, blocks);
  return result;
}

export function QuoteCloud({ quotes }: { quotes: QuoteEntry[] }) {
  const reduceMotion = useReducedMotion();
  const router = useRouter();

  // Generated after mount so randomization never causes a hydration mismatch.
  const [assignments, setAssignments] = useState<QuoteAssignment[] | null>(
    null,
  );
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [layout, setLayout] = useState<PackResult | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [fontsTick, setFontsTick] = useState(0);
  // Latch: once revealed, resize re-packs must not replay the entrance.
  const [hasRevealed, setHasRevealed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    setAssignments(generateAssignments(quotes));
    setHasRevealed(false);
  }, [quotes]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Late-loading fonts change metrics; re-pack whenever a font load settles.
  useEffect(() => {
    let cancelled = false;
    const bump = () => {
      if (!cancelled) setFontsTick((t) => t + 1);
    };
    document.fonts.ready.then(bump);
    document.fonts.addEventListener("loadingdone", bump);
    return () => {
      cancelled = true;
      document.fonts.removeEventListener("loadingdone", bump);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop || !assignments) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setContainerWidth((prev) => (Math.abs(prev - width) < 1 ? prev : width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isDesktop, assignments]);

  // Any input change invalidates the layout, forcing an unplaced measure render
  // (blocks back to natural width) before the effect below re-packs.
  useLayoutEffect(() => {
    setLayout(null);
  }, [assignments, isDesktop, containerWidth, fontsTick]);

  // Measure natural block sizes, then pack. Runs in the commit where layout is
  // null and the hidden blocks are in the DOM at natural width. Uses offset
  // dimensions (transform-independent) so the 0.96 entrance scale can't skew
  // measurement, +1px slack so integer rounding never re-wraps a line.
  useLayoutEffect(() => {
    if (layout !== null || !isDesktop || !assignments) return;
    const width = containerRef.current?.offsetWidth ?? 0;
    if (width <= 0) return;

    const blocks: PackBlock[] = [];
    // Hero first (anchors the top), then the rest in their already-shuffled
    // order so big and small quotes intermix vertically instead of stratifying
    // into big-at-top / small-at-bottom.
    const ordered = [
      ...assignments.filter((a) => a.tier === 0),
      ...assignments.filter((a) => a.tier !== 0),
    ];
    for (const a of ordered) {
      const el = blockRefs.current.get(a.quote.id);
      if (!el) return;
      blocks.push({
        id: a.quote.id,
        width: el.offsetWidth + 1,
        height: el.offsetHeight + 1,
        author: a.quote.attribution,
      });
    }
    setLayout(packBlocks(blocks, width, PACK_GUTTER_PX));
  }, [layout, isDesktop, assignments]);

  const revealStarted = layout !== null || isDesktop === false;

  useEffect(() => {
    if (revealStarted) setHasRevealed(true);
  }, [revealStarted]);

  const reveal = revealStarted || hasRevealed;

  // Cursor-following author tooltip. Author persists through fade-out (only
  // `visible` toggles) so the label doesn't blank mid-transition.
  const [tip, setTip] = useState<{ author: string; visible: boolean }>({
    author: "",
    visible: false,
  });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Position via direct DOM writes (not state) so pointer moves don't re-render
  // the whole cloud. Offset from the cursor and clamped to the viewport.
  const positionTooltip = useCallback((clientX: number, clientY: number) => {
    const el = tooltipRef.current;
    if (!el) return;
    const gap = 18;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    // Center-right of the cursor: just to its right, vertically centred on it.
    let left = clientX + gap;
    const top = Math.min(
      Math.max(8, clientY - h / 2),
      window.innerHeight - h - 8,
    );
    if (left + w > window.innerWidth - 8) left = clientX - gap - w; // flip near right edge
    el.style.transform = `translate3d(${Math.max(8, left)}px, ${top}px, 0)`;
  }, []);

  useEffect(() => {
    if (!tip.visible) return;
    const onMove = (e: PointerEvent) => positionTooltip(e.clientX, e.clientY);
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [tip.visible, positionTooltip]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative z-0 isolate px-6 pb-24 pt-12 md:py-24"
    >
      <div className="mx-auto max-w-[100rem]">
        <motion.header
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-16 text-center md:mb-24"
        >
          <h1 className="heading-bleed-mobile select-none text-center font-display text-[clamp(2.75rem,10.5vw,6.5rem)] font-extrabold uppercase leading-none tracking-tighter sm:text-[clamp(3rem,11.5vw,7rem)] md:max-w-full md:text-[min(8.2vw,6.75rem)] heading-ghost heading-ghost-photos">
            Quotes
          </h1>
          <p className="mt-6 select-none text-[1.375rem] leading-snug text-neutral-400 md:mt-8">
            &ldquo; Lines worth keeping. &rdquo;
          </p>
        </motion.header>
        {assignments && isDesktop !== null ? (
          isDesktop ? (
          <div
            ref={containerRef}
            className="relative"
            style={layout ? { height: layout.height } : { minHeight: "70vh" }}
          >
            {assignments.map((a) => {
              const pos = layout?.positions.get(a.quote.id);
              const label = a.quote.attribution
                ? `${a.quote.text} — ${a.quote.attribution}`
                : a.quote.text;
              return (
                <motion.figure
                  key={a.quote.id}
                  ref={(el) => {
                    if (el) blockRefs.current.set(a.quote.id, el);
                  }}
                  role="figure"
                  aria-label={label}
                  className={`select-none ${
                    a.quote.attribution === EASTER_EGG_AUTHOR
                      ? "cursor-pointer"
                      : ""
                  }`}
                  onClick={
                    a.quote.attribution === EASTER_EGG_AUTHOR
                      ? () => router.push(EASTER_EGG_HREF)
                      : undefined
                  }
                  onPointerEnter={
                    isDesktop && a.quote.attribution
                      ? (e) => {
                          setTip({
                            author: a.quote.attribution as string,
                            visible: true,
                          });
                          positionTooltip(e.clientX, e.clientY);
                        }
                      : undefined
                  }
                  onPointerLeave={
                    isDesktop
                      ? () => setTip((t) => ({ ...t, visible: false }))
                      : undefined
                  }
                  initial={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: QUOTE_FADE_SCALE_FROM }
                  }
                  animate={
                    reveal
                      ? { opacity: 1, scale: 1 }
                      : reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: QUOTE_FADE_SCALE_FROM }
                  }
                  transition={
                    reduceMotion
                      ? {
                          duration: REDUCED_MOTION_FADE_DURATION_S,
                          ease: "easeOut",
                        }
                      : {
                          delay: a.delayMs / 1000,
                          duration: QUOTE_FADE_DURATION_S,
                          ease: "easeOut",
                        }
                  }
                  style={
                    isDesktop
                      ? {
                          position: "absolute",
                          left: pos?.left ?? 0,
                          top: pos?.top ?? 0,
                          width: pos?.width,
                          visibility: pos ? "visible" : "hidden",
                        }
                      : { position: "relative" }
                  }
                >
                  {SHOW_ATTRIBUTION && a.quote.attribution ? (
                    <figcaption
                      aria-hidden="true"
                      className="mb-2.5 ms-1.5 font-mono text-[0.7rem] uppercase leading-none tracking-[0.22em] text-neutral-400"
                    >
                      {a.quote.attribution}
                    </figcaption>
                  ) : null}
                  <blockquote
                    aria-hidden="true"
                    style={{
                      fontFamily: a.fontFamily,
                      fontStyle: a.fontStyle,
                      fontWeight: a.fontWeight,
                      fontSize: SIZE_TIERS[a.tier].fontSize,
                      lineHeight: SIZE_TIERS[a.tier].lineHeight,
                      color: layout?.colors.get(a.quote.id) ?? QUOTE_WHITE,
                      textTransform: a.uppercase ? "uppercase" : undefined,
                      letterSpacing: a.letterSpacing,
                      maxWidth: isDesktop
                        ? `${TIER_MAX_WIDTHS_CH[a.tier]}ch`
                        : undefined,
                    }}
                  >
                    {a.quote.text}
                  </blockquote>
                </motion.figure>
              );
            })}
          </div>
          ) : (
            // Mobile: a vertical stack carrying each quote's own font treatment,
            // ordered by the same per-load shuffle. Just scroll.
            <ul className="flex flex-col gap-12">
              {assignments.map((a) => (
                <motion.li
                  key={a.quote.id}
                  className={`select-none ${
                    a.quote.attribution === EASTER_EGG_AUTHOR
                      ? "cursor-pointer"
                      : ""
                  }`}
                  onClick={
                    a.quote.attribution === EASTER_EGG_AUTHOR
                      ? () => router.push(EASTER_EGG_HREF)
                      : undefined
                  }
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <figure
                    role="figure"
                    aria-label={
                      a.quote.attribution
                        ? `${a.quote.text} — ${a.quote.attribution}`
                        : a.quote.text
                    }
                  >
                    <blockquote
                      aria-hidden="true"
                      className="text-neutral-100"
                      style={{
                        fontFamily: a.fontFamily,
                        fontStyle: a.fontStyle,
                        fontWeight: a.fontWeight,
                        textTransform: a.uppercase ? "uppercase" : undefined,
                        letterSpacing: a.letterSpacing,
                        fontSize: "clamp(1.5rem, 5.5vw, 2.1rem)",
                        lineHeight: 1.3,
                      }}
                    >
                      {a.quote.text}
                    </blockquote>
                    {a.quote.attribution ? (
                      <figcaption
                        aria-hidden="true"
                        className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-neutral-500"
                      >
                        {a.quote.attribution}
                      </figcaption>
                    ) : null}
                  </figure>
                </motion.li>
              ))}
            </ul>
          )
        ) : (
          <div className="min-h-[70vh]" aria-hidden="true" />
        )}
      </div>
      <div
        ref={tooltipRef}
        aria-hidden="true"
        className={`pointer-events-none fixed left-0 top-0 z-[100] rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-neutral-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_10px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-opacity duration-150 ${
          tip.visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {tip.author}
      </div>
    </main>
  );
}

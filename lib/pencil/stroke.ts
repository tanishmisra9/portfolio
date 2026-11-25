// The pencil stroke model: a drawn SVG path (the hand-drawn builders' `d`, unchanged) becomes a densely resampled
// centerline that knows, at every point, where the tip is, which way it is heading, how tightly it is turning and how
// fast a hand would be moving there. That drives both the graphite line's width (rendered by PencilStroke) and the
// synthesized scratch (lib/pencil/voice.ts). Pure: no DOM, no `@/` imports (scripts/check-pencil.mjs runs it on Node).

// No imports at all: Next's TS setup rejects `.ts` import extensions while Node's type stripping requires them, so the
// config (lib/pencil/config.ts, PENCIL.line and the turn settings) is passed in by the caller.

export type Pt = [number, number];
export type LineConfig = {
  sampleStep: number;
  downWeight: number;
  slowThick: number;
  fastThin: number;
  curvatureSlow: number;
  endSlow: number;
  taper: number;
  taperMin: number;
  wobble: number;
  wobblePeriod: number;
  min: number;
  max: number;
  buckets: number;
};
export type TurnConfig = { tickTurn: number; tickSpan: number };

export type Tip = {
  x: number;
  y: number;
  /** Heading in radians (screen coords: y down). */
  angle: number;
  /** Downward component of the heading: 1 straight down, −1 straight up. */
  down: number;
  /** Signed curvature (1/px). */
  curvature: number;
  /** Implied pen speed 0..1 (slow in tight curves and at the ends). */
  speed: number;
};

export type Stroke = {
  length: number;
  pts: Pt[];
  /** Arc length at each point. */
  cum: number[];
  width: number[];
  /** Arc lengths of sharp turns (for the voice's ticks). */
  turns: number[];
  tipAt(len: number): Tip;
  /** The line drawn up to `len`, as round-capped paths grouped by width level. */
  paths(len: number): { w: number; d: string }[];
  /** The width levels (fixed per stroke), so a renderer can create one element per level up front. */
  levels: number[];
};

// ── Path sampling (absolute M / L / C / Q, which is all the builders emit) ──

export function samplePath(d: string): Pt[] {
  const tok = d.match(/[MLCQ]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? [];
  const out: Pt[] = [];
  let i = 0;
  let cur: Pt = [0, 0];
  let cmd = "";
  const num = () => parseFloat(tok[i++]);
  const pt = (): Pt => [num(), num()];
  while (i < tok.length) {
    if (/[MLCQ]/i.test(tok[i])) cmd = tok[i++].toUpperCase();
    if (cmd === "M") {
      cur = pt();
      out.push(cur);
      cmd = "L"; // further pairs after M are line-tos
    } else if (cmd === "L") {
      cur = pt();
      out.push(cur);
    } else if (cmd === "C") {
      const [c1, c2, e] = [pt(), pt(), pt()];
      const n = Math.max(4, Math.ceil(chord(cur, c1, c2, e) / 1.5));
      for (let k = 1; k <= n; k++) out.push(cubic(cur, c1, c2, e, k / n));
      cur = e;
    } else if (cmd === "Q") {
      const [c, e] = [pt(), pt()];
      const n = Math.max(4, Math.ceil(chord(cur, c, e) / 1.5));
      for (let k = 1; k <= n; k++) out.push(quad(cur, c, e, k / n));
      cur = e;
    } else {
      i++; // unknown token: skip
    }
  }
  return out;
}

const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const chord = (...p: Pt[]) => p.slice(1).reduce((s, q, k) => s + dist(p[k], q), 0);
function cubic(a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt {
  const u = 1 - t;
  const f = (i: 0 | 1) => u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i];
  return [f(0), f(1)];
}
function quad(a: Pt, b: Pt, c: Pt, t: number): Pt {
  const u = 1 - t;
  const f = (i: 0 | 1) => u * u * a[i] + 2 * u * t * b[i] + t * t * c[i];
  return [f(0), f(1)];
}

/** Evenly spaced points `step` px apart along a polyline (the last point is always kept). */
export function resample(poly: Pt[], step: number): Pt[] {
  const pts = poly.filter((p, k) => k === 0 || dist(poly[k - 1], p) > 1e-6);
  if (pts.length < 2) return pts;
  const out: Pt[] = [pts[0]];
  let carry = 0;
  for (let k = 1; k < pts.length; k++) {
    const [a, b] = [pts[k - 1], pts[k]];
    const seg = dist(a, b);
    let at = step - carry;
    while (at <= seg) {
      const t = at / seg;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      at += step;
    }
    carry = seg - (at - step);
  }
  const last = pts[pts.length - 1];
  if (dist(out[out.length - 1], last) > 1e-6) out.push(last);
  return out;
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smoothstep = (t: number) => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};

/**
 * Builds the stroke model from a path `d` and the stroke's base width (px). `seed` varies the width wobble.
 * `cfg` is PENCIL.line (or an override for a stroke that should draw differently); `turn` is PENCIL.sound's
 * tickTurn/tickSpan.
 */
export function createStroke(d: string, base: number, seed: number, cfg: LineConfig, turn: TurnConfig): Stroke {
  const pts = resample(samplePath(d), cfg.sampleStep);
  const n = pts.length;
  const cum = [0];
  for (let k = 1; k < n; k++) cum.push(cum[k - 1] + dist(pts[k - 1], pts[k]));
  const length = cum[n - 1] ?? 0;

  // Heading from a centred difference; curvature as heading change per px over a small window.
  const angle = pts.map((_, k) => {
    const [a, b] = [pts[Math.max(0, k - 1)], pts[Math.min(n - 1, k + 1)]];
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  });
  const W = 2;
  const curv = pts.map((_, k) => {
    const [i, j] = [Math.max(0, k - W), Math.min(n - 1, k + W)];
    const ds = cum[j] - cum[i];
    return ds > 0 ? wrap(angle[j] - angle[i]) / ds : 0;
  });
  const down = angle.map((a) => Math.sin(a));
  const ends = Math.max(1e-6, cfg.endSlow * length);
  const speed = pts.map((_, k) => {
    const s = 1 / (1 + cfg.curvatureSlow * Math.abs(curv[k]));
    const ease = 0.35 + 0.65 * Math.min(smoothstep(cum[k] / ends), smoothstep((length - cum[k]) / ends));
    return s * ease;
  });

  // Width: direction × implied speed × wobble × end taper, clamped.
  const ph = [seed * 1.7, seed * 4.3];
  const wobble = (s: number) =>
    0.6 * Math.sin((2 * Math.PI * s) / cfg.wobblePeriod + ph[0]) + 0.4 * Math.sin((2 * Math.PI * s) / (cfg.wobblePeriod * 0.37) + ph[1]);
  const width = pts.map((_, k) => {
    const dir = 1 + cfg.downWeight * down[k];
    const pace = 1 + cfg.slowThick - (cfg.slowThick + cfg.fastThin) * speed[k];
    const taper = cfg.taper > 0 ? cfg.taperMin + (1 - cfg.taperMin) * Math.min(smoothstep(cum[k] / cfg.taper), smoothstep((length - cum[k]) / cfg.taper)) : 1;
    return base * clamp(dir * pace * (1 + cfg.wobble * wobble(cum[k])) * taper, cfg.min * taper, cfg.max);
  });

  // Sharp turns: heading change above tickTurn degrees within tickSpan × base of travel; nearby hits merged.
  const span = turn.tickSpan * base;
  const limit = (turn.tickTurn * Math.PI) / 180;
  const turns: number[] = [];
  for (let k = 0, j = 0; k < n; k++) {
    while (j < n - 1 && cum[j] - cum[k] < span) j++;
    let turned = 0;
    for (let m = k + 1; m <= j; m++) turned += wrap(angle[m] - angle[m - 1]);
    if (Math.abs(turned) > limit) {
      const at = (cum[k] + cum[j]) / 2;
      if (!turns.length || at - turns[turns.length - 1] > span * 2) turns.push(at);
    }
  }

  const levels = Array.from({ length: cfg.buckets }, (_, b) => base * (cfg.min + ((cfg.max - cfg.min) * (b + 0.5)) / cfg.buckets));
  const levelOf = (w: number) => clamp(Math.floor(((w / base - cfg.min) / (cfg.max - cfg.min)) * cfg.buckets), 0, cfg.buckets - 1);

  const indexAt = (len: number) => {
    let lo = 0;
    let hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (cum[mid] <= len) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };
  const lerpAt = (len: number): [number, number] => {
    const k = indexAt(clamp(len, 0, length));
    if (k >= n - 1) return [n - 1, 0];
    const seg = cum[k + 1] - cum[k];
    return [k, seg > 0 ? (len - cum[k]) / seg : 0];
  };

  return {
    length,
    pts,
    cum,
    width,
    turns,
    levels,
    tipAt(len) {
      const [k, t] = lerpAt(len);
      const j = Math.min(n - 1, k + 1);
      const mix = (a: number, b: number) => a + (b - a) * t;
      return {
        x: mix(pts[k][0], pts[j][0]),
        y: mix(pts[k][1], pts[j][1]),
        angle: angle[k] + wrap(angle[j] - angle[k]) * t,
        down: mix(down[k], down[j]),
        curvature: mix(curv[k], curv[j]),
        speed: mix(speed[k], speed[j]),
      };
    },
    paths(len) {
      const out = levels.map((w) => ({ w, d: "" }));
      if (n < 2 || len <= 0) return out;
      const [k, t] = lerpAt(len);
      const last = Math.min(k, n - 2);
      const f = (v: number) => v.toFixed(1);
      // Each segment goes to its width level; consecutive segments on one level are chained into one subpath.
      let prevLevel = -1;
      for (let s = 0; s <= last; s++) {
        const a = pts[s];
        const partial = s === k && k < n - 1;
        const b: Pt = partial ? [a[0] + (pts[s + 1][0] - a[0]) * t, a[1] + (pts[s + 1][1] - a[1]) * t] : pts[s + 1];
        if (partial && t <= 0) break;
        const lv = levelOf((width[s] + width[s + 1]) / 2);
        out[lv].d += lv === prevLevel ? ` L${f(b[0])} ${f(b[1])}` : ` M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`;
        prevLevel = lv;
        if (partial) break;
      }
      return out;
    },
  };
}

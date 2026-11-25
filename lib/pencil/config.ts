// Every knob of the pencil engine in one place: how the graphite line responds to the stroke (lib/pencil/stroke.ts)
// and how the synthesized scratch responds to the tip (lib/pencil/voice.ts + public/worklets/pencil.js).
// No `@/` imports and no enums: scripts/check-pencil.mjs loads this on Node's native TS stripping.

export const PENCIL = {
  line: {
    /** px between resampled centerline points. */
    sampleStep: 2,
    /** Width × (1 + this × down): heavier on downstrokes, lighter on upstrokes (down runs −1..1). */
    downWeight: 0.18,
    /** Width at the slowest implied pen speed: × (1 + slowThick). */
    slowThick: 0.2,
    /** Width at the fastest implied pen speed: × (1 − fastThin). */
    fastThin: 0.16,
    /** px. Implied speed = 1 / (1 + curvatureSlow × |curvature|): a hand slows into tight curves. */
    curvatureSlow: 30,
    /** Fraction of the stroke eased at each end: the pen lands and lifts slower. */
    endSlow: 0.08,
    /** px over which width ramps up from `taperMin` at the very start and down to it at the very end. */
    taper: 8,
    taperMin: 0.35,
    /** ± fraction of low-frequency, seeded width wobble along the stroke, and its period in px. */
    wobble: 0.06,
    wobblePeriod: 90,
    /** Width clamp, × the stroke's base width. */
    min: 0.55,
    max: 1.4,
    /** Width levels the line is rendered at (one round-capped path each). More = smoother width changes. */
    buckets: 8,
    /** Graphite grain strength 0..1 (0 = a clean line). */
    grain: 0.3,
    /** Nothing shows until the drawn length reaches this × base width (a near-zero round cap paints a dot). */
    minVisible: 2,
  },
  sound: {
    /**
     * The friction bed: white noise through these parallel resonant bands (Hz, Q, linear gain). Fitted to the reference
     * recording (public/sfx/pencil.mp3) by scripts/pencil-fit.mjs, so the synth sounds like the scratch the owner liked.
     */
    bands: [
      { f: 250, q: 1.2, g: 0.2 },
      { f: 500, q: 1.2, g: 0.35 },
      { f: 1000, q: 1.2, g: 0.6 },
      { f: 2000, q: 1.2, g: 0.8 },
      { f: 3000, q: 1.4, g: 0.8 },
      { f: 4500, q: 1.4, g: 0.6 },
      { f: 6500, q: 1.4, g: 0.4 },
      { f: 9000, q: 1.4, g: 0.25 },
    ],
    /** Output scale at pressure 1, fitted so the synth's level matches the normalised recording's. */
    outGain: 1,
    /** Level range (linear): any movement plays at `floor`, speed adds up to `max`. */
    floor: 0.11,
    max: 0.3,
    /** px/s of tip travel at which the level reaches `max`. */
    fullSpeed: 900,
    /** Level × (1 + this × down): a downstroke presses harder. */
    downWeight: 0.15,
    /** Level × (1 − this × tightness) through tight curves (tightness from curvature, 0..1). */
    curvatureSoft: 0.35,
    /** Octaves the band bank shifts: up on upstrokes (lighter, thinner), down on downstrokes (darker, fuller). */
    brightness: 0.35,
    /** Paper tooth: clicks per px of tip travel, their level relative to the bed, centre frequency and decay (s). */
    toothPerPx: 0.6,
    tooth: 0.5,
    toothFreq: 3400,
    toothDecay: 0.0025,
    /** Stereo width: pan = this × the tip's position across the viewport (−1 left … 1 right). 0 = mono. */
    pan: 0.6,
    /** Level smoothing time constants (s): how fast the pen bites, and how fast it fades once you stop. */
    attack: 0.012,
    release: 0.06,
    /** ms with no movement before the level releases (bridges mouse-wheel notches ~120ms apart). */
    releaseAfterMs: 150,
    /** Transients: a tick where the pen turns sharply (arrowhead tips, tight loop turns), a touch where it lands. */
    tick: 0.5,
    touch: 0.35,
    /** A "sharp turn" = heading change above `tickTurn` degrees within `tickSpan` × base width of travel. */
    tickTurn: 100,
    tickSpan: 4,
  },
};

export type PencilConfig = typeof PENCIL;

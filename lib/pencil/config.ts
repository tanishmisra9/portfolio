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
     * The friction bed: a graphic EQ of 1/3-octave resonant bands (Hz, Q, linear gain), each fed its own independent
     * noise so band powers add (a shared source made neighbouring bands interfere). Fitted to the reference recording
     * (public/sfx/pencil.mp3) by scripts/pencil-fit.mjs, so the synth sounds like the scratch the owner liked.
     * Re-run the fit after changing any band, `hp`, or the tooth settings.
     */
    bands: [
      { f: 125, q: 4.3, g: 0.2642 },
      { f: 160, q: 4.3, g: 0.2508 },
      { f: 200, q: 4.3, g: 0.259 },
      { f: 250, q: 4.3, g: 0.3536 },
      { f: 315, q: 4.3, g: 0.3415 },
      { f: 400, q: 4.3, g: 0.8402 },
      { f: 500, q: 4.3, g: 2.9578 },
      { f: 630, q: 4.3, g: 1.7818 },
      { f: 800, q: 4.3, g: 1.2744 },
      { f: 1000, q: 4.3, g: 0.7346 },
      { f: 1250, q: 4.3, g: 0.4433 },
      { f: 1600, q: 4.3, g: 0.7825 },
      { f: 2000, q: 4.3, g: 0.1139 },
      { f: 2500, q: 4.3, g: 0.3271 },
      { f: 3150, q: 4.3, g: 0.0027 },
      { f: 4000, q: 4.3, g: 0.0113 },
      { f: 5000, q: 4.3, g: 0.1507 },
      { f: 6300, q: 4.3, g: 0.3565 },
      { f: 8000, q: 4.3, g: 0.4593 },
      { f: 10000, q: 4.3, g: 0.8227 },
    ],
    /** Hz: a 4th-order high-pass under the bed, only to remove rumble below the lowest band. */
    hp: 100,
    /**
     * Output scale at pressure 1, fitted so the synth's level matches the normalised recording's.
     * Last fit: every 1/3-octave band 125 Hz–10 kHz within ±1.5 dB of the recording (worst 1.4 dB at 3.15 kHz, where the
     * random paper-tooth clicks live), level ratio 1.004. The near-zero 3150/4000 gains are right: the tooth supplies them.
     */
    outGain: 0.3655,
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

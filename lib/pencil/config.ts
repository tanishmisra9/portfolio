// Every knob of the pencil engine in one place: the stroke model the voice reads (lib/pencil/stroke.ts) and how the
// synthesized scratch responds to the tip (lib/pencil/voice.ts + public/worklets/pencil.js). The line itself is a
// plain SVG stroke (the graphite line was rolled back for performance; see components/photos/pencil-stroke.tsx).
// No `@/` imports and no enums: scripts/check-pencil.mjs loads this on Node's native TS stripping.

export const PENCIL = {
  line: {
    /** px between resampled centerline points (the tip is read from these). */
    sampleStep: 2,
    /** Nothing shows until the drawn length reaches this × the stroke width (a near-zero round cap paints a dot). */
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
    /**
     * Level range (linear): any movement plays at `floor`, speed adds up to `max`. Owner: 0.22/0.6 on the normalised
     * sample was "too loud", 0.11/0.3 "a tad too loud still", so 0.085/0.23 (−2.3 dB). Move both together.
     */
    floor: 0.085,
    max: 0.23,
    /** px/s of tip travel at which the level reaches `max`. */
    fullSpeed: 900,
    /** Level × (1 + this × down): a downstroke presses harder. */
    downWeight: 0.15,
    /** Level × (1 − this × tightness) through tight curves (tightness from curvature, 0..1). */
    curvatureSoft: 0.35,
    /** px: tightness = 1 − 1 / (1 + this × |curvature|), from 0 on a straight run toward 1 in a tight loop. */
    curvatureScale: 30,
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
    release: 0.04,
    /**
     * ms with no tip movement before the level releases. Short, so a small scroll doesn't ring on (owner: small scrolls
     * had "overly long" pencil sound at 150ms + a 60ms fade). Scroll events arrive every frame while the page moves,
     * including during a wheel notch's smooth-scroll animation, so 80ms still bridges them.
     */
    releaseAfterMs: 80,
    /** Transients: a tick where the pen turns sharply (arrowhead tips, tight loop turns), a touch where it lands. */
    tick: 0.5,
    touch: 0.35,
    /** A "sharp turn" = heading change above `tickTurn` degrees within `tickSpan` px of travel. */
    tickTurn: 100,
    tickSpan: 28,
  },
};

export type PencilConfig = typeof PENCIL;

// The /photos pencil strokes' sound comes from the pencil-voice package (github.com/tanishmisra9/pencil-voice, installed
// from a pinned GitHub tag). This file holds this site's settings for it, so tuning stays a local edit with no release.
// Every knob, its unit and what it sounds like: pencil-voice's docs/tuning.md. The package default is its `graphite`
// preset (fitted to a pencil recording kept locally as public/sfx/pencil.mp3, not in the repo); the values below are the ones tuned by ear for this page.

import type { PencilConfig } from "pencil-voice";

/** Overrides on top of pencil-voice's `graphite` preset. */
export const SITE_PENCIL: Partial<PencilConfig> = {
  /**
   * Level range (linear): any movement plays at `floor`, speed adds up to `max`. Owner: 0.22/0.6 on the normalised
   * sample was "too loud", 0.11/0.3 "a tad too loud still", so 0.085/0.23 (−2.3 dB). Move both together.
   */
  floor: 0.085,
  max: 0.23,
  /**
   * ms with no tip movement before the level releases, and its fade (s). Short, so a small scroll doesn't ring on
   * (owner: small scrolls had "overly long" pencil sound at 150ms + a 60ms fade).
   */
  releaseAfterMs: 80,
  release: 0.04,
};

/** The line (a plain SVG stroke, components/photos/pencil-stroke.tsx). */
export const PENCIL_LINE = {
  /** Nothing shows until the drawn length reaches this × the stroke width (a near-zero round cap paints a dot). The
   *  pen's "touch" transient fires at the same moment, when the ink first appears. */
  minVisible: 2,
};

/**
 * Filename (not a full URL — samples can now be served from Blob or the local
 * /sfx/radio fallback) used to pick the perceived-loudness reference for gain matching.
 */
export const RADIO_REFERENCE_SAMPLE_FILENAME = "stupid.mp3";

/** Used when the published snapshot has no radio clips (nothing published yet, or none left). */
export const RADIO_SAMPLE_FALLBACK = [
  "/sfx/radio/stay-out.mp3",
  "/sfx/radio/simply-lovely.mp3",
  "/sfx/radio/max-squeaky.mp3",
  "/sfx/radio/stupid.mp3",
] as const;

/**
 * Playback gains for the fallback clips, precomputed exactly as publish() does for uploaded ones: RMS over every channel
 * (lib/radio-loudness.ts, measured in Chromium), then radioGain() against stupid.mp3. Without these the fallback clips
 * played unmatched once gains moved into the published snapshot. Re-measure if a fallback clip changes.
 * Measured RMS: stay-out 0.07127, simply-lovely 0.06880, max-squeaky 0.05413, stupid 0.07303.
 */
export const RADIO_FALLBACK_GAINS: Record<string, number> = {
  "/sfx/radio/stay-out.mp3": 1.025,
  "/sfx/radio/simply-lovely.mp3": 1.061,
  "/sfx/radio/max-squeaky.mp3": 1.349,
  "/sfx/radio/stupid.mp3": 1,
};

/** Used when the published snapshot has no keystroke triggers (nothing published yet, or none left). */
export const RADIO_TRIGGER_FALLBACK = ["bbb", "boxbox"] as const;

/** Loudness matching: floor for a near-silent clip's RMS, and the playback-gain range. */
export const RADIO_RMS_FLOOR = 0.0008;
const RADIO_GAIN_MIN = 0.45;
const RADIO_GAIN_MAX = 2.2;

export function radioGain(referenceRms: number, rms: number): number {
  const gain = Math.max(referenceRms, RADIO_RMS_FLOOR) / Math.max(rms, RADIO_RMS_FLOOR);
  return Math.min(RADIO_GAIN_MAX, Math.max(RADIO_GAIN_MIN, gain));
}

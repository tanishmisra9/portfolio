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

/** Used when the published snapshot has no keystroke triggers (nothing published yet, or none left). */
export const RADIO_TRIGGER_FALLBACK = ["bbb", "boxbox"] as const;

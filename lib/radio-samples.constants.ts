/** Perceived loudness reference for radio easter-egg gain matching. */
export const RADIO_REFERENCE_SAMPLE = "/sfx/radio/stupid.mp3";

/** Used when `public/sfx/radio` is missing, empty, or unreadable. */
export const RADIO_SAMPLE_FALLBACK = [
  "/sfx/radio/stay-out.mp3",
  "/sfx/radio/simply-lovely.mp3",
  "/sfx/radio/max-squeaky.mp3",
  RADIO_REFERENCE_SAMPLE,
] as const;

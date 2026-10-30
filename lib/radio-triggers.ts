import { getPublishedData } from "@/lib/site-content";
import { RADIO_TRIGGER_FALLBACK } from "@/lib/radio-samples.constants";

/**
 * Keystroke words that fire the radio easter egg — edited at /admin/radio, live after
 * Publish like the rest of the site (read from the published snapshot).
 */
export async function getRadioTriggers(): Promise<string[]> {
  try {
    const { radio } = await getPublishedData();
    if (radio?.triggers.length) return radio.triggers;
  } catch {
    // No snapshot yet / DB unreachable — use fallback.
  }

  return [...RADIO_TRIGGER_FALLBACK];
}

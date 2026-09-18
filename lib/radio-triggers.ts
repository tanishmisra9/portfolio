import { db } from "@/db/client";
import { radioTriggers } from "@/db/schema";
import { RADIO_TRIGGER_FALLBACK } from "@/lib/radio-samples.constants";

/**
 * Keystroke words that fire the radio easter egg — editable via /admin/radio. Read
 * directly from the DB the same way other static pages already read published content
 * (see lib/site-content.ts), rather than through Blob like the audio samples, since
 * these are just short strings with normal add/edit/delete semantics.
 */
export async function getRadioTriggers(): Promise<string[]> {
  try {
    const rows = await db.select().from(radioTriggers);
    const words = rows.map((r) => r.text);
    if (words.length > 0) return words;
  } catch {
    // DB unreachable — use fallback.
  }

  return [...RADIO_TRIGGER_FALLBACK];
}

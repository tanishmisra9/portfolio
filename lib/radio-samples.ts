import path from "node:path";
import { getPublishedData } from "@/lib/site-content";
import { RADIO_SAMPLE_FALLBACK } from "@/lib/radio-samples.constants";

export const ALLOWED_AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".wav", ".ogg", ".webm"]);

/** Extension whitelist + a permissive MIME check (only rejects a MIME type that's
 * definitely non-audio; an empty/unrecognized MIME doesn't fail a correctly-extensioned
 * file, since browsers don't reliably classify every audio format). */
export function isAllowedAudioFile(filename: string, mimeType: string): boolean {
  const hasAudioExtension = ALLOWED_AUDIO_EXTENSIONS.has(path.extname(filename).toLowerCase());
  const hasNonAudioMimeType = mimeType !== "" && !mimeType.startsWith("audio/");
  return hasAudioExtension && !hasNonAudioMimeType;
}

/**
 * Radio easter-egg samples are uploaded to Vercel Blob via /admin/radio and go live on
 * Publish (read from the published snapshot). Falls back to a fixed local list if the
 * snapshot has none (e.g. before the first publish) or is unreachable.
 */
export async function getRadioSampleUrls(): Promise<string[]> {
  try {
    const { radio } = await getPublishedData();
    if (radio?.samples.length) return radio.samples;
  } catch {
    // No snapshot yet / DB unreachable — use fallback.
  }

  return [...RADIO_SAMPLE_FALLBACK];
}

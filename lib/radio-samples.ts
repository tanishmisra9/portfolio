import path from "node:path";
import { listRadioSamples } from "@/lib/admin/blob";
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
 * Radio easter-egg samples now live in Vercel Blob (uploaded via /admin/radio), not
 * public/sfx/radio — that directory is read-only in production. Falls back to a fixed
 * local list if Blob is unreachable or empty (e.g. before the first upload).
 */
export async function getRadioSampleUrls(): Promise<string[]> {
  try {
    const samples = await listRadioSamples();
    const urls = samples
      .filter((s) => ALLOWED_AUDIO_EXTENSIONS.has(path.extname(s.pathname).toLowerCase()))
      .map((s) => s.url)
      .sort((a, b) => a.localeCompare(b));

    if (urls.length > 0) return urls;
  } catch {
    // Blob unreachable — use fallback.
  }

  return [...RADIO_SAMPLE_FALLBACK];
}

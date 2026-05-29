import { readdir } from "node:fs/promises";
import path from "node:path";
import { RADIO_SAMPLE_FALLBACK } from "@/lib/radio-samples.constants";

const RADIO_DIR = path.join(process.cwd(), "public", "sfx", "radio");
const PUBLIC_PREFIX = "/sfx/radio";

const ALLOWED_EXTENSIONS = new Set([".mp3", ".m4a", ".wav", ".ogg", ".webm"]);

function isAudioFile(name: string): boolean {
  const ext = path.extname(name).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

/**
 * Discover radio easter-egg samples from `public/sfx/radio` at build/request time.
 * New files are included automatically after rebuild or deploy.
 */
export async function getRadioSampleUrls(): Promise<string[]> {
  try {
    const entries = await readdir(RADIO_DIR, { withFileTypes: true });
    const urls = entries
      .filter((entry) => entry.isFile() && isAudioFile(entry.name))
      .map((entry) => `${PUBLIC_PREFIX}/${entry.name}`)
      .sort((a, b) => a.localeCompare(b));

    if (urls.length > 0) return urls;
  } catch {
    // Directory missing or unreadable — use fallback.
  }

  return [...RADIO_SAMPLE_FALLBACK];
}

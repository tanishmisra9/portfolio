import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";

export function getPublicImageDimensions(
  publicSrc: string,
): { width: number; height: number } | null {
  try {
    const relativePath = publicSrc.replace(/^\/+/, "");
    const filePath = path.join(process.cwd(), "public", relativePath);
    const { width, height } = imageSize(fs.readFileSync(filePath));
    return { width, height };
  } catch {
    return null;
  }
}

const MAX_REMOTE_IMAGE_BYTES = 15 * 1024 * 1024;

/** Only our own Vercel Blob store (the same host next.config.ts allows for next/image). */
export function isBlobImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** Blog images uploaded via the admin live on Vercel Blob (an external URL) rather than under public/. Any other URL is not fetched. */
export async function getRemoteImageDimensions(
  url: string,
): Promise<{ width: number; height: number } | null> {
  if (!isBlobImageUrl(url)) return null;
  try {
    const res = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(5000) });
    if (!res.ok || !res.body) return null;
    if (Number(res.headers.get("content-length") ?? 0) > MAX_REMOTE_IMAGE_BYTES) return null;
    // Stream: the size is in the first bytes of nearly every image, so stop reading as soon as it parses, and never
    // buffer past the cap even when the server sent no (or a wrong) Content-Length.
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) return null; // ended without a parseable header
        chunks.push(value);
        total += value.length;
        if (total > MAX_REMOTE_IMAGE_BYTES) return null;
        try {
          const { width, height } = imageSize(Buffer.concat(chunks));
          if (width > 0 && height > 0) return { width, height }; // some detectors report 0x0 for bytes that aren't an image
        } catch {
          // header not complete yet: read more
        }
      }
    } finally {
      void reader.cancel().catch(() => {});
    }
  } catch {
    return null;
  }
}

export async function getImageDimensions(
  src: string,
): Promise<{ width: number; height: number } | null> {
  return src.startsWith("/") ? getPublicImageDimensions(src) : getRemoteImageDimensions(src);
}

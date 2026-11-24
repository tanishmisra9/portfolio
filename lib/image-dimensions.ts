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
    if (!res.ok) return null;
    if (Number(res.headers.get("content-length") ?? 0) > MAX_REMOTE_IMAGE_BYTES) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_REMOTE_IMAGE_BYTES) return null;
    const { width, height } = imageSize(buffer);
    return { width, height };
  } catch {
    return null;
  }
}

export async function getImageDimensions(
  src: string,
): Promise<{ width: number; height: number } | null> {
  return src.startsWith("/") ? getPublicImageDimensions(src) : getRemoteImageDimensions(src);
}

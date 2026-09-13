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

/** Blog images uploaded via the admin live on Vercel Blob (an external URL) rather than under public/. */
export async function getRemoteImageDimensions(
  url: string,
): Promise<{ width: number; height: number } | null> {
  try {
    const res = await fetch(url);
    const buffer = Buffer.from(await res.arrayBuffer());
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

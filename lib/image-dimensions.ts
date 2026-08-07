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

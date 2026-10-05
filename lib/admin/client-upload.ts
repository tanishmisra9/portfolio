"use client";

import { upload } from "@vercel/blob/client";

/**
 * Uploads straight from the browser to Blob storage (see app/api/admin/blob-upload) —
 * server actions cap request bodies at 4.5MB on Vercel no matter what
 * next.config.ts says, which silently broke uploads of the larger existing photos.
 *
 * Dimensions come from createImageBitmap, which decodes with EXIF orientation applied
 * (unlike a raw width/height read), and its failure to decode is also the signal used
 * to reject formats the browser can't read (e.g. HEIC in Chrome/Firefox) before the
 * upload happens, rather than shipping a broken photo.
 */
export async function uploadImageToBlob(
  file: File,
  pathnamePrefix: string,
  onProgress?: (percentage: number) => void,
): Promise<{ url: string; width: number; height: number }> {
  let width: number;
  let height: number;
  try {
    const bitmap = await createImageBitmap(file);
    width = bitmap.width;
    height = bitmap.height;
    bitmap.close();
  } catch {
    throw new Error(`Can't read "${file.name}" — try exporting it as JPEG or PNG first.`);
  }

  const blob = await upload(`${pathnamePrefix}/${file.name}`, file, {
    access: "public",
    handleUploadUrl: "/api/admin/blob-upload",
    onUploadProgress: onProgress ? ({ percentage }) => onProgress(percentage) : undefined,
  });

  return { url: blob.url, width, height };
}

/** A small JPEG preview (longest side 512px) as a data URL — what the AI alt-text action
 * receives instead of the full file, keeping that request tiny. Null if undecodable. */
export async function toAltPreviewDataUrl(file: File): Promise<string | null> {
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  } catch {
    return null;
  } finally {
    bitmap?.close();
  }
}

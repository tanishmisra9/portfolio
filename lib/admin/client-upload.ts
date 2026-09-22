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
  });

  return { url: blob.url, width, height };
}

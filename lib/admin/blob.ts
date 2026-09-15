import { put, list, del } from "@vercel/blob";

export async function uploadAsset(pathnamePrefix: string, file: File) {
  const blob = await put(`${pathnamePrefix}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });
  return blob;
}

export async function listAssetFilenames(pathnamePrefix: string): Promise<string[]> {
  const { blobs } = await list({ prefix: `${pathnamePrefix}/` });
  return blobs.map((b) => b.pathname.split("/").pop()!);
}

export async function deleteAsset(url: string) {
  await del(url);
}

/**
 * Fixed pathname + allowOverwrite (rather than uploadAsset's timestamped, ever-growing
 * names) so the resume always lives at one URL and the filename download() gets is
 * controlled by the blob's own pathname, not the HTML `download` attribute — which
 * browsers ignore for cross-origin links once Content-Disposition is present.
 */
export async function uploadResume(file: File) {
  return put("resume/Tanish_Misra_Resume.pdf", file, {
    access: "public",
    allowOverwrite: true,
  });
}

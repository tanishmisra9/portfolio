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
 * The filename is user-editable but always lands directly in a Blob pathname, so it's
 * sanitized to a safe basename first. Uses allowOverwrite so re-uploading under the same
 * name replaces it rather than growing a pile of blobs; renaming does leave the previous
 * blob orphaned (negligible on the free tier, not worth cleanup code).
 */
export async function uploadNamedAsset(prefix: string, file: File, filename: string) {
  const safeName =
    filename.replace(/[^a-zA-Z0-9.\-_]/g, "") ||
    file.name.replace(/[^a-zA-Z0-9.\-_]/g, "") ||
    "file";
  return put(`${prefix}/${safeName}`, file, {
    access: "public",
    allowOverwrite: true,
  });
}

export async function uploadResume(file: File, filename: string) {
  return uploadNamedAsset("resume", file, filename || "Resume-TanishMisra.pdf");
}

export async function listRadioSamples(): Promise<{ url: string; pathname: string }[]> {
  const { blobs } = await list({ prefix: "radio/" });
  return blobs.map((b) => ({ url: b.url, pathname: b.pathname }));
}

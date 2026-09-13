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

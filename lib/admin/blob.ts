import { put, list } from "@vercel/blob";

export async function uploadAsset(pathnamePrefix: string, file: File) {
  const blob = await put(`${pathnamePrefix}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });
  return blob;
}

/**
 * Strips the machinery Blob adds around the original filename so it can be compared
 * against a plain markdown reference like "heart.png": the old server-upload scheme's
 * `<Date.now()>-` prefix, and addRandomSuffix's `-<random>` suffix before the extension.
 */
function originalFilename(pathnameBasename: string): string {
  const noPrefix = pathnameBasename.replace(/^\d{10,}-/, "");
  return noPrefix.replace(/-[a-zA-Z0-9_]{10,}(\.[a-zA-Z0-9]+)$/, "$1");
}

export async function listAssetFilenames(
  pathnamePrefix: string,
): Promise<{ name: string; url: string }[]> {
  const { blobs } = await list({ prefix: `${pathnamePrefix}/` });
  return blobs.map((b) => ({ name: originalFilename(b.pathname.split("/").pop()!), url: b.url }));
}

/**
 * This does NOT overwrite a fixed pathname: the resume link is
 * published-snapshot data (draft → Publish), and the previous implementation reused the
 * exact pathname the live snapshot already links to, so uploading a same-named file
 * replaced the live resume immediately, skipping Publish, and could keep serving the old
 * PDF from cache for its ~1-month default max-age since the URL never changed. Nesting
 * under a unique folder keeps the pathname's basename (and so the download filename)
 * clean while giving every upload its own URL.
 */
export async function uploadResume(file: File, filename: string) {
  const safeName =
    (filename || file.name).replace(/[^a-zA-Z0-9.\-_]/g, "") || "Resume-TanishMisra.pdf";
  return put(`resume/${Date.now()}/${safeName}`, file, { access: "public" });
}

/** Same unique-folder scheme as uploadResume: a re-upload under an existing name must not replace a clip the live snapshot already points at. */
export async function uploadRadioSample(file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "") || "clip";
  return put(`radio/${Date.now()}/${safeName}`, file, { access: "public" });
}

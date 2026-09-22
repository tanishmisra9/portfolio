/** Normalizes free text into a URL-safe slug: lowercase, spaces/underscores to dashes,
 * anything outside [a-z0-9-] stripped, dashes collapsed and trimmed from the ends. */
export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

import matter from "gray-matter";

// No `@/` imports: scripts/check-admin.mjs loads this file on Node's native TS stripping.

const IMAGE_RE = /!\[[^\]]*\]\(([^)\s]+)\)/g;
const CODE_RE = /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g;

/**
 * Parses frontmatter as data only. gray-matter evaluates `---js` / `---javascript` frontmatter with eval() by
 * default (and merges custom engines over its defaults, so each language key must be overridden), which would be
 * server-side code execution from an imported file. Reject any language-marked fence outright and neutralise the
 * executable engines as a second layer. YAML (the default) and `---json` stay data-only.
 */
export function parseFrontmatter(raw: string) {
  const fence = /^﻿?---([^\r\n]*)/.exec(raw);
  const lang = fence?.[1].trim().toLowerCase() ?? "";
  if (lang && lang !== "yaml" && lang !== "yml") {
    throw new Error("Frontmatter must be plain YAML (no language marker).");
  }
  const refuse = () => {
    throw new Error("Executable frontmatter is not allowed.");
  };
  return matter(raw, { engines: { js: refuse, javascript: refuse, coffee: refuse, cson: refuse } });
}

/** Ranges of fenced/inline code, where image-looking text is an example, not an image. */
function codeRanges(content: string): Array<[number, number]> {
  return [...content.matchAll(CODE_RE)].map((m) => [m.index!, m.index! + m[0].length]);
}

/** Image destinations in the Markdown, skipping anything inside code. */
export function imageRefs(content: string): string[] {
  const code = codeRanges(content);
  return [...content.matchAll(IMAGE_RE)]
    .filter((m) => !code.some(([a, b]) => m.index! >= a && m.index! < b))
    .map((m) => m[1]);
}

/** Replaces only the destination of each matching image; prose, links and code that mention the same path stay as written. */
export function rewriteImageDestinations(content: string, urlFor: Map<string, string>): string {
  const code = codeRanges(content);
  return content.replace(IMAGE_RE, (full, path: string, offset: number) => {
    const url = urlFor.get(path);
    if (!url || code.some(([a, b]) => offset >= a && offset < b)) return full;
    return full.slice(0, full.lastIndexOf(path)) + url + ")";
  });
}

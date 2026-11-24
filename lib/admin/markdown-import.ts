import matter from "gray-matter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import type { Definition, Image, ImageReference, Root } from "mdast";

// No `@/` imports: scripts/check-admin.mjs loads this file on Node's native TS stripping.

/**
 * Parses frontmatter as data only. gray-matter evaluates `---js` / `---javascript` frontmatter with eval() by
 * default (and merges custom engines over its defaults, so each language key must be overridden), which would be
 * server-side code execution from an imported file. Reject any language-marked fence outright and neutralise the
 * executable engines as a second layer. Only plain YAML (the default, no language marker) is accepted, so `---json` is rejected too.
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

type Dest = { url: string; start: number; end: number };

/** Walks every node; the parser (not a regex) decides what is an image and what is code. */
function walk(node: { type: string; children?: unknown[] }, fn: (n: Image | ImageReference | Definition) => void) {
  if (node.type === "image" || node.type === "imageReference" || node.type === "definition") fn(node as Image);
  for (const c of node.children ?? []) walk(c as { type: string; children?: unknown[] }, fn);
}

/** Offset of `url` in `raw`, right after one of the `marker`s (`](` for inline images, `]:` for definitions). Null if it can't be located. */
function destOffset(raw: string, url: string, marker: string): number | null {
  for (let i = raw.indexOf(marker); i !== -1; i = raw.indexOf(marker, i + 1)) {
    let j = i + marker.length;
    while (/\s/.test(raw[j] ?? "")) j++;
    if (raw[j] === "<") j++;
    if (url && raw.startsWith(url, j)) return j;
  }
  return null;
}

/** Destinations of real images: inline images, plus the definitions that an image reference points at. */
function imageDests(content: string): Dest[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(content) as Root;
  const used = new Set<string>();
  const defs: Definition[] = [];
  const out: Dest[] = [];
  walk(tree, (n) => {
    if (n.type === "imageReference") used.add(n.identifier);
    else if (n.type === "definition") defs.push(n);
    else if (n.position && n.url) {
      const { start, end } = n.position;
      const at = destOffset(content.slice(start.offset!, end.offset!), n.url, "](");
      if (at !== null) out.push({ url: n.url, start: start.offset! + at, end: start.offset! + at + n.url.length });
    }
  });
  for (const d of defs) {
    if (!used.has(d.identifier) || !d.position) continue;
    const { start, end } = d.position;
    const at = destOffset(content.slice(start.offset!, end.offset!), d.url, "]:");
    if (at !== null) out.push({ url: d.url, start: start.offset! + at, end: start.offset! + at + d.url.length });
  }
  return out;
}

/** Image destinations in the Markdown (inline, titled and reference-style), skipping anything inside code. */
export function imageRefs(content: string): string[] {
  return imageDests(content).map((d) => d.url);
}

/** Replaces only the destination of each matching image; prose, links and code that mention the same path stay as written. */
export function rewriteImageDestinations(content: string, urlFor: Map<string, string>): string {
  let out = content;
  for (const d of imageDests(content).sort((a, b) => b.start - a.start)) {
    const url = urlFor.get(d.url);
    if (url) out = out.slice(0, d.start) + url + out.slice(d.end);
  }
  return out;
}

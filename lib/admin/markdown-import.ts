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

/** `wrap` (when set) turns the replacement URL into the text that replaces the whole span. */
type Dest = { url: string; start: number; end: number; wrap?: (url: string) => string };
type Ref = { type: string; identifier: string; alt?: string | null; position?: Image["position"] };

/** Walks every node; the parser (not a regex) decides what is an image and what is code. */
function walk(node: { type: string; children?: unknown[] }, fn: (n: Image | ImageReference | Definition | Ref) => void) {
  if (["image", "imageReference", "definition", "linkReference"].includes(node.type)) fn(node as Image);
  for (const c of node.children ?? []) walk(c as { type: string; children?: unknown[] }, fn);
}

/** End of a raw destination token starting at `j`: `<...>` up to (not incl.) `>`, else up to whitespace or an unbalanced `)`, honouring `\` escapes. */
function tokenEnd(raw: string, j: number): number {
  if (raw[j] === "<") {
    const close = raw.indexOf(">", j + 1);
    return close === -1 ? raw.length : close;
  }
  let depth = 0;
  let k = j;
  for (; k < raw.length; k++) {
    const c = raw[k];
    if (c === "\\") { k++; continue; }
    if (/\s/.test(c)) break;
    if (c === "(") depth++;
    if (c === ")") { if (depth === 0) break; depth--; }
  }
  return k;
}

/**
 * Span of the destination in `raw`, right after one of the `marker`s (`](` for inline images, `]:` for definitions).
 * Prefers a token that matches `url` exactly; otherwise the destination as written, whose text can differ from mdast's
 * decoded `url` (backslash escapes, entities such as `&amp;`). That fallback is the last `](` (an inline image's
 * destination follows its alt) or the first `]:`. Null only if there is no marker at all.
 */
function destSpan(raw: string, url: string, marker: string): { start: number; end: number } | null {
  let fallback: { start: number; end: number } | null = null;
  for (let i = raw.indexOf(marker); i !== -1; i = raw.indexOf(marker, i + 1)) {
    let j = i + marker.length;
    while (/\s/.test(raw[j] ?? "")) j++;
    const inner = raw[j] === "<" ? j + 1 : j;
    const span = { start: inner, end: tokenEnd(raw, j) };
    if (url && raw.slice(span.start, span.end) === url) return span;
    if (marker === "](" || !fallback) fallback = span;
  }
  return fallback;
}

const escapeAlt = (alt: string) => alt.replace(/[\\[\]]/g, "\\$&");

/** Destinations of real images: inline images, plus the definitions that an image reference points at. */
function imageDests(content: string): Dest[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(content) as Root;
  const imageRefNodes: Ref[] = [];
  const linkIds = new Set<string>();
  const defs: Definition[] = [];
  const out: Dest[] = [];
  const at = (n: { position?: Image["position"] }, url: string, marker: string) => {
    const { start, end } = n.position!;
    const span = destSpan(content.slice(start.offset!, end.offset!), url, marker);
    return span && { url, start: start.offset! + span.start, end: start.offset! + span.end };
  };
  walk(tree, (n) => {
    if (n.type === "imageReference") imageRefNodes.push(n as Ref);
    else if (n.type === "linkReference") linkIds.add((n as Ref).identifier);
    else if (n.type === "definition") defs.push(n as Definition);
    else if (n.type === "image" && n.position && (n as Image).url) {
      const d = at(n as Image, (n as Image).url, "](");
      if (d) out.push(d);
    }
  });
  const imageIds = new Set(imageRefNodes.map((r) => r.identifier));
  for (const d of defs) {
    if (!imageIds.has(d.identifier) || !d.position || !d.url) continue;
    if (linkIds.has(d.identifier)) {
      // Shared with a normal link: rewriting the definition would move the link too. Turn each image reference
      // into an inline image instead and leave the definition (and the link) as written.
      for (const r of imageRefNodes) {
        if (r.identifier !== d.identifier || !r.position) continue;
        const alt = escapeAlt(r.alt ?? "");
        out.push({ url: d.url, start: r.position.start.offset!, end: r.position.end.offset!, wrap: (u) => `![${alt}](${u})` });
      }
      continue;
    }
    const dest = at(d, d.url, "]:");
    if (dest) out.push(dest);
  }
  return out;
}

/** Image destinations in the Markdown (inline, titled and reference-style), skipping anything inside code. */
export function imageRefs(content: string): string[] {
  return [...new Set(imageDests(content).map((d) => d.url))];
}

/** Replaces only the destination of each matching image; prose, links and code that mention the same path stay as written. */
export function rewriteImageDestinations(content: string, urlFor: Map<string, string>): string {
  let out = content;
  for (const d of imageDests(content).sort((a, b) => b.start - a.start)) {
    const url = urlFor.get(d.url);
    if (url) out = out.slice(0, d.start) + (d.wrap ? d.wrap(url) : url) + out.slice(d.end);
  }
  return out;
}

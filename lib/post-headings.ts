import type { Root, Heading } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

export type PostHeading = { id: string; text: string; depth: 0 | 1 | 2 };

// Prefixed so a heading titled "Top" or "Main content" can't duplicate the page's own #top / #main-content ids.
const slugify = (s: string) =>
  "sec-" +
  (s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-") || "section");

/** Unique ids in document order (intro, intro-1, …). The ONE place ids are made: the TOC and the rendered headings both go through it.
 *  Uniqueness is checked against every id already emitted, so a literal "Intro-1" heading can't collide with a generated suffix. */
function collect(tree: Root) {
  const used = new Set<string>();
  const out: { node: Heading; id: string; text: string }[] = [];
  for (const node of tree.children) {
    if (node.type !== "heading") continue;
    const text = toString(node);
    const base = slugify(text);
    let id = base;
    for (let n = 1; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    out.push({ node, id, text });
  }
  return out;
}

/** react-markdown plugin: stamps `id` on every heading so `#id` links land. */
export function remarkHeadingIds() {
  return (tree: Root) => {
    for (const { node, id } of collect(tree)) {
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
    }
  };
}

/** `#`..`###` headings, parsed from the same markdown the page renders. `depth` is relative to the shallowest level
 *  present (0 = top), so a post that only uses `###` still gets a flat list. */
export function extractHeadings(content: string): PostHeading[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(content) as Root;
  const all = collect(tree).filter(({ node }) => node.depth <= 3);
  const top = Math.min(...all.map(({ node }) => node.depth));
  return all.map(({ node, id, text }) => ({ id, text, depth: Math.min(node.depth - top, 2) as 0 | 1 | 2 }));
}

type MdNode = { type: string; value?: string; children?: MdNode[]; data?: { hProperties?: Record<string, unknown> } };
const isBlank = (n?: MdNode) => n?.type === "text" && !n.value?.trim();
const isLineBreak = (n?: MdNode) => isBlank(n) || n?.type === "break"; // soft newline, or a hard break (two trailing spaces)
const isImage = (n: MdNode) => n.type === "image" || n.type === "imageReference"; // ![a](x) and ![a][ref]
const isLink = (n: MdNode) => n.type === "link" || n.type === "linkReference"; // [..](x) and [..][ref]
const isOnlyEmphasis = (p?: MdNode) => p?.type === "paragraph" && p.children?.length === 1 && p.children[0].type === "emphasis";

/** react-markdown plugin: stamps each image with `data-caption` (the italic line written under it, either on the next line
 *  or after a blank line, which is how posts caption images) and `data-linked` (the image sits inside a link). The italic
 *  line still renders in the post as before; only the click-preview reads the attribute. */
export function remarkImageMeta() {
  return (tree: Root) => {
    const walk = (node: MdNode, inLink: boolean, next?: MdNode) => {
      const kids = node.children ?? [];
      kids.forEach((child, i) => {
        if (!isImage(child)) return walk(child, inLink || isLink(child), kids[i + 1]);
        const caption =
          isLineBreak(kids[i + 1]) && kids[i + 2]?.type === "emphasis" && kids.slice(i + 3).every(isBlank)
            ? kids[i + 2] // same paragraph: image, line break, *caption* — and nothing after it (else it's prose)
            : node.type === "paragraph" && kids.length === 1 && isOnlyEmphasis(next)
              ? next!.children![0] // image-only paragraph, then a *caption* paragraph
              : undefined;
        const props: Record<string, unknown> = {};
        if (caption) props["data-caption"] = toString(caption as Parameters<typeof toString>[0]);
        if (inLink) props["data-linked"] = "true";
        child.data = { ...child.data, hProperties: { ...child.data?.hProperties, ...props } };
      });
    };
    walk(tree as MdNode, false);
  };
}

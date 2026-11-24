import type { Root, Heading } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

export type PostHeading = { id: string; text: string; depth: 0 | 1 | 2 };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-") || "section";

/** Unique ids in document order (intro, intro-1, …). The ONE place ids are made: the TOC and the rendered headings both go through it. */
function collect(tree: Root) {
  const seen = new Map<string, number>();
  const out: { node: Heading; id: string; text: string }[] = [];
  for (const node of tree.children) {
    if (node.type !== "heading") continue;
    const text = toString(node);
    const base = slugify(text);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    out.push({ node, id: n ? `${base}-${n}` : base, text });
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

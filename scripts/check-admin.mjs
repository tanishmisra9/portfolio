// Boundary checks for the admin import / fetch / slug-lock paths. Runs on Node's native TS stripping (22.18+), so the
// files it imports must stay free of `@/` imports. Each assertion was verified to fail with its guard removed.
import assert from "node:assert/strict";
import fs from "node:fs";
import { parseFrontmatter, imageRefs, rewriteImageDestinations } from "../lib/admin/markdown-import.ts";
import { isBlobImageUrl, getRemoteImageDimensions } from "../lib/image-dimensions.ts";
import { extractHeadings, remarkImageMeta } from "../lib/post-headings.ts";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { LOCKED_COLLECTION_SLUGS } from "../lib/slug.ts";

// SEC-001: executable frontmatter is rejected and never evaluated.
globalThis.__pwned = false;
for (const lang of ["js", "javascript", "coffee"]) {
  assert.throws(() => parseFrontmatter(`---${lang}\n{ title: (globalThis.__pwned = true) }\n---\nbody`), /Frontmatter|Executable/);
}
assert.equal(globalThis.__pwned, false, "JS frontmatter was evaluated");
assert.equal(parseFrontmatter("---\ntitle: Hi\ndate: 2026-01-02\n---\nbody").data.title, "Hi");
// A file opening with a thematic break (four or more dashes) has no frontmatter at all; it must import, not be refused.
for (const rule of ["----", "-----"]) {
  const r = parseFrontmatter(`${rule}\n\nJust a post.\n`);
  assert.ok(r.content.includes("Just a post."), `${rule}: body lost`);
}

// BUG-003: only image destinations are rewritten; prose, links and code keep the same filename.
const md = "![a](./img/sample.png)\n\nsample.png in prose, [link](./img/sample.png), `![x](./img/sample.png)`\n\n```\n![y](./img/sample.png)\n```\n";
assert.deepEqual(imageRefs(md), ["./img/sample.png"]);
const out = rewriteImageDestinations(md, new Map([["./img/sample.png", "https://x.public.blob.vercel-storage.com/s.png"]]));
assert.ok(out.startsWith("![a](https://x.public.blob.vercel-storage.com/s.png)"));
assert.equal(out.split("./img/sample.png").length - 1, 3, "prose/link/code occurrences must be untouched");

// BUG-003 (AST): indented code is code, titled and reference-style images are images.
const md2 = "    ![ex](./a.png)\n\n![t](./b.png \"a title\")\n\n![r][p]\n\n[p]: ./c.png\n";
assert.deepEqual(imageRefs(md2).sort(), ["./b.png", "./c.png"]);
const out2 = rewriteImageDestinations(md2, new Map([["./a.png", "A"], ["./b.png", "B"], ["./c.png", "C"]]));
assert.equal(out2, "    ![ex](./a.png)\n\n![t](B \"a title\")\n\n![r][p]\n\n[p]: C\n");

// A destination written differently from its decoded url (escapes, entities) is still found and rewritten, not dropped.
assert.deepEqual(imageRefs("![x](my\\_photo.png)\n"), ["my_photo.png"]);
assert.equal(rewriteImageDestinations("![x](my\\_photo.png)\n", new Map([["my_photo.png", "U"]])), "![x](U)\n");
assert.equal(rewriteImageDestinations("![x](a&amp;b.png \"t\")\n", new Map([["a&b.png", "U"]])), "![x](U \"t\")\n");
assert.equal(rewriteImageDestinations("![x](<my photo.png>)\n", new Map([["my photo.png", "U"]])), "![x](<U>)\n");
assert.equal(rewriteImageDestinations("![y][d]\n\n[d]: my\\_pic.png\n", new Map([["my_pic.png", "U"]])), "![y][d]\n\n[d]: U\n");

// A definition shared by an image and a normal link: only the image moves to the Blob URL; the link keeps its target.
const shared = "![pic][a] and [see original][a]\n\n[a]: /blog/x/pic.png\n";
assert.deepEqual(imageRefs(shared), ["/blog/x/pic.png"]);
assert.equal(rewriteImageDestinations(shared, new Map([["/blog/x/pic.png", "U"]])), "![pic](U) and [see original][a]\n\n[a]: /blog/x/pic.png\n");

// BUG-008: heading ids are unique even when a literal heading equals a generated suffix, and never empty.
const ids = extractHeadings("# Intro\n\n# Intro\n\n# Intro-1\n\n# Top\n\n# !!!\n\n# !!!\n").map((h) => h.id);
assert.equal(new Set(ids).size, ids.length, `duplicate heading ids: ${ids}`);
assert.ok(ids.every((id) => id.startsWith("sec-") && id !== "sec-"), ids.join());

// SEC-003: only our Blob host is ever fetched.
assert.ok(isBlobImageUrl("https://abc.public.blob.vercel-storage.com/a.png"));
for (const bad of ["http://abc.public.blob.vercel-storage.com/a.png", "http://127.0.0.1/a.png", "https://evil.com/a.png", "https://public.blob.vercel-storage.com.evil.com/a.png", "nope"]) {
  assert.equal(isBlobImageUrl(bad), false, bad);
}
const realFetch = globalThis.fetch;
let called = false;
globalThis.fetch = async () => ((called = true), new Response(""));
assert.equal(await getRemoteImageDimensions("http://127.0.0.1/a.png"), null);
globalThis.fetch = realFetch;
assert.equal(called, false, "a non-Blob URL reached fetch");

// PERF-004: dimensions are read from the first bytes, and the byte cap holds with no Content-Length.
{
  const png = Buffer.alloc(33);
  Buffer.from("89504e470d0a1a0a0000000d49484452", "hex").copy(png);
  png.writeUInt32BE(7, 16);
  png.writeUInt32BE(5, 20);
  const stream = (chunks) => {
    const st = { cancelled: false, pulled: 0 };
    const body = new ReadableStream({
      pull(c) {
        st.pulled++;
        c.enqueue(chunks(st.pulled));
      },
      cancel() {
        st.cancelled = true;
      },
    });
    return [st, body];
  };
  const url = "https://abc.public.blob.vercel-storage.com/a.png";
  let [st, body] = stream((n) => (n === 1 ? png : new Uint8Array(1 << 20)));
  globalThis.fetch = async () => new Response(body);
  assert.deepEqual(await getRemoteImageDimensions(url), { width: 7, height: 5 });
  assert.ok(st.cancelled && st.pulled < 5, "read past the header");
  [st, body] = stream(() => new Uint8Array(1 << 20));
  globalThis.fetch = async () => new Response(body);
  assert.equal(await getRemoteImageDimensions(url), null);
  assert.ok(st.cancelled && st.pulled <= 17, `buffered past the cap (${st.pulled} MiB)`);
  globalThis.fetch = realFetch;
}

// BUG-004: every slug-keyed title effect is locked against renames.
const src = fs.readFileSync(new URL("../components/photos/album-title.tsx", import.meta.url), "utf8");
const effectMap = /effectMap[^{]*\{([\s\S]*?)\n\s*\}/.exec(src)?.[1] ?? "";
const keys = [...effectMap.matchAll(/^\s*["']?([a-z0-9-]+)["']?\s*:/gm)].map((m) => m[1]);
assert.ok(keys.length >= 4, "could not read effectMap keys");
for (const k of keys) assert.ok(LOCKED_COLLECTION_SLUGS.includes(k), `${k} is effect-keyed but not locked`);

// Post image preview: the caption is the italic line under an image (next line or after a blank line).
{
  const meta = (md) => {
    const tree = unified().use(remarkParse).parse(md);
    remarkImageMeta()(tree);
    const out = [];
    const walk = (n) =>
      n.type === "image" || n.type === "imageReference" ? out.push(n.data?.hProperties ?? {}) : (n.children ?? []).forEach(walk);
    walk(tree);
    return out;
  };
  assert.equal(meta("![a](x.png)\n*Next line.*")[0]["data-caption"], "Next line.");
  assert.equal(meta("![a](x.png)\n\n*After a blank.*")[0]["data-caption"], "After a blank.");
  assert.equal(meta("![a](x.png)\n\nPlain text, *not* a caption.")[0]["data-caption"], undefined);
  assert.equal(meta("![a](x.png)")[0]["data-caption"], undefined);
  assert.equal(meta("[![a](x.png)](https://e.com)")[0]["data-linked"], "true");
  assert.equal(meta("![a](x.png)")[0]["data-linked"], undefined);
  // An italic phrase that starts a prose line is not a caption; a hard line break (two spaces) still separates one.
  assert.equal(meta("![a](x.png)\n*Note:* the rest of this explains it.")[0]["data-caption"], undefined);
  assert.equal(meta("![a](x.png)  \n*Hard break.*")[0]["data-caption"], "Hard break.");
  // Reference-style: a linked image via [..][ref] is linked (no preview button inside its <a>); ![a][ref] gets its caption.
  assert.equal(meta("[![a](x.png)][src]\n\n[src]: https://e.com")[0]["data-linked"], "true");
  assert.equal(meta("![a][img]\n*Ref caption.*\n\n[img]: x.png")[0]["data-caption"], "Ref caption.");
}

console.log("check-admin: ok");

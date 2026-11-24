// Boundary checks for the admin import / fetch / slug-lock paths. Runs on Node's native TS stripping (22.18+), so the
// files it imports must stay free of `@/` imports. Each assertion was verified to fail with its guard removed.
import assert from "node:assert/strict";
import fs from "node:fs";
import { parseFrontmatter, imageRefs, rewriteImageDestinations } from "../lib/admin/markdown-import.ts";
import { isBlobImageUrl, getRemoteImageDimensions } from "../lib/image-dimensions.ts";
import { extractHeadings } from "../lib/post-headings.ts";
import { LOCKED_COLLECTION_SLUGS } from "../lib/slug.ts";

// SEC-001: executable frontmatter is rejected and never evaluated.
globalThis.__pwned = false;
for (const lang of ["js", "javascript", "coffee"]) {
  assert.throws(() => parseFrontmatter(`---${lang}\n{ title: (globalThis.__pwned = true) }\n---\nbody`), /Frontmatter|Executable/);
}
assert.equal(globalThis.__pwned, false, "JS frontmatter was evaluated");
assert.equal(parseFrontmatter("---\ntitle: Hi\ndate: 2026-01-02\n---\nbody").data.title, "Hi");

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

console.log("check-admin: ok");

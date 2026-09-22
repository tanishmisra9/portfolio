"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";

export function NewPostForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // Slugified on submit, not on every keystroke — the old per-keystroke `trim()`
        // stripped spaces before they could ever become dashes, and characters like
        // `#`/`?`/`/` passed straight through into the URL.
        const cleaned = slugify(slug);
        if (cleaned) router.push(`/admin/blog/${cleaned}`);
      }}
      className="flex gap-2 rounded-md border border-border bg-surface p-4 backdrop-blur-md"
    >
      <input
        className="flex-1 rounded border border-border-strong bg-transparent px-2 py-1 text-base"
        placeholder="new post slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        required
      />
      <button type="submit" className="rounded border border-border-strong px-3 py-1.5 text-base">
        + New post
      </button>
    </form>
  );
}

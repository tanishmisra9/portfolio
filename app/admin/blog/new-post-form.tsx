"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewPostForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (slug) router.push(`/admin/blog/${slug}`);
      }}
      className="flex gap-2 rounded border border-fg/10 p-3"
    >
      <input
        className="flex-1 rounded border border-fg/20 bg-transparent px-2 py-1 text-sm"
        placeholder="new-post-slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value.trim().toLowerCase().replace(/\s+/g, "-"))}
        required
      />
      <button type="submit" className="rounded border border-fg/20 px-3 py-1.5 text-sm">
        + New post
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/admin/ui/button";
import { Field, Input } from "@/components/admin/ui/field";
import { Panel } from "@/components/admin/ui/panel";
import { slugify } from "@/lib/slug";

export function NewPostForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");

  return (
    <Panel>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // Slugified on submit, not on every keystroke — the old per-keystroke `trim()`
          // stripped spaces before they could ever become dashes, and characters like
          // `#`/`?`/`/` passed straight through into the URL.
          const cleaned = slugify(slug);
          if (cleaned) router.push(`/admin/blog/${cleaned}`);
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <Field label="New post slug" className="min-w-48 flex-1">
          <Input placeholder="my-new-post" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </Field>
        <Button type="submit" variant="primary">
          + New post
        </Button>
      </form>
    </Panel>
  );
}

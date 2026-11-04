"use client";

import { useState, useTransition } from "react";
import { updateCollection } from "@/lib/admin/actions";
import { LOCKED_COLLECTION_SLUGS, slugify } from "@/lib/slug";

const fieldClass =
  "w-full rounded border border-border-strong bg-transparent px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

export function CollectionDetails({
  id,
  slug,
  title,
  description,
}: {
  id: number;
  slug: string;
  title: string;
  description: string;
}) {
  const [, startTransition] = useTransition();
  const [slugError, setSlugError] = useState<string | null>(null);
  const slugLocked = LOCKED_COLLECTION_SLUGS.includes(slug);

  function save(fields: { title?: string; description?: string }) {
    startTransition(async () => {
      await updateCollection(id, fields);
    });
  }

  function saveSlug(input: HTMLInputElement) {
    startTransition(async () => {
      const error = await updateCollection(id, { slug: input.value });
      setSlugError(error);
      // A rejected value isn't saved, so don't leave it sitting in the field.
      if (error) input.value = slug;
    });
  }

  return (
    <div className="mb-8 grid gap-4 rounded-md border border-border bg-surface p-4 backdrop-blur-md sm:grid-cols-2">
      <label className="block">
        <span className="mb-1 block text-base text-dim">Title</span>
        <input
          className={fieldClass}
          defaultValue={title}
          onBlur={(e) => e.target.value.trim() && e.target.value !== title && save({ title: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-base text-dim">Description</span>
        <input
          className={fieldClass}
          defaultValue={description}
          onBlur={(e) => e.target.value !== description && save({ description: e.target.value })}
        />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-base text-dim">Slug (the /photos/… URL)</span>
        <input
          key={slug}
          className={`${fieldClass} font-mono ${slugLocked ? "opacity-60" : ""}`}
          defaultValue={slug}
          readOnly={slugLocked}
          onChange={() => setSlugError(null)}
          onBlur={(e) => {
            if (slugLocked) return;
            const next = slugify(e.target.value);
            if (next === slug) {
              e.target.value = slug;
              setSlugError(null);
              return;
            }
            saveSlug(e.target);
          }}
        />
        <span className="mt-1 block text-base text-dim">
          {slugLocked
            ? "Locked: this collection's title effect or easter egg is tied to its URL."
            : "Changes this page's URL once published; old links stop working."}
        </span>
        {slugError && <span className="mt-1 block text-base text-red-500">{slugError}</span>}
      </label>
    </div>
  );
}

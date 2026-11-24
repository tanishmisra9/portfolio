"use client";

import { useState } from "react";
import { updateCollection } from "@/lib/admin/actions";
import { Field, Input } from "@/components/admin/ui/field";
import { Panel } from "@/components/admin/ui/panel";
import { SaveStatus } from "@/components/admin/ui/save-status";
import { useSaveStatus } from "@/components/admin/ui/use-save-status";
import { LOCKED_COLLECTION_SLUGS, slugify } from "@/lib/slug";

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
  const status = useSaveStatus();
  const [slugError, setSlugError] = useState<string | null>(null);
  const slugLocked = LOCKED_COLLECTION_SLUGS.includes(slug);

  /** updateCollection reports a rejected value by returning a message; turn it into a thrown error so the status shows it. */
  const update = (fields: Parameters<typeof updateCollection>[1]) => async () => {
    const error = await updateCollection(id, fields);
    if (error) throw new Error(error);
  };

  function save(fields: { title?: string; description?: string }) {
    void status.run(update(fields));
  }

  function saveSlug(input: HTMLInputElement) {
    void (async () => {
      const result = await status.run(update({ slug: input.value }));
      if (result.ok) return;
      // A rejected value isn't saved, so don't leave it sitting in the field.
      input.value = slug;
      setSlugError(result.error);
    })();
  }

  return (
    <Panel className="mb-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Title"
          hint={
            slug === "new-york"
              ? "The heading on this album's page is fixed artwork (New York / I ♥ NY); this title only changes the index card and page metadata."
              : undefined
          }
        >
          <Input
            defaultValue={title}
            onBlur={(e) => e.target.value.trim() && e.target.value !== title && save({ title: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <Input defaultValue={description} onBlur={(e) => e.target.value !== description && save({ description: e.target.value })} />
        </Field>
        <Field
          className="sm:col-span-2"
          label="Slug (the /photos/… URL)"
          hint={
            slugLocked
              ? "Locked: this collection's title effect or easter egg is tied to its URL."
              : "Changes this page's URL once published; old links stop working."
          }
          error={slugError}
        >
          <Input
            key={slug}
            className={`font-mono ${slugLocked ? "opacity-60" : ""}`}
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
        </Field>
      </div>
      <div className={status.status === "idle" ? "sr-only" : "mt-3 min-h-5"}>
        <SaveStatus state={status} />
      </div>
    </Panel>
  );
}

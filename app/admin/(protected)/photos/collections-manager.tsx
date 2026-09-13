"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { InferSelectModel } from "drizzle-orm";
import type { collections } from "@/db/schema";
import { ReorderableList } from "@/components/admin/reorderable-list";
import { createCollection, deleteCollection, reorderCollections, updateCollection } from "@/lib/admin/actions";

type Collection = InferSelectModel<typeof collections>;

export function CollectionsManager({ collections }: { collections: Collection[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="space-y-6">
      <ReorderableList
        items={collections}
        onReorder={(ids) =>
          startTransition(async () => {
            await reorderCollections(ids);
            router.refresh();
          })
        }
        renderItem={(c, dragProps) => (
          <div
            {...dragProps}
            className="flex cursor-grab items-center gap-3 rounded border border-fg/10 p-3"
          >
            <span className="text-dim">⠿</span>
            <div className="flex-1">
              <input
                className="w-full bg-transparent text-sm outline-none"
                defaultValue={c.title}
                onBlur={(e) =>
                  e.target.value !== c.title &&
                  startTransition(async () => {
                    await updateCollection(c.id, { title: e.target.value });
                    router.refresh();
                  })
                }
              />
              <input
                className="w-full bg-transparent text-xs text-dim outline-none"
                defaultValue={c.description}
                onBlur={(e) =>
                  e.target.value !== c.description &&
                  startTransition(async () => {
                    await updateCollection(c.id, { description: e.target.value });
                    router.refresh();
                  })
                }
              />
            </div>
            <Link href={`/admin/photos/${c.id}`} className="text-sm underline">
              Manage photos
            </Link>
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  await deleteCollection(c.id);
                  router.refresh();
                })
              }
              className="text-xs text-red-500"
            >
              Delete
            </button>
          </div>
        )}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            await createCollection({ slug, title, description });
            setSlug("");
            setTitle("");
            setDescription("");
            router.refresh();
          });
        }}
        className="space-y-2 rounded border border-fg/10 p-3"
      >
        <h2 className="text-sm text-dim">New collection</h2>
        <input
          className="w-full rounded border border-fg/20 bg-transparent px-2 py-1 text-sm"
          placeholder="slug (e.g. tokyo-2026)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
        <input
          className="w-full rounded border border-fg/20 bg-transparent px-2 py-1 text-sm"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          className="w-full rounded border border-fg/20 bg-transparent px-2 py-1 text-sm"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit" className="rounded border border-fg/20 px-3 py-1.5 text-sm">
          + Add collection
        </button>
      </form>
    </div>
  );
}

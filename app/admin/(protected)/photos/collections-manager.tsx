"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import type { collections } from "@/db/schema";
import { ReorderableList } from "@/components/admin/reorderable-list";
import { createCollection, deleteCollection, reorderCollections } from "@/lib/admin/actions";

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
            await reorderCollections(ids as number[]);
            router.refresh();
          })
        }
        renderItem={(c, dragProps) => (
          <div
            {...dragProps}
            className="flex cursor-grab items-center gap-3 rounded-md border border-border bg-surface p-3 backdrop-blur-md"
          >
            <GripVertical className="h-5 w-5 shrink-0 text-dim" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="break-words text-base text-fg">{c.title}</div>
              {c.description && <div className="break-words text-base text-dim">{c.description}</div>}
            </div>
            <Link
              href={`/admin/photos/${c.id}`}
              className="rounded border border-border-strong px-4 py-2 text-base text-fg transition-colors hover:border-hover-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
            >
              Manage
            </Link>
            <button
              type="button"
              onClick={() => {
                if (!confirm(`Delete "${c.title}" and all its photos?`)) return;
                startTransition(async () => {
                  await deleteCollection(c.id);
                  router.refresh();
                });
              }}
              className="px-2 py-2 text-base text-red-500"
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
        className="space-y-2 rounded-md border border-border bg-surface p-4 backdrop-blur-md"
      >
        <h2 className="text-base text-dim">New collection</h2>
        <label className="block">
          <span className="mb-1 block text-base text-dim">Slug (used in the URL)</span>
          <input
            className="w-full rounded border border-border-strong bg-transparent px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
            placeholder="e.g. tokyo-2026"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-base text-dim">Title</span>
          <input
            className="w-full rounded border border-border-strong bg-transparent px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-base text-dim">Description</span>
          <input
            className="w-full rounded border border-border-strong bg-transparent px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <button type="submit" className="rounded bg-fg px-4 py-2 text-base text-bg">
          + Add collection
        </button>
      </form>
    </div>
  );
}

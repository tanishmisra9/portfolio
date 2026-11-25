"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import type { collections } from "@/db/schema";
import { Button } from "@/components/admin/ui/button";
import { DeleteButton } from "@/components/admin/ui/delete-button";
import { Field, Input } from "@/components/admin/ui/field";
import { MoveButtons } from "@/components/admin/ui/move-buttons";
import { AdminHeading, EmptyState, Panel } from "@/components/admin/ui/panel";
import { SaveStatus } from "@/components/admin/ui/save-status";
import { useSaveStatus } from "@/components/admin/ui/use-save-status";
import { ReorderableList } from "@/components/admin/reorderable-list";
import {
  createCollection,
  deleteCollection,
  reorderCollections,
} from "@/lib/admin/actions";
import { PhotoUploader } from "./photo-uploader";
import { PhotoViewer } from "./[id]/photo-viewer";

type Collection = InferSelectModel<typeof collections>;

export function CollectionsManager({
  collections,
}: {
  collections: Collection[];
}) {
  const status = useSaveStatus();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // Clicking a cover opens the same preview dialog the photo rows use; focus returns to the cover on close.
  const [viewingId, setViewingId] = useState<number | null>(null);
  const viewing = collections.find((c) => c.id === viewingId) ?? null;
  const viewerTrigger = useRef<HTMLElement | null>(null);
  const closeViewer = useCallback(() => {
    setViewingId(null);
    viewerTrigger.current?.focus();
  }, []);

  function reorder(ids: number[]) {
    void status.run(() => reorderCollections(ids));
  }

  return (
    <div className="space-y-8">
      <AdminHeading
        title="Photo collections"
        subtitle="Collections of photos. Drag or use the arrows to reorder."
        actions={<SaveStatus state={status} />}
      />

      {/* Same layout as the new-post form on /admin/blog: one always-visible panel, fields in a wrapping row, primary button at the end. */}
      <Panel>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              const result = await status.run(async () => {
                const err = await createCollection({
                  slug,
                  title,
                  description,
                });
                if (err) throw new Error(err);
              });
              if (!result.ok) return;
              setSlug("");
              setTitle("");
              setDescription("");
            })();
          }}
          className="grid gap-3 sm:grid-cols-[1fr_auto]"
        >
          {/* sm+: the new-post form's row (slug fills the width, primary button at the end), title/description below. Mobile: fields first, button last. */}
          <Field label="New collection slug">
            <Input
              placeholder="e.g. tokyo-2026"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </Field>
          <div className="grid gap-3 sm:col-span-2 sm:row-start-2 sm:grid-cols-2">
            <Field label="Title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Field>
            <Field label="Description">
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
          </div>
          <Button
            type="submit"
            variant="primary"
            className="justify-self-start sm:col-start-2 sm:row-start-1 sm:self-end sm:justify-self-auto"
          >
            + New collection
          </Button>
        </form>
      </Panel>

      <PhotoUploader collections={collections} />

      {collections.length === 0 ? (
        <EmptyState>No collections yet.</EmptyState>
      ) : (
        <ReorderableList
          items={collections}
          onReorder={(ids) => reorder(ids as number[])}
          renderItem={(c, dragProps, { index, count, move }) => {
            return (
              <div className="relative flex flex-wrap items-center gap-3 border border-border bg-surface p-3 backdrop-blur-md transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-fg hover:shadow-[5px_5px_0_rgb(var(--fg-rgb)/0.2)] has-[:focus-visible]:-translate-x-0.5 has-[:focus-visible]:-translate-y-0.5 has-[:focus-visible]:border-fg motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0">
                <div className="relative z-10">
                  <MoveButtons
                    index={index}
                    count={count}
                    label={c.title}
                    onMove={move}
                  />
                </div>
                <div
                  {...dragProps}
                  aria-hidden
                  className="relative z-10 flex h-11 w-7 shrink-0 cursor-grab items-center justify-center text-dim hover:text-fg"
                >
                  <GripVertical className="h-5 w-5" />
                </div>
                {c.coverImage && (
                  <button
                    type="button"
                    aria-label={`View ${c.title} cover`}
                    onClick={(e) => {
                      viewerTrigger.current = e.currentTarget;
                      setViewingId(c.id);
                    }}
                    className="relative z-10 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
                  >
                    <Image
                      src={c.coverImage}
                      alt=""
                      width={48}
                      height={48}
                      className="size-12 object-cover"
                    />
                  </button>
                )}
                {!c.coverImage && (
                  <div
                    aria-hidden
                    className="size-12 shrink-0 border border-dashed border-border-strong"
                  />
                )}
                <div className="min-w-0 flex-1 basis-48">
                  {/* Stretched link: its ::after covers the whole row; the controls above sit at z-10. */}
                  <Link
                    href={`/admin/photos/${c.id}`}
                    className="block break-words text-base text-fg after:absolute after:inset-0 after:z-[1] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-fg/70"
                  >
                    {c.title}
                  </Link>
                  {c.description && (
                    <div className="break-words text-base text-dim">
                      {c.description}
                    </div>
                  )}
                </div>
                <div className="relative z-10">
                  <DeleteButton
                    label={`Delete ${c.title} and all its photos`}
                    onConfirm={() =>
                      void status.run(() => deleteCollection(c.id))
                    }
                  />
                </div>
              </div>
            );
          }}
        />
      )}
      <PhotoViewer
        photo={
          viewing && {
            blobUrl: viewing.coverImage,
            alt: `${viewing.title} cover`,
            caption: viewing.description || null,
          }
        }
        onClose={closeViewer}
      />
    </div>
  );
}

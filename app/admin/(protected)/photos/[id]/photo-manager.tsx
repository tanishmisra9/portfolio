"use client";

import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";
import { Eye, EyeOff, GripVertical, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";
import type { InferSelectModel } from "drizzle-orm";
import type { photos } from "@/db/schema";
import { ReorderableList } from "@/components/admin/reorderable-list";
import { deletePhoto, generateAltForPhoto, reorderPhotos, updateCollection, updatePhoto } from "@/lib/admin/actions";
import { fieldClass, oneLine, PhotoUploader } from "../photo-uploader";
import { PhotoViewer } from "./photo-viewer";
import { Tooltip } from "@/components/ui/tooltip";

type Photo = InferSelectModel<typeof photos>;

// Single-line height at rest, grows on focus — pure CSS so it works in Safari.
const growClass =
  "h-10 resize-none overflow-hidden whitespace-nowrap transition-[height] duration-200 focus:h-32 focus:overflow-auto focus:whitespace-normal motion-reduce:transition-none";

export function PhotoManager({
  collectionId,
  collectionSlug,
  coverImage,
  photos,
}: {
  collectionId: number;
  collectionSlug: string;
  coverImage: string;
  photos: Photo[];
}) {
  const [, startTransition] = useTransition();
  // Server actions run one at a time anyway, so a single "generating" id is enough.
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [altErrors, setAltErrors] = useState<Record<number, string>>({});

  async function generateAlt(id: number) {
    setGeneratingId(id);
    const error = await generateAltForPhoto(id).catch(() => "request failed (are you still logged in?)");
    setAltErrors((prev) => ({ ...prev, [id]: error ?? "" }));
    setGeneratingId(null);
  }
  // The Cover button fills the instant it's clicked; it reverts by itself if the save doesn't land.
  const [optimisticCover, setOptimisticCover] = useOptimistic(coverImage);
  // Held by id so the dialog always shows the freshest row (and closes itself if the photo is deleted).
  const [viewingId, setViewingId] = useState<number | null>(null);
  const viewing = photos.find((p) => p.id === viewingId) ?? null;
  const viewerTrigger = useRef<HTMLElement | null>(null);
  const closeViewer = useCallback(() => {
    setViewingId(null);
    viewerTrigger.current?.focus();
  }, []);

  return (
    <div className="space-y-6">
      <PhotoUploader collections={[{ id: collectionId, slug: collectionSlug, title: "" }]} />

      <ReorderableList
        items={photos}
        onReorder={(ids) =>
          startTransition(async () => {
            await reorderPhotos(ids as number[]);
          })
        }
        renderItem={(photo, dragProps) => (
          <div
            {...dragProps}
            className="relative flex cursor-grab items-center gap-3 rounded-md border border-border bg-surface p-2 backdrop-blur-md hover:z-10 focus-within:z-10"
          >
            <GripVertical className="h-5 w-5 shrink-0 text-dim" aria-hidden />
            <button
              type="button"
              aria-label="View photo"
              onClick={(e) => {
                viewerTrigger.current = e.currentTarget;
                setViewingId(photo.id);
              }}
              className="shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
            >
              <Image
                src={photo.blobUrl}
                alt={photo.alt}
                width={64}
                height={64}
                className={`h-16 w-16 rounded object-cover ${photo.hidden ? "opacity-50" : ""}`}
              />
            </button>
            <div className="flex-1 space-y-1">
              {photo.hidden && <span className="text-sm uppercase text-dim">Hidden</span>}
              {!photo.alt.trim() && (
                <div className="flex flex-wrap items-center gap-x-3 text-base">
                  <button
                    type="button"
                    disabled={generatingId !== null}
                    onClick={() => void generateAlt(photo.id)}
                    className="inline-flex items-center gap-1 rounded px-1 py-1 text-fg underline decoration-fg/40 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 disabled:opacity-60"
                  >
                    {generatingId === photo.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Sparkles className="h-4 w-4" aria-hidden />
                    )}
                    {generatingId === photo.id ? "Generating…" : "Generate alt text"}
                  </button>
                  {altErrors[photo.id] && <span className="text-red-500">Couldn&apos;t generate — {altErrors[photo.id]}</span>}
                </div>
              )}
              <textarea
                key={photo.alt}
                aria-label="Alt text"
                className={`${fieldClass} ${growClass}`}
                placeholder="No alt text"
                defaultValue={photo.alt}
                onBlur={(e) =>
                  oneLine(e.target.value) !== photo.alt &&
                  startTransition(async () => {
                    await updatePhoto(photo.id, { alt: oneLine(e.target.value) });
                  })
                }
              />
              <textarea
                aria-label="Caption"
                className={`${fieldClass} ${growClass}`}
                placeholder="Caption"
                defaultValue={photo.caption ?? ""}
                onBlur={(e) =>
                  oneLine(e.target.value) !== (photo.caption ?? "") &&
                  startTransition(async () => {
                    await updatePhoto(photo.id, { caption: oneLine(e.target.value) || null });
                  })
                }
              />
            </div>
            <Tooltip align="end" label={photo.hidden ? "Show photo" : "Hide photo"}>
              <button
                type="button"
                aria-label={photo.hidden ? "Show photo" : "Hide photo"}
                onClick={() =>
                  startTransition(async () => {
                    await updatePhoto(photo.id, { hidden: !photo.hidden });
                  })
                }
                className="rounded p-2 text-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
              >
                {photo.hidden ? <Eye className="h-5 w-5" aria-hidden /> : <EyeOff className="h-5 w-5" aria-hidden />}
              </button>
            </Tooltip>
            <Tooltip
              align="end"
              label={photo.blobUrl === optimisticCover ? "This is the collection thumbnail" : "Use as the collection thumbnail"}
            >
              <button
                type="button"
                aria-pressed={photo.blobUrl === optimisticCover}
                onClick={() =>
                  photo.blobUrl !== optimisticCover &&
                  startTransition(async () => {
                    setOptimisticCover(photo.blobUrl);
                    await updateCollection(collectionId, { coverImage: photo.blobUrl });
                  })
                }
                className={`min-h-9 rounded border border-border-strong px-3 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 ${
                  photo.blobUrl === optimisticCover ? "bg-fg text-bg" : "text-muted hover:text-fg"
                }`}
              >
                Cover
              </button>
            </Tooltip>
            <button
              type="button"
              onClick={() => {
                if (!confirm("Delete this photo?")) return;
                startTransition(async () => {
                  await deletePhoto(photo.id);
                });
              }}
              className="px-2 py-2 text-base text-red-500"
            >
              Delete
            </button>
          </div>
        )}
      />
      <PhotoViewer photo={viewing} onClose={closeViewer} />
    </div>
  );
}

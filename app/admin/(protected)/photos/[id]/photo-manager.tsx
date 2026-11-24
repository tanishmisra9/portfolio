"use client";

import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";
import { Eye, EyeOff, GripVertical, Loader2, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import type { InferSelectModel } from "drizzle-orm";
import type { photos } from "@/db/schema";
import { ReorderableList } from "@/components/admin/reorderable-list";
import { Button } from "@/components/admin/ui/button";
import { DeleteButton } from "@/components/admin/ui/delete-button";
import { Textarea } from "@/components/admin/ui/field";
import { MoveButtons } from "@/components/admin/ui/move-buttons";
import { EmptyState, Tag } from "@/components/admin/ui/panel";
import { SaveStatus } from "@/components/admin/ui/save-status";
import { useSaveStatus } from "@/components/admin/ui/use-save-status";
import { IconButton } from "@/components/ui/icon-button";
import { deletePhoto, generateAltForPhoto, reorderPhotos, updateCollection, updatePhoto } from "@/lib/admin/actions";
import { oneLine, PhotoUploader } from "../photo-uploader";
import { PhotoViewer } from "./photo-viewer";

type Photo = InferSelectModel<typeof photos>;

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
  const status = useSaveStatus();
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

      <div className={status.status === "idle" ? "sr-only" : "min-h-5"}>
        <SaveStatus state={status} />
      </div>

      {photos.length === 0 ? (
        <EmptyState>No photos in this collection yet. Drop some above.</EmptyState>
      ) : (
        <ReorderableList
          items={photos}
          onReorder={(ids) => void status.run(() => reorderPhotos(ids as number[]))}
          renderItem={(photo, dragProps) => {
            const index = photos.findIndex((p) => p.id === photo.id);
            const isCover = photo.blobUrl === optimisticCover;
            return (
              <div className="relative flex flex-wrap items-start gap-3 border border-border bg-surface p-3 backdrop-blur-md">
                <MoveButtons
                  index={index}
                  count={photos.length}
                  label="photo"
                  onMove={(d) => {
                    const ids = photos.map((p) => p.id);
                    const [moved] = ids.splice(index, 1);
                    ids.splice(index + d, 0, moved);
                    void status.run(() => reorderPhotos(ids));
                  }}
                />
                <div {...dragProps} aria-hidden className="flex h-16 w-7 shrink-0 cursor-grab items-center justify-center text-dim hover:text-fg">
                  <GripVertical className="h-5 w-5" />
                </div>
                <button
                  type="button"
                  aria-label="View photo"
                  onClick={(e) => {
                    viewerTrigger.current = e.currentTarget;
                    setViewingId(photo.id);
                  }}
                  className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
                >
                  <Image src={photo.blobUrl} alt={photo.alt} width={64} height={64} className={`h-16 w-16 object-cover ${photo.hidden ? "opacity-50" : ""}`} />
                </button>
                <div className="min-w-0 flex-1 basis-64 space-y-2">
                  {photo.hidden && <Tag>Hidden</Tag>}
                  {!photo.alt.trim() && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base">
                      <Button size="sm" disabled={generatingId !== null} onClick={() => void generateAlt(photo.id)}>
                        {generatingId === photo.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
                        {generatingId === photo.id ? "Generating…" : "Generate alt text"}
                      </Button>
                      {altErrors[photo.id] && <span className="text-danger">Couldn&apos;t generate — {altErrors[photo.id]}</span>}
                    </div>
                  )}
                  <Textarea
                    key={photo.alt}
                    aria-label="Alt text"
                    rows={2}
                    className="resize-y"
                    placeholder="No alt text"
                    defaultValue={photo.alt}
                    onBlur={(e) => oneLine(e.target.value) !== photo.alt && void status.run(() => updatePhoto(photo.id, { alt: oneLine(e.target.value) }))}
                  />
                  <Textarea
                    aria-label="Caption"
                    rows={2}
                    className="resize-y"
                    placeholder="Caption"
                    defaultValue={photo.caption ?? ""}
                    onBlur={(e) =>
                      oneLine(e.target.value) !== (photo.caption ?? "") &&
                      void status.run(() => updatePhoto(photo.id, { caption: oneLine(e.target.value) || null }))
                    }
                  />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <IconButton
                    icon={photo.hidden ? <Eye /> : <EyeOff />}
                    label={photo.hidden ? "Show photo" : "Hide photo"}
                    onClick={() => void status.run(() => updatePhoto(photo.id, { hidden: !photo.hidden }))}
                  />
                  <IconButton
                    icon={<Star className={isCover ? "fill-current" : ""} />}
                    label={isCover ? "This is the collection thumbnail" : "Use as the collection thumbnail"}
                    aria-pressed={isCover}
                    onClick={() =>
                      !isCover &&
                      startTransition(async () => {
                        setOptimisticCover(photo.blobUrl);
                        await status.run(() => updateCollection(collectionId, { coverImage: photo.blobUrl }));
                      })
                    }
                  />
                  <DeleteButton label="Delete photo" onConfirm={() => void status.run(() => deletePhoto(photo.id))} />
                </div>
              </div>
            );
          }}
        />
      )}
      <PhotoViewer photo={viewing} onClose={closeViewer} />
    </div>
  );
}

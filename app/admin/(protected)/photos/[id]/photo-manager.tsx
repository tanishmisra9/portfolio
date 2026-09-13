"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { InferSelectModel } from "drizzle-orm";
import type { photos } from "@/db/schema";
import { ReorderableList } from "@/components/admin/reorderable-list";
import { deletePhoto, reorderPhotos, updatePhoto, uploadPhoto } from "@/lib/admin/actions";

type Photo = InferSelectModel<typeof photos>;

export function PhotoManager({
  collectionId,
  collectionSlug,
  photos,
}: {
  collectionId: number;
  collectionSlug: string;
  photos: Photo[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState<{ file: File; alt: string; caption: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;
    setPending((prev) => [
      ...prev,
      ...Array.from(files).map((file) => ({ file, alt: "", caption: "" })),
    ]);
  }

  function uploadPending(index: number) {
    const item = pending[index];
    startTransition(async () => {
      await uploadPhoto(collectionId, collectionSlug, item.file, {
        alt: item.alt,
        caption: item.caption,
      });
      setPending((prev) => prev.filter((_, i) => i !== index));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded border-2 border-dashed p-6 text-center text-sm ${
          dragOver ? "border-fg bg-fg/5" : "border-fg/20 text-dim"
        }`}
      >
        Drag and drop images here, or click to choose files
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {pending.map((item, index) => (
        <div key={index} className="flex items-center gap-3 rounded border border-fg/10 p-3">
          <span className="text-sm">{item.file.name}</span>
          <input
            className="flex-1 rounded border border-fg/20 bg-transparent px-2 py-1 text-sm"
            placeholder="Alt text (required)"
            value={item.alt}
            onChange={(e) =>
              setPending((prev) =>
                prev.map((p, i) => (i === index ? { ...p, alt: e.target.value } : p)),
              )
            }
          />
          <input
            className="flex-1 rounded border border-fg/20 bg-transparent px-2 py-1 text-sm"
            placeholder="Caption (optional)"
            value={item.caption}
            onChange={(e) =>
              setPending((prev) =>
                prev.map((p, i) => (i === index ? { ...p, caption: e.target.value } : p)),
              )
            }
          />
          <button
            type="button"
            disabled={!item.alt}
            onClick={() => uploadPending(index)}
            className="rounded bg-fg px-3 py-1 text-xs text-bg disabled:opacity-50"
          >
            Upload
          </button>
        </div>
      ))}

      <ReorderableList
        items={photos}
        onReorder={(ids) =>
          startTransition(async () => {
            await reorderPhotos(ids);
            router.refresh();
          })
        }
        renderItem={(photo, dragProps) => (
          <div
            {...dragProps}
            className="flex cursor-grab items-center gap-3 rounded border border-fg/10 p-2"
          >
            <span className="text-dim">⠿</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.blobUrl} alt={photo.alt} className="h-16 w-16 rounded object-cover" />
            <div className="flex-1 space-y-1">
              <input
                className="w-full bg-transparent text-sm outline-none"
                defaultValue={photo.alt}
                onBlur={(e) =>
                  e.target.value !== photo.alt &&
                  startTransition(async () => {
                    await updatePhoto(photo.id, { alt: e.target.value });
                    router.refresh();
                  })
                }
              />
              <input
                className="w-full bg-transparent text-xs text-dim outline-none"
                placeholder="Caption"
                defaultValue={photo.caption ?? ""}
                onBlur={(e) =>
                  e.target.value !== (photo.caption ?? "") &&
                  startTransition(async () => {
                    await updatePhoto(photo.id, { caption: e.target.value || null });
                    router.refresh();
                  })
                }
              />
            </div>
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  await deletePhoto(photo.id);
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
    </div>
  );
}

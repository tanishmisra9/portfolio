"use client";

import { useRef, useState, useTransition } from "react";
import { GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
        className={`cursor-pointer rounded border-2 border-dashed p-6 text-center text-base ${
          dragOver ? "border-fg bg-fg/5" : "border-border-strong text-dim"
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
        <div key={index} className="flex items-center gap-3 rounded-md border border-border bg-surface p-3 backdrop-blur-md">
          <span className="text-base">{item.file.name}</span>
          <input
            className="flex-1 rounded border border-border-strong bg-transparent px-2 py-1 text-base"
            placeholder="Alt text (required)"
            value={item.alt}
            onChange={(e) =>
              setPending((prev) =>
                prev.map((p, i) => (i === index ? { ...p, alt: e.target.value } : p)),
              )
            }
          />
          <input
            className="flex-1 rounded border border-border-strong bg-transparent px-2 py-1 text-base"
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
            className="rounded bg-fg px-3 py-1 text-base text-bg disabled:opacity-50"
          >
            Upload
          </button>
        </div>
      ))}

      <ReorderableList
        items={photos}
        onReorder={(ids) =>
          startTransition(async () => {
            await reorderPhotos(ids as number[]);
            router.refresh();
          })
        }
        renderItem={(photo, dragProps) => (
          <div
            {...dragProps}
            className="flex cursor-grab items-center gap-3 rounded-md border border-border bg-surface p-2 backdrop-blur-md"
          >
            <GripVertical className="h-5 w-5 shrink-0 text-dim" aria-hidden />
            <Image
              src={photo.blobUrl}
              alt={photo.alt}
              width={64}
              height={64}
              className="h-16 w-16 rounded object-cover"
            />
            <div className="flex-1 space-y-1">
              <input
                aria-label="Alt text"
                className="w-full rounded border border-border-strong bg-transparent px-3 py-1.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
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
                aria-label="Caption"
                className="w-full rounded border border-border-strong bg-transparent px-3 py-1.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
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
              onClick={() => {
                if (!confirm("Delete this photo?")) return;
                startTransition(async () => {
                  await deletePhoto(photo.id);
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
    </div>
  );
}

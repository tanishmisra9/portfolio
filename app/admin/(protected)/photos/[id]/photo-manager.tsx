"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { GripVertical, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { InferSelectModel } from "drizzle-orm";
import type { photos } from "@/db/schema";
import { ReorderableList } from "@/components/admin/reorderable-list";
import { deletePhoto, reorderPhotos, suggestAltText, updatePhoto, uploadPhoto } from "@/lib/admin/actions";
import { toAltPreviewDataUrl, uploadImageToBlob } from "@/lib/admin/client-upload";

type Photo = InferSelectModel<typeof photos>;

interface PendingPhoto {
  key: string;
  file: File;
  previewUrl: string;
  alt: string;
  caption: string;
  /** First AI suggestion, kept so Reset can restore it without another API call. */
  aiAlt: string | null;
  aiStatus: "generating" | "ready" | "failed";
  status: "idle" | "uploading" | "saving";
  progress: number;
}

// Alt/caption are single logical lines; the textareas exist only for room to read and edit.
const oneLine = (v: string) => v.replace(/\s*\n+\s*/g, " ").trim();

const fieldClass =
  "w-full rounded border border-border-strong bg-transparent px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-fg/70 disabled:opacity-60";
// Single-line height at rest, grows on focus — pure CSS so it works in Safari.
const growClass =
  "h-10 resize-none overflow-hidden whitespace-nowrap transition-[height] duration-200 focus:h-32 focus:overflow-auto focus:whitespace-normal motion-reduce:transition-none";

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
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function patchPending(key: string, patch: Partial<PendingPhoto>) {
    setPending((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  // Previews are object URLs; release any still alive if the page is left.
  useEffect(() => () => pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)), []);

  function removePending(key: string) {
    const gone = pendingRef.current.find((p) => p.key === key);
    if (gone) URL.revokeObjectURL(gone.previewUrl);
    setPending((prev) => prev.filter((p) => p.key !== key));
  }

  async function requestAiAlt(key: string, file: File) {
    const preview = await toAltPreviewDataUrl(file);
    const suggestion = preview ? await suggestAltText(preview).catch(() => null) : null;
    setPending((prev) =>
      prev.map((p) => {
        if (p.key !== key) return p;
        if (!suggestion) return { ...p, aiStatus: "failed" };
        // Never overwrite something the user already typed while this was loading.
        return { ...p, aiAlt: suggestion, aiStatus: "ready", alt: p.alt === "" ? suggestion : p.alt };
      }),
    );
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const added: PendingPhoto[] = Array.from(files).map((file) => ({
      key: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      alt: "",
      caption: "",
      aiAlt: null,
      aiStatus: "generating",
      status: "idle",
      progress: 0,
    }));
    setPending((prev) => [...prev, ...added]);
    for (const item of added) void requestAiAlt(item.key, item.file);
  }

  // Tracked per item (not one shared transition) so concurrent uploads each show their own
  // progress, and removal is by key so out-of-order completion can't drop or duplicate a row.
  async function uploadPending(key: string) {
    const item = pending.find((p) => p.key === key);
    if (!item) return;
    setErrors((prev) => ({ ...prev, [key]: "" }));
    patchPending(key, { status: "uploading", progress: 0 });
    try {
      const { url, width, height } = await uploadImageToBlob(
        item.file,
        `photos/${collectionSlug}`,
        (percentage) => patchPending(key, { progress: percentage }),
      );
      patchPending(key, { status: "saving", progress: 100 });
      await uploadPhoto(collectionId, url, { alt: oneLine(item.alt), caption: oneLine(item.caption), width, height });
      removePending(key);
      router.refresh();
    } catch (err) {
      patchPending(key, { status: "idle", progress: 0 });
      setErrors((prev) => ({ ...prev, [key]: err instanceof Error ? err.message : "Upload failed." }));
    }
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

      {pending.map((item) => {
        const busy = item.status !== "idle";
        return (
          <div key={item.key} className="space-y-3 rounded-md border border-border bg-surface p-4 backdrop-blur-md">
            <div className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previewUrl} alt="" className="h-28 w-28 shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1 space-y-3">
                <p className="truncate text-base text-dim">{item.file.name}</p>
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-base text-dim">
                    <label htmlFor={`alt-${item.key}`}>Alt text (required)</label>
                    {item.aiStatus === "generating" && (
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-4 w-4 animate-pulse" aria-hidden /> Generating…
                      </span>
                    )}
                    {item.aiStatus === "failed" && <span>Couldn&apos;t auto-generate</span>}
                    {item.aiAlt && item.alt !== item.aiAlt && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => patchPending(item.key, { alt: item.aiAlt! })}
                        className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-base text-fg underline decoration-fg/40 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden /> Reset to suggestion
                      </button>
                    )}
                  </div>
                  <textarea
                    id={`alt-${item.key}`}
                    rows={4}
                    disabled={busy}
                    className={fieldClass}
                    placeholder={item.aiStatus === "generating" ? "Generating alt text…" : "Describe the photo"}
                    value={item.alt}
                    onChange={(e) => patchPending(item.key, { alt: e.target.value })}
                  />
                </div>
                <label className="block">
                  <span className="mb-1 block text-base text-dim">Caption (optional)</span>
                  <textarea
                    rows={3}
                    disabled={busy}
                    className={fieldClass}
                    value={item.caption}
                    onChange={(e) => patchPending(item.key, { caption: e.target.value })}
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!item.alt.trim() || busy}
                onClick={() => void uploadPending(item.key)}
                className="inline-flex min-w-36 items-center justify-center gap-2 rounded bg-fg px-4 py-2 text-base text-bg disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {item.status === "uploading"
                  ? `Uploading ${Math.round(item.progress)}%`
                  : item.status === "saving"
                    ? "Saving…"
                    : "Upload"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => removePending(item.key)}
                className="rounded px-3 py-2 text-base text-dim hover:text-fg disabled:opacity-60"
              >
                Remove
              </button>
            </div>
            {busy && (
              <div
                role="progressbar"
                aria-valuenow={Math.round(item.progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1 overflow-hidden rounded bg-fg/10"
              >
                <div className="h-full bg-fg transition-[width] duration-200" style={{ width: `${item.progress}%` }} />
              </div>
            )}
            {errors[item.key] && <p className="text-base text-red-500">{errors[item.key]}</p>}
          </div>
        );
      })}

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
              <textarea
                aria-label="Alt text"
                className={`${fieldClass} ${growClass}`}
                defaultValue={photo.alt}
                onBlur={(e) =>
                  oneLine(e.target.value) !== photo.alt &&
                  startTransition(async () => {
                    await updatePhoto(photo.id, { alt: oneLine(e.target.value) });
                    router.refresh();
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

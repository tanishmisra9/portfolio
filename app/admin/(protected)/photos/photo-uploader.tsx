"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Select, Textarea } from "@/components/admin/ui/field";
import { suggestAltText, uploadPhoto } from "@/lib/admin/actions";
import { toAltPreviewDataUrl, uploadImageToBlob } from "@/lib/admin/client-upload";
import { AI_STATUS, move, UPLOAD_STATUS, type AiStatus, type UploadStatus } from "@/lib/state-machines";

interface PendingPhoto {
  key: string;
  file: File;
  previewUrl: string;
  alt: string;
  caption: string;
  /** First AI suggestion, kept so Reset can restore it without another API call. */
  aiAlt: string | null;
  aiStatus: AiStatus;
  aiError?: string;
  status: UploadStatus;
  progress: number;
  /** Null until the user picks one (only possible when several collections are offered). */
  collectionId: number | null;
}

// Alt/caption are single logical lines; the textareas exist only for room to read and edit.
export const oneLine = (v: string) => v.replace(/\s*\n+\s*/g, " ").trim();

export { fieldClass } from "@/components/admin/ui/field";

type UploadTarget = { id: number; slug: string; title: string };

/** Dropzone + pending-upload cards. With one collection the destination is fixed; with several, each card asks for one. */
export function PhotoUploader({ collections }: { collections: UploadTarget[] }) {
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [addedTo, setAddedTo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function patchPending(key: string, patch: Partial<PendingPhoto>) {
    setPending((prev) =>
      prev.map((p) => {
        if (p.key !== key) return p;
        const status = patch.status ? move(UPLOAD_STATUS, p.status, patch.status) : p.status;
        return { ...p, ...patch, status };
      }),
    );
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

  // Next.js runs client-invoked server actions strictly one at a time, so firing a
  // suggestion per selected file at once would make an Upload click (uploadPhoto) wait
  // behind all of them. Chaining them keeps at most one in flight ahead of any upload.
  const aiQueue = useRef<Promise<unknown>>(Promise.resolve());

  function requestAiAlt(key: string, file: File) {
    aiQueue.current = aiQueue.current.then(() => fetchAiAlt(key, file));
  }

  async function fetchAiAlt(key: string, file: File) {
    const preview = await toAltPreviewDataUrl(file);
    const result = preview
      ? await suggestAltText(preview).catch(() => ({ error: "request failed (are you still logged in?)" }))
      : { error: "this image format can't be previewed in the browser" };
    const suggestion = "alt" in result ? result.alt : null;
    const reason = "error" in result ? result.error : "";
    setPending((prev) =>
      prev.map((p) => {
        if (p.key !== key) return p;
        if (!suggestion) return { ...p, aiStatus: move(AI_STATUS, p.aiStatus, "failed"), aiError: reason };
        // Never overwrite something the user already typed while this was loading.
        return { ...p, aiAlt: suggestion, aiStatus: move(AI_STATUS, p.aiStatus, "ready"), alt: p.alt === "" ? suggestion : p.alt };
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
      collectionId: collections.length === 1 ? collections[0].id : null,
    }));
    setPending((prev) => [...prev, ...added]);
    for (const item of added) requestAiAlt(item.key, item.file);
  }

  // Tracked per item (not one shared transition) so concurrent uploads each show their own
  // progress, and removal is by key so out-of-order completion can't drop or duplicate a row.
  async function uploadPending(key: string) {
    const item = pending.find((p) => p.key === key);
    const target = collections.find((c) => c.id === item?.collectionId);
    if (!item || !target) return;
    setErrors((prev) => ({ ...prev, [key]: "" }));
    patchPending(key, { status: "uploading", progress: 0 });
    try {
      const { url, width, height } = await uploadImageToBlob(
        item.file,
        `photos/${target.slug}`,
        (percentage) => patchPending(key, { progress: percentage }),
      );
      patchPending(key, { status: "saving", progress: 100 });
      await uploadPhoto(target.id, url, { alt: oneLine(item.alt), caption: oneLine(item.caption), width, height });
      removePending(key);
      if (collections.length > 1) {
        setAddedTo(target.title);
        setTimeout(() => setAddedTo(null), 3000);
      }
    } catch (err) {
      patchPending(key, { status: "idle", progress: 0 });
      setErrors((prev) => ({ ...prev, [key]: err instanceof Error ? err.message : "Upload failed." }));
    }
  }

  const ready = pending.filter((p) => p.status === "idle" && p.alt.trim() && p.collectionId !== null);
  async function uploadAll() {
    for (const item of ready) await uploadPending(item.key);
  }

  return (
    <div className="space-y-6">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), inputRef.current?.click())}
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
        className={`cursor-pointer border border-dashed p-6 text-center text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 ${
          dragOver ? "border-fg bg-fg/10" : "border-border-strong text-dim"
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

      {ready.length > 1 && (
        <Button variant="primary" onClick={() => void uploadAll()}>
          Upload all ({ready.length})
        </Button>
      )}

      {pending.map((item) => {
        const busy = item.status !== "idle";
        return (
          <div key={item.key} className="space-y-3 border border-border bg-surface p-4 backdrop-blur-md">
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previewUrl} alt="" className="h-28 w-28 shrink-0 object-cover" />
              <div className="min-w-0 flex-1 space-y-3">
                <p className="truncate text-base text-dim">{item.file.name}</p>
                {collections.length > 1 && (
                  <label className="block">
                    <span className="mb-1 block text-base text-dim">Collection</span>
                    <Select
                      disabled={busy}
                      value={item.collectionId ?? ""}
                      onChange={(e) =>
                        patchPending(item.key, { collectionId: e.target.value ? Number(e.target.value) : null })
                      }
                    >
                      <option value="">Choose a collection…</option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </Select>
                  </label>
                )}
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-base text-dim">
                    <label htmlFor={`alt-${item.key}`}>Alt text (required)</label>
                    {item.aiStatus === "generating" && (
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-4 w-4 animate-pulse" aria-hidden /> Generating…
                      </span>
                    )}
                    {item.aiStatus === "failed" && (
                      <span>
                        Couldn&apos;t auto-generate{item.aiError ? ` — ${item.aiError}` : ""}
                      </span>
                    )}
                    {item.aiAlt && item.alt !== item.aiAlt && (
                      <Button size="sm" disabled={busy} onClick={() => patchPending(item.key, { alt: item.aiAlt! })} className="ml-auto">
                        <RotateCcw className="h-4 w-4" aria-hidden /> Reset to suggestion
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id={`alt-${item.key}`}
                    rows={4}
                    disabled={busy}
                    placeholder={item.aiStatus === "generating" ? "Generating alt text…" : "Describe the photo"}
                    value={item.alt}
                    onChange={(e) => patchPending(item.key, { alt: e.target.value })}
                  />
                </div>
                <label className="block">
                  <span className="mb-1 block text-base text-dim">Caption (optional)</span>
                  <Textarea
                    rows={3}
                    disabled={busy}
                    value={item.caption}
                    onChange={(e) => patchPending(item.key, { caption: e.target.value })}
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                className="min-w-36"
                disabled={!item.alt.trim() || item.collectionId === null || busy}
                onClick={() => void uploadPending(item.key)}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {item.status === "uploading"
                  ? `Uploading ${Math.round(item.progress)}%`
                  : item.status === "saving"
                    ? "Saving…"
                    : "Upload"}
              </Button>
              <Button disabled={busy} onClick={() => removePending(item.key)}>
                Remove
              </Button>
            </div>
            {busy && (
              <div
                role="progressbar"
                aria-valuenow={Math.round(item.progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1 overflow-hidden bg-fg/10"
              >
                <div className="h-full bg-fg transition-[width] duration-200" style={{ width: `${item.progress}%` }} />
              </div>
            )}
            {errors[item.key] && <p role="alert" className="text-base text-danger">{errors[item.key]}</p>}
          </div>
        );
      })}
      {addedTo && (
        <p aria-live="polite" className="text-base text-dim">
          Added to {addedTo} ✓
        </p>
      )}
    </div>
  );
}

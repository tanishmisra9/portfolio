"use client";

import { useRef, useState, useTransition } from "react";
import { uploadResume } from "@/lib/admin/actions";

export function ResumeUploader({
  currentUrl,
  onUploaded,
}: {
  currentUrl: string;
  onUploaded: (url: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function selectFile(file: File | undefined) {
    if (!file) return;
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function confirmUpload() {
    if (!pendingFile) return;
    startTransition(async () => {
      const url = await uploadResume(pendingFile);
      onUploaded(url);
      setPendingFile(null);
      setPreviewUrl(null);
    });
  }

  return (
    <div className="space-y-3">
      {currentUrl && !previewUrl && (
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-fg underline decoration-fg/40 underline-offset-2 hover:decoration-fg"
        >
          Current resume
        </a>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          selectFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded border-2 border-dashed p-4 text-center text-xs ${
          dragOver ? "border-fg bg-fg/5" : "border-fg/20 text-dim"
        }`}
      >
        Drag and drop a PDF here, or click to choose a file
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => selectFile(e.target.files?.[0])}
        />
      </div>

      {previewUrl && (
        <div className="space-y-2">
          <embed src={previewUrl} type="application/pdf" className="h-96 w-full rounded border border-fg/10" />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={confirmUpload}
              className="rounded bg-fg px-3 py-1.5 text-sm text-bg disabled:opacity-50"
            >
              {pending ? "Uploading..." : "Use this resume"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingFile(null);
                setPreviewUrl(null);
              }}
              className="text-sm text-dim hover:text-fg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

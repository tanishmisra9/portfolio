"use client";

import { useRef, useState, useTransition } from "react";
import { uploadResume } from "@/lib/admin/actions";

const DEFAULT_FILENAME = "Resume-TanishMisra.pdf";

function filenameFromUrl(url: string): string {
  const name = url.split("?")[0].split("/").pop();
  return name && name.toLowerCase().endsWith(".pdf") ? name : DEFAULT_FILENAME;
}

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
  const [filename, setFilename] = useState(() => filenameFromUrl(currentUrl));
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
      const url = await uploadResume(pendingFile, filename || DEFAULT_FILENAME);
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
          className="text-base text-fg underline decoration-fg/40 underline-offset-2 hover:decoration-fg"
        >
          Current resume
        </a>
      )}

      <label className="block">
        <span className="mb-1 block text-sm text-dim">Download filename</span>
        <input
          className="w-full rounded border border-fg/20 bg-transparent px-2 py-1.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
        />
      </label>

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
        className={`cursor-pointer rounded border-2 border-dashed p-4 text-center text-sm ${
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
              className="rounded bg-fg px-3 py-1.5 text-base text-bg disabled:opacity-50"
            >
              {pending ? "Uploading..." : "Use this resume"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingFile(null);
                setPreviewUrl(null);
              }}
              className="text-base text-dim hover:text-fg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

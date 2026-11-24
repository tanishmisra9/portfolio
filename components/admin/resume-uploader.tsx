"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/admin/ui/button";
import { Field, Input } from "@/components/admin/ui/field";
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

      <Field label="Download filename">
        <Input value={filename} onChange={(e) => setFilename(e.target.value)} />
      </Field>

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
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), inputRef.current?.click())}
        className={`cursor-pointer border border-dashed p-4 text-center text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 ${
          dragOver ? "border-fg bg-fg/10" : "border-border-strong text-dim"
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
          <embed src={previewUrl} type="application/pdf" className="h-96 w-full border border-border" />
          <div className="flex gap-2">
            <Button variant="primary" pending={pending} onClick={confirmUpload}>
              {pending ? "Uploading…" : "Use this resume"}
            </Button>
            <Button
              onClick={() => {
                setPendingFile(null);
                setPreviewUrl(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRadioSample, uploadRadioSample } from "@/lib/admin/actions";

interface Sample {
  url: string;
  pathname: string;
}

function filenameOf(pathname: string): string {
  return pathname.split("/").pop() ?? pathname;
}

export function RadioManager({ samples }: { samples: Sample[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setErrors([]);
    startTransition(async () => {
      const failed: string[] = [];
      for (const file of fileArray) {
        const url = await uploadRadioSample(file);
        if (!url) failed.push(file.name);
      }
      setErrors(failed.map((name) => `${name}: not an audio file`));
      router.refresh();
    });
  }

  function remove(url: string) {
    startTransition(async () => {
      await deleteRadioSample(url);
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
          uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded border-2 border-dashed p-6 text-center text-base ${
          dragOver ? "border-fg bg-fg/5" : "border-border-strong text-dim"
        }`}
      >
        Drag and drop audio clips here (multiple allowed), or click to choose files
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          multiple
          hidden
          onChange={(e) => uploadFiles(e.target.files)}
        />
      </div>

      {errors.length > 0 && (
        <div className="space-y-1 rounded border border-fg/10 p-3 text-base text-red-500">
          {errors.map((msg) => (
            <p key={msg}>{msg}</p>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {samples.map((sample) => (
          <div
            key={sample.url}
            className="flex items-center gap-3 rounded-md border border-border bg-surface p-3 backdrop-blur-md"
          >
            <span className="flex-1 truncate text-base text-fg">{filenameOf(sample.pathname)}</span>
            <audio controls src={sample.url} className="h-8" />
            <button type="button" onClick={() => remove(sample.url)} className="text-base text-red-500">
              Delete
            </button>
          </div>
        ))}
        {samples.length === 0 && <p className="text-muted">No samples uploaded yet.</p>}
      </div>
    </div>
  );
}

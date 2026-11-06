"use client";

import { useRef, useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { deleteRadioSample, setRadioSampleDisabled, uploadRadioSample } from "@/lib/admin/actions";

interface Sample {
  url: string;
  pathname: string;
  disabled: boolean;
}

function filenameOf(pathname: string): string {
  return pathname.split("/").pop() ?? pathname;
}

export function RadioManager({ samples, liveUrls }: { samples: Sample[]; liveUrls: string[] }) {
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
    });
  }

  function toggleDisabled(url: string, disabled: boolean) {
    startTransition(async () => {
      await setRadioSampleDisabled(url, disabled);
    });
  }

  function remove(url: string) {
    startTransition(async () => {
      await deleteRadioSample(url);
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
        {samples.map((sample) => {
          const isLive = liveUrls.includes(sample.url);
          // Differs from what's live (new, re-enabled, or about to be turned off) -> outlined until Publish.
          const changed = !sample.disabled !== isLive;
          const tag = sample.disabled ? (changed ? "Turning off" : "Disabled") : changed ? "New" : null;
          return (
            <div
              key={sample.url}
              className={`relative flex items-center gap-3 rounded-md border bg-surface p-3 backdrop-blur-md hover:z-10 focus-within:z-10 ${
                changed ? "border-fg" : "border-border"
              }`}
            >
              <span className={`flex-1 truncate text-base text-fg ${sample.disabled ? "opacity-50" : ""}`}>
                {filenameOf(sample.pathname)}
              </span>
              {tag && <span className="text-sm uppercase text-dim">{tag}</span>}
              <audio controls src={sample.url} className={`h-8 ${sample.disabled ? "opacity-50" : ""}`} />
              <Tooltip label={sample.disabled ? "Enable clip" : "Disable clip"} align="end">
                <button
                  type="button"
                  aria-label={sample.disabled ? "Enable clip" : "Disable clip"}
                  onClick={() => toggleDisabled(sample.url, !sample.disabled)}
                  className="rounded p-2 text-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
                >
                  {sample.disabled ? <Eye className="h-5 w-5" aria-hidden /> : <EyeOff className="h-5 w-5" aria-hidden />}
                </button>
              </Tooltip>
              <button type="button" onClick={() => remove(sample.url)} className="text-base text-red-500">
                Delete
              </button>
            </div>
          );
        })}
        {samples.length === 0 && <p className="text-muted">No samples uploaded yet.</p>}
      </div>
    </div>
  );
}

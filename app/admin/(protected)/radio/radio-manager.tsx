"use client";

import { useRef, useState } from "react";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { DeleteButton } from "@/components/admin/ui/delete-button";
import { EmptyState, Tag } from "@/components/admin/ui/panel";
import { SaveStatus } from "@/components/admin/ui/save-status";
import { useSaveStatus } from "@/components/admin/ui/use-save-status";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/admin/ui/field";
import { Button } from "@/components/admin/ui/button";
import { measureRms } from "@/lib/radio-loudness";
import { deleteRadioSample, renameRadioSample, setRadioSampleDisabled, setRadioSampleRms, uploadRadioSample } from "@/lib/admin/actions";

interface Sample {
  url: string;
  pathname: string;
  disabled: boolean;
  rms: number | null;
}

function filenameOf(pathname: string): string {
  return pathname.split("/").pop() ?? pathname;
}

/**
 * The clip's name, with a pencil to rename it in place. Enter or leaving the field saves, Esc cancels; an unchanged
 * name is a no-op. A rejected name (empty, too long) shows in the status line and the field stays open.
 */
function ClipName({ name, disabled, onSave }: { name: string; disabled: boolean; onSave: (name: string) => Promise<boolean> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const cancelled = useRef(false);

  async function commit() {
    if (cancelled.current) return;
    if (value.trim() === name) return setEditing(false);
    if (await onSave(value)) setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex min-w-0 flex-1 basis-40 items-center gap-[30px]">
        <span className={`truncate text-base text-fg ${disabled ? "opacity-50" : ""}`}>{name}</span>
        <IconButton
          icon={<Pencil />}
          label={`Rename ${name}`}
          onClick={() => {
            cancelled.current = false;
            setValue(name);
            setEditing(true);
          }}
        />
      </div>
    );
  }
  return (
    <Input
      aria-label={`New name for ${name}`}
      className="min-w-0 flex-1 basis-40"
      value={value}
      autoFocus
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void commit();
        } else if (e.key === "Escape") {
          cancelled.current = true;
          setEditing(false);
        }
      }}
    />
  );
}

export function RadioManager({ samples, liveUrls }: { samples: Sample[]; liveUrls: string[] }) {
  const status = useSaveStatus();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setErrors([]);
    setUploading(true);
    void (async () => {
      const failed: string[] = [];
      for (const file of fileArray) {
        // uploadRadioSample returns a falsy value for a non-audio file; anything else that throws is a real failure.
        const result = await status.run(async () => {
          const url = await uploadRadioSample(file, await measureRms(file));
          if (!url) throw new Error("not an audio file");
        });
        if (!result.ok) failed.push(`${file.name}: couldn't upload (is it an audio file?)`);
      }
      setErrors(failed);
      setUploading(false);
    })();
  }

  /** One-time backfill: measures clips uploaded before loudness was stored (decoded here, never on the public site). */
  function analyzeLoudness() {
    void status.run(async () => {
      let failed = 0;
      for (const sample of samples.filter((s) => s.rms === null)) {
        const rms = await measureRms(sample.url);
        if (rms === null) failed += 1;
        else await setRadioSampleRms(sample.url, rms);
      }
      if (failed > 0) throw new Error(`${failed} clip(s) couldn't be analyzed; they'll play at default volume.`);
    });
  }

  function toggleDisabled(url: string, disabled: boolean) {
    void status.run(() => setRadioSampleDisabled(url, disabled));
  }

  /** Resolves true when the rename saved (the row then leaves edit mode). */
  async function rename(url: string, name: string): Promise<boolean> {
    const result = await status.run(async () => {
      const err = await renameRadioSample(url, name);
      if (err) throw new Error(err);
    });
    return result.ok;
  }

  function remove(url: string) {
    void status.run(() => deleteRadioSample(url));
  }

  return (
    <div className="space-y-6">
      <div
        role="button"
        tabIndex={0}
        aria-busy={uploading}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), inputRef.current?.click())}
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
        className={`cursor-pointer border border-dashed p-6 text-center text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 ${
          dragOver ? "border-fg bg-fg/10" : "border-border-strong text-dim"
        }`}
      >
        {uploading ? "Uploading…" : "Drag and drop audio clips here (multiple allowed), or click to choose files"}
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
        <div role="alert" className="space-y-1 border border-border p-3 text-base text-danger">
          {errors.map((msg) => (
            <p key={msg}>{msg}</p>
          ))}
        </div>
      )}

      {samples.some((s) => s.rms === null) && (
        <Button onClick={analyzeLoudness}>Analyze loudness ({samples.filter((s) => s.rms === null).length} clips)</Button>
      )}

      <SaveStatus state={status} />

      <div className="space-y-2">
        {samples.map((sample) => {
          const isLive = liveUrls.includes(sample.url);
          // Differs from what's live (new, re-enabled, or about to be turned off) -> outlined until Publish.
          const changed = !sample.disabled !== isLive;
          const tag = sample.disabled ? (changed ? "Turning off" : "Disabled") : changed ? "New" : null;
          return (
            <div
              key={sample.url}
              className={`relative flex flex-wrap items-center gap-3 border bg-surface p-3 backdrop-blur-md hover:z-10 focus-within:z-10 ${
                changed ? "border-fg" : "border-border"
              }`}
            >
              <ClipName name={filenameOf(sample.pathname)} disabled={sample.disabled} onSave={(name) => rename(sample.url, name)} />
              {tag && <Tag>{tag}</Tag>}
              <audio controls src={sample.url} className={`h-8 max-w-full ${sample.disabled ? "opacity-50" : ""}`} />
              <IconButton
                icon={sample.disabled ? <Eye /> : <EyeOff />}
                label={sample.disabled ? "Enable clip" : "Disable clip"}
                onClick={() => toggleDisabled(sample.url, !sample.disabled)}
              />
              <DeleteButton label={`Delete ${filenameOf(sample.pathname)}`} onConfirm={() => remove(sample.url)} />
            </div>
          );
        })}
        {samples.length === 0 && <EmptyState>No samples uploaded yet.</EmptyState>}
      </div>
    </div>
  );
}

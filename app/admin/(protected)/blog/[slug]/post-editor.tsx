"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  importMarkdownPost,
  renamePost,
  savePost,
  type ImageCheckResult,
} from "@/lib/admin/actions";
import { slugify } from "@/lib/slug";
import { uploadImageToBlob } from "@/lib/admin/client-upload";
import { useRegisterDirty } from "@/components/admin/dirty-context";
import { Button } from "@/components/admin/ui/button";
import { Field, Input, Textarea } from "@/components/admin/ui/field";
import { AdminHeading, Panel } from "@/components/admin/ui/panel";
import { StickyBar } from "@/components/admin/ui/sticky-bar";
import { useSaveStatus } from "@/components/admin/ui/use-save-status";
import { AdminBackLink } from "@/components/admin/ui/back-link";
import { PostPreview } from "@/components/blog/post-preview";

interface PostFields {
  slug: string;
  title: string;
  date: string;
  description: string;
  body: string;
}

type ViewMode = "write" | "split" | "preview";
const VIEW_MODES: { value: ViewMode; label: string; className?: string }[] = [
  { value: "write", label: "Write" },
  { value: "split", label: "Split", className: "hidden lg:inline-flex" }, // side by side needs the width
  { value: "preview", label: "Preview" },
];

/** Same segmented-control look as the quotes size picker: sharp, one solid selected segment. */
function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div role="radiogroup" aria-label="Editor view" className="inline-flex border border-border-strong p-0.5">
      {VIEW_MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          role="radio"
          aria-checked={value === m.value}
          onClick={() => onChange(m.value)}
          className={`${m.className ?? "inline-flex"} min-h-9 items-center px-3 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 ${
            value === m.value ? "bg-fg text-bg" : "text-muted hover:text-fg"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

const RENAMING_MSG = "Wait for the slug rename or import to finish, then try again.";

export function PostEditor({
  initial,
  isNew,
}: {
  slug: string;
  initial: PostFields;
  isNew: boolean;
}) {
  const router = useRouter();
  const [fields, setFields] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const dirty = useMemo(() => JSON.stringify(fields) !== JSON.stringify(baseline), [fields, baseline]);
  useRegisterDirty(dirty);
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const [pending, startTransition] = useTransition();
  const status = useSaveStatus();
  const [slugError, setSlugError] = useState<string | null>(null);
  // Save draft upserts by slug, so it must not run while a rename is in flight (it would re-create the post under the old slug).
  const [renaming, setRenaming] = useState(false);
  // Rename and import both write the post under fields.slug, so they must never overlap (either order re-creates the old post).
  // A ref, not state: an import's FileReader callback runs after render and would otherwise read a stale value.
  const writing = useRef(false);
  const [pendingMd, setPendingMd] = useState<File | null>(null);
  const [imageChecks, setImageChecks] = useState<ImageCheckResult[] | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<ViewMode>("write");
  // Typing stays instant; the preview re-renders the markdown a beat behind it.
  const deferredBody = useDeferredValue(fields.body);

  function save() {
    void (async () => {
      const result = await status.run(() => savePost(fields));
      if (!result.ok) return;
      setBaseline(fields);
      if (isNew) router.replace(`/admin/blog/${fields.slug}`);
    })();
  }

  /**
   * Renames the post right away (its own action, not part of Save draft). The page URL is swapped with
   * history.replaceState rather than router.replace: a new [slug] param would remount the editor and drop unsaved edits.
   */
  function saveSlug(input: HTMLInputElement) {
    const next = slugify(input.value);
    if (next === fields.slug) {
      input.value = fields.slug;
      setSlugError(null);
      return;
    }
    if (writing.current) {
      input.value = fields.slug;
      return setSlugError("Wait for the import to finish, then rename.");
    }
    writing.current = true;
    setRenaming(true);
    void (async () => {
      const result = await status.run(() => renamePost(fields.slug, input.value));
      writing.current = false;
      setRenaming(false);
      if (!result.ok) {
        setSlugError(result.error);
        input.value = fields.slug;
        return;
      }
      const { slug: saved } = result.value as { slug: string };
      setFields((f) => ({ ...f, slug: saved }));
      setBaseline((b) => ({ ...b, slug: saved }));
      input.value = saved;
      setSlugError(null);
      window.history.replaceState(null, "", `/admin/blog/${saved}`);
    })();
  }

  function importMdFile(file: File) {
    if (writing.current) return setUploadError(RENAMING_MSG);
    writing.current = true;
    const reader = new FileReader();
    reader.onerror = () => {
      writing.current = false;
    };
    reader.onload = () => {
      const raw = String(reader.result);
      void (async () => {
        try {
          // importMarkdownPost already persists the post inside the action, so the
          // imported result is itself the new saved baseline, not a pending edit.
          const result = await status.run(() => importMarkdownPost(raw, fields.slug));
          if (!result.ok) return;
          const { post, imageChecks } = result.value as Exclude<typeof result.value, { error: string }>;
          setFields(post);
          setBaseline(post);
          setImageChecks(imageChecks);
        } finally {
          writing.current = false;
        }
      })();
    };
    reader.readAsText(file);
  }

  /** A .md file replaces the whole post (and saves it at once), so ask first when there is something to lose. */
  function handleFile(file: File) {
    // A rename is in flight: fields.slug is stale, so an import (upsert by slug) or an upload (blob prefix) would target the old post.
    if (renaming) return setUploadError(RENAMING_MSG);
    if (!file.name.endsWith(".md")) return uploadImage(file);
    if (fields.body.trim() || fields.title.trim()) setPendingMd(file);
    else importMdFile(file);
  }

  function uploadImage(file: File) {
    setUploadError(null);
    startTransition(async () => {
      try {
        const { url } = await uploadImageToBlob(file, `blog/${fields.slug}`);
        setFields((f) => ({ ...f, body: `${f.body}\n\n![${file.name}](${url})\n` }));
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <AdminBackLink href="/admin/blog" label="Back to thoughts" />
      <AdminHeading title={isNew ? "New Post" : fields.title || "Untitled"} />

      <Field label="Title">
        <Input value={fields.title} onChange={(e) => setFields({ ...fields, title: e.target.value })} />
      </Field>
      {!isNew && (
        <Field
          label="Slug (the /thoughts/… URL)"
          hint="Changes this post's URL once published; old links stop working. Saves as soon as you leave the field."
          error={slugError}
        >
          <Input
            key={fields.slug}
            className="font-mono"
            defaultValue={fields.slug}
            onChange={() => setSlugError(null)}
            onBlur={(e) => saveSlug(e.target)}
          />
        </Field>
      )}
      <Field label="Date">
        <Input type="date" value={fields.date} onChange={(e) => setFields({ ...fields, date: e.target.value })} />
      </Field>
      <Field label="Description">
        <Input value={fields.description} onChange={(e) => setFields({ ...fields, description: e.target.value })} />
      </Field>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload an image or import a markdown file"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), fileInputRef.current?.click())}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={`cursor-pointer border border-dashed p-4 text-center text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 ${
          dragOver ? "border-fg bg-fg/10" : "border-border-strong text-dim"
        }`}
      >
        {pending ? "Working…" : "Drop or click to add an image to the post, or import a .md file"}
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) handleFile(file);
          }}
        />
      </div>

      {pendingMd && (
        <div role="alert" className="flex flex-wrap items-center gap-3 border border-border-strong p-3">
          <p className="mr-auto text-sm text-fg">Importing {pendingMd.name} replaces this post&rsquo;s fields and saves it right away.</p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              const f = pendingMd;
              setPendingMd(null);
              importMdFile(f);
            }}
          >
            Replace post
          </Button>
          <Button size="sm" onClick={() => setPendingMd(null)}>
            Cancel
          </Button>
        </div>
      )}

      {uploadError && <p role="alert" className="text-base text-danger">{uploadError}</p>}

      {imageChecks && imageChecks.length > 0 && (
        <Panel inset className="space-y-1 text-base">
          <p className="text-dim">Image references in the imported markdown:</p>
          {imageChecks.map((check, i) => (
            <div key={i}>
              {check.status === "ok" && <span className="text-fg">✓ {check.referencedPath}</span>}
              {check.status === "suggested" && (
                <span className="text-muted">
                  ~ {check.referencedPath} — closest uploaded match: {check.suggestion} (
                  {Math.round((check.score ?? 0) * 100)}%). Upload the right image or fix the path.
                </span>
              )}
              {check.status === "missing" && (
                <span className="text-danger">✗ {check.referencedPath} — no uploaded match found</span>
              )}
            </div>
          ))}
        </Panel>
      )}

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="post-body" className="text-base text-dim">
            Body (markdown)
          </label>
          <ViewToggle value={view} onChange={setView} />
        </div>
        <div className={view === "split" ? "grid items-start gap-4 lg:grid-cols-2" : ""}>
          <Textarea
            id="post-body"
            className={`font-mono ${view === "preview" ? "hidden" : ""}`}
            rows={view === "split" ? 28 : 20}
            value={fields.body}
            onChange={(e) => setFields({ ...fields, body: e.target.value })}
          />
          {view !== "write" && (
            <div className="max-h-[70dvh] min-w-0 overflow-y-auto border border-border bg-surface p-5 backdrop-blur-md md:p-6 lg:sticky lg:top-24">
              <PostPreview title={fields.title} description={fields.description} date={fields.date} body={deferredBody} />
            </div>
          )}
        </div>
      </div>

      <StickyBar dirty={dirty} canSave={(dirty || isNew) && !renaming} onSave={save} state={status} />
    </div>
  );
}

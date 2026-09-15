"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deletePost,
  importMarkdownPost,
  savePost,
  uploadBlogImage,
  type ImageCheckResult,
} from "@/lib/admin/actions";
import { useRegisterDirty } from "@/components/admin/dirty-context";

interface PostFields {
  slug: string;
  title: string;
  date: string;
  description: string;
  body: string;
}

const inputClass =
  "w-full rounded border border-fg/20 bg-transparent px-2 py-1.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

export function PostEditor({
  slug,
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
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [imageChecks, setImageChecks] = useState<ImageCheckResult[] | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function save() {
    startTransition(async () => {
      await savePost(fields);
      setBaseline(fields);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      if (isNew) router.replace(`/admin/blog/${slug}`);
    });
  }

  function importMdFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result);
      startTransition(async () => {
        // importMarkdownPost already persists the post inside the action, so the
        // imported result is itself the new saved baseline, not a pending edit.
        const { post, imageChecks } = await importMarkdownPost(raw, slug);
        setFields(post);
        setBaseline(post);
        setImageChecks(imageChecks);
      });
    };
    reader.readAsText(file);
  }

  function uploadImage(file: File) {
    startTransition(async () => {
      const url = await uploadBlogImage(slug, file);
      setFields((f) => ({ ...f, body: `${f.body}\n\n![${file.name}](${url})\n` }));
    });
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl">{isNew ? "New post" : fields.title}</h1>
        {!isNew && (
          <button
            type="button"
            onClick={() => {
              if (confirm("Delete this post permanently?")) {
                startTransition(async () => {
                  await deletePost(slug);
                  router.push("/admin/blog");
                });
              }
            }}
            className="text-sm text-red-500"
          >
            Delete post
          </button>
        )}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm text-dim">Title</span>
        <input
          className={inputClass}
          value={fields.title}
          onChange={(e) => setFields({ ...fields, title: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-dim">Date</span>
        <input
          type="date"
          className={inputClass}
          value={fields.date}
          onChange={(e) => setFields({ ...fields, date: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-dim">Description</span>
        <input
          className={inputClass}
          value={fields.description}
          onChange={(e) => setFields({ ...fields, description: e.target.value })}
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
          const file = e.dataTransfer.files[0];
          if (!file) return;
          if (file.name.endsWith(".md")) importMdFile(file);
          else uploadImage(file);
        }}
        className={`rounded border-2 border-dashed p-4 text-center text-sm ${
          dragOver ? "border-fg bg-fg/5" : "border-fg/20 text-dim"
        }`}
      >
        Drop a .md file to import its content, or drop/click to upload an image into the post
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.name.endsWith(".md")) importMdFile(file);
            else uploadImage(file);
          }}
        />
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 underline"
          >
            choose a file
          </button>
        </div>
      </div>

      {imageChecks && imageChecks.length > 0 && (
        <div className="space-y-1 rounded border border-fg/10 p-3 text-sm">
          <p className="text-dim">Image references in the imported markdown:</p>
          {imageChecks.map((check, i) => (
            <div key={i}>
              {check.status === "ok" && <span className="text-green-500">✓ {check.referencedPath}</span>}
              {check.status === "suggested" && (
                <span className="text-yellow-500">
                  ~ {check.referencedPath} — closest uploaded match: {check.suggestion} (
                  {Math.round((check.score ?? 0) * 100)}%). Upload the right image or fix the path.
                </span>
              )}
              {check.status === "missing" && (
                <span className="text-red-500">✗ {check.referencedPath} — no uploaded match found</span>
              )}
            </div>
          ))}
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-sm text-dim">Body (markdown)</span>
        <textarea
          className={`${inputClass} font-mono`}
          rows={20}
          value={fields.body}
          onChange={(e) => setFields({ ...fields, body: e.target.value })}
        />
      </label>

      <div className="fixed bottom-0 left-0 right-0 border-t border-fg/10 bg-bg p-4">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="rounded bg-fg px-4 py-1.5 text-base text-bg disabled:opacity-50"
        >
          {pending ? "Saving..." : saved ? "Saved ✓" : "Save draft"}
        </button>
      </div>
    </div>
  );
}

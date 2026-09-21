"use client";

import { ICON_OPTIONS, resolveIcon } from "@/components/social-icon";
import { ResumeUploader } from "./resume-uploader";
import type { SocialLink } from "@/types/content";

const inputClass =
  "w-full rounded border border-border-strong bg-transparent px-2 py-1.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

/** These four are load-bearing: iconFor/email/resume special-casing all key off the label text, so renaming or deleting one would silently break the site. */
const LOCKED_IDS = new Set(["social-github", "social-linkedin", "social-email", "social-resume"]);

export function SocialEditor({
  items,
  onChange,
}: {
  items: SocialLink[];
  onChange: (items: SocialLink[]) => void;
}) {
  function update(id: string, patch: Partial<SocialLink>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function remove(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function addLink() {
    onChange([...items, { id: crypto.randomUUID(), label: "", href: "", display: "" }]);
  }

  return (
    <div className="space-y-4">
      <div className="grid items-start gap-5 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = resolveIcon(item);
          const locked = LOCKED_IDS.has(item.id);
          return (
            <div
              key={item.id}
              className="space-y-2 rounded-md border border-border bg-surface p-6 backdrop-blur-md"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                {locked ? (
                  <span className="flex-1 text-base text-fg">{item.label}</span>
                ) : (
                  <input
                    className={inputClass}
                    placeholder="Label"
                    value={item.label}
                    onChange={(e) => update(item.id, { label: e.target.value })}
                  />
                )}
                {!locked && (
                  <select
                    aria-label="Icon"
                    className="rounded border border-border-strong bg-transparent px-2 py-1 text-base"
                    value={item.icon ?? ""}
                    onChange={(e) => update(item.id, { icon: e.target.value || undefined })}
                  >
                    <option value="">Auto</option>
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {!locked && (
                <label className="block">
                  <span className="mb-1 block text-base text-dim">Tooltip (shown on hover)</span>
                  <input
                    className={inputClass}
                    placeholder={item.label || "Tooltip"}
                    value={item.tooltip ?? ""}
                    onChange={(e) => update(item.id, { tooltip: e.target.value || undefined })}
                  />
                </label>
              )}

              {item.label === "Email" ? (
                <input
                  type="email"
                  className={inputClass}
                  placeholder="you@example.com"
                  value={item.href.replace(/^mailto:/, "")}
                  onChange={(e) =>
                    update(item.id, { href: `mailto:${e.target.value}`, display: e.target.value })
                  }
                />
              ) : item.label === "Resume" ? (
                <ResumeUploader currentUrl={item.href} onUploaded={(url) => update(item.id, { href: url })} />
              ) : (
                <input
                  aria-label="URL"
                  className={inputClass}
                  placeholder="URL"
                  value={item.href}
                  onChange={(e) => update(item.id, { href: e.target.value })}
                />
              )}

              {!locked && (
                <button type="button" onClick={() => remove(item.id)} className="text-base text-red-500">
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button type="button" onClick={addLink} className="rounded border border-border-strong px-3 py-1.5 text-base">
        + Add link
      </button>
    </div>
  );
}

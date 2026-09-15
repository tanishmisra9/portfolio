"use client";

import { iconFor } from "@/components/social-icon";
import { ResumeUploader } from "./resume-uploader";
import type { SocialLink } from "@/types/content";

const inputClass =
  "w-full rounded border border-fg/20 bg-transparent px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

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
      <div className="grid gap-5 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = iconFor(item.label);
          return (
            <div
              key={item.id}
              className="space-y-2 rounded-md border border-border bg-surface p-6 backdrop-blur-md"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                <input
                  className={inputClass}
                  placeholder="Label"
                  value={item.label}
                  onChange={(e) => update(item.id, { label: e.target.value })}
                />
              </div>

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
                <>
                  <input
                    className={inputClass}
                    placeholder="URL"
                    value={item.href}
                    onChange={(e) => update(item.id, { href: e.target.value })}
                  />
                  <input
                    className={inputClass}
                    placeholder="Display text"
                    value={item.display}
                    onChange={(e) => update(item.id, { display: e.target.value })}
                  />
                </>
              )}

              <button type="button" onClick={() => remove(item.id)} className="text-xs text-red-500">
                Remove
              </button>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={addLink} className="rounded border border-fg/20 px-3 py-1.5 text-sm">
        + Add link
      </button>
    </div>
  );
}

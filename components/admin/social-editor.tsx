"use client";

import { ICON_OPTIONS, resolveIcon } from "@/components/social-icon";
import { Button } from "@/components/admin/ui/button";
import { DeleteButton } from "@/components/admin/ui/delete-button";
import { Field, Input, Select } from "@/components/admin/ui/field";
import { ResumeUploader } from "./resume-uploader";
import type { SocialLink } from "@/types/content";

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
              className="space-y-2 border border-border bg-surface p-4 backdrop-blur-md md:p-6"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                {locked ? (
                  <span className="flex-1 text-base text-fg">{item.label}</span>
                ) : (
                  <Input
                    placeholder="Label"
                    value={item.label}
                    onChange={(e) => update(item.id, { label: e.target.value })}
                  />
                )}
                {!locked && (
                  <Select
                    aria-label="Icon"
                    className="!w-auto"
                    value={item.icon ?? ""}
                    onChange={(e) => update(item.id, { icon: e.target.value || undefined })}
                  >
                    <option value="">Auto</option>
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              {!locked && (
                <Field label="Tooltip (shown on hover)">
                  <Input
                    placeholder={item.label || "Tooltip"}
                    value={item.tooltip ?? ""}
                    onChange={(e) => update(item.id, { tooltip: e.target.value || undefined })}
                  />
                </Field>
              )}

              {item.label === "Email" ? (
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={item.href.replace(/^mailto:/, "")}
                  onChange={(e) =>
                    update(item.id, { href: `mailto:${e.target.value}`, display: e.target.value })
                  }
                />
              ) : item.label === "Resume" ? (
                <ResumeUploader currentUrl={item.href} onUploaded={(url) => update(item.id, { href: url })} />
              ) : (
                <Input
                  aria-label="URL"
                  placeholder="URL"
                  value={item.href}
                  onChange={(e) => update(item.id, { href: e.target.value })}
                />
              )}

              {!locked && (
                <div className="flex justify-end">
                  <DeleteButton label={`Remove ${item.label || "link"}`} onConfirm={() => remove(item.id)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Button onClick={addLink}>+ Add link</Button>
    </div>
  );
}

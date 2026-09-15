"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FieldInput, type FieldDef, type Item } from "./array-editor";
import { EntryList } from "./entry-list";

const SINGLE_FIELDS: FieldDef[] = [
  { key: "issuer", label: "Issuer (aria-label only)", type: "text" },
  { key: "title", label: "Title", type: "text" },
  { key: "credentialUrl", label: "Credential URL", type: "text" },
  { key: "pills", label: "Pills", type: "tags" },
  { key: "skills", label: "Skills", type: "tags" },
];

const SERIES_FIELDS: FieldDef[] = [
  { key: "issuer", label: "Issuer (aria-label only)", type: "text" },
  { key: "title", label: "Title", type: "text" },
  { key: "pills", label: "Pills", type: "tags" },
  { key: "skills", label: "Skills", type: "tags" },
];

const COURSE_FIELDS: FieldDef[] = [
  { key: "title", label: "Course title", type: "text" },
  { key: "credentialUrl", label: "Credential URL", type: "text" },
];

/**
 * Certifications and course-series programs render different fields (a single cert has
 * `credentialUrl`; a series has `courses` instead) — explicit add buttons pick the shape
 * up front rather than inferring it from whether `courses` happens to be populated.
 */
export function CertificationsEditor({
  items,
  onChange,
}: {
  items: Item[];
  onChange: (items: Item[]) => void;
}) {
  // Every card defaults collapsed (existing cards can be long, especially a series with
  // several courses); a newly added one opens immediately so there's something to fill in.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function update(id: string, key: string, value: unknown) {
    onChange(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function remove(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function addSingle() {
    const item = { id: crypto.randomUUID(), issuer: "", title: "" };
    onChange([...items, item]);
    setExpanded((prev) => new Set(prev).add(item.id));
  }

  function addSeries() {
    const item = { id: crypto.randomUUID(), issuer: "", title: "", courses: [] };
    onChange([...items, item]);
    setExpanded((prev) => new Set(prev).add(item.id));
  }

  return (
    <div className="space-y-4">
      <div className="grid items-start gap-5 sm:grid-cols-2">
        {items.map((item) => {
          const isSeries = item.courses !== undefined;
          const fields = isSeries ? SERIES_FIELDS : SINGLE_FIELDS;
          const isOpen = expanded.has(item.id);
          const courseCount = Array.isArray(item.courses) ? item.courses.length : 0;
          const name = (item.title as string) || "Untitled";
          const label = isSeries && courseCount ? `${name} (${courseCount})` : name;

          return (
            <div key={item.id} className="space-y-2 rounded-md border border-border bg-surface p-6 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                  <span className="text-sm text-fg">{label}</span>
                </button>
                <button type="button" onClick={() => remove(item.id)} className="text-sm text-red-500">
                  Remove
                </button>
              </div>

              {isOpen && (
                <div className="space-y-2 pl-6">
                  {fields.map((field) => (
                    <FieldInput
                      key={field.key}
                      field={field}
                      value={item[field.key]}
                      onChange={(v) => update(item.id, field.key, v)}
                    />
                  ))}
                  {isSeries && (
                    <div>
                      <span className="mb-1 block text-sm text-dim">Courses</span>
                      <EntryList
                        nested
                        items={(item.courses as Item[]) ?? []}
                        onChange={(courses) => update(item.id, "courses", courses)}
                        newItem={() => ({ id: crypto.randomUUID(), title: "", credentialUrl: "" })}
                        summary={(c) => (c.title as string) || "Untitled course"}
                        fields={COURSE_FIELDS}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={addSingle} className="rounded border border-fg/20 px-3 py-1.5 text-base">
          + Add certification
        </button>
        <button type="button" onClick={addSeries} className="rounded border border-fg/20 px-3 py-1.5 text-base">
          + Add course series
        </button>
      </div>
    </div>
  );
}

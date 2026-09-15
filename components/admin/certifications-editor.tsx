"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FieldInput, type FieldDef, type Item } from "./array-editor";

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
  {
    key: "courses",
    label: "Courses",
    type: "sublist",
    subFields: [
      { key: "title", label: "Course title", type: "text" },
      { key: "credentialUrl", label: "Credential URL", type: "text" },
    ],
    newSubItem: () => ({ id: crypto.randomUUID(), title: "", credentialUrl: "" }),
  },
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
  // Course series default collapsed (they can hold many course rows and clutter the
  // grid); a newly added one is opened immediately so there's something to fill in.
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());

  function toggleSeries(id: string) {
    setExpandedSeries((prev) => {
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
    onChange([...items, { id: crypto.randomUUID(), issuer: "", title: "" }]);
  }

  function addSeries() {
    const item = { id: crypto.randomUUID(), issuer: "", title: "", courses: [] };
    onChange([...items, item]);
    setExpandedSeries((prev) => new Set(prev).add(item.id));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-5 sm:grid-cols-2">
        {items.map((item) => {
          const isSeries = item.courses !== undefined;
          const fields = isSeries ? SERIES_FIELDS : SINGLE_FIELDS;
          const isOpen = !isSeries || expandedSeries.has(item.id);
          const courseCount = Array.isArray(item.courses) ? item.courses.length : 0;

          return (
            <div key={item.id} className="space-y-2 rounded-md border border-border bg-surface p-6 backdrop-blur-md">
              {isSeries ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSeries(item.id)}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                    <span className="text-xs uppercase tracking-wide text-dim">
                      Course series{!isOpen && (item.title || item.issuer) ? ` — ${item.title || item.issuer} (${courseCount})` : ""}
                    </span>
                  </button>
                  <button type="button" onClick={() => remove(item.id)} className="text-xs text-red-500">
                    Remove
                  </button>
                </div>
              ) : (
                <p className="text-xs uppercase tracking-wide text-dim">Certification</p>
              )}

              {isOpen && (
                <>
                  {fields.map((field) => (
                    <FieldInput
                      key={field.key}
                      field={field}
                      value={item[field.key]}
                      onChange={(v) => update(item.id, field.key, v)}
                    />
                  ))}
                  {!isSeries && (
                    <button type="button" onClick={() => remove(item.id)} className="text-xs text-red-500">
                      Remove
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={addSingle} className="rounded border border-fg/20 px-3 py-1.5 text-sm">
          + Add certification
        </button>
        <button type="button" onClick={addSeries} className="rounded border border-fg/20 px-3 py-1.5 text-sm">
          + Add course series
        </button>
      </div>
    </div>
  );
}

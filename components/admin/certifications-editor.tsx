"use client";

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
    onChange([...items, { id: crypto.randomUUID(), issuer: "", title: "", courses: [] }]);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-5 sm:grid-cols-2">
        {items.map((item) => {
          const isSeries = item.courses !== undefined;
          const fields = isSeries ? SERIES_FIELDS : SINGLE_FIELDS;
          return (
            <div key={item.id} className="space-y-2 rounded-md border border-border bg-surface p-6 backdrop-blur-md">
              <p className="text-xs uppercase tracking-wide text-dim">
                {isSeries ? "Course series" : "Certification"}
              </p>
              {fields.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={item[field.key]}
                  onChange={(v) => update(item.id, field.key, v)}
                />
              ))}
              <button type="button" onClick={() => remove(item.id)} className="text-xs text-red-500">
                Remove
              </button>
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

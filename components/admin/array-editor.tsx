"use client";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "tags" | "select" | "sublist";
  /** "select" only. */
  options?: { value: string; label: string }[];
  /** "sublist" only — fields for each row of the nested array. */
  subFields?: FieldDef[];
  /** "sublist" only — factory for a new nested row. */
  newSubItem?: () => Item;
}

export type Item = Record<string, unknown> & { id: string };

interface ArrayEditorProps {
  items: Item[];
  fields: FieldDef[];
  onChange: (items: Item[]) => void;
  /** Omit to hide the built-in "+ Add" button — e.g. certifications renders two distinct add actions instead. */
  newItem?: () => Item;
  /** "cards" gives a 2-col bordered-card grid (skills/certifications/projects); "rows" (default) stacks entries. */
  layout?: "rows" | "cards";
  /** Internal — true when rendering a sublist one level deep, for tighter nested spacing. */
  nested?: boolean;
}

/** Generic add/edit/remove list editor, reused across every portfolio array section. */
export function ArrayEditor({
  items,
  fields,
  onChange,
  newItem,
  layout = "rows",
  nested = false,
}: ArrayEditorProps) {
  function updateItem(id: string, key: string, value: unknown) {
    onChange(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  const itemClassName = nested
    ? "space-y-2 rounded border border-fg/10 bg-fg/[0.02] p-3"
    : "space-y-2 rounded-md border border-border bg-surface p-6 backdrop-blur-md";

  return (
    <div className={layout === "cards" ? "space-y-4" : "space-y-3"}>
      <div className={layout === "cards" ? "grid items-start gap-5 sm:grid-cols-2" : "space-y-3"}>
        {items.map((item) => (
          <div key={item.id} className={itemClassName}>
            {fields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={item[field.key]}
                onChange={(v) => updateItem(item.id, field.key, v)}
              />
            ))}
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="text-sm text-red-500"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      {newItem && (
        <button
          type="button"
          onClick={() => onChange([...items, newItem()])}
          className="rounded border border-fg/20 px-3 py-1.5 text-base"
        >
          + Add
        </button>
      )}
    </div>
  );
}

export function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const base =
    "w-full rounded border border-fg/20 bg-transparent px-2 py-1 text-base outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

  if (field.type === "tags") {
    const list = Array.isArray(value) ? (value as string[]) : [];
    return (
      <label className="block">
        <span className="mb-1 block text-sm text-dim">{field.label} (comma-separated)</span>
        <input
          className={base}
          defaultValue={list.join(", ")}
          onBlur={(e) =>
            onChange(
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
        />
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="block">
        <span className="mb-1 block text-sm text-dim">{field.label}</span>
        <textarea
          className={base}
          rows={3}
          defaultValue={typeof value === "string" ? value : ""}
          onBlur={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="block">
        <span className="mb-1 block text-sm text-dim">{field.label}</span>
        <select
          className={base}
          defaultValue={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "sublist") {
    const list = Array.isArray(value) ? (value as Item[]) : [];
    return (
      <div>
        <span className="mb-1 block text-sm text-dim">{field.label}</span>
        <ArrayEditor
          items={list}
          fields={field.subFields ?? []}
          onChange={(next) => onChange(next)}
          newItem={field.newSubItem ?? (() => ({ id: crypto.randomUUID() }))}
          nested
        />
      </div>
    );
  }

  return (
    <label className="block">
      <span className="mb-1 block text-sm text-dim">{field.label}</span>
      <input
        className={base}
        defaultValue={typeof value === "string" ? value : ""}
        onBlur={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

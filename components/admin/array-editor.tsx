"use client";

interface FieldDef {
  key: string;
  label: string;
  /** "json" is the escape hatch for a nested sub-structure (e.g. pillRows, courses, links) — edited as raw JSON. */
  type: "text" | "textarea" | "tags" | "json";
}

interface ArrayEditorProps {
  items: Record<string, unknown>[];
  fields: FieldDef[];
  onChange: (items: Record<string, unknown>[]) => void;
  newItem: () => Record<string, unknown>;
}

/** Generic add/edit/remove list editor, reused across the portfolio's experience/education/skills/certifications/projects/social sections. */
export function ArrayEditor({ items, fields, onChange, newItem }: ArrayEditorProps) {
  function updateItem(index: number, key: string, value: unknown) {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded border border-fg/10 p-3">
          {fields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={item[field.key]}
              onChange={(v) => updateItem(index, field.key, v)}
            />
          ))}
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="text-xs text-red-500"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, newItem()])}
        className="rounded border border-fg/20 px-3 py-1.5 text-sm"
      >
        + Add
      </button>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const base =
    "w-full rounded border border-fg/20 bg-transparent px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

  if (field.type === "tags") {
    const list = Array.isArray(value) ? (value as string[]) : [];
    return (
      <label className="block">
        <span className="mb-1 block text-xs text-dim">{field.label} (comma-separated)</span>
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
        <span className="mb-1 block text-xs text-dim">{field.label}</span>
        <textarea
          className={base}
          rows={3}
          defaultValue={typeof value === "string" ? value : ""}
          onBlur={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }

  if (field.type === "json") {
    return (
      <label className="block">
        <span className="mb-1 block text-xs text-dim">{field.label} (advanced — raw JSON)</span>
        <textarea
          className={`${base} font-mono`}
          rows={3}
          defaultValue={value === undefined ? "" : JSON.stringify(value, null, 2)}
          onBlur={(e) => {
            if (!e.target.value.trim()) return onChange(undefined);
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              // leave the field as-typed; invalid JSON is caught on next successful edit
            }
          }}
        />
      </label>
    );
  }

  return (
    <label className="block">
      <span className="mb-1 block text-xs text-dim">{field.label}</span>
      <input
        className={base}
        defaultValue={typeof value === "string" ? value : ""}
        onBlur={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

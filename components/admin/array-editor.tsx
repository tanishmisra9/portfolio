"use client";

import { useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";

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
  /** Collapsible cards: a header (chevron + this label) toggles the fields; cards start closed and a new one opens. */
  cardLabel?: (item: Item) => string;
  /** With cardLabel: adds a hide/show eye toggle that sets `hidden` on the item. */
  hideToggle?: boolean;
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
  cardLabel,
  hideToggle,
  nested = false,
}: ArrayEditorProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addItem() {
    if (!newItem) return;
    const item = newItem();
    onChange([...items, item]);
    setExpanded((prev) => new Set(prev).add(item.id));
  }

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
        {items.map((item) => {
          if (cardLabel) {
            const isOpen = expanded.has(item.id);
            return (
              <div key={item.id} className={itemClassName}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggle(item.id)}
                    className="flex min-h-9 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
                  >
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                    <span className={`text-base text-fg ${item.hidden ? "opacity-60" : ""}`}>
                      {cardLabel(item) || "Untitled"}
                    </span>
                    {hideToggle && item.hidden ? (
                      <span className="rounded-full border border-border-strong px-2 py-0.5 text-base text-dim">Hidden</span>
                    ) : null}
                  </button>
                  {hideToggle && (
                    <button
                      type="button"
                      aria-pressed={Boolean(item.hidden)}
                      aria-label={item.hidden ? "Show on site" : "Hide from site"}
                      title={item.hidden ? "Show on site" : "Hide from site"}
                      onClick={() => {
                        const { hidden: _hidden, ...rest } = item;
                        onChange(items.map((i) => (i.id === item.id ? (item.hidden ? rest : { ...item, hidden: true }) : i)));
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded text-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
                    >
                      {item.hidden ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
                    </button>
                  )}
                  <button type="button" onClick={() => removeItem(item.id)} className="px-2 py-1 text-base text-red-500">
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
                        onChange={(v) => updateItem(item.id, field.key, v)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <div key={item.id} className={itemClassName}>
              {fields.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={item[field.key]}
                  onChange={(v) => updateItem(item.id, field.key, v)}
                />
              ))}
              <button type="button" onClick={() => removeItem(item.id)} className="text-base text-red-500">
                Remove
              </button>
            </div>
          );
        })}
      </div>
      {newItem && (
        <button
          type="button"
          onClick={addItem}
          className="rounded border border-border-strong px-3 py-1.5 text-base"
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
    "w-full rounded border border-border-strong bg-transparent px-2 py-1 text-base outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

  if (field.type === "tags") {
    const list = Array.isArray(value) ? (value as string[]) : [];
    return (
      <label className="block">
        <span className="mb-1 block text-base text-dim">{field.label} (comma-separated)</span>
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
        <span className="mb-1 block text-base text-dim">{field.label}</span>
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
        <span className="mb-1 block text-base text-dim">{field.label}</span>
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
        <span className="mb-1 block text-base text-dim">{field.label}</span>
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
      <span className="mb-1 block text-base text-dim">{field.label}</span>
      <input
        className={base}
        defaultValue={typeof value === "string" ? value : ""}
        onBlur={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

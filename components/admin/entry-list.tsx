"use client";

import { useState } from "react";
import { ReorderableList } from "./reorderable-list";
import { DateRangeFields } from "./date-range-fields";
import { FieldInput, type FieldDef, type Item } from "./array-editor";
import type { StartEndDate } from "@/types/content";

interface EntryListProps {
  items: Item[];
  fields: FieldDef[];
  onChange: (items: Item[]) => void;
  newItem: () => Item;
  /** One-line collapsed summary, e.g. "Org — Role — Jun 2023 – Present". */
  summary: (item: Item) => string;
  /** Experience/Education entries carry a start/end date pair edited as one unit. */
  hasDateRange?: boolean;
}

/**
 * Collapsed-by-default, drag-reorderable rows with an inline Edit toggle — used for
 * Experience/Education, where entries are numerous enough that showing every field for
 * every entry at once buries the ones you actually want to change.
 */
export function EntryList({ items, fields, onChange, newItem, summary, hasDateRange }: EntryListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function updateItem(id: string, key: string, value: unknown) {
    onChange(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function updateDateRange(id: string, value: StartEndDate) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...value } : item)));
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addItem() {
    const item = newItem();
    onChange([...items, item]);
    setExpanded((prev) => new Set(prev).add(item.id));
  }

  return (
    <div className="space-y-3">
      <ReorderableList
        items={items}
        onReorder={(ids) => onChange(ids.map((id) => items.find((i) => i.id === id)!))}
        renderItem={(item, dragProps) => (
          <div className="rounded-md border border-border bg-surface backdrop-blur-md">
            <div className="flex items-center gap-3 p-4">
              <span {...dragProps} className="cursor-grab text-dim" aria-hidden>
                ⠿
              </span>
              <span className="flex-1 truncate text-sm text-fg">{summary(item)}</span>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="text-xs underline decoration-fg/40 underline-offset-2"
              >
                {expanded.has(item.id) ? "Close" : "Edit"}
              </button>
              <button type="button" onClick={() => removeItem(item.id)} className="text-xs text-red-500">
                Remove
              </button>
            </div>
            {expanded.has(item.id) && (
              <div className="space-y-2 border-t border-border p-4">
                {hasDateRange && (
                  <DateRangeFields
                    value={{
                      startDate: item.startDate as string,
                      endDate: item.endDate as StartEndDate["endDate"],
                    }}
                    onChange={(v) => updateDateRange(item.id, v)}
                  />
                )}
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
        )}
      />
      <button type="button" onClick={addItem} className="rounded border border-fg/20 px-3 py-1.5 text-sm">
        + Add
      </button>
    </div>
  );
}

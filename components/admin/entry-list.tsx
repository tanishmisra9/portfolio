"use client";

import { GripVertical } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { DeleteButton } from "@/components/admin/ui/delete-button";
import { MoveButtons } from "@/components/admin/ui/move-buttons";
import { ReorderableList } from "./reorderable-list";
import { useExpandedSet, moveItem } from "./use-expanded-set";
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
  /** Lighter styling for a list nested inside another card (e.g. courses inside a certification). */
  nested?: boolean;
}

/**
 * Collapsed-by-default, drag-reorderable rows with an inline Edit toggle — used for
 * Experience/Education, where entries are numerous enough that showing every field for
 * every entry at once buries the ones you actually want to change.
 */
export function EntryList({ items, fields, onChange, newItem, summary, hasDateRange, nested }: EntryListProps) {
  const { expanded, toggle, expand } = useExpandedSet();

  function updateItem(id: string, key: string, value: unknown) {
    onChange(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function updateDateRange(id: string, value: StartEndDate) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...value } : item)));
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function move(id: string, toIndex: number) {
    onChange(moveItem(items, id, toIndex));
  }

  function addItem() {
    const item = newItem();
    onChange([...items, item]);
    expand(item.id);
  }

  return (
    <div className="space-y-3">
      <ReorderableList
        items={items}
        onReorder={(ids) => onChange(ids.map((id) => items.find((i) => i.id === id)!))}
        renderItem={(item, dragProps) => {
          const index = items.findIndex((i) => i.id === item.id);
          return (
          <div
            className={nested ? "border border-border" : "border border-border bg-surface backdrop-blur-md"}
          >
            <div className={`flex items-center gap-3 ${nested ? "p-3" : "p-4"}`}>
              <MoveButtons index={index} count={items.length} label={summary(item) || "item"} onMove={(d) => move(item.id, index + d)} />
              {/* draggable lives on this div, not the SVG — browsers don't honor draggable
                  on SVG elements, so the drag previously never started. */}
              <div
                {...dragProps}
                role="button"
                tabIndex={0}
                aria-label={`Reorder ${summary(item) || "item"}. Drag, or use arrow keys.`}
                onKeyDown={(e) => {
                  const index = items.findIndex((i) => i.id === item.id);
                  if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    move(item.id, index - 1);
                  } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                    e.preventDefault();
                    move(item.id, index + 1);
                  }
                }}
                className="flex h-9 w-7 shrink-0 cursor-grab items-center justify-center text-dim hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
              >
                <GripVertical className="h-5 w-5" aria-hidden />
              </div>
              <span className="flex-1 truncate text-base text-fg">{summary(item)}</span>
              <Button className="min-h-12" onClick={() => toggle(item.id)} aria-expanded={expanded.has(item.id)}>
                {expanded.has(item.id) ? "Close" : "Edit"}
              </Button>
              <DeleteButton label={`Remove ${summary(item) || "entry"}`} onConfirm={() => removeItem(item.id)} />
            </div>
            {expanded.has(item.id) && (
              <div
                className={`space-y-2 border-t border-border ${nested ? "p-3" : "p-4"}`}
              >
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
          );
        }}
      />
      <Button onClick={addItem}>+ Add</Button>
    </div>
  );
}

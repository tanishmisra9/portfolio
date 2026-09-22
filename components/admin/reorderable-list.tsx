"use client";

import { useEffect, useState, type ReactNode } from "react";
import type React from "react";

type ItemId = string | number;

interface ReorderableListProps<T extends { id: ItemId }> {
  items: T[];
  onReorder: (orderedIds: ItemId[]) => void;
  renderItem: (
    item: T,
    dragHandleProps: { draggable: true; onDragStart: (e: React.DragEvent) => void },
  ) => ReactNode;
}

/**
 * Native HTML5 drag-and-drop reordering — no dnd library needed for a plain vertical list.
 *
 * Only the id ORDER is local state; the items themselves always come fresh from props via
 * `itemsById`. An earlier version kept full item objects in state and only resynced them
 * when the id set changed, so any edit to an item's fields (not just add/remove) rendered
 * from a stale copy until the next reorder — e.g. editing a date then editing the paired
 * field would silently revert the first edit.
 */
export function ReorderableList<T extends { id: ItemId }>({
  items,
  onReorder,
  renderItem,
}: ReorderableListProps<T>) {
  const [order, setOrder] = useState<ItemId[]>(() => items.map((i) => i.id));
  const [draggingId, setDraggingId] = useState<ItemId | null>(null);
  const itemIds = items.map((i) => i.id).join(",");
  const itemsById = new Map(items.map((i) => [i.id, i]));

  // Resync local order when the parent's item set changes (add/remove), without
  // clobbering an in-progress drag reorder on every unrelated re-render.
  useEffect(() => {
    setOrder((current) => {
      if (current.join(",") === itemIds) return current;
      const stillPresent = current.filter((id) => items.some((i) => i.id === id));
      const added = items.filter((i) => !current.includes(i.id)).map((i) => i.id);
      return [...stillPresent, ...added];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIds]);

  function handleDrop(targetId: ItemId) {
    if (draggingId === null || draggingId === targetId) return;
    const next = [...order];
    const fromIndex = next.indexOf(draggingId);
    const toIndex = next.indexOf(targetId);
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setOrder(next);
    setDraggingId(null);
    onReorder(next);
  }

  return (
    <div className="space-y-2">
      {order.map((id) => {
        const item = itemsById.get(id);
        if (!item) return null;
        return (
          <div key={id} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(id)}>
            {renderItem(item, {
              draggable: true,
              // Firefox refuses to start a drag unless dataTransfer.setData is called.
              onDragStart: (e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(id));
                setDraggingId(id);
              },
            })}
          </div>
        );
      })}
    </div>
  );
}

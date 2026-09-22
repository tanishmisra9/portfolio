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

  // Resync local order whenever the parent's items change, without clobbering an
  // in-progress drag reorder on every unrelated re-render (drag already updates `order`
  // itself in handleDrop, synchronously ahead of the parent's items prop catching up).
  useEffect(() => {
    setOrder((current) => {
      if (current.join(",") === itemIds) return current;
      const currentIds = new Set(current);
      const nextIds = new Set(items.map((i) => i.id));
      const sameSet = current.length === items.length && current.every((id) => nextIds.has(id));
      if (sameSet) {
        // Same items, different order — a reorder that didn't go through this
        // component's own handleDrop (e.g. EntryList's arrow-key move, which updates
        // the parent's state directly). Adopt the parent's order rather than keeping
        // this component's now-stale one, which otherwise never picks up such a change.
        return items.map((i) => i.id);
      }
      const stillPresent = current.filter((id) => nextIds.has(id));
      const added = items.filter((i) => !currentIds.has(i.id)).map((i) => i.id);
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

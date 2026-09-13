"use client";

import { useEffect, useState, type ReactNode } from "react";

interface ReorderableListProps<T extends { id: number }> {
  items: T[];
  onReorder: (orderedIds: number[]) => void;
  renderItem: (item: T, dragHandleProps: { draggable: true; onDragStart: () => void }) => ReactNode;
}

/** Native HTML5 drag-and-drop reordering — no dnd library needed for a plain vertical list. */
export function ReorderableList<T extends { id: number }>({
  items,
  onReorder,
  renderItem,
}: ReorderableListProps<T>) {
  const [order, setOrder] = useState(items);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const itemIds = items.map((i) => i.id).join(",");

  // Resync local order when the parent's item set changes (add/remove), without
  // clobbering an in-progress drag reorder on every unrelated re-render.
  useEffect(() => {
    setOrder((current) => {
      if (current.map((i) => i.id).join(",") === itemIds) return current;
      const stillPresent = current.filter((c) => items.some((i) => i.id === c.id));
      const added = items.filter((i) => !current.some((c) => c.id === i.id));
      return [...stillPresent, ...added];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIds]);

  function handleDrop(targetId: number) {
    if (draggingId === null || draggingId === targetId) return;
    const next = [...order];
    const fromIndex = next.findIndex((i) => i.id === draggingId);
    const toIndex = next.findIndex((i) => i.id === targetId);
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setOrder(next);
    setDraggingId(null);
    onReorder(next.map((i) => i.id));
  }

  return (
    <div className="space-y-2">
      {order.map((item) => (
        <div
          key={item.id}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(item.id)}
        >
          {renderItem(item, {
            draggable: true,
            onDragStart: () => setDraggingId(item.id),
          })}
        </div>
      ))}
    </div>
  );
}

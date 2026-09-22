"use client";

import { useState } from "react";

/** Shared collapsed/expanded-by-id state — used by ArrayEditor's cards and EntryList's rows. */
export function useExpandedSet() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expand(id: string) {
    setExpanded((prev) => new Set(prev).add(id));
  }

  return { expanded, toggle, expand };
}

/** Shared array-move-by-id logic — used by ArrayEditor's and EntryList's drag/arrow-key reordering. */
export function moveItem<T extends { id: string }>(items: T[], id: string, toIndex: number): T[] {
  const from = items.findIndex((i) => i.id === id);
  if (from < 0 || toIndex < 0 || toIndex >= items.length || from === toIndex) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

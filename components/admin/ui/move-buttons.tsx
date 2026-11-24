"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

const BTN = "flex h-5 w-7 items-center justify-center text-dim transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 disabled:pointer-events-none disabled:opacity-30";
const noMouseFocus = (e: React.MouseEvent) => e.preventDefault();

/** Up/Down reorder buttons: drag-and-drop doesn't work on touch, and arrow keys need a keyboard. Sit next to the drag grip. */
export function MoveButtons({ index, count, label, onMove }: { index: number; count: number; label: string; onMove: (delta: -1 | 1) => void }) {
  return (
    <div className="flex shrink-0 flex-col">
      <button type="button" aria-label={`Move ${label} up`} disabled={index <= 0} onMouseDown={noMouseFocus} onClick={() => onMove(-1)} className={BTN}>
        <ChevronUp className="size-4" aria-hidden />
      </button>
      <button type="button" aria-label={`Move ${label} down`} disabled={index >= count - 1} onMouseDown={noMouseFocus} onClick={() => onMove(1)} className={BTN}>
        <ChevronDown className="size-4" aria-hidden />
      </button>
    </div>
  );
}

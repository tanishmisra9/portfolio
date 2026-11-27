"use client";

import { useId, useState, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { formatDateRange } from "@/lib/format-date-range";
import type { StartEndDate } from "@/types/content";

type Props = {
  dates: StartEndDate;
  title: string;
  subtitle: ReactNode;
  /** Shown when the row is open. Omit (or pass nothing) for a plain row with no toggle. */
  children?: ReactNode;
};

const DATE = "font-sans text-sm text-muted";
// items-start: a <button> centres its content vertically, which pushed the date below the title's line.
const GRID = "grid items-start gap-1 md:grid-cols-[25%_1fr_auto] md:gap-8";

/**
 * One Experience / Education entry as a compact row (date, title, subtitle) that opens to show its details.
 * The open/shut is the CSS grid-rows 0fr → 1fr transition (no height measuring, no Framer height:auto); a closed
 * panel is `inert`, so nothing inside it can be tabbed to or read out.
 */
export function ExpandableRow({ dates, title, subtitle, children }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const header = (
    <>
      <span className={`${DATE} md:pt-1`}>{formatDateRange(dates)}</span>
      <span className="min-w-0">
        <span className="block font-display text-xl font-semibold text-fg">{title}</span>
        <span className="mt-1 block text-muted">{subtitle}</span>
      </span>
    </>
  );

  if (!children) {
    return <div className={`${GRID} border-t border-border py-5`}>{header}</div>;
  }

  return (
    <div className="border-t border-border">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className={`group relative ${GRID} w-full py-5 pr-8 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 md:pr-0`}
      >
        {header}
        {/* Mobile: pinned top-right beside the title; desktop: its own column. */}
        <span
          aria-hidden
          className="absolute right-0 top-[3.1rem] text-dim transition-colors group-hover:text-fg md:static md:pr-2 md:pt-1.5"
        >
          {open ? <Minus className="h-4 w-4" strokeWidth={1.8} /> : <Plus className="h-4 w-4" strokeWidth={1.8} />}
        </span>
      </button>
      <div
        id={panelId}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-6 md:ml-[calc(25%+2rem)]">{children}</div>
        </div>
      </div>
    </div>
  );
}

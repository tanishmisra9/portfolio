"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { ADMIN_SECTION_HEADING_CLASSES } from "@/components/ui/class-constants";

/** Native <details>/<summary> — `open` is lifted to the parent so Expand/Collapse all can drive every section at once. */
export function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <details
      open={open}
      onToggle={(e) => onToggle(e.currentTarget.open)}
      className="border-b border-border py-6 first:pt-0"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
        <span className={ADMIN_SECTION_HEADING_CLASSES}>{title}</span>
      </summary>
      <div className="mt-6 pl-8">{children}</div>
    </details>
  );
}

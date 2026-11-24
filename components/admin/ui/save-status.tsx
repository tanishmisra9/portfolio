"use client";

import type { SaveState } from "./use-save-status";

/** The quiet status line: Saving… / Saved / Couldn't save — reason. The live region is always mounted so screen readers hear changes. */
export function SaveStatus({ state, className = "", failed = "Couldn’t save", done = "Saved" }: { state: Pick<SaveState, "status" | "error">; className?: string; failed?: string; done?: string }) {
  const { status, error } = state;
  return (
    <span role="status" aria-live="polite" className={`text-sm ${status === "error" ? "text-danger" : "text-dim"} ${className}`}>
      {status === "saving" ? "Saving…" : status === "saved" ? done : status === "error" ? `${failed} — ${error}` : ""}
    </span>
  );
}

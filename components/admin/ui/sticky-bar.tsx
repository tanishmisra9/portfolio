"use client";

import type { ReactNode } from "react";
import { Button } from "./button";
import { SaveStatus } from "./save-status";
import type { SaveState } from "./use-save-status";

/** Save bar for form pages: sticks to the viewport bottom inside the page column, so it never covers content or the nav. */
export function StickyBar({ dirty, onSave, state, label = "Save draft", canSave = dirty, extra }: { dirty: boolean; canSave?: boolean; onSave: () => void; state: SaveState; label?: string; extra?: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-40 -mx-6 mt-10 border-t border-border bg-bg/95 px-6 py-3 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {dirty && <span className="text-sm text-danger">Unsaved changes</span>}
          <SaveStatus state={state} />
          {extra}
        </div>
        <Button variant="primary" onClick={onSave} pending={state.status === "saving"} disabled={!canSave}>
          {label}
        </Button>
      </div>
    </div>
  );
}

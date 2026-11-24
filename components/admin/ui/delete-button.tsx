"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "./button";

const REVERT_MS = 4000;

/**
 * Two-step delete, no browser dialogs: a trash icon turns in place into "Delete? Yes / Cancel". Esc, Cancel or 4s of
 * inaction puts it back. (A 2-state latch, so it isn't in lib/state-machines.ts.)
 */
export function DeleteButton({ label, onConfirm, disabled }: { label: string; onConfirm: () => void; disabled?: boolean }) {
  const [armed, setArmed] = useState(false);
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!armed) return;
    box.current?.querySelector("button")?.focus();
    const t = setTimeout(() => setArmed(false), REVERT_MS);
    return () => clearTimeout(t);
  }, [armed]);

  if (!armed) {
    return <IconButton icon={<Trash2 />} label={label} disabled={disabled} onClick={() => setArmed(true)} className="shrink-0" />;
  }
  return (
    <span
      ref={box}
      role="group"
      aria-label={`Confirm: ${label}`}
      onKeyDown={(e) => e.key === "Escape" && setArmed(false)}
      className="inline-flex shrink-0 items-center gap-2"
    >
      <Button variant="danger" size="sm" onClick={() => { setArmed(false); onConfirm(); }}>
        Delete
      </Button>
      <Button size="sm" onClick={() => setArmed(false)}>
        Cancel
      </Button>
    </span>
  );
}

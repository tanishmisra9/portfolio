"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface DirtyChange {
  key: string;
  label: string;
}

interface DirtyState {
  dirty: boolean;
  setDirty: (v: boolean) => void;
  changes: DirtyChange[];
  setChanges: (v: DirtyChange[]) => void;
}

const DirtyContext = createContext<DirtyState | null>(null);

export function DirtyProvider({ children }: { children: ReactNode }) {
  const [dirty, setDirty] = useState(false);
  const [changes, setChanges] = useState<DirtyChange[]>([]);
  const value = useMemo(() => ({ dirty, setDirty, changes, setChanges }), [dirty, changes]);
  return <DirtyContext.Provider value={value}>{children}</DirtyContext.Provider>;
}

/** Editor pages (portfolio, blog posts) that buffer edits locally before an explicit
 * Save call this with their own dirty flag (and optionally which named sections changed),
 * so the header's Publish button can warn before publishing a draft that doesn't yet
 * include what's on screen, and link to where the changes are. */
export function useRegisterDirty(dirty: boolean, changes: DirtyChange[] = []) {
  const ctx = useContext(DirtyContext);
  const setDirty = ctx?.setDirty;
  const setChanges = ctx?.setChanges;
  const changesKey = changes.map((c) => c.key).join(",");
  // Depends on the (stable) setters, not the context value — the value changes whenever this
  // effect sets state, which would otherwise re-run the effect forever.
  useEffect(() => {
    setDirty?.(dirty);
    setChanges?.(changes);
    return () => {
      setDirty?.(false);
      setChanges?.([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, changesKey, setDirty, setChanges]);
}

export function useAdminDirty() {
  const ctx = useContext(DirtyContext);
  return { dirty: ctx?.dirty ?? false, changes: ctx?.changes ?? [] };
}

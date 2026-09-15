"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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
  return (
    <DirtyContext.Provider value={{ dirty, setDirty, changes, setChanges }}>{children}</DirtyContext.Provider>
  );
}

/** Editor pages (portfolio, blog posts) that buffer edits locally before an explicit
 * Save call this with their own dirty flag (and optionally which named sections changed),
 * so the header's Publish button can warn before publishing a draft that doesn't yet
 * include what's on screen, and link to where the changes are. */
export function useRegisterDirty(dirty: boolean, changes: DirtyChange[] = []) {
  const ctx = useContext(DirtyContext);
  const changesKey = changes.map((c) => c.key).join(",");
  useEffect(() => {
    ctx?.setDirty(dirty);
    ctx?.setChanges(changes);
    return () => {
      ctx?.setDirty(false);
      ctx?.setChanges([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, changesKey, ctx]);
}

export function useAdminDirty() {
  const ctx = useContext(DirtyContext);
  return { dirty: ctx?.dirty ?? false, changes: ctx?.changes ?? [] };
}

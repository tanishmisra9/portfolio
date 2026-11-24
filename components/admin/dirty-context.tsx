"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface DirtyState {
  dirty: boolean;
  setDirty: (v: boolean) => void;
}

const DirtyContext = createContext<DirtyState | null>(null);

export function DirtyProvider({ children }: { children: ReactNode }) {
  const [dirty, setDirty] = useState(false);
  const value = useMemo(() => ({ dirty, setDirty }), [dirty]);
  return <DirtyContext.Provider value={value}>{children}</DirtyContext.Provider>;
}

/** Editor pages (a portfolio block, a blog post) that buffer edits locally before an explicit Save call this with their
 * own dirty flag, so the header can warn before leaving or publishing a draft that doesn't yet include what's on screen. */
export function useRegisterDirty(dirty: boolean) {
  const setDirty = useContext(DirtyContext)?.setDirty;
  // Depends on the (stable) setter, not the context value: the value changes whenever this effect sets state.
  useEffect(() => {
    setDirty?.(dirty);
    return () => setDirty?.(false);
  }, [dirty, setDirty]);
}

export function useAdminDirty() {
  return { dirty: useContext(DirtyContext)?.dirty ?? false };
}

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const DirtyContext = createContext<{ dirty: boolean; setDirty: (v: boolean) => void } | null>(null);

export function DirtyProvider({ children }: { children: ReactNode }) {
  const [dirty, setDirty] = useState(false);
  return <DirtyContext.Provider value={{ dirty, setDirty }}>{children}</DirtyContext.Provider>;
}

/** Editor pages (portfolio, blog posts) that buffer edits locally before an explicit
 * Save call this with their own dirty flag, so the header's Publish button can warn
 * before publishing a draft that doesn't yet include what's on screen. */
export function useRegisterDirty(dirty: boolean) {
  const ctx = useContext(DirtyContext);
  useEffect(() => {
    ctx?.setDirty(dirty);
    return () => ctx?.setDirty(false);
  }, [dirty, ctx]);
}

export function useAdminDirty() {
  return useContext(DirtyContext)?.dirty ?? false;
}

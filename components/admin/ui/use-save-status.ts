"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SAVE_STATUS, move, type SaveStatus } from "@/lib/state-machines";

/**
 * One save status for every admin writer (explicit Save bars and blur autosaves). `run(fn)` wraps a server action:
 * it reports saving -> saved (fades to idle after 2s) or error with the reason, and resolves `{ ok, value }` (a void action still says ok). A throw is an error, and so is a
 * returned `{ error: string }`. Overlapping runs are counted, so it only says "Saved" when the last one finishes.
 */
export function useSaveStatus() {
  const [view, setView] = useState<{ status: SaveStatus; error?: string }>({ status: "idle" });
  const statusRef = useRef<SaveStatus>("idle");
  const inflight = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const go = useCallback((to: SaveStatus, error?: string) => {
    statusRef.current = move(SAVE_STATUS, statusRef.current, to);
    setView({ status: statusRef.current, error });
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: string }> => {
      clearTimeout(timer.current);
      inflight.current++;
      if (statusRef.current !== "saving") go("saving");
      let failure: string | undefined;
      let result: T | undefined;
      try {
        result = await fn();
        const err = (result as { error?: unknown } | undefined)?.error;
        if (typeof err === "string") failure = err;
      } catch (e) {
        failure = e instanceof Error ? e.message : "Something went wrong";
      }
      inflight.current--;
      if (inflight.current === 0) {
        if (failure) go("error", failure);
        else {
          go("saved");
          timer.current = setTimeout(() => go("idle"), 2000);
        }
      }
      return failure !== undefined ? { ok: false, error: failure } : { ok: true, value: result as T };
    },
    [go],
  );

  return { ...view, run };
}

export type SaveState = ReturnType<typeof useSaveStatus>;

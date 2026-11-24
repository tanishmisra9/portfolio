"use client";

import { useEffect } from "react";

const HOLD_MS = 350;

/**
 * Touch feedback for HoverFill controls. On touch there is no hover, and :active lasts only as long as the finger is
 * down (~80ms for a tap), so the fill started rising and collapsed halfway. Instead a touch/pen press marks the link
 * `data-tapped`: the fill rises while pressed, holds for HOLD_MS after release (so a quick tap shows the whole fill),
 * then drops. Scrolling (pointercancel) clears it at once. Mice are ignored: they use :hover.
 */
export function TapFill() {
  useEffect(() => {
    let active: Element | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clear = () => {
      clearTimeout(timer);
      active?.removeAttribute("data-tapped");
      active = null;
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const el = (e.target as Element | null)?.closest?.("a, button, [role=button]");
      if (!el?.querySelector(":scope > [data-fill]")) return;
      clear();
      el.setAttribute("data-tapped", "");
      active = el;
    };
    const up = () => {
      clearTimeout(timer);
      timer = setTimeout(clear, HOLD_MS);
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointerup", up, true);
    document.addEventListener("pointercancel", clear, true);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointerup", up, true);
      document.removeEventListener("pointercancel", clear, true);
      clear();
    };
  }, []);
  return null;
}

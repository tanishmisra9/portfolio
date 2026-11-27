"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The Experience / Education "reading light" (`data-dim` on each `<li>`; style with `data-[dim]:` / `group-data-[dim]:`).
 * - Mouse (hover + fine pointer): nothing is dimmed at rest; hovering an entry lights it and dims the rest, and leaving
 *   the list undims everything. The owner wanted desktop to be in their control, not driven by scroll position.
 * - Touch: whichever entry crosses the middle band of the screen is lit, the others rest dimmed. An
 *   IntersectionObserver only, no scroll handler and no rAF (the iOS momentum-scroll lesson in app/photos/CLAUDE.md).
 *   The first entry is lit until another reaches the band; between entries the last one stays lit.
 * Without JS, or under reduced motion, nothing is ever dimmed.
 */
export function SpotlightList({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = ref.current;
    if (!list || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = [...list.children] as HTMLElement[];
    if (items.length < 2) return;
    let lit: Element | null = items[0];
    const paint = () => items.forEach((el) => el.toggleAttribute("data-dim", lit !== null && el !== lit));

    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      // Crossing the gap between entries fires nothing, so the last hovered entry stays lit until another or until
      // the pointer leaves the list.
      const enter = (e: PointerEvent) => {
        lit = e.currentTarget as Element;
        paint();
      };
      const leave = () => {
        lit = null;
        paint();
      };
      items.forEach((el) => el.addEventListener("pointerenter", enter));
      list.addEventListener("pointerleave", leave);
      return () => {
        items.forEach((el) => el.removeEventListener("pointerenter", enter));
        list.removeEventListener("pointerleave", leave);
        items.forEach((el) => el.removeAttribute("data-dim"));
      };
    }

    const inBand = new Map<Element, number>();
    paint();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) inBand.set(e.target, e.isIntersecting ? e.intersectionRect.height : 0);
        let best = 0;
        let next: Element | null = null;
        for (const [el, h] of inBand) if (h > best) [best, next] = [h, el];
        if (next && next !== lit) {
          lit = next;
          paint();
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      items.forEach((el) => el.removeAttribute("data-dim"));
    };
  }, []);

  return (
    <ol ref={ref} className={className}>
      {children}
    </ol>
  );
}

/** Classes for each `<li>` in a SpotlightList: the whole entry dims; mark tag rows with SPOTLIGHT_TAGS to hide them. */
export const SPOTLIGHT_ITEM = "group/spot transition-opacity duration-500 ease-out data-[dim]:opacity-30";
export const SPOTLIGHT_TAGS = "transition-opacity duration-500 ease-out group-data-[dim]/spot:opacity-0";

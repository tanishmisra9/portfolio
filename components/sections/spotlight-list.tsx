"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The Experience / Education reading light, touch only (`data-dim` on each `<li>`; styles in entry-style.tsx):
 * whichever entry crosses the middle band of the screen is lit, the others rest dimmed. An IntersectionObserver only,
 * no scroll handler and no rAF (the iOS momentum-scroll lesson in app/photos/CLAUDE.md). The first entry is lit until
 * another reaches the band; between entries the last one stays lit.
 * Mouse devices get no dimming at all (the owner rejected it on desktop, scroll- or hover-driven); they get the entry
 * hover instead (ENTRY_ITEM / EntryTitle). Without JS, or under reduced motion, nothing is ever dimmed.
 */
export function SpotlightList({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = ref.current;
    if (!list || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const items = [...list.children] as HTMLElement[];
    if (items.length < 2) return;
    let lit: Element = items[0];
    const paint = () => items.forEach((el) => el.toggleAttribute("data-dim", el !== lit));
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

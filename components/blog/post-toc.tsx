"use client";

import { useEffect, useState } from "react";
import type { PostHeading } from "@/lib/post-headings";

/* "On this page" nav, xl+ only. The active entry is the last heading that has scrolled above ~35% of the viewport.
   The 7rem top margin matches the sticky 5rem header plus the headings' scroll-mt-28. */
export function PostToc({ headings }: { headings: PostHeading[] }) {
  const [active, setActive] = useState(headings[0]?.id);

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-112px 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [headings]);

  return (
    <nav aria-label="On this page" className="sticky top-28 hidden max-h-[calc(100vh-8rem)] self-start overflow-y-auto xl:block">
      <p className="mb-3 text-sm text-dim">On this page</p>
      <ul className="border-l border-border">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onMouseDown={(e) => e.preventDefault()}
              aria-current={active === h.id ? "location" : undefined}
              className={`-ml-px block border-l-2 py-1.5 text-sm leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 ${
                ["pl-4", "pl-7", "pl-10"][h.depth]
              } ${active === h.id ? "border-fg text-fg" : "border-transparent text-dim hover:text-fg"}`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

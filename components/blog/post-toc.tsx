"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { PostHeading } from "@/lib/post-headings";

/* Below xl, where PostToc is hidden: a native <select>, so phones open their own picker (iOS's menu, Android's sheet).
   Options can't be padded on iOS, so depth is shown with non-breaking spaces. The value snaps back to "" so the box
   keeps reading "Jump to…" and the same section can be picked twice. */
export function PostJump({ headings }: { headings: PostHeading[] }) {
  return (
    <div className="relative xl:hidden">
      <select
        aria-label="Jump to section"
        value=""
        onChange={(e) => {
          const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          document.getElementById(e.target.value)?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
        }}
        className="w-full cursor-pointer appearance-none rounded-none border border-border bg-bg py-3 pl-4 pr-11 text-sm text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
      >
        <option value="" disabled>
          Jump to…
        </option>
        {headings.map((h) => (
          <option key={h.id} value={h.id}>
            {"   ".repeat(h.depth) + h.text}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

/* "On this page" nav, xl+ only. A section is current once its heading is well inside the viewport (top above
   LINE_FRACTION of the height), not when it is about to scroll off under the sticky header. A clicked entry lands at
   7rem (scroll-mt-28), which is above this line, so it is active on arrival. */
const LINE_FRACTION = 0.55;

export function PostToc({ headings }: { headings: PostHeading[] }) {
  const [active, setActive] = useState<string>();

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => !!el);
    let raf = 0;
    const update = () => {
      raf = 0;
      // Active = last heading whose top has crossed the line (derived from scroll position,
      // so it is right in both scroll directions, unlike an IntersectionObserver that only fires on band crossings).
      let id: string | undefined; // none until the first heading is reached
      for (const el of els) if (el.getBoundingClientRect().top <= window.innerHeight * LINE_FRACTION) id = el.id;
      setActive(id);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useHomeIntroDone } from "@/components/home-intro-gate";
import { ScrollReveal } from "@/components/scroll-reveal";
import { PILL_CLASSES, SECTION_HEADING_CLASSES } from "@/components/ui/class-constants";
import { formatDateRange } from "@/lib/format-date-range";
import type { EducationEntry, ExperienceEntry } from "@/types/content";

type Props = { experience: ExperienceEntry[]; education: EducationEntry[]; now: string };

/** One row: a role, or a school (a degree and a minor with the same school and dates share a row). */
type Item = {
  key: string;
  org: string;
  startDate: string;
  endDate: string | "present" | null;
  work: ExperienceEntry[];
  school: EducationEntry[];
};

/** Marker centre from the row's top: the middle of the mono date line (20px). */
const NODE_Y = 10;
const DRAW_STAGGER_MS = 80;

const TAG_CLASSES = `${PILL_CLASSES} font-sans text-[10px] uppercase tracking-widest`;
const COURSE_PILL_CLASSES =
  "rounded-none border border-border-strong bg-fg/[0.06] px-3 py-1 font-sans text-[10px] uppercase tracking-widest text-fg select-none cursor-default";

/** Newest start first. Built from the published data on every render, so adding or editing an entry in the admin re-sorts it. */
function buildItems(experience: ExperienceEntry[], education: EducationEntry[]): Item[] {
  const byKey = new Map<string, Item>();
  const add = (org: string, d: Pick<Item, "startDate" | "endDate">, w?: ExperienceEntry, s?: EducationEntry) => {
    const key = `${w ? "w" : "s"}|${org}|${d.startDate}|${d.endDate}`;
    const item = byKey.get(key) ?? { key, org, startDate: d.startDate, endDate: d.endDate, work: [], school: [] };
    if (w) item.work.push(w);
    if (s) item.school.push(s);
    byKey.set(key, item);
  };
  for (const e of experience) add(e.org, e, e);
  for (const e of education) add(e.institution, e, undefined, e);
  // Stable sort: entries starting the same month keep their admin order (work before school).
  return [...byKey.values()].sort((a, b) => (a.startDate === b.startDate ? 0 : a.startDate < b.startDate ? 1 : -1));
}

/**
 * Experience + Education as one timeline: a single line with a marker per entry, newest first. A filled marker is
 * something still going (end "present" or a future date). The line draws down once when the section first comes into
 * view (CSS transitions, not scroll-driven).
 */
export function TimelineSection({ experience, education, now }: Props) {
  const homeIntroDone = useHomeIntroDone();
  const items = useMemo(() => buildItems(experience, education), [experience, education]);
  const [drawn, setDrawn] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!homeIntroDone || drawn) return;
    const el = listRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [homeIntroDone, drawn]);

  if (items.length === 0) return null;

  return (
    <section id="experience" aria-labelledby="experience-heading" className="scroll-mt-20 px-6 pb-8 pt-5 md:pb-16 md:pt-20">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal variant="fade" homeIntroComplete={homeIntroDone}>
          <h2 id="experience-heading" tabIndex={0} className={SECTION_HEADING_CLASSES}>
            Timeline
          </h2>
        </ScrollReveal>
        <ol ref={listRef} data-drawn={drawn} className="group/tl mt-8">
          {items.map((item, i) => {
            const ongoing = item.endDate === "present" || (item.endDate !== null && item.endDate > now);
            const delay = `${i * DRAW_STAGGER_MS}ms`;
            return (
              <li key={item.key} className="relative grid grid-cols-[1.75rem_1fr] md:grid-cols-[2.5rem_1fr]">
                {/* The line runs from this marker to the next one. */}
                {i < items.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute left-[4px] w-px origin-top bg-fg/25 transition-transform duration-500 ease-out motion-safe:group-data-[drawn=false]/tl:scale-y-0"
                    style={{ top: NODE_Y, bottom: -NODE_Y, transitionDelay: delay }}
                  />
                ) : null}
                <span
                  aria-hidden
                  className={`absolute left-0 h-[9px] w-[9px] -translate-y-1/2 border-[1.5px] transition-transform duration-300 motion-safe:group-data-[drawn=false]/tl:scale-0 ${
                    ongoing ? "border-fg bg-fg" : "border-fg/50 bg-bg"
                  }`}
                  style={{ top: NODE_Y, transitionDelay: delay }}
                />
                <ScrollReveal className="col-start-2 pb-10 md:pb-12" homeIntroComplete={homeIntroDone}>
                  <Entry item={item} />
                </ScrollReveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function Entry({ item }: { item: Item }) {
  const activities = [...new Set(item.school.flatMap((e) => e.activities ?? []))];
  const coursework = [...new Set(item.school.flatMap((e) => e.coursework ?? []))];
  const tags = [...new Set(item.work.flatMap((e) => e.tags))];
  return (
    <div className="grid gap-1 md:grid-cols-[12rem_1fr] md:gap-8">
      <div className="font-mono text-sm uppercase leading-5 tracking-wider text-muted">{formatDateRange(item)}</div>
      <div>
        <p className="font-display text-xl font-semibold text-fg">{item.org}</p>
        {item.work.map((e) => (
          <div key={e.id}>
            <p className="mt-1 text-muted">{e.role}</p>
            {e.description ? <p className="mt-3 max-w-2xl text-muted">{e.description}</p> : null}
          </div>
        ))}
        {item.school.map((e) => (
          <p key={e.id} className="mt-1 text-muted">{e.credential}</p>
        ))}
        {tags.length ? (
          <ul className="mt-3 flex flex-wrap gap-2 md:mt-4">
            {tags.map((t) => (
              <li key={t} className={TAG_CLASSES}>{t}</li>
            ))}
          </ul>
        ) : null}
        {activities.length || coursework.length ? (
          <div className="mt-4 flex flex-col gap-2">
            {activities.length ? (
              <ul className="flex flex-wrap gap-2">
                {activities.map((a) => (
                  <li key={a} className={TAG_CLASSES}>{a}</li>
                ))}
              </ul>
            ) : null}
            {coursework.length ? (
              <ul className="flex flex-wrap gap-2">
                {coursework.map((c) => (
                  <li key={c} className={COURSE_PILL_CLASSES}>{c}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

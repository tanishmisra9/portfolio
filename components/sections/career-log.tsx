"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useHomeIntroDone } from "@/components/home-intro-gate";
import { ScrollReveal } from "@/components/scroll-reveal";
import { PILL_CLASSES, SECTION_HEADING_CLASSES } from "@/components/ui/class-constants";
import { formatDateRange } from "@/lib/format-date-range";
import { buildCareerGraph, type GraphItem, type GraphRow } from "@/lib/career-graph";
import type { EducationEntry, ExperienceEntry } from "@/types/content";

type Entry = { type: "work"; e: ExperienceEntry } | { type: "school"; e: EducationEntry };
type Item = GraphItem<Entry>;
type Row = GraphRow<Entry>;

type Props = { experience: ExperienceEntry[]; education: EducationEntry[]; now: string };

/** Node centre from the row's top: the middle of the first text line (the mono date, 20px line). */
const NODE_Y = 10;
/** Height of the trunk ↔ branch curve under a merge/fork node. */
const BAND = 28;
const DRAW_STAGGER_MS = 70;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const month = (d: string) => `${MONTHS[Number(d.slice(5)) - 1] ?? ""} ${d.slice(0, 4)}`;

const laneX = (lane: number) => `calc(var(--lane) * ${lane + 0.5})`;

const tagsOf = (item: Item) => item.entries.flatMap((x) => (x.type === "work" ? x.e.tags : []));

const TAG_CLASSES = `${PILL_CLASSES} !cursor-pointer font-sans text-[10px] uppercase tracking-widest transition-colors duration-200 hover:border-fg/30 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 aria-pressed:border-fg aria-pressed:bg-fg/[0.1] aria-pressed:text-fg`;
const ORG_PILL_CLASSES = `${PILL_CLASSES} font-sans text-[10px] uppercase tracking-widest`;
const COURSE_PILL_CLASSES =
  "rounded-none border border-border-strong bg-fg/[0.06] px-3 py-1 font-sans text-[10px] uppercase tracking-widest text-fg select-none cursor-default";

/**
 * Experience + Education as one commit graph, newest first (layout: lib/career-graph.ts, checked by
 * `npm run check:graph`). Hover a card (mouse) or focus inside it to light its branch; press a tag to `--grep`.
 * The lines draw once, row by row, when the section first comes into view: a CSS transition, not scroll-driven.
 */
export function CareerLog({ experience, education, now }: Props) {
  const homeIntroDone = useHomeIntroDone();
  const graph = useMemo(
    () =>
      buildCareerGraph<Entry>(
        [
          ...experience.map((e) => ({ kind: "work" as const, org: e.org, startDate: e.startDate, endDate: e.endDate, entry: { type: "work" as const, e } })),
          ...education.map((e) => ({ kind: "school" as const, org: e.institution, startDate: e.startDate, endDate: e.endDate, entry: { type: "school" as const, e } })),
        ],
        now,
      ),
    [experience, education, now],
  );
  const [hover, setHover] = useState<string | null>(null);
  const [grep, setGrep] = useState<string | null>(null);
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

  const matches = useMemo(() => {
    if (!grep) return null;
    const g = grep.toLowerCase();
    return new Set(graph.items.filter((it) => tagsOf(it).some((t) => t.toLowerCase() === g)).map((it) => it.key));
  }, [grep, graph.items]);
  // What's lit: the grep's matches, else the hovered branch, else everything.
  const lit = matches ?? (hover ? new Set([hover]) : null);
  const isLit = (key: string) => !lit || lit.has(key);

  if (graph.rows.length === 0) return null;

  const gutter: CSSProperties = { width: `calc(var(--lane) * ${graph.laneCount} + 0.75rem)` };

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="scroll-mt-20 px-6 pb-8 pt-5 md:pb-16 md:pt-20"
    >
      <div className="mx-auto max-w-6xl">
        <ScrollReveal variant="fade" homeIntroComplete={homeIntroDone}>
          <p className="font-mono text-sm text-dim" aria-live="polite">
            <span aria-hidden>$ </span>git log --graph
            {grep ? (
              <>
                {" "}
                <span className="text-fg">--grep=&quot;{grep}&quot;</span>
                <span> · {matches?.size ?? 0} {matches?.size === 1 ? "match" : "matches"} · </span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setGrep(null)}
                  className="text-muted underline underline-offset-4 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
                >
                  clear
                </button>
              </>
            ) : null}
          </p>
          <h2 id="experience-heading" tabIndex={0} className={SECTION_HEADING_CLASSES}>
            Timeline
          </h2>
        </ScrollReveal>

        <ol
          ref={listRef}
          data-drawn={drawn}
          className="group/log mt-6 text-fg/30 [--lane:14px] md:mt-8 md:[--lane:22px]"
        >
          {graph.rows.map((row, i) => (
            <LogRow
              key={row.item ? `${row.kind}-${row.item.key}` : "head"}
              row={row}
              index={i}
              gutter={gutter}
              laneCount={graph.laneCount}
              isLit={isLit}
              anyLit={!!lit}
              grep={grep}
              onGrep={(t) => setGrep((g) => (g === t ? null : t))}
              onHover={setHover}
              homeIntroDone={homeIntroDone}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

type RowProps = {
  row: Row;
  index: number;
  gutter: CSSProperties;
  laneCount: number;
  isLit: (key: string) => boolean;
  anyLit: boolean;
  grep: string | null;
  onGrep: (tag: string) => void;
  onHover: (key: string | null) => void;
  homeIntroDone: boolean;
};

/** Ink for one lane segment / node: full fg when lit by a hover or grep, faint when something else is. */
function ink(lit: boolean, anyLit: boolean) {
  return anyLit ? (lit ? "text-fg" : "text-fg/10") : "";
}

function LogRow({ row, index, gutter, laneCount, isLit, anyLit, grep, onGrep, onHover, homeIntroDone }: RowProps) {
  const item = row.item;
  const delay = { transitionDelay: `${index * DRAW_STAGGER_MS}ms` };
  const itemLit = item ? isLit(item.key) : true;
  const draw = "transition-transform duration-500 ease-out motion-safe:group-data-[drawn=false]/log:scale-y-0";

  const hoverProps = item
    ? {
        onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && onHover(item.key),
        onPointerLeave: (e: React.PointerEvent) => e.pointerType === "mouse" && onHover(null),
        onFocus: () => onHover(item.key),
        onBlur: () => onHover(null),
      }
    : {};

  const minH = row.kind === "end" || row.kind === "head" ? NODE_Y + BAND + 10 : undefined;

  return (
    <li className="relative flex" style={{ minHeight: minH }} {...hoverProps}>
      {/* Gutter: this row's slice of every lane. */}
      <div aria-hidden className="relative shrink-0" style={gutter}>
        {row.segs.map((s) => {
          const afterElbow = row.elbow?.dir === "merge" && s.lane === row.elbow.lane && s.part === "bottom";
          // The oldest row's trunk runs on past its fork so the first branch has something to join.
          const rootTrunk = s.key === "trunk" && s.part === "top" && row.elbow?.dir === "fork";
          const top = s.part === "bottom" ? NODE_Y + (afterElbow ? BAND : 0) : 0;
          const style: CSSProperties = {
            left: laneX(s.lane),
            top,
            ...(s.part === "top" ? { height: rootTrunk ? NODE_Y + BAND : NODE_Y } : { bottom: 0 }),
            ...delay,
          };
          return (
            <span
              key={`${s.key}-${s.part}`}
              data-seg={s.key}
              data-lane={s.lane}
              className={`absolute w-[1.5px] -translate-x-1/2 origin-top bg-current ${draw} ${ink(isLit(s.key), anyLit)}`}
              style={style}
            />
          );
        })}

        {row.elbow ? (
          <svg
            // Fades in rather than dash-drawing: with non-scaling-stroke the dash pattern is in screen pixels, so a
            // pathLength=1 dasharray rendered as a dotted line.
            className={`absolute left-0 overflow-visible transition-opacity duration-500 motion-safe:group-data-[drawn=false]/log:opacity-0 ${ink(itemLit, anyLit)}`}
            style={{ top: NODE_Y, height: BAND, width: `calc(var(--lane) * ${laneCount})`, ...delay }}
            viewBox={`0 0 ${laneCount} 1`}
            preserveAspectRatio="none"
          >
            <path
              d={
                row.elbow.dir === "merge"
                  ? `M0.5 0 C0.5 0.6 ${row.elbow.lane + 0.5} 0.4 ${row.elbow.lane + 0.5} 1`
                  : `M${row.elbow.lane + 0.5} 0 C${row.elbow.lane + 0.5} 0.6 0.5 0.4 0.5 1`
              }
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : null}

        {/* HEAD: a "now" rule across the running branches, and dashed stubs for expected ends. */}
        {row.kind === "head" ? (
          <>
            {row.segs.length > 1 ? (
              <span
                className="absolute h-px origin-left bg-current transition-transform duration-500 ease-out motion-safe:group-data-[drawn=false]/log:scale-x-0"
                style={{ left: laneX(0), top: NODE_Y, width: `calc(var(--lane) * ${Math.max(...row.segs.map((s) => s.lane))})` }}
              />
            ) : null}
            {row.future?.map((f) => (
              <span
                key={f.lane}
                className="absolute w-0 -translate-x-1/2 border-l-[1.5px] border-dashed border-current"
                style={{ left: laneX(f.lane), top: -6, height: NODE_Y + 6 }}
              />
            ))}
          </>
        ) : null}

        <Node row={row} index={index} lit={itemLit} anyLit={anyLit} />
      </div>

      {/* Content */}
      <div className={`min-w-0 flex-1 transition-opacity duration-300 ${anyLit && !itemLit ? "opacity-35" : ""} ${row.kind === "start" || row.kind === "point" ? "pb-10 md:pb-12" : "pb-4"}`}>
        {row.kind === "head" ? (
          <p className="font-mono text-sm leading-5 text-fg">
            HEAD <span className="text-dim">· now</span>
            {row.future?.length ? (
              <span className="block text-dim">
                {row.future.map((f) => `${f.org} · expected ${month(f.date)}`).join(" / ")}
              </span>
            ) : null}
          </p>
        ) : row.kind === "end" && item ? (
          <p className="font-mono text-sm leading-5 text-dim">
            <span className="uppercase tracking-wider">{month(row.date!)}</span> · wrapped up at {item.org}
          </p>
        ) : item ? (
          <ScrollReveal homeIntroComplete={homeIntroDone}>
            <Card item={item} grep={grep} onGrep={onGrep} />
          </ScrollReveal>
        ) : null}
      </div>
    </li>
  );
}

/** Sharp squares, like everything else in v2 (no round pills). Filled = work, hollow = school; merges and HEAD sit on the trunk. */
function Node({ row, index, lit, anyLit }: { row: Row; index: number; lit: boolean; anyLit: boolean }) {
  const school = row.item?.kind === "school";
  const size = row.kind === "head" ? 11 : row.kind === "end" ? 7 : 9;
  const hollow = row.kind === "head" || ((row.kind === "start" || row.kind === "point") && school);
  return (
    <span
      className={`absolute -translate-x-1/2 -translate-y-1/2 border-[1.5px] border-current transition-transform duration-300 motion-safe:group-data-[drawn=false]/log:scale-0 ${
        hollow ? "bg-bg" : "bg-current"
      } ${row.kind === "head" ? "text-fg" : ink(lit, anyLit) || "text-fg/60"}`}
      style={{ left: laneX(row.lane), top: NODE_Y, width: size, height: size, transitionDelay: `${index * DRAW_STAGGER_MS + 150}ms` }}
    />
  );
}

function Card({ item, grep, onGrep }: { item: Item; grep: string | null; onGrep: (t: string) => void }) {
  const first = item.entries[0];
  return (
    <div className="grid gap-1 md:grid-cols-[12rem_1fr] md:gap-8">
      <div className="font-mono text-sm uppercase leading-5 tracking-wider text-muted">
        {formatDateRange(item)}
      </div>
      <div>
        <p className="font-display text-xl font-semibold text-fg">{item.org}</p>
        {item.entries.map((x) =>
          x.type === "work" ? (
            <div key={x.e.id}>
              <p className="mt-1 text-muted">{x.e.role}</p>
              {x.e.description ? <p className="mt-3 max-w-2xl text-muted">{x.e.description}</p> : null}
            </div>
          ) : (
            <p key={x.e.id} className="mt-1 text-muted">{x.e.credential}</p>
          ),
        )}
        {first.type === "work" ? (
          <ul className="mt-3 flex flex-wrap gap-2 md:mt-4" aria-label={`Skills used at ${item.org}`}>
            {tagsOf(item).map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  aria-pressed={grep?.toLowerCase() === tag.toLowerCase()}
                  title={`Show everywhere I used ${tag}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onGrep(tag)}
                  className={TAG_CLASSES}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <SchoolPills item={item} />
        )}
      </div>
    </div>
  );
}

function SchoolPills({ item }: { item: Item }) {
  const activities = [...new Set(item.entries.flatMap((x) => (x.type === "school" ? x.e.activities ?? [] : [])))];
  const coursework = [...new Set(item.entries.flatMap((x) => (x.type === "school" ? x.e.coursework ?? [] : [])))];
  if (!activities.length && !coursework.length) return null;
  return (
    <div className="mt-4 flex flex-col gap-2">
      {activities.length ? (
        <ul className="flex flex-wrap gap-2">
          {activities.map((a) => (
            <li key={a} className={ORG_PILL_CLASSES}>{a}</li>
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
  );
}

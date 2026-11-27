/**
 * The home "Timeline" as a commit graph (components/sections/career-log.tsx): a trunk (lane 0), and one branch per role
 * or school that forks off the trunk where it starts and merges back where it ends; ongoing ones run up to HEAD.
 *
 * Rows are ordinal, like `git log --graph`, newest first: HEAD, then one row per event (an end, a start, or a point
 * date). Every row lists the lane segments that cross it, so the component draws each row on its own with no DOM
 * measurement. Pure and import-free so `scripts/check-career-graph.mjs` runs it on Node's TS stripping.
 *
 * Dates are "YYYY-MM" (compare as strings). `endDate`: "present" = ongoing, null = a single point, a date after `now` =
 * ongoing with an expected end (shown as a dashed stub above HEAD).
 */

export type GraphInput<E> = {
  kind: "work" | "school";
  org: string;
  startDate: string;
  endDate: string | "present" | null;
  entry: E;
};

/** Entries with the same kind, org and dates share one branch (e.g. a degree and a minor at the same school). */
export type GraphItem<E> = {
  key: string;
  kind: "work" | "school";
  org: string;
  startDate: string;
  endDate: string | "present" | null;
  entries: E[];
  /** 0 for points (on the trunk). */
  lane: number;
};

/** "top": from the row's top edge down to its node. "bottom": from its node (after the elbow, if any) to its bottom edge. */
export type Seg = {
  lane: number;
  part: "full" | "top" | "bottom";
  /** The owning item's key; "trunk" for lane 0. Lanes are reused over time, so highlighting goes by key, not lane. */
  key: string;
};

export type GraphRow<E> = {
  kind: "head" | "end" | "point" | "start";
  /** null for HEAD. */
  date: string | null;
  /** Lane the row's node sits on: the trunk for HEAD, merges (ends) and points; the branch for a start. */
  lane: number;
  item?: GraphItem<E>;
  segs: Seg[];
  /** Curve between the trunk and a branch, just below the node: "merge" trunk → branch (end), "fork" branch → trunk (start). */
  elbow?: { lane: number; dir: "merge" | "fork" };
  /** HEAD only: branches still running with an expected end after now. */
  future?: { lane: number; date: string; org: string }[];
};

export type CareerGraph<E> = { laneCount: number; rows: GraphRow<E>[]; items: GraphItem<E>[] };

// At equal dates: ends above points above starts, so two things that share a month (one ending, one starting) still
// overlap in rows and never share a lane.
const EVENT_ORDER = { end: 0, point: 1, start: 2 } as const;

export function buildCareerGraph<E>(inputs: GraphInput<E>[], now: string): CareerGraph<E> {
  const items: GraphItem<E>[] = [];
  const byKey = new Map<string, GraphItem<E>>();
  for (const i of inputs) {
    const key = `${i.kind}|${i.org}|${i.startDate}|${i.endDate}`;
    const found = byKey.get(key);
    if (found) found.entries.push(i.entry);
    else {
      const item: GraphItem<E> = { key, kind: i.kind, org: i.org, startDate: i.startDate, endDate: i.endDate, entries: [i.entry], lane: 0 };
      byKey.set(key, item);
      items.push(item);
    }
  }
  if (items.length === 0) return { laneCount: 0, rows: [], items };

  const ongoing = (it: GraphItem<E>) => it.endDate === "present" || (it.endDate !== null && it.endDate > now);

  type Ev = { kind: "end" | "point" | "start"; date: string; item: GraphItem<E>; order: number };
  const events: Ev[] = [];
  items.forEach((item, order) => {
    if (item.endDate === null) events.push({ kind: "point", date: item.startDate, item, order });
    else {
      if (!ongoing(item)) events.push({ kind: "end", date: item.endDate, item, order });
      events.push({ kind: "start", date: item.startDate, item, order });
    }
  });
  events.sort((a, b) =>
    a.date !== b.date ? (a.date < b.date ? 1 : -1) : EVENT_ORDER[a.kind] - EVENT_ORDER[b.kind] || a.order - b.order,
  );

  // Row span of each branch: from HEAD (ongoing) or its end row, down to its start row. Row 0 is HEAD.
  const top = new Map<GraphItem<E>, number>();
  const bottom = new Map<GraphItem<E>, number>();
  events.forEach((e, i) => {
    if (e.kind === "end") top.set(e.item, i + 1);
    if (e.kind === "start") bottom.set(e.item, i + 1);
  });
  const branches = items.filter((it) => it.endDate !== null);
  for (const b of branches) if (ongoing(b)) top.set(b, 0);

  // Lowest free lane above the trunk; a lane is free once its last branch ended on an earlier row.
  const laneBottom: number[] = [];
  const byTop = [...branches].sort((a, b) => top.get(a)! - top.get(b)! || items.indexOf(a) - items.indexOf(b));
  for (const b of byTop) {
    let lane = 1;
    while (laneBottom[lane] !== undefined && laneBottom[lane] >= top.get(b)!) lane++;
    b.lane = lane;
    laneBottom[lane] = bottom.get(b)!;
  }

  const rowCount = events.length + 1;
  const spans = [
    { lane: 0, top: 0, bottom: rowCount - 1, key: "trunk" },
    ...branches.map((b) => ({ lane: b.lane, top: top.get(b)!, bottom: bottom.get(b)!, key: b.key })),
  ];
  const segsAt = (r: number): Seg[] => {
    const segs: Seg[] = [];
    for (const s of spans) {
      if (s.top === s.bottom) continue;
      if (r > s.top && r < s.bottom) segs.push({ lane: s.lane, part: "full", key: s.key });
      else if (r === s.top) segs.push({ lane: s.lane, part: "bottom", key: s.key });
      else if (r === s.bottom) segs.push({ lane: s.lane, part: "top", key: s.key });
    }
    return segs.sort((a, b) => a.lane - b.lane);
  };

  const future = branches
    .filter((b) => b.endDate !== "present" && ongoing(b))
    .map((b) => ({ lane: b.lane, date: b.endDate as string, org: b.org }));
  const rows: GraphRow<E>[] = [{ kind: "head", date: null, lane: 0, segs: segsAt(0), ...(future.length ? { future } : {}) }];
  events.forEach((e, i) => {
    const row: GraphRow<E> = { kind: e.kind, date: e.date, lane: e.kind === "start" ? e.item.lane : 0, item: e.item, segs: segsAt(i + 1) };
    if (e.kind === "end") row.elbow = { lane: e.item.lane, dir: "merge" };
    if (e.kind === "start") row.elbow = { lane: e.item.lane, dir: "fork" };
    rows.push(row);
  });

  return { laneCount: Math.max(1, ...branches.map((b) => b.lane + 1)), rows, items };
}

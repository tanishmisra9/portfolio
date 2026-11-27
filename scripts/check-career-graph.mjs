#!/usr/bin/env node
// Checks the home Timeline's commit-graph layout (lib/career-graph.ts) on the live data shape and edge cases.
// Run: npm run check:graph   (needs Node's native TypeScript stripping, 22.18+)

import { buildCareerGraph } from "../lib/career-graph.ts";

let failures = 0;
function check(label, ok) {
  if (ok) console.log(`  ok  ${label}`);
  else {
    console.error(`FAIL  ${label}`);
    failures++;
  }
}

const w = (org, startDate, endDate) => ({ kind: "work", org, startDate, endDate, entry: org });
const s = (org, startDate, endDate, entry = org) => ({ kind: "school", org, startDate, endDate, entry });

// Months are inclusive: [start, end]; "present"/future = through now and beyond.
const endOf = (it, now) => (it.endDate === null ? it.startDate : it.endDate === "present" ? "9999-12" : it.endDate);
const overlap = (a, b, now) => a.startDate <= endOf(b, now) && b.startDate <= endOf(a, now);

function invariants(name, inputs, now, expect = {}) {
  console.log(name);
  const g = buildCareerGraph(inputs, now);
  const branches = g.items.filter((it) => it.endDate !== null);
  const points = g.items.filter((it) => it.endDate === null);

  // Rows: HEAD first, then one per event.
  if (inputs.length === 0) return check("no entries -> no rows", g.rows.length === 0);
  check("first row is HEAD", g.rows[0].kind === "head");

  for (let i = 0; i < branches.length; i++)
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i], b = branches[j];
      if (overlap(a, b, now)) check(`${a.org} / ${b.org} overlap in time -> different lanes`, a.lane !== b.lane);
    }
  check("branches never use the trunk", branches.every((b) => b.lane >= 1));
  check("points sit on the trunk", points.every((p) => p.lane === 0));

  for (const b of branches) {
    const startRow = g.rows.findIndex((r) => r.kind === "start" && r.item === b);
    const isOngoing = !g.rows.some((r) => r.kind === "end" && r.item === b);
    const topRow = isOngoing ? 0 : g.rows.findIndex((r) => r.kind === "end" && r.item === b);
    if (isOngoing) check(`${b.org} is ongoing -> its lane starts at HEAD`, g.rows[0].segs.some((x) => x.lane === b.lane && x.part === "bottom"));
    let contiguous = startRow > topRow;
    for (let r = topRow; r <= startRow; r++) {
      const want = r === topRow ? "bottom" : r === startRow ? "top" : "full";
      contiguous &&= g.rows[r].segs.some((x) => x.lane === b.lane && x.part === want);
    }
    check(`${b.org}: lane ${b.lane} drawn on every row from ${topRow} to ${startRow}`, contiguous);
    check(`${b.org}: start row is a fork from its own lane`, g.rows[startRow].lane === b.lane && g.rows[startRow].elbow?.dir === "fork");
  }
  check("no row draws one lane twice", g.rows.every((r) => new Set(r.segs.map((x) => x.lane)).size === r.segs.length));
  check("merges and points have their node on the trunk", g.rows.every((r) => (r.kind === "end" || r.kind === "point" ? r.lane === 0 : true)));
  check("laneCount covers every lane", g.laneCount > Math.max(0, ...branches.map((b) => b.lane)));
  if (expect.items !== undefined) check(`grouped into ${expect.items} items`, g.items.length === expect.items);
  if (expect.future !== undefined) check(`HEAD shows ${expect.future.length} future stub(s)`, JSON.stringify((g.rows[0].future ?? []).map((f) => f.date)) === JSON.stringify(expect.future));
  if (expect.lanes !== undefined) check(`uses ${expect.lanes} lanes`, g.laneCount === expect.lanes);
  return g;
}

const LIVE = [
  w("Toyota Motor North America", "2026-05", "2026-08"),
  w("The Data Mine", "2026-01", "present"),
  w("Purdue Electric Racing", "2025-08", "present"),
  w("Purdue Electric Vehicle Club", "2025-08", "present"),
  w("Q Spark Group", "2024-03", "2025-07"),
  w("Karen Dillard's College Prep", "2023-06", "2025-08"),
  s("Purdue University", "2025-08", "2028-12", "B.S."),
  s("Purdue University", "2025-08", "2028-12", "Minor"),
  s("Plano West Senior High School", "2025-05", null),
];
// Peak concurrency is Jun 2026: Toyota, Data Mine, PER, EVC, Purdue = 5 branches + trunk.
const live = invariants("live data", LIVE, "2026-11", { items: 8, future: ["2028-12"], lanes: 6 });
check("Purdue B.S. + minor share one branch", live.items.find((i) => i.org === "Purdue University").entries.length === 2);

invariants("no entries", [], "2026-11");
invariants("all finished", [w("A", "2020-01", "2021-01"), w("B", "2021-03", "2022-01")], "2026-11", { lanes: 2 });
invariants("only a point", [s("HS", "2025-05", null)], "2026-11", { lanes: 1 });
invariants("one ends the month another starts (they overlap)", [w("A", "2020-01", "2021-06"), w("B", "2021-06", "present")], "2026-11", { lanes: 3 });
invariants("same org, different dates are separate", [w("A", "2020-01", "2021-01"), w("A", "2022-01", "present")], "2026-11", { items: 2 });
invariants("a role that starts and ends in one month", [w("A", "2021-06", "2021-06"), w("B", "2020-01", "present")], "2026-11");
invariants("expected end in the past is finished", [s("U", "2020-01", "2024-05")], "2026-11", { future: [] });

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nall career-graph checks passed");

#!/usr/bin/env node
// Regression check for the UI state machines in lib/state-machines.ts.
// Tests the forbidden edges (not just the happy path) and that every writer goes through move().
//
// Run: npm run check:states   (needs a Node with native TypeScript stripping, 22.18+)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { move, ANIM_PHASE, HERO_PHASE, NYC_PHASE, UPLOAD_STATUS, AI_STATUS, SAVE_STATUS, HALF_PRESS, TITLE_PHASE } from "../lib/state-machines.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(ROOT, path), "utf8");

let failures = 0;
function check(label, ok) {
  if (ok) console.log(`  ok  ${label}`);
  else {
    console.error(`FAIL  ${label}`);
    failures++;
  }
}

// move() warns on a blocked edge; that's expected here, so keep the output readable.
console.warn = () => {};

const MACHINES = {
  ANIM_PHASE: { edges: ANIM_PHASE, allowed: ["idle>wipe", "wipe>flyout", "flyout>flyin", "flyin>settle", "settle>idle"], terminal: [] },
  HERO_PHASE: { edges: HERO_PHASE, allowed: ["idle>launch", "launch>bolt", "bolt>drive", "drive>enter", "enter>idle"], terminal: [] },
  NYC_PHASE: { edges: NYC_PHASE, allowed: ["idle>swap", "swap>hold"], terminal: ["hold"] },
  UPLOAD_STATUS: { edges: UPLOAD_STATUS, allowed: ["idle>uploading", "uploading>saving", "uploading>idle", "saving>idle"], terminal: [] },
  SAVE_STATUS: { edges: SAVE_STATUS, allowed: ["idle>saving", "saving>saved", "saving>error", "saved>idle", "saved>saving", "error>idle", "error>saving"], terminal: [] },
  AI_STATUS: { edges: AI_STATUS, allowed: ["generating>ready", "generating>failed"], terminal: ["ready", "failed"] },
  TITLE_PHASE: { edges: TITLE_PHASE, allowed: ["waiting>cycling", "waiting>still", "cycling>paused", "paused>cycling"], terminal: ["still"] },
  HALF_PRESS: { edges: HALF_PRESS, allowed: ["off>focusing", "focusing>locked", "focusing>off", "locked>off"], terminal: [] },
};

for (const [name, { edges, allowed, terminal }] of Object.entries(MACHINES)) {
  const states = Object.keys(edges);
  const actual = states.flatMap((from) => edges[from].map((to) => `${from}>${to}`));
  check(`${name}: edge list is exactly the intended one`, actual.length === allowed.length && allowed.every((e) => actual.includes(e)));
  check(`${name}: every edge target is a defined state`, actual.every((e) => states.includes(e.split(">")[1])));
  check(`${name}: terminal states are exactly [${terminal}]`, JSON.stringify(states.filter((s) => edges[s].length === 0)) === JSON.stringify(terminal));
  // Every ordered pair, including self-edges: allowed ones move, all others must stay put.
  for (const from of states) {
    for (const to of states) {
      const ok = allowed.includes(`${from}>${to}`);
      check(`${name}: ${from} -> ${to} ${ok ? "allowed" : "blocked"}`, move(edges, from, to) === (ok ? to : from));
    }
  }
}

// Every writer goes through move(): no raw phase/status writes in the components.
const noRaw = (file, re, what) => check(`${file}: ${what}`, !re.test(read(file)));
noRaw("components/photos/album-title.tsx", /setPhase\(\s*"/, 'no raw setPhase("...")');
noRaw("components/hero/use-pitstop.ts", /phaseRef\.current\s*=(?!=)(?!\s*move\()/, "phase only written via move()");
noRaw("components/photos/nyc-title.tsx", /setPhase\(\s*"/, 'no raw setPhase("...")');
noRaw("app/admin/(protected)/photos/photo-uploader.tsx", /aiStatus: "(ready|failed)"/, "no raw aiStatus ready/failed write");
noRaw("app/admin/(protected)/photos/photo-uploader.tsx", /setPending\([^)]*status:/, "no raw status write via setPending");
noRaw("components/quotes/quote-subtitle.tsx", /setPhase\(\s*"/, 'no raw setPhase("...")');
noRaw("components/photos/photos-header.tsx", /setHalf\(\s*"/, 'no raw setHalf("...")');
noRaw("components/admin/ui/use-save-status.ts", /statusRef\.current\s*=(?!=)(?!\s*move\()/, "status only written via move()");

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nall state-machine checks passed");

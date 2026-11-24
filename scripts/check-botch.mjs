// Guards the hand-kept link between the botched stop's visuals (components/hero/use-pitstop.ts) and the sounds baked
// into public/sfx/pitstop-botch.mp3 (scripts/pitstop-sfx/build_botch.py). Nothing else notices if only one side is edited:
// the tire would seat before/after its clack and the drive-off would miss the engine rev.
import { readFileSync, existsSync } from "node:fs";

const ts = readFileSync("components/hero/use-pitstop.ts", "utf8");
const py = readFileSync("scripts/pitstop-sfx/build_botch.py", "utf8");
let failed = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "  ok " : "FAIL "} ${name}${ok ? "" : "  " + detail}`);
  if (!ok) failed++;
};
const nums = (src) => [...src.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));

const shiftMs = Number(ts.match(/const BOTCH_SHIFT_MS = (\d+)/)?.[1]);
const shiftS = Number(py.match(/^SHIFT = ([\d.]+)/m)?.[1]);
check("BOTCH_SHIFT_MS matches SHIFT in build_botch.py", Math.round(shiftS * 1000) === shiftMs, `${shiftMs}ms vs ${shiftS}s`);

const track = [...ts.match(/const BOTCH_TRACK = \[([\s\S]*?)\] as const;/)[1].matchAll(/\[(\d+),\s*(\d+)\]/g)].map((m) => [+m[1], +m[2]]);
const segs = track.slice(1).map((p, i) => p[0] - track[i][0]);
check("every BOTCH_TRACK segment is >= 50ms (3 frames at 60fps)", Math.min(...segs) >= 50, `segments ${segs}`);
check("BOTCH_TRACK ends seated (0px)", track.at(-1)[1] === 0);

// the instants a tire lands (distance falls into a poke, or into home) are where the clip has its hits
const landings = track.filter(([, d], j) => j === 0 || d < track[j - 1][1]).map(([ms]) => ms);
const land = nums(py.match(/^LAND = \[([^\]]*)\]/m)[1]);
check("tire landings in BOTCH_TRACK == LAND in build_botch.py", JSON.stringify(landings) === JSON.stringify(land), `${landings} vs ${land}`);

const pieces = [...py.match(/^PIECES = \[([\s\S]*?)\n/m)[1].matchAll(/\((\d+),\s*(\d+)\)/g)].map((m) => [+m[1], +m[2]]);
check("gun pieces end where the clip's own burst resumes (1350 + SHIFT)", pieces.at(-1)[1] === 1350 + shiftMs, `${pieces.at(-1)[1]} vs ${1350 + shiftMs}`);
// every landing sits in a gap between pieces (so the clack cuts through), not on top of a piece
const onPiece = land.filter((t) => pieces.some(([a, b]) => t > a && t < b));
check("no failing landing falls inside a gun piece (the seat at the end does, by design)", onPiece.filter((t) => t !== land.at(-1)).length === 0, `inside a piece: ${onPiece}`);

check("public/sfx/pitstop-botch.mp3 exists", existsSync("public/sfx/pitstop-botch.mp3"));
if (failed) {
  console.log(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nall botch checks passed");

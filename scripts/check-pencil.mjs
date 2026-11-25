// Checks for the pencil engine's stroke model (lib/pencil/stroke.ts): the geometry the line and the sound read.
// Runs on Node's native TS stripping (22.18+): `npm run check:pencil`.
import assert from "node:assert/strict";
import { PENCIL } from "../lib/pencil/config.ts";
import { createStroke, resample, samplePath } from "../lib/pencil/stroke.ts";

const make = (d, base = 7) => createStroke(d, base, 1, PENCIL.line, PENCIL.sound);
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (±${tol})`);

// Path sampling follows the real curve: a cubic's sampled polyline ends at its end point and is longer than its chord.
{
  const pts = samplePath("M 0 0 C 0 100, 100 100, 100 0");
  assert.deepEqual(pts[0], [0, 0]);
  near(pts.at(-1)[0], 100, 1e-9, "cubic ends at its end x");
  near(pts.at(-1)[1], 0, 1e-9, "cubic ends at its end y");
  const q = samplePath("M 0 0 Q 50 100, 100 0");
  near(Math.max(...q.map((p) => p[1])), 50, 0.5, "quadratic peak");
}

// Resampling: evenly spaced and the arc length matches the summed polyline.
{
  const line = resample([[0, 0], [100, 0]], 2);
  assert.equal(line.length, 51);
  const s = make("M 0 0 L 100 0 L 100 60");
  near(s.length, 160, 0.01, "arc length of an L");
}

// Curvature on a sampled circle of radius 50 is about 1/50.
{
  const r = 50;
  const pts = Array.from({ length: 721 }, (_, k) => {
    const a = (k / 720) * 2 * Math.PI;
    return `${(r * Math.cos(a)).toFixed(3)} ${(r * Math.sin(a)).toFixed(3)}`;
  });
  const s = make(`M ${pts[0]} ${pts.slice(1).map((p) => `L ${p}`).join(" ")}`);
  const mid = s.tipAt(s.length / 2);
  near(Math.abs(mid.curvature), 1 / r, 0.002, "circle curvature");
}

// Direction: down = +1 on a vertical downstroke, −1 on an upstroke (screen y grows downward).
{
  near(make("M 0 0 L 0 200").tipAt(100).down, 1, 1e-6, "downstroke");
  near(make("M 0 200 L 0 0").tipAt(100).down, -1, 1e-6, "upstroke");
}

// Width: always within [min, max] × base, and heavier on a downstroke than an upstroke at equal speed.
{
  const base = 7;
  for (const d of ["M 0 0 L 0 300", "M 0 300 L 0 0", "M 0 0 C 0 200, 200 200, 200 0 Q 260 -80, 120 -40"]) {
    const s = make(d, base);
    for (const w of s.width) assert.ok(w >= PENCIL.line.min * base * PENCIL.line.taperMin - 1e-9 && w <= PENCIL.line.max * base + 1e-9, `width ${w} out of range`);
  }
  const down = make("M 0 0 L 0 300", base);
  const up = make("M 0 300 L 0 0", base);
  const at = (s) => s.width[Math.floor(s.width.length / 2)];
  assert.ok(at(down) > at(up), `downstroke ${at(down)} should be heavier than upstroke ${at(up)}`);
}

// Drawing: paths(len) grows monotonically with len and is empty at 0; the full draw covers every segment.
{
  const s = make("M 0 0 C 0 200, 200 200, 200 0");
  const segs = (len) => s.paths(len).reduce((n, p) => n + (p.d.match(/L/g) ?? []).length, 0);
  assert.equal(segs(0), 0);
  let prev = 0;
  for (let k = 1; k <= 20; k++) {
    const c = segs((s.length * k) / 20);
    assert.ok(c >= prev, `segments shrank at ${k}/20`);
    prev = c;
  }
  assert.equal(prev, s.pts.length - 1, "full draw covers every segment");
  assert.equal(s.paths(s.length).length, PENCIL.line.buckets);
}

// Sharp turns: an arrowhead-style reversal (down, then straight back up) is found; a gentle arc has none.
{
  const rev = make("M 0 0 L 0 200 L 6 120");
  assert.ok(rev.turns.length >= 1, "reversal not detected");
  near(rev.turns[0], 200, 30, "reversal position");
  assert.equal(make("M 0 0 Q 300 150, 600 0").turns.length, 0, "a gentle arc has no sharp turns");
}

console.log("check-pencil: ok");

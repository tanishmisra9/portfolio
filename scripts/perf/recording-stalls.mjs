// Stalls in an iPhone screen recording: frames where the page's content froze while the scroll kept moving.
// usage: node scripts/perf/recording-stalls.mjs <recording.mp4>   (needs ffmpeg + ffprobe)
//
// iOS draws the scrollbar off the page's thread, so it keeps moving when the page can't produce frames. A run of frames
// with frozen content while the scrollbar moves is the page stalling, not the finger pausing. The recording is constant
// frame rate (a repeated frame is a dropped one). Caveat: a pinned stage where nothing is scrubbed is legitimately still,
// so read the flagged times against the page.
import { execFileSync } from "node:child_process";

const file = process.argv[2];
if (!file) throw new Error("usage: node scripts/perf/recording-stalls.mjs <recording.mp4>");
const probe = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "csv=p=0", file]).toString().trim().split(",");
const [W, H] = [+probe[0], +probe[1]];
const fps = eval(probe[2]); // "60/1"
const raw = (vf) => execFileSync("ffmpeg", ["-v", "error", "-i", file, "-vf", `${vf},format=gray`, "-f", "rawvideo", "-"], { maxBuffer: 2 ** 31 });

// Content: the page minus the scrollbar column, the status bar and Safari's toolbar, downscaled.
const cw = Math.round(W * 0.94), cy = Math.round(H * 0.1), ch = Math.round(H * 0.77);
const [bw, bh] = [310, Math.round((310 * ch) / cw)];
const body = raw(`crop=${cw}:${ch}:0:${cy},scale=${bw}:${bh}`);
// Scrollbar: a strip at the right edge, full resolution.
const sx = Math.round(W * 0.977), sw = Math.round(W * 0.018), sy = Math.round(H * 0.04), sh = Math.round(H * 0.94);
const strip = raw(`crop=${sw}:${sh}:${sx}:${sy}`);

const nb = bw * bh, ns = sw * sh, N = Math.floor(body.length / nb);
const changed = [], bar = [];
for (let i = 0; i < N; i++) {
  if (i) { let c = 0; for (let k = 0; k < nb; k++) if (Math.abs(body[i * nb + k] - body[(i - 1) * nb + k]) > 12) c++; changed.push(c); }
  // The scrollbar: the mean row of high-contrast pixels in the strip (null when it's hidden).
  let s = 0, c = 0;
  for (let y = 0; y < sh; y++) {
    let mn = 255, mx = 0;
    for (let x = 0; x < sw; x++) { const v = strip[i * ns + y * sw + x]; if (v < mn) mn = v; if (v > mx) mx = v; }
    if (mx - mn > 40) { s += y; c++; }
  }
  bar.push(c > 20 ? s / c : null);
}
const FROZEN = 50; // fewer changed pixels than this is encoder noise: the page didn't update
const moving = (i) => bar[i] != null && bar[i - 1] != null && Math.abs(bar[i] - bar[i - 1]) >= 1;

let map = "";
for (let i = 1; i < N; i++) map += changed[i - 1] < FROZEN ? (moving(i) ? "x" : ".") : "o";
console.log(`${file}\n${W}x${H} @ ${fps} fps, ${N} frames. o = page updated, x = page frozen while scrolling, . = still\n`);
for (let s = 0; s < map.length; s += 60) console.log(`${(s / fps).toFixed(2).padStart(6)}s ${map.slice(s, s + 60)}`);

const runs = [...map.matchAll(/x{3,}/g)].map((m) => ({ at: (m.index + 1) / fps, frames: m[0].length }));
const xs = (map.match(/x/g) ?? []).length, scrolling = xs + [...map].filter((c, k) => c === "o" && moving(k + 1)).length;
console.log(`\nstalls (>= 3 frozen frames while scrolling): ${runs.length}`);
for (const r of runs) console.log(`  ${r.at.toFixed(2)}s  ${r.frames} frames (${((r.frames / fps) * 1000).toFixed(0)} ms)`);
console.log(`frozen while scrolling: ${xs} of ${scrolling} scrolling frames (${((100 * xs) / Math.max(1, scrolling)).toFixed(1)}%)`);
console.log(runs.length ? "FAIL: the page stalled while scrolling" : "PASS: no stalls while scrolling");
process.exitCode = runs.length ? 1 : 0;

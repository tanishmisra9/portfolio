// Scroll cost down vs up, per section: iPhone 13, 6x CPU, 12px per frame. Also profiles the scripts that dominate
// on the way up in the intro, and counts what happens to the DOM/React while scrolling up.
import { chromium, devices } from "playwright";
const URL = process.env.URL ?? "http://localhost:3000/photos";
const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}) });
let ctx, page, cdp;
async function fresh() {
  if (ctx) await ctx.close();
  ctx = await b.newContext({ ...devices["iPhone 13"] });
  page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.touchscreen.tap(8, 600);
  cdp = await ctx.newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
}
const KEYS = ["ScriptDuration", "RecalcStyleDuration", "LayoutDuration", "TaskDuration", "LayoutCount", "RecalcStyleCount"];
const metrics = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
const sections = {
  intro: "section[aria-label='Why I take pictures']",
  note: "section[aria-labelledby='pencil-note']",
  collections: "#collections",
};
const step = (y) => page.evaluate((y) => new Promise((r) => { scrollTo({ top: y, behavior: "instant" }); requestAnimationFrame(() => requestAnimationFrame(() => r(performance.now()))); }), y);
const rows = [];
let profile = null;
for (const [name, sel] of Object.entries(sections)) {
  await fresh(); // same starting state in A and B: nothing drawn yet
  const [top, h] = await page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return [r.top + scrollY, r.height]; }, sel);
  const ys = [];
  for (let y = Math.max(0, top - 400); y < top + h; y += 12) ys.push(y);
  for (const dir of ["down", "up"]) {
    const seq = dir === "down" ? ys : [...ys].reverse();
    await step(seq[0]);
    await page.waitForTimeout(300);
    if (name === "intro" && dir === "up") {
      await cdp.send("Profiler.enable");
      await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
      await cdp.send("Profiler.start");
    }
    await page.evaluate(() => { window.__mut = 0; window.__obs = new MutationObserver((l) => (window.__mut += l.length)); window.__obs.observe(document.body, { subtree: true, attributes: true, childList: true, characterData: true }); });
    const m0 = await metrics();
    let t = await step(seq[0]);
    const gaps = [];
    for (const y of seq.slice(1)) { const t2 = await step(y); gaps.push(t2 - t); t = t2; }
    const m1 = await metrics();
    const mut = await page.evaluate(() => (window.__obs.disconnect(), window.__mut));
    if (name === "intro" && dir === "up") profile = (await cdp.send("Profiler.stop")).profile;
    const per = (k) => (((m1[k] - m0[k]) * (k.endsWith("Count") ? 1 : 1000)) * 100) / seq.length;
    rows.push({ name, dir, ...Object.fromEntries(KEYS.map((k) => [k, per(k)])), mutPer100: (mut * 100) / seq.length, p90gap: gaps.sort((a, b) => a - b)[Math.floor(gaps.length * 0.9)] });
  }
}
console.log("section     dir    script  style  layout   task   layouts styles  DOM-mutations   p90 frame-pair ms   (per 100 steps)");
for (const r of rows) console.log(`${r.name.padEnd(11)} ${r.dir.padEnd(5)} ${[r.ScriptDuration, r.RecalcStyleDuration, r.LayoutDuration, r.TaskDuration, r.LayoutCount, r.RecalcStyleCount, r.mutPer100, r.p90gap].map((v) => v.toFixed(1).padStart(7)).join(" ")}`);

// Top self-time functions while scrolling up through the intro.
const self = new Map();
const byId = new Map(profile.nodes.map((n) => [n.id, n]));
const dt = profile.timeDeltas;
profile.samples.forEach((id, i) => {
  const n = byId.get(id);
  const f = n.callFrame;
  const key = `${f.functionName || "(anon)"} ${f.url.split("/").slice(-1)[0].split("?")[0]}:${f.lineNumber + 1}`;
  self.set(key, (self.get(key) ?? 0) + (dt[i] ?? 0));
});
console.log("\nTop self time scrolling UP through the intro (ms):");
[...self.entries()].filter(([k]) => !k.startsWith("(idle)") && !k.startsWith("(program)")).sort((a, b) => b[1] - a[1]).slice(0, 18).forEach(([k, v]) => console.log(`  ${(v / 1000).toFixed(1).padStart(7)}  ${k}`));
await b.close();

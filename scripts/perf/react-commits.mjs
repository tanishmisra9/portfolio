// Which React components render while scrolling up through the intro (dev build: component names are intact).
// Counts, per component, the profiler samples where it is on the stack under a React render, plus commits per step.
import { chromium, devices } from "playwright";
const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}) });
const ctx = await b.newContext({ ...devices["iPhone 13"] });
const page = await ctx.newPage();
// Count React commits via the devtools hook React looks for at load.
await page.addInitScript(() => {
  window.__commits = 0;
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    isDisabled: false, supportsFiber: true, renderers: new Map(), inject() { return 1; },
    onCommitFiberRoot() { window.__commits++; }, onCommitFiberUnmount() {}, onPostCommitFiberRoot() {}, checkDCE() {},
  };
});
await page.goto(process.env.URL ?? "http://localhost:3000/photos", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.touchscreen.tap(8, 600);
const cdp = await ctx.newCDPSession(page);
const step = (y) => page.evaluate((y) => new Promise((r) => { scrollTo({ top: y, behavior: "instant" }); requestAnimationFrame(() => requestAnimationFrame(() => r())); }), y);
const [top, h] = await page.evaluate(() => { const r = document.querySelector("section[aria-label='Why I take pictures']").getBoundingClientRect(); return [r.top + scrollY, r.height]; });
const ys = [];
for (let y = top + h; y > top - 400; y -= 12) ys.push(y);
await step(ys[0]);
await page.waitForTimeout(300);
for (const dir of ["up", "down"]) {
  const seq = dir === "up" ? ys : [...ys].reverse();
  await step(seq[0]);
  await page.waitForTimeout(300);
  const c0 = await page.evaluate(() => window.__commits);
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.setSamplingInterval", { interval: 100 });
  await cdp.send("Profiler.start");
  for (const y of seq) await step(y);
  const { profile } = await cdp.send("Profiler.stop");
  const commits = (await page.evaluate(() => window.__commits)) - c0;
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const parent = new Map();
  for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
  const comp = new Map();
  for (const id of profile.samples) {
    const seen = new Set();
    for (let cur = id; cur !== undefined; cur = parent.get(cur)) {
      const fn = byId.get(cur).callFrame.functionName;
      if (/^[A-Z][A-Za-z0-9]+$/.test(fn) && !seen.has(fn)) { seen.add(fn); comp.set(fn, (comp.get(fn) ?? 0) + 1); }
    }
  }
  console.log(`${dir}: ${commits} React commits over ${seq.length} scroll steps`);
  console.log("  components on the stack (samples):", [...comp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `${k} ${v}`).join(", "));
}
await b.close();

// Paint / raster / GPU cost, scroll down vs up, per section (iPhone 13, 6x CPU, 12px per frame), from a Chrome trace.
import { chromium, devices } from "playwright";
const URL = process.env.URL ?? "http://localhost:3000/photos";
const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--enable-gpu-rasterization"] });
let ctx, page, cdp;
async function fresh() {
  if (ctx) await ctx.close();
  ctx = await b.newContext({ ...devices["iPhone 13"] });
  page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.touchscreen.tap(8, 600);
  cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
}
const sections = {
  intro: "section[aria-label='Why I take pictures']",
  note: "section[aria-labelledby='pencil-note']",
  collections: "[data-collection-grid]",
};
const step = (y) => page.evaluate((y) => new Promise((r) => { scrollTo({ top: y, behavior: "instant" }); requestAnimationFrame(() => requestAnimationFrame(() => r())); }), y);
const NAMES = ["Paint", "RasterTask", "GPUTask", "Layerize", "UpdateLayer", "PrePaint"];
async function traced(fn) {
  const events = [];
  cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
  await cdp.send("Tracing.start", { categories: "devtools.timeline,disabled-by-default-devtools.timeline,gpu,cc,viz", transferMode: "ReportEvents" });
  await fn();
  const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
  await cdp.send("Tracing.end");
  await done;
  const sum = Object.fromEntries(NAMES.map((n) => [n, 0]));
  for (const e of events) if (e.ph === "X" && e.name in sum) sum[e.name] += (e.dur ?? 0) / 1000;
  return sum;
}
console.log("section     dir    " + NAMES.map((n) => n.padStart(11)).join("") + "   (ms per 100 steps)");
for (const [name, sel] of Object.entries(sections)) {
  await fresh();
  const [top, h] = await page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return [r.top + scrollY, r.height]; }, sel);
  const ys = [];
  for (let y = Math.max(0, top - 400); y < top + h; y += 12) ys.push(y);
  for (const dir of ["down", "up"]) {
    const seq = dir === "down" ? ys : [...ys].reverse();
    await step(seq[0]);
    await page.waitForTimeout(300);
    const s = await traced(async () => { for (const y of seq) await step(y); });
    console.log(`${name.padEnd(11)} ${dir.padEnd(5)} ${NAMES.map((n) => ((s[n] * 100) / seq.length).toFixed(1).padStart(11)).join("")}`);
  }
}
await b.close();

// Cost of the glass nav's backdrop-blur, in HEADED Chromium (real GPU compositing renders backdrop-filter; headless
// doesn't). Traces GPU/viz work while scrolling the whole page down and up, with the blur on and forced off.
import { chromium } from "playwright";
const URL = process.env.URL ?? "http://localhost:3140/photos";
const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), headless: false, args: ["--window-size=1440,960"] });
const NAMES = ["GPUTask", "Paint", "RasterTask", "Graphics.Pipeline", "SkiaGraphite::Submit", "DirectRenderer::DrawFrame", "SkiaOutputSurfaceImplOnGpu::SwapBuffers"];
async function run(blur) { const radius = blur;
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  if (radius !== 12) await page.addStyleTag({ content: `[data-site-header] .backdrop-blur-md { backdrop-filter: ${radius ? `blur(${radius}px)` : "none"} !important; -webkit-backdrop-filter: ${radius ? `blur(${radius}px)` : "none"} !important; }` });
  await page.waitForTimeout(1500);
  const hasBlur = await page.evaluate(() => getComputedStyle(document.querySelector("[data-site-header] .backdrop-blur-md")).backdropFilter);
  const cdp = await ctx.newCDPSession(page);
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const step = (y) => page.evaluate((y) => new Promise((r) => { scrollTo({ top: y, behavior: "instant" }); requestAnimationFrame(() => requestAnimationFrame(() => r())); }), y);
  const events = [];
  cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
  await cdp.send("Tracing.start", { categories: "devtools.timeline,disabled-by-default-devtools.timeline,gpu,viz,cc", transferMode: "ReportEvents" });
  let steps = 0;
  for (let y = 0; y <= H; y += 24, steps++) await step(y);
  for (let y = H; y >= 0; y -= 24, steps++) await step(y);
  const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
  await cdp.send("Tracing.end");
  await done;
  const sum = {};
  for (const e of events) if (e.ph === "X" && NAMES.includes(e.name)) sum[e.name] = (sum[e.name] ?? 0) + (e.dur ?? 0) / 1000;
  await ctx.close();
  return { backdropFilter: hasBlur, perHundredSteps: Object.fromEntries(Object.entries(sum).map(([k, v]) => [k, +((v * 100) / steps).toFixed(1)])) };
}
for (const round of [1, 2]) for (const r of [12, 8, 4, 0]) { const x = await run(r); console.log(`round ${round} blur ${String(r).padStart(2)}px  pipeline ${x.perHundredSteps["Graphics.Pipeline"]}  drawFrame ${x.perHundredSteps["DirectRenderer::DrawFrame"]}  swap ${x.perHundredSteps["SkiaOutputSurfaceImplOnGpu::SwapBuffers"]}  (${x.backdropFilter})`); }
await b.close();

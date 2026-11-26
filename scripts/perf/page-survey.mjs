// Per-page load survey (iPhone 13, production): requests and bytes by type, LCP, and idle cost (CPU and rAF callbacks
// in 4 s with no input, after load settles). Idle work is a loop left running; it costs battery on every visit.
import { chromium, devices } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3000";
const PAGES = (process.env.PAGES ?? "/,/photos,/photos/campus,/thoughts,/thoughts/candle-v2,/quotes,/f1,/privacy").split(",");
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
for (const path of PAGES) {
  const ctx = await b.newContext(devices["iPhone 13"]);
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__raf = 0;
    const o = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => o((t) => { window.__raf++; cb(t); });
    window.__lcp = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  const bytes = {}, count = {}, urls = [];
  const type = {};
  cdp.on("Network.responseReceived", (e) => { type[e.requestId] = e.type; });
  cdp.on("Network.loadingFinished", (e) => {
    const t = type[e.requestId] ?? "Other";
    bytes[t] = (bytes[t] ?? 0) + e.encodedDataLength;
    count[t] = (count[t] ?? 0) + 1;
  });
  cdp.on("Network.requestWillBeSent", (e) => urls.push(e.request.url));
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await cdp.send("Performance.enable");
  const m = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
  const m0 = await m();
  const r0 = await page.evaluate(() => window.__raf);
  await page.waitForTimeout(4000);
  const m1 = await m();
  const r1 = await page.evaluate(() => window.__raf);
  const lcp = await page.evaluate(() => window.__lcp);
  const kb = (t) => ((bytes[t] ?? 0) / 1024).toFixed(0);
  const total = Object.values(bytes).reduce((a, c) => a + c, 0) / 1024;
  const media = urls.filter((u) => /\.(mp3|wav|ogg|m4a|mp4|webm)(\?|$)/.test(u)).map((u) => u.split("/").pop());
  console.log(`${path.padEnd(22)} req ${String(Object.values(count).reduce((a, c) => a + c, 0)).padStart(3)}  total ${total.toFixed(0).padStart(5)}kB  js ${kb("Script").padStart(4)} img ${kb("Image").padStart(5)} font ${kb("Font").padStart(4)} media ${kb("Media").padStart(4)} fetch ${kb("Fetch").padStart(4)}  LCP ${lcp.toFixed(0).padStart(5)}ms  idle4s: task ${((m1.TaskDuration - m0.TaskDuration) * 1000).toFixed(0).padStart(4)}ms raf ${r1 - r0}${media.length ? "  media: " + media.join(" ") : ""}`);
  await ctx.close();
}
await b.close();

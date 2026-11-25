// Fade-then-redraw behaviour of every pencil stroke on /photos (production build).
import { chromium, devices } from "playwright";
const URL = process.env.URL ?? "http://localhost:3140/photos";
const OUT = process.env.OUT ?? ".";
const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}) });
const failures = [];
const ok = (label, cond, extra = "") => { console.log(`${cond ? "  ok " : "FAIL "} ${label} ${extra}`); if (!cond) failures.push(label); };

for (const [name, opts] of [["desktop", { viewport: { width: 1440, height: 900 } }], ["iphone", devices["iPhone 13"]]]) {
  const ctx = await b.newContext(opts);
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript(() => {
    window.__press = 0;
    const W = window.AudioWorkletNode;
    window.AudioWorkletNode = class extends W {
      constructor(...a) {
        super(...a);
        const p = this.parameters.get("pressure"), set = AudioParam.prototype.setTargetAtTime;
        p.setTargetAtTime = (v, t, c) => (v > 0 && window.__press++, set.call(p, v, t, c));
      }
    };
  });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  if (name === "desktop") await page.mouse.click(8, 600); else await page.touchscreen.tap(8, 600);
  // Every stroke path: the intro arrow, the two circles, the note arrow.
  const read = () => page.evaluate(() => [...document.querySelectorAll("svg path")].filter((p) => p.closest("svg").classList.contains("overflow-visible") && p.getAttribute("pathLength")).map((p) => {
    const dash = parseFloat((p.getAttribute("stroke-dasharray") ?? "0").split(/[ ,]+/)[0]) || 0;
    return { drawn: +dash.toFixed(3), op: +(parseFloat(getComputedStyle(p).opacity) * parseFloat(getComputedStyle(p.closest("svg")).opacity)).toFixed(3) };
  }));
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const go = (y) => page.evaluate((y) => new Promise((r) => { scrollTo({ top: y, behavior: "instant" }); requestAnimationFrame(() => requestAnimationFrame(r)); }), y);
  const pass = async (from, to, stepPx) => {
    const samples = [];
    const dir = Math.sign(to - from);
    for (let y = from; dir > 0 ? y <= to : y >= to; y += dir * stepPx) { await go(y); samples.push({ y, strokes: await read(), press: await page.evaluate(() => window.__press) }); }
    return samples;
  };
  const down1 = await pass(0, H, 40);
  const n = down1.at(-1).strokes.length;
  ok(`${name}: ${n} strokes found`, n === 4);
  ok(`${name}: all fully drawn and opaque after scrolling down`, down1.at(-1).strokes.every((s) => s.drawn > 0.98 && s.op === 1), JSON.stringify(down1.at(-1).strokes));
  const up = await pass(H, 0, 40);
  for (let k = 0; k < n; k++) {
    const series = up.map((s) => s.strokes[k]);
    const ops = series.map((s) => s.op);
    // Before its reset, drawn never shrinks: a fade, never an un-draw.
    const resetAt = series.findIndex((s) => s.drawn < 0.01);
    const before = resetAt < 0 ? series : series.slice(0, resetAt);
    const undrew = before.some((s, i) => i && s.drawn < before[i - 1].drawn - 1e-6);
    const mids = ops.filter((o) => o > 0.15 && o < 0.85).length;
    ok(`${name} stroke ${k}: scrolling up fades it (no un-draw), through partial opacity, to gone, then resets`,
      !undrew && mids >= 1 && resetAt >= 0, `(mid-opacity samples ${mids}, reset at step ${resetAt}/${series.length}, min op ${Math.min(...ops)})`);
  }
  ok(`${name}: scrolling up is silent`, up.at(-1).press === up[0].press, `(${up.at(-1).press - up[0].press} pressure updates)`);
  const p0 = await page.evaluate(() => window.__press);
  const down2 = await pass(0, H, 40);
  ok(`${name}: the second pass redraws everything with sound`, down2.at(-1).strokes.every((s) => s.drawn > 0.98 && s.op === 1) && down2.at(-1).press - p0 > 20, `(${down2.at(-1).press - p0} pressure updates)`);

  // Partial: from the bottom, back up over the note only (not to its start), then down again: brightens, no new sound.
  // Aim at where the full up-pass measured the note arrow about half faded.
  const noteK = n - 1;
  const half = up.find((s) => s.strokes[noteK].op > 0.3 && s.strokes[noteK].op < 0.7);
  const part = await pass(H, half.y, 40);
  const mid = part.at(-1).strokes[noteK];
  if (name === "desktop") await page.screenshot({ path: `${OUT}/fade-${name}-note-half.png` });
  const back = await pass(half.y, H, 40);
  const pressAfter = await page.evaluate(() => window.__press);
  ok(`${name}: partial scroll-back fades the note arrow but keeps its ink`, mid.op < 0.95 && mid.op > 0 && mid.drawn > 0.98, JSON.stringify(mid));
  ok(`${name}: returning brightens it back to 1 without new sound`, back.at(-1).strokes[noteK].op === 1 && pressAfter === part.at(-1).press, `(${pressAfter - part.at(-1).press} new pressure updates)`);
  ok(`${name}: no page errors`, errs.length === 0, errs.join(" | "));
  await ctx.close();
}
// Reduced motion: strokes drawn, never faded.
{
  const ctx = await b.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const ops = [];
  for (const y of [H, H / 2, 0, H]) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
    await page.waitForTimeout(150);
    ops.push(...(await page.evaluate(() => [...document.querySelectorAll("svg path[pathLength]")].map((p) => +getComputedStyle(p).opacity * +getComputedStyle(p.closest("svg")).opacity))));
  }
  ok("reduced motion: every stroke stays at opacity 1", ops.length > 0 && ops.every((o) => o === 1), `(${ops.length} readings)`);
  await ctx.close();
}
await b.close();
console.log(failures.length ? `\n${failures.length} failed` : "\nall fade checks passed");

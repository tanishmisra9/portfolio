// Fits the synthesized pencil (public/worklets/pencil.js) to the reference recording (public/sfx/pencil.mp3), so the
// synth sounds like the scratch the owner liked. Renders the worklet offline in headless Chromium for 4s at a steady
// mid speed, compares 1/3-octave band levels (125 Hz – 10 kHz, shape normalised) against the recording, nudges the
// band gains until every band is within ±3 dB, matches the output level (RMS at pressure 1), and prints the values
// to paste into lib/pencil/config.ts (`sound.bands`, `sound.outGain`).
//
// Dev-only. Needs a running dev server (default http://localhost:3000; override with URL=…) and Playwright
// available to Node (e.g. `npm i --no-save playwright` once). Run: `node scripts/pencil-fit.mjs`.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const URL = (process.env.URL ?? "http://localhost:3000").replace(/\/$/, "");
// CONFIG=… lets a copy of this script run from a folder where Playwright is installed (ESM ignores NODE_PATH).
const cfg = readFileSync(process.env.CONFIG ?? new URL("../lib/pencil/config.ts", import.meta.url), "utf8");
const num = (key) => parseFloat(cfg.match(new RegExp(`${key}:\\s*([\\d.]+)`))[1]);
const bandsSrc = cfg.match(/bands:\s*\[([\s\S]*?)\]/)[1];
let bands = [...bandsSrc.matchAll(/f:\s*([\d.]+),\s*q:\s*([\d.]+),\s*g:\s*([\d.]+)/g)].map((m) => ({ f: +m[1], q: +m[2], g: +m[3] }));
let outGain = num("outGain");
const tooth = { tooth: num("tooth"), toothFreq: num("toothFreq"), toothDecay: num("toothDecay"), hp: num("hp") };
const midSpeed = num("fullSpeed") / 2; // px/s
const toothRate = midSpeed * num("toothPerPx");
const CENTRES = [125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000];

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage();
await page.goto(`${URL}/favicon.ico`); // any same-origin page: the worklet and the sample load from it

const measure = (opts) =>
  page.evaluate(async ({ bands, outGain, tooth, toothRate, CENTRES }) => {
    const SR = 44100;
    const analyse = (x) => {
      const N = 8192;
      const win = Float32Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
      const power = new Float64Array(N / 2);
      let frames = 0;
      for (let off = 0; off + N <= x.length; off += N / 2, frames++) {
        const re = new Float64Array(N);
        const im = new Float64Array(N);
        for (let i = 0; i < N; i++) re[i] = x[off + i] * win[i];
        // iterative radix-2 FFT
        for (let i = 1, j = 0; i < N; i++) {
          let bit = N >> 1;
          for (; j & bit; bit >>= 1) j ^= bit;
          j ^= bit;
          if (i < j) [re[i], re[j], im[i], im[j]] = [re[j], re[i], im[j], im[i]];
        }
        for (let len = 2; len <= N; len <<= 1) {
          const a = (-2 * Math.PI) / len;
          for (let i = 0; i < N; i += len)
            for (let k = 0; k < len / 2; k++) {
              const [c, s] = [Math.cos(a * k), Math.sin(a * k)];
              const [ur, ui] = [re[i + k], im[i + k]];
              const vr = re[i + k + len / 2] * c - im[i + k + len / 2] * s;
              const vi = re[i + k + len / 2] * s + im[i + k + len / 2] * c;
              re[i + k] = ur + vr;
              im[i + k] = ui + vi;
              re[i + k + len / 2] = ur - vr;
              im[i + k + len / 2] = ui - vi;
            }
        }
        for (let k = 0; k < N / 2; k++) power[k] += re[k] * re[k] + im[k] * im[k];
      }
      const band = CENTRES.map((fc) => {
        const [lo, hi] = [fc / 2 ** (1 / 6), fc * 2 ** (1 / 6)];
        let e = 0;
        for (let k = Math.ceil((lo * N) / SR); k <= Math.floor((hi * N) / SR); k++) e += power[k];
        return e / frames;
      });
      const total = band.reduce((a, b) => a + b, 0);
      const rms = Math.sqrt(x.reduce((a, v) => a + v * v, 0) / x.length);
      return { shape: band.map((e) => 10 * Math.log10(e / total)), rms };
    };
    // reference
    const buf = await (await fetch("/sfx/pencil.mp3")).arrayBuffer();
    const ref = (await new OfflineAudioContext(1, SR, SR).decodeAudioData(buf)).getChannelData(0);
    // synth: 4s at pressure 1, neutral brightness, mid-speed tooth
    const ctx = new OfflineAudioContext(1, SR * 4, SR);
    await ctx.audioWorklet.addModule("/worklets/pencil.js");
    const node = new AudioWorkletNode(ctx, "pencil", { numberOfInputs: 0, outputChannelCount: [1], processorOptions: { bands, outGain, ...tooth } });
    node.parameters.get("pressure").setValueAtTime(1, 0);
    node.parameters.get("toothRate").setValueAtTime(toothRate, 0);
    node.connect(ctx.destination);
    const syn = (await ctx.startRendering()).getChannelData(0).slice(SR / 2); // skip the filters' settling
    return { ref: analyse(ref), syn: analyse(syn) };
  }, opts);

// Each 1/3-octave band is corrected by the synth band nearest to it (log frequency).
const owner = CENTRES.map((fc) => bands.reduce((best, b, i) => (Math.abs(Math.log2(b.f / fc)) < Math.abs(Math.log2(bands[best].f / fc)) ? i : best), 0));
let r;
for (let it = 0; it < 30; it++) {
  r = await measure({ bands, outGain, tooth, toothRate, CENTRES });
  const err = r.syn.shape.map((v, i) => v - r.ref.shape[i]);
  const worst = Math.max(...err.map(Math.abs));
  console.log(`iter ${String(it).padStart(2)}  worst band error ${worst.toFixed(2)} dB  level ratio ${(r.syn.rms / r.ref.rms).toFixed(3)}`);
  outGain *= r.ref.rms / r.syn.rms;
  if (worst <= 1.5 && Math.abs(r.syn.rms / r.ref.rms - 1) < 0.03) break;
  bands = bands.map((b, i) => {
    const mine = err.filter((_, k) => owner[k] === i);
    const e = mine.length ? mine.reduce((a, v) => a + v, 0) / mine.length : 0;
    // Clamped step (±6 dB per iteration) and range, so one bad reading can't run a band away.
    const step = Math.max(-6, Math.min(6, -0.8 * e));
    return { ...b, g: +Math.min(20, Math.max(0.001, b.g * 10 ** (step / 20))).toFixed(4) };
  });
}
await browser.close();

console.log("\nband   ref dB   synth dB   error");
CENTRES.forEach((fc, i) => console.log(`${String(fc).padStart(5)}  ${r.ref.shape[i].toFixed(1).padStart(6)}  ${r.syn.shape[i].toFixed(1).padStart(8)}  ${(r.syn.shape[i] - r.ref.shape[i]).toFixed(1).padStart(6)}`));
console.log("\nPaste into lib/pencil/config.ts:");
console.log(`    bands: [\n${bands.map((b) => `      { f: ${b.f}, q: ${b.q}, g: ${b.g} },`).join("\n")}\n    ],`);
console.log(`    outGain: ${outGain.toFixed(4)},`);

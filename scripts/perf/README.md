# /photos scroll-performance scripts (dev-only)

Measurement tools for the /photos page. They're not tests run in CI: each prints numbers for you to compare.

**Setup.** They need Playwright, which isn't a project dependency: `npm i --no-save playwright && npx playwright install chromium`, or set `CHROME=/path/to/chrome`. Each reads `URL` (default `http://localhost:3000/photos`).

**Always measure a production build.** Use `next build && next start -p <port>`, never `dev:lan`. React's dev build dominates the profile, so dev numbers mislead.

**Compare A/B by alternating runs.** Build the baseline in its own git worktree, serve both builds on different ports, and alternate A, B, A, B. The same build varies ±3–6% from run to run, and a single baseline run once made an unchanged build look 5–10% slower.

| Script | What it measures |
|---|---|
| `scroll-cost.mjs` | Main-thread script, style, layout and task time per section, **down vs up**. Emulated iPhone 13 at 6× CPU, 12 px per step, a fresh load per section so A and B start in the same state. Also the top self-time functions scrolling up through the intro. |
| `scroll-gpu.mjs` | Paint, raster, GPU, layerize and pre-paint from a Chrome trace, per section and direction. |
| `nav-blur.mjs` | **Headed** Chromium (real GPU compositing; headless doesn't render `backdrop-filter`): the graphics pipeline with the nav's backdrop blur at 12, 8, 4 and 0 px. |
| `react-commits.mjs` | React commits during a full intro pass, counted through a stub devtools hook. It should be 0: scroll must never set React state. |
| `pencil-fade.mjs` | The strokes' fade-then-redraw behaviour: fades without un-drawing, resets, redraws with sound, a partial scroll-back that brightens again silently, and reduced motion. Desktop and iPhone 13. |
| `recording-stalls.mjs` | An **iPhone screen recording** (`node scripts/perf/recording-stalls.mjs <file.mp4>`, needs ffmpeg): frames where the page froze while the iOS scrollbar (drawn off the page's thread) kept moving. Lists each run of ≥ 3 frozen frames and the share of scrolling frames that froze. The only tool here that sees real-device rendering, which Chromium's GPU raster hides. |

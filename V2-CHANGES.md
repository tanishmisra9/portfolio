# v2: what changed since v1 (`main`)

`v2` is a redesign of the whole site plus a rebuilt /photos experience. It is **139 commits** ahead of `main`
(22–25 Nov 2026) and touches **138 files** (+6,979 / −2,863 lines). `main` has **2 commits that `v2` does not**
(they re-add the EXPERIENCE/SKILLS/PROJECTS nav links and re-centre the hero); see
[Not carried over from main](#not-carried-over-from-main).

- [Before you deploy](#before-you-deploy)
- [Design system](#design-system)
- [Home: the hero pit stop](#home-the-hero-pit-stop)
- [/photos](#photos)
- [/thoughts (was /blog)](#thoughts-was-blog)
- [/f1](#f1)
- [Admin](#admin)
- [Performance](#performance)
- [Accessibility](#accessibility)
- [Reliability and security fixes](#reliability-and-security-fixes)
- [Tooling and checks](#tooling-and-checks)
- [Known gaps and open items](#known-gaps-and-open-items)

---

## Before you deploy

- **Node ≥ 22.18** is now required (`engines` in package.json). The check scripts run on Node's native TypeScript
  stripping.
- **Database:** v2 adds two tables and a column. Run `npm run db:push` against production once.
  - `login_attempts`: the per-IP admin login throttle. Until it exists, the throttle silently does nothing.
  - `shutter_count`: the /photos global shot counter. It already exists in the current database. Until it exists,
    the counter just stays hidden.
  - `radio_samples.rms`: measured loudness for the radio easter egg. After pushing, open /admin/radio and run
    **Analyze loudness** once, then **Publish**.
- **New dependencies:**
  - `pencil-voice` (installed from GitHub, `github:tanishmisra9/pencil-voice#v0.1.1`);
  - `unified`, `remark-parse` and `mdast-util-to-string`.

  No new environment variables.
- **Route rename:** `/blog` → `/thoughts`, with permanent (308) redirects, so old links keep working.
- **Sound needs https.** The /photos pencil synth runs in an AudioWorklet, which browsers only allow on https or
  localhost. Production is fine; a phone on the LAN dev server (`http://192.168…`) is silent by design.

---

## Design system

The whole site moved to one visual language. The rules live in `CLAUDE.md` ("v2 design rules").

- **No pills:** tags, buttons and tooltips are sharp rectangles (`PILL_CLASSES`, `GLASS_BUTTON_*`).
- **Headings are solid fills in Title case** (`SECTION_HEADING_CLASSES`, `PAGE_TITLE_CLASSES`). The outlined
  "ghost" headings are gone. Line-height is written into the size utility (`text-5xl/[1.4]`), so descenders never clip.
- **Poppins is the default font.** YD Gothic, Inter and Inter Tight stay as fallbacks. Punctuation now renders in
  Inter Tight instead of YD Gothic's heavy blocks.
- **Link hover = outline + fill:** a foreground-coloured rectangle rises behind the text (`HoverFill`). It's used on
  the nav, the logo, the theme toggle and the footer links. On touch, `TapFill` makes the fill rise, hold and drop. It
  never sticks, because hover styles only apply where hover exists.
- **Tooltips:** a sharp bordered box in a portal, in the system UI font. It flips above the trigger when there's no
  room and stays inside the viewport.
- **`IconButton`:** one shared square icon button with a fill hover and a tooltip. It's used for back, replay,
  copy-link and the admin controls. Back buttons are a chevron.
- **Theme switch is a cover-dip:** a full-screen cover in the old background fades in, the theme swaps underneath,
  and the cover fades out. The old per-element colour fade let text vanish mid-switch, and WebKit ghosted the hero
  letters. The toggle's tooltip says what it switches to ("Switch to dark mode").
- **The nav bar is an opaque tint, not a backdrop blur.** The tint is what the frosted glass averaged to: the page
  background, or over the /photos sky that sky's colour. At rest it matches the old glass within 0–4 RGB units,
  except over content, where the glass's soft smear is now a plain bar.
- **Footer:** social links (LinkedIn, GitHub, Résumé), the email as copy-to-clipboard text (no Mail pop-up), "Stay in
  touch", back-to-top, and the © line. /privacy and /legal read the contact email from the published social link.
- **Content pages** (posts, albums) hang the back button, title and body on the header logo's left edge, with tighter
  title leading. Client navigation now lands at the top of the page; it used to land 85px down.

---

## Home: the hero pit stop

- **Clicking the name runs an F1 pit stop.** The letters split into four tires that bolt back on in time with one
  continuous sound clip: gun burst, growl, drive-off. The name then re-enters from the left.
  - It has vertical "sauce": landing kicks, a squat on drive-off and a wobble on re-entry.
  - While the growl swells, the parked name has a subtle engine rumble.
- **Botched stop (40% chance):** one tire cross-threads, gets left behind, and sneaks back.
  - It has its own sound clip (`pitstop-botch.mp3`, built by `scripts/pitstop-sfx`).
  - It's never the same tire twice in a row (`sessionStorage`).
  - The next stop's variant is rolled and preloaded ahead of time.
- **Under reduced motion,** the name is plain text: no dead "Play pit-stop" button, and no clip is downloaded.

---

## /photos

The page became an experience rather than a grid.

### The "day of light" scroll intro
- **The intro is one day of light.** Dark mode is a sunset (golden hour → blue hour → night); light mode is a sunrise
  (pre-dawn → dawn → golden morning → daylight). Either way it resolves into the page's own background, so the exit
  has no edge. Every text/sky pair is measured at ≥ 4.5:1 contrast.
- **Beat 1:** "What I believe in." is typed by scroll. It hands off to the next line through a **rising horizon of
  light**: a masked sky with masked text, and a lag measured every frame so the two lines never overlap. That replaced
  a plain crossfade.
- **Beat 2:** "I think *anyone* can be a photographer / since the best camera is the one in your *pocket.*" A pencil
  arrow carries the reader from one phrase to the next, and the camera follows the pencil tip's height.
  - Pencil circles loop "anyone" and "pocket.", different on every load. They replaced an iOS Live Text selection.
  - In light mode the arrow turns from white to dark exactly where both inks read equally on the blue→gold blend
    (measured).
- **Beat 4:** "Mobile photography." switches on like a neon sign, letter by letter, with a stutter.
  - Dark mode: an amber glow that breathes once lit.
  - Light mode: crisp sodium-amber letters, so the switch-on is clearly visible (it used to be plain black).
- **The glass nav takes the ink of whichever sky is behind it** (`html[data-pd-sky]`).

### Pencil strokes and their sound
- **Every stroke is drawn by scroll and voiced by a synthesized pencil** that follows the real pen tip:
  - speed sets the volume and the paper-tooth crackle;
  - downstrokes press harder and sound darker;
  - tight curves are lighter;
  - sharp turns tick;
  - the pen landing taps;
  - the sound pans with the tip's position.
- The strokes covered: the intro arrow, both circles, and the "Here's my work." arrow.
- **The synth** is an AudioWorklet: 20 one-third-octave noise bands fitted to a real pencil recording within ±1.5 dB,
  plus paper-tooth clicks per pixel drawn.
- **It's its own open-source package now,** [`pencil-voice`](https://github.com/tanishmisra9/pencil-voice) (MIT), with
  docs, tests, CI and a [live demo](https://tanishmisra9.github.io/pencil-voice/examples/). The site keeps only its
  tuned loudness and tail (`lib/pencil/config.ts`).
- **Scrolling back up fades a stroke instead of leaving it crisp,** and it never un-draws. Halfway back over a stroke
  it's at half opacity; back at its start it's gone. Fully faded, it redraws, with the sound, on the next pass down.
- **Audio etiquette:** silent until the first click, tap or key. It re-arms after iOS interruptions, and there's no
  audio at all under reduced motion.

### "Here's my work." note
- The heading lights up word by word. Then the pencil sweeps from the end of the line, through two cursive loops, to
  the middle of the page, ending just clear of the first collection.

### The camera title ("tanishtakespics")
- **It's a shutter.** It sits in viewfinder corner brackets and has a "Take a photo" hover label.
- **Clicking it fires a flash** (with the brackets snapping in) and a shutter sound.
  - Dark mode keeps the white pop.
  - Light mode flashes warm-white letters with an amber edge. White on the white page simply vanished.
- **Camera HUD:**
  - a focus point that hunts and locks green;
  - a rule-of-thirds grid on hover;
  - an exposure readout (shutter, aperture, ISO) that meters on each shot;
  - a **global shot counter** ("No. 1,284") shared by every visitor, which rolls up with the shutter.
- **Half-press:** holding the title is a real half-pressed shutter. Focus hunts and locks with an AF beep, the
  exposure meters and locks, and the release takes the shot, keeping the lock. It works with the mouse, a touch long
  press and Space.

### Collections
- **Contact-sheet tiles:** a cover plus a strip of frames and a frame count.
- **Back to photos** on an album lands on the collections, not the top of the intro.

---

## /thoughts (was /blog)

- **Route renamed** `/blog` → `/thoughts`, with 308 redirects.
- **Cards:**
  - a lift hover with a hard offset shadow;
  - a rectangle that traces itself around the title;
  - a dateline;
  - a "⋯" copy-link button.
- **"On this page":** posts get a section nav with scroll-spy on wide screens (xl and up). Short posts without
  headings drop the empty column.
- **Unique heading IDs:** a `sec-` prefix and a used-set allocator, so they never collide with `#top` or with each
  other.
- **Linked images** no longer nest a `div` inside a `p`.

---

## /f1

- **Launch ink:** torn ink masses, rising plumes, dry-brush hairline bundles and vertical speed lines fire behind the
  car's tires during the launch rush, in the clip's own drawn style. It follows the theme.
- **Replay** is an icon button, and each replay re-rolls the sound, the hold and the ink.
- The intro **releases its decoded frames** when it finishes, and the loader stops on Skip.

---

## Admin

- **Redesigned in the v2 language:**
  - top-bar navigation;
  - a two-step delete instead of `confirm()`;
  - one save-status pattern for every writer;
  - a `--danger` token.
- **Safety rails against silent data loss:**
  - Buttons that cancel mousedown now blur the active field first. Fields commit on blur, so Save used to send the
    previous value.
  - **Rename and import share a lock**, so overlapping them can't re-create the old post.
  - **Save pressed while editing the slug** renames and then saves the rest.
  - The editor no longer flips to "New Post" after a rename.
  - Renaming a post copies its images to the new slug.
  - Image uploads wait for an in-flight markdown import.
  - The photo uploader is single-flight, and claims items synchronously.
  - Reorder arrows act on the list as shown, so they can't undo a drag that hasn't saved yet.
- **Markdown import is data-only:** frontmatter can't run JavaScript. Image destinations are found through the remark
  AST (inline, titled, reference-style, escaped), never in code blocks or prose. A definition shared by an image and a
  link is left alone.
- **Remote image dimensions** are fetched only from the Vercel Blob host, streamed, with a 5s timeout and a 15MB cap.
- **Radio easter egg:** loudness is measured once in the admin ("Analyze loudness"), not on every visitor's device.
  Publish flags clips that haven't been analysed.
- **Login throttle:** 8 failures per 15 minutes per IP, recorded before the password is compared. Refused retries
  don't extend the lockout.

---

## Performance

Each number below was measured during development, mostly on production builds with an emulated iPhone 13 at 6×
CPU, comparing old and new builds in alternating runs. The tools are in `scripts/perf/`.

| Change | Measured effect |
|---|---|
| Home: the hero name's idle drift is CSS keyframes (compositor) instead of a forever-running Framer loop of x/y/skewX | Idle home page **510 → 7 ms** of main-thread work per 4 s, **60 → 0** rAF callbacks a second (iPhone 13); same motion, still off under reduced motion |
| Inter and Inter Tight no longer preloaded (fallbacks that only `/quotes` and YD Gothic's punctuation ever paint) | Fonts on every page except `/quotes`: **10 files / 133 kB → 8 files / 65 kB**, same faces rendered |
| /photos and album images: `sizes` hints match the measured column widths (were `100vw` on phones, 896px on desktop) | iPhone image bytes for a full scroll: `/photos` **1153 → 872 kB**, `/photos/campus` **1654 → 1314 kB**, snowfall 485 → 358 kB. Desktop 1× albums now load correctly sized files (were upscaled 896 → 1067px) |
| /photos collection covers no longer `priority` (they sit ~7 screens down) | No image preloads or image fetches before the reader scrolls; fonts, JS and hydration get the bandwidth |
| /quotes: Familjen Grotesk italic dropped (every quote treatment is upright) | /quotes fonts **14 files / 243 kB → 13 / 223 kB** |
| Shutter counter GET cached at the CDN for 10 s (+60 s stale); POST and failed reads stay uncached | A /photos view no longer costs a serverless invocation and a Neon round trip just to seed the counter |
| `public/` assets (/f1, /sfx, /fonts, heart.png) get a one-day browser cache (+7 days stale) | Repeat visits stop revalidating every file (75+ conditional requests before the /f1 lights ran); names aren't versioned, so a replaced file reaches visitors within a day |
| Radio easter egg ships measured gains instead of downloading every clip per visitor | Was about **75% of the free Blob transfer quota**; a trigger now fetches only the clip it plays |
| "Mobile photography." glow breathes on its own composited layer (opacity) instead of animating three large blurred text-shadows | GPU work while scrolling the note **−89%** (437 → 49 ms per 100 frames); collections style/layout/paint 81/59/50 → 15/1/2 |
| Nav bar: opaque tint instead of `backdrop-filter: blur` (the radius didn't matter; the filter itself did) | Graphics pipeline **−28%**, frame drawing about **8× lighter**, buffer swaps halved on every scroll frame of every page |
| Scroll never sets React state (typed letters, sky switch and lit sign are direct DOM writes) | React commits per intro pass **about 20 → 0**; intro task time **−7%** scrolling down (script −27%), **−5%** scrolling up |
| /photos intro: every scroll-scrubbed element (sky layers, sun, camera track, lit words, stroke fades) on its own layer (`will-change`) | iPhone recording showed the stage updating at about 10 fps on re-passes while the scroll stayed smooth (iOS repainting on the CPU). Chromium intro paint **−23% down, −50% up**; layouts per 100 steps 56 → 40 down, 30 → 12 up; pixel-identical |
| Stroke fade written as a style on the SVG, not a Framer value on the path | Avoided a forced layout per frame (layouts 2 → 32 per 100 frames in the first version) |
| Pencil strokes rolled back from a per-frame variable-width graphite renderer to one plain SVG path | Removed the per-frame path rebuild and SVG filter the site "felt slow" with; the sound is unchanged |
| Pencil sound runs in an AudioWorklet (off the main thread); stroke position cached and re-read only on resize | No per-frame layout reads; moving the engine into the package changed scroll cost by 0% (A/B) |
| Sign glow paused while off screen; the synth writes silence without filtering when idle | Idle cost about zero |
| F1 intro frees its decoded frames; heart image resized; unneeded preloads dropped; pit-stop clip not fetched under reduced motion | Less memory and fewer bytes on load |

---

## Accessibility

- **Reduced motion is honoured everywhere:**
  - a static /photos intro (strokes fully drawn, never faded);
  - the hero as plain text;
  - no flash or neon stutter;
  - no audio context;
  - the hero magnet effect off.
- **Contrast:** dim text and the smallest quote tier at ≥ 4.5:1 (checked by `check:colors`), and every /photos sky
  pair at ≥ 4.5:1. The daylight neon is 4.81:1.
- **Keyboard:** the title effects and the Verstappen link are reachable. The camera title's half-press works with
  Space, and Replay keeps focus. Focus rings are styled, without Safari's blue box on `<main>`.
- **Screen readers:** the typed heading carries its full text as a label. The neon sign and the HUD are hidden from
  assistive tech, and buttons have descriptive labels.
- **`noscript` quotes**, and hover-only styles that never stick on touch.

---

## Reliability and security fixes

Several review rounds (`/code-review` medium and high, plus an audit) were fixed in full. Beyond the admin rails above:

- **Hydration:** no mismatch for reduced-motion /photos visitors (motion choices made after mount).
- **Pencil voice** warns instead of failing silently when AudioWorklet is missing (an insecure context).
- **Shot counter:**
  - it only moves forward (stale responses can't roll it back);
  - it counts one shot per IP per second;
  - it's capped below the 32-bit limit, so a POST loop can't overflow it into hiding;
  - it fails open (hidden) on any database error.
- **Half-press:** one at a time (no double beep), and a lock with no click (iOS) doesn't leak into the next shot.
- **iOS:** the long-press callout is disabled on the camera title. It's now plain CSS; the Tailwind class never
  generated anything.
- **Theme toggle** blurs a focused admin field before cancelling mousedown.
- **Footer** copies the real mailto address (case and decoding).
- **The theme dip** survives hidden tabs (timers, not requestAnimationFrame), and the F1 ink follows the theme.
- **Hero pit stop** pauses its audio when it starts too late to stay in sync.

---

## Tooling and checks

- `npm run check:admin`: the admin safety rails, the markdown importer, unique heading IDs, the streaming
  image-dimension reader, and the locked collection slugs.
- `npm run check:botch`: ties the botched pit stop's visuals to its baked sound clip.
- `npm run check:states`: every UI state machine (`lib/state-machines.ts`), including the new `HERO_PHASE` and
  `HALF_PRESS`. Forbidden edges are tested, and raw state writes are grepped out.
- `npm run check:colors`: now also asserts WCAG contrast ratios.
- `scripts/perf/` (dev-only, needs Playwright): scroll cost and GPU per section in both directions, the nav-blur cost
  in headed Chromium, a React-commit counter, and the pencil fade check.
- **`pencil-voice`** has its own test suite: 19 unit tests that fail when a rule is broken, and a browser test that
  drives the demo and checks the synth really plays.

---

## Known gaps and open items

- **Sound licences:** `public/sfx/pencil.mp3` (the pencil reference recording) and `public/sfx/focus-beep.mp3` (the
  half-press beep) came from YouTube SFX uploads with unverified licences. Confirm or replace them before production.
  `pencil-voice` ships only fitted numbers, never the audio.
- **Real-device checks still worth doing:**
  - the iPhone long-press callout on the camera title;
  - the pencil sound over https on a phone;
  - the Safari toolbar tint with the theme cover-dip.
- **Untested in a browser:** the "New Post" flip after a rename was fixed from a code trace; renaming a post once
  would confirm it.
- **Pre-existing:** under reduced motion, the dev console logs a hydration warning from the /photos entrance
  animation. It's harmless in production, and still to fix.
- **Not pushed:** `v2` exists only locally.

### Not carried over from main

`main` has two commits that `v2` deliberately leaves out:

- `3b7f0fc`: re-adds the EXPERIENCE / SKILLS / PROJECTS nav links (a revert of the nav trim).
- `e1bf6a6`: centres the hero again.

Merge `main` into `v2` only if you want those back.

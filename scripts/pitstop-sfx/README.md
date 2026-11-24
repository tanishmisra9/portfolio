# Pit stop sfx build

Builds `public/sfx/pitstop.mp3` (normal stop) and `public/sfx/pitstop-botch.mp3` (botched stop). Notes on what each
section of the clips is, and why, are in `components/hero/PITSTOP.md`.

**These scripts can't run from a clean checkout.** Their inputs are not in the repo (third-party audio) and every script
reads them by relative path from the current directory, so run them from a work dir that holds:

| input | what | made by |
|---|---|---|
| `src.wav` | audio of the YouTube Short the pit stop sounds are cut from (gun burst 5.97-6.62s, growl 7.28-8.42s, drive-off 8.5-9.96s) | you: download + `ffmpeg -i short.mp4 src.wav` |
| `w8.wav`, `w9.wav` | "WHOOSH 8" (source 25.21-25.57s) and "WHOOSH 9" (26.43-28.48s) from the "20 CINEMATIC WHOOSH Sound Effects (No Copyright)" video (id Hj7-pltIVng) | you: extract those ranges |
| `region.wav` | `src.wav` 5.80-9.96s through the one filter chain | `build.py` |
| `hit.wav`, `crack.wav`, `rattle.wav`, `thump.wav` | the impact hit and its layers | `hit.py` |

Order: `build.py` -> `hit.py` -> (normal clip: `build3.py` then `mix2.py <base> <whoosh9_ms> <out.wav>`, then encode) or
(botched clip: `build_botch.py <out.mp3>`) -> `check_botch.py <clip.mp3> [normal.mp3]`.

- `build_botch.py` encodes with `volume=0.75`: the shipped normal clip is its pre-encode mix at -2.5 dB.
- `mix2.py` / `punch.py` are the normal clip's mixer and its landing-jump check, kept as the record of how it was made
  (`punch.py` has the older 4-hit landing list).
- The visual side of the botch lives in `components/hero/use-pitstop.ts` (`BOTCH_TRACK`, `BOTCH_SHIFT_MS`); `LAND` and
  `SHIFT` here must match it. `npm run check:botch` fails if they drift.

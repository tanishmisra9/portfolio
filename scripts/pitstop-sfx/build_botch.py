"""Build the BOTCHED pit stop clip (public/sfx/pitstop-botch.mp3).

Run from a work dir that holds the inputs the other scripts here produce (none of them are in the repo: the source is a
YouTube Short / whoosh pack, see components/hero/PITSTOP.md): region.wav (build.py), hit.wav + crack.wav + rattle.wav
(hit.py), w8.wav, w9.wav.   usage: python3 build_botch.py <out.mp3>

Same clip as the normal stop up to the gun burst, then SHIFT seconds of extra, frantic gun material are inserted into the
burst, right before it crossfades into the engine growl. Everything after (growl, drive-off, whoosh 9) is the same audio
shifted by SHIFT, so the visual timeline only needs `+ BOTCH_SHIFT_MS` after the burst. Times below are clip ms and MUST
match POKES in components/hero/use-pitstop.ts.
"""
import subprocess, sys

def ff(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)

OUT = sys.argv[1]
SHIFT = 0.77                       # = BOTCH_SHIFT_MS (770): what the extension adds; the clip's own burst resumes at 1350 + SHIFT
INS = 0.60                         # region time where the extension goes in (clip 1.35, inside the burst, before the xfade at 1.40)
# where each (failing) poke lands, then the final seat. Mirrors POKES in use-pitstop.ts
LAND = [1540, 1690, 1825, 1945, 2055, 2265]
FAIL_GAIN = [0.7, 0.6, 0.65, 0.7, 0.8]   # the failing pokes get louder as the crew panics
FINAL_GAIN = 1.0
W8_AT = [0, 160, 320, 480]
NORMAL_HITS = [(1000, 0.95), (1180, 0.85), (1360, 0.9)]   # tires 1-3 land exactly as in the normal clip
W9_AT = 3190 + int(SHIFT * 1000)   # normal clip: whoosh 9 starts 3.19s

# ---- 1. extension: gated brrt pieces cut from the real rattle, ambience-only gaps, all from region.wav (same filter chain)
# (start ms, end ms) in clip time inside [1350, 2120]. Each failing poke lands in a 50ms gap (landing -25..+25) so the
# clack cuts through the whirr: gun brrt -> stops -> clack -> brrt. The clip's own burst resumes at 2120 for the final push.
PIECES = [(1350, 1515), (1565, 1665), (1715, 1800), (1850, 1920), (1970, 2030), (2080, 2120)]
SRC_OFF = [0.30, 0.40, 0.27, 0.45, 0.33, 0.38]   # region offsets inside the loud burst (0.25-0.60), varied so it doesn't loop
parts = []
t = 1350
for k, (a, b) in enumerate(PIECES):
    if a > t:  # gap = ambience only (region 0.02-0.15, before the gun starts at 0.17)
        ff("-ss", "0.02", "-t", str((a - t) / 1000), "-i", "region.wav", "-af", "afade=t=in:d=0.004,afade=t=out:st=%f:d=0.004" % max(0, (a - t) / 1000 - 0.004), f"gap{k}.wav")
        parts.append(f"gap{k}.wav")
    dur = (b - a) / 1000
    ff("-ss", str(SRC_OFF[k]), "-t", str(dur), "-i", "region.wav", "-af", f"afade=t=in:d=0.003,afade=t=out:st={max(0, dur - 0.005)}:d=0.005", f"piece{k}.wav")
    parts.append(f"piece{k}.wav")
    t = b
assert t == int(1350 + SHIFT * 1000), (t, SHIFT)
ins = [x for p in parts for x in ("-i", p)]
ff(*ins, "-filter_complex", "".join(f"[{i}:a]" for i in range(len(parts))) + f"concat=n={len(parts)}:v=0:a=1", "EXT.wav")

# ---- 2. X' = X[0:INS] + EXT + X[INS:1.0]  (6ms fades at the splices), then the usual 0.35s crossfade into the growl
ff("-ss", "0", "-t", str(INS), "-i", "region.wav", "-af", "afade=t=out:st=%f:d=0.006" % (INS - 0.006), "X1.wav")
ff("-ss", str(INS), "-t", str(1.0 - INS), "-i", "region.wav", "-af", "afade=t=in:d=0.006", "X2.wav")
ff("-i", "X1.wav", "-i", "EXT.wav", "-i", "X2.wav", "-filter_complex", "[0:a][1:a][2:a]concat=n=3:v=0:a=1", "Xb.wav")
ff("-ss", "1.20", "-t", "2.96", "-i", "region.wav", "Y.wav")
ff("-i", "Xb.wav", "-i", "Y.wav", "-filter_complex", "acrossfade=d=0.35:c1=qsin:c2=qsin", "weaveb.wav")
ff("-f", "lavfi", "-t", "0.75", "-i", "anullsrc=r=48000:cl=mono", "-i", "weaveb.wav", "-filter_complex", "[0:a][1:a]concat=n=2:v=0:a=1", "baseb.wav")

# ---- 3. hits: failing pokes = crack + rattle slice (no thump: metal on metal, nothing seats); the seat = the full hit.wav
ff("-i", "crack.wav", "-i", "rattle.wav", "-filter_complex", "[0:a][1:a]amix=inputs=2:normalize=0:duration=longest", "-ar", "48000", "-ac", "1", "tink.wav")

# ---- 4. mix (same recipe as mix2.py: duck the burst's highs around the hits, dip the whole bed at each landing)
ALL_HIT_MS = [h for h, _ in NORMAL_HITS] + LAND
DUCK = "1-0.7*exp(-pow((t-1.55)/0.45,2))"   # centre/width widened to cover the longer burst (was 1.25 / 0.28 at 0.8)
DIP = "*".join(f"(1-0.6*exp(-pow((t-{(ms + 40) / 1000})/0.05,2)))" for ms in ALL_HIT_MS)
fc = (f"[0:a]acrossover=split=1300:order=4th[lo][hi];[hi]volume='{DUCK}':eval=frame[hid];"
      f"[lo][hid]amix=inputs=2:normalize=0,volume='{DIP}':eval=frame[bed];")
labels = ["[bed]"]
hits = [(ms, g, "hit.wav") for ms, g in NORMAL_HITS] + \
       [(ms, g, "tink.wav") for ms, g in zip(LAND[:-1], FAIL_GAIN)] + [(LAND[-1], FINAL_GAIN, "hit.wav")]
inputs = ["-i", "baseb.wav", "-i", "hit.wav", "-i", "tink.wav", "-i", "w8.wav", "-i", "w9.wav"]
# one split per source so each hit gets its own copy
n_hit = sum(1 for h in hits if h[2] == "hit.wav"); n_tink = len(hits) - n_hit
fc += "[1:a]asplit=%d%s;" % (n_hit, "".join(f"[hs{i}]" for i in range(n_hit)))
fc += "[2:a]asplit=%d%s;" % (n_tink, "".join(f"[ts{i}]" for i in range(n_tink)))
fc += "[3:a]asplit=4[a1][a2][a3][a4];"
hi = ti = 0
for ms, g, src in hits:
    lab = f"hs{hi}" if src == "hit.wav" else f"ts{ti}"
    hi += src == "hit.wav"; ti += src != "hit.wav"
    fc += f"[{lab}]volume={g},adelay={ms}:all=1[d_{ms}];"
    labels.append(f"[d_{ms}]")
for i, ms in enumerate(W8_AT, 1):
    fc += f"[a{i}]adelay={ms}:all=1[w8_{i}];"
    labels.append(f"[w8_{i}]")
fc += f"[4:a]adelay={W9_AT}:all=1[w9];"
labels.append("[w9]")
fc += "".join(labels) + f"amix=inputs={len(labels)}:normalize=0:duration=longest[m]"
ff(*inputs, "-filter_complex", fc, "-map", "[m]", "-ar", "48000", "-ac", "1", "mixb.wav")
ff("-i", "mixb.wav", "-ar", "44100", "-ac", "1", "-af", "volume=0.75", "-c:a", "libmp3lame", "-b:a", "96k", OUT)   # volume=0.75: the shipped pitstop.mp3 is its pre-encode mix at -2.5 dB
print("built", OUT, "shift", SHIFT, "whoosh9 at", W9_AT)

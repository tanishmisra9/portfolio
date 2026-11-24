"""Checks on a DECODED pit stop clip (not the mp3 envelope). usage: python3 check_botch.py <clip.mp3> [<normal.mp3>]
 - near-silent 10ms frames (< -70 dB) between 0.9s and the end of the engine: must be ~0 (no digital gaps)
 - largest frame-to-frame (10ms) level drop at each splice: the normal clip's worst is 6.3 dB
 - level jump at each landing (loudest 5ms from just before to 30ms after, minus the mean of the 50ms ending 10ms earlier)
 - loudness of 0-0.9s vs the normal clip (the two must match: same PITSTOP_VOLUME)
"""
import re, subprocess, sys, tempfile, os

def rms(path, n):
    f = tempfile.mktemp(suffix=".txt")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-af",
                    f"aresample=48000,asetnsamples={n},astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file={f}",
                    "-f", "null", "-"], check=True)
    r = [-90.0 if m.group(1) == "-inf" else float(m.group(1)) for l in open(f) for m in [re.search(r"RMS_level=(\S+)", l)] if m]
    os.remove(f)
    return r

LAND = [1000, 1180, 1360, 1540, 1690, 1825, 1945, 2055, 2265]   # 1540..2055 fail, 2265 = seat (same list as build_botch.py + the 3 clean tires)
SPLICES = {"extension in": 1350, "extension out": 2120, "xfade (botch)": 2170}
clip = sys.argv[1]
r10 = rms(clip, 480)
dur = len(r10) * 0.01
silent = [i * 10 for i in range(90, int(4300 / 10)) if r10[i] < -70]
print(f"{clip}: {dur:.2f}s, near-silent frames 0.9-4.3s: {len(silent)} {silent[:8]}")
for name, ms in SPLICES.items():
    i = ms // 10
    worst = min(r10[j] - r10[j - 1] for j in range(i - 3, i + 5))
    print(f"  splice {name:14s} @ {ms}ms: worst 10ms drop {worst:6.1f} dB")
r5 = rms(clip, 240)
print("  landing jumps (dB): ", end="")
for t in LAND:
    i = int((t / 1000 + 0.004) / 0.005)
    before = sum(r5[i - 12:i - 2]) / 10
    after = max(r5[i - 1:i + 6])
    print(f"{t}:{after - before:5.1f}", end="  ")
print()
if len(sys.argv) > 2:
    ra, rb = rms(clip, 480)[:90], rms(sys.argv[2], 480)[:90]
    ma, mb = sum(ra) / len(ra), sum(rb) / len(rb)
    print(f"  0-0.9s mean level: botch {ma:.2f} dB vs normal {mb:.2f} dB (diff {ma - mb:+.2f})")

import subprocess, sys
# usage: mix2.py <base.wav> <w9_start_ms> <out.wav> [hits 0|1]
# base: continuous region (burst crossfaded into growl). Its burst's high band is ducked (smooth gaussian, centred 1.25s)
# so four discrete hits (one per tire landing) stand out; whoosh 8 per chunk; whoosh 9 for the return.
base, w9_at, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
use_hits = (sys.argv[4] != "0") if len(sys.argv) > 4 else True
W8_AT = [0, 160, 320, 480]               # LAUNCH_MS - 40
HIT_AT = [1000, 1180, 1360, 1540]        # BOLT_MS + SNAP (160ms): the measured instant each tire lands
HIT_GAIN = [0.95, 0.85, 0.9, 0.95]
DUCK = "1-0.8*exp(-pow((t-1.25)/0.28,2))"
# short dips of the whole burst right at each landing (sidechain-style) so each hit pops out of it
DIP = "*".join(f"(1-0.6*exp(-pow((t-{(ms + 40) / 1000})/0.05,2)))" for ms in HIT_AT)
fc = (f"[0:a]acrossover=split=1300:order=4th[lo][hi];[hi]volume='{DUCK}':eval=frame[hid];"
      f"[lo][hid]amix=inputs=2:normalize=0,volume='{DIP}':eval=frame[bed];")
labels = ["[bed]"]
fc += "[1:a]asplit=4[h1][h2][h3][h4];"
for i, (ms, g) in enumerate(zip(HIT_AT, HIT_GAIN), 1):
    fc += f"[h{i}]volume={g if use_hits else 0},adelay={ms}:all=1[hd{i}];"
    labels.append(f"[hd{i}]")
fc += "[2:a]asplit=4[a1][a2][a3][a4];"
for i, ms in enumerate(W8_AT, 1):
    fc += f"[a{i}]adelay={ms}:all=1[d{i}];"
    labels.append(f"[d{i}]")
fc += f"[3:a]adelay={w9_at}:all=1[w9];"
labels.append("[w9]")
fc += "".join(labels) + f"amix=inputs={len(labels)}:normalize=0:duration=longest[m]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", base, "-i", "hit.wav", "-i", "w8.wav", "-i", "w9.wav",
                "-filter_complex", fc, "-map", "[m]", "-ar", "48000", "-ac", "1", out], check=True)
print("ok", out)

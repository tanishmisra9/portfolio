import re, subprocess, sys
# usage: punch.py <wav>... -> for each landing time, level jump (dB) from the 50ms before to the loudest 5ms in the next 30ms
LAND = [1000, 1180, 1360, 1540]
DELAY = 0.004  # decoded-mp3 lag: the first hit's attack lands ~5ms after its nominal time (read off the 5ms envelope)
for f in sys.argv[1:]:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f, "-af",
                    "asetnsamples=240,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=pu.txt",
                    "-f", "null", "-"], check=True)
    r = [-90 if m.group(1) == "-inf" else float(m.group(1)) for l in open("pu.txt") for m in [re.search(r"RMS_level=(\S+)", l)] if m]
    out = []
    for t in LAND:
        i = int((t / 1000 + DELAY) / 0.005)
        before = sum(r[i - 12:i - 2]) / 10      # 50ms before, ending 10ms ahead of the nominal landing
        after = max(r[i - 1:i + 6])              # loudest 5ms frame from just before to 30ms after the landing
        out.append(after - before)
    print(f"{f}: jump at landings (dB) " + "  ".join(f"{x:5.1f}" for x in out) + f"   mean {sum(out)/4:.1f}")

import subprocess

def ff(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)

# One continuous stretch of the Short (gun burst 5.97-6.62, growl 7.28-8.42, drive-off 8.5-9.96): same filters
# everywhere, no gaps, so there is nothing to "hear the seam" of. clip_time = source_time - 5.05.
SRC_START, SRC_LEN = 5.80, 4.16          # 5.80 .. 9.96
PAD_S = 0.75                              # clip silence before the region (so region t=0 sits at clip 0.75)
ff("-ss", str(SRC_START), "-t", str(SRC_LEN), "-i", "src.wav",
   "-af", f"highpass=f=180,afftdn=nr=10:nf=-35,afade=t=in:d=0.12,afade=t=out:st={SRC_LEN-0.3}:d=0.3",
   "-ar", "48000", "region.wav")
ff("-f", "lavfi", "-t", str(PAD_S), "-i", "anullsrc=r=48000:cl=mono", "-i", "region.wav",
   "-filter_complex", "[0:a][1:a]concat=n=2:v=0:a=1", "base2.wav")
print("base2 built")

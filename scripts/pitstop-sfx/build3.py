import subprocess

def ff(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)

# region.wav = source 5.80-9.96 through the single filter chain (built by build.py), so both halves share it exactly.
# X = region 0.00-1.00 (src 5.80-6.80: ambience + gun burst 5.97-6.62), Y = region 1.20-4.16 (src 7.00-9.96: ambience,
# growl onset at 7.28, engine). Crossfade them over 0.35s (X tail 6.45-6.80 against Y head 7.00-7.35): the gun burst
# fades out while the growl rises in, both over the same bed, instead of a 0.66s lull between two sounds.
XFADE = 0.35
ff("-ss", "0", "-t", "1.00", "-i", "region.wav", "X.wav")
ff("-ss", "1.20", "-t", "2.96", "-i", "region.wav", "Y.wav")
ff("-i", "X.wav", "-i", "Y.wav", "-filter_complex", f"acrossfade=d={XFADE}:c1=qsin:c2=qsin", "weave.wav")
ff("-f", "lavfi", "-t", "0.75", "-i", "anullsrc=r=48000:cl=mono", "-i", "weave.wav",
   "-filter_complex", "[0:a][1:a]concat=n=2:v=0:a=1", "base3.wav")
print("base3 built")

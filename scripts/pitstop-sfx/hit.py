import subprocess

def ff(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)

SR = 48000
# 1) thump: pitch-dropping sine (110 -> ~55 Hz), 140ms, fast exponential decay = the low "weight" of an impact
ff("-f", "lavfi", "-i", f"aevalsrc='0.95*sin(2*PI*(55+55*exp(-t*35))*t)*exp(-t*40)':d=0.11:s={SR}", "thump.wav")
# 2) crack: 22ms of white noise, highpassed, instant decay = the sharp attack edge
ff("-f", "lavfi", "-i", f"anoisesrc=d=0.03:c=white:r={SR}:a=0.9",
   "-af", "highpass=f=2500,afade=t=out:st=0.004:d=0.02,volume=0.55", "crack.wav")
# 3) rattle: 150ms of the source gun burst (loud stretch), bass cut, 2ms attack, quick fade = same timbre as the real gun
ff("-ss", "6.00", "-t", "0.11", "-i", "src.wav", "-af", "highpass=f=500,afade=t=in:d=0.002,afade=t=out:st=0.04:d=0.07,volume=0.8", "rattle.wav")
# hit = the three layers starting together (all land on the first sample), 150ms long
ff("-i", "thump.wav", "-i", "crack.wav", "-i", "rattle.wav",
   "-filter_complex", "[0:a][1:a][2:a]amix=inputs=3:normalize=0:duration=longest,volume=1.0", "-ar", str(SR), "-ac", "1", "hit.wav")
print("hit built")

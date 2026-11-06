"""Synthesize the quiet SFX set the edits expect (thud, whoosh, pop, tick, ding, click, glitch) with ffmpeg.

usage: make_sfx.py <out dir>
Every sound is generated from ffmpeg's lavfi sources, so the files carry no third-party licence.
"""
import os, subprocess, sys

SFX = {
    "thud":   "sine=f=58:d=0.45,volume=2.2,afade=t=out:st=0:d=0.45:curve=exp",
    "whoosh": "anoisesrc=c=pink:d=0.65:a=0.6,bandpass=f=1400:w=1100,afade=t=in:d=0.28,afade=t=out:st=0.3:d=0.35",
    "pop":    "sine=f=620:d=0.09,afade=t=out:st=0:d=0.09:curve=exp",
    "tick":   "sine=f=2600:d=0.035,afade=t=out:st=0:d=0.035",
    "ding":   "sine=f=1320:d=1.3,afade=t=out:st=0:d=1.3:curve=exp",
    "click":  "sine=f=3600:d=0.018,afade=t=out:st=0:d=0.018",
    "glitch": "anoisesrc=c=white:d=0.22:a=0.5,acrusher=bits=4:samples=12,tremolo=f=38:d=0.9,afade=t=out:st=0.12:d=0.1",
}

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
for name, src in SFX.items():
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", src, "-ar", "44100", "-ac", "2",
                    os.path.join(out, f"{name}.wav")], check=True)
print("wrote", len(SFX), "sfx to", out)

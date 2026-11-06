"""Mux the rendered (muted) edit with the raw audio, normalized, plus quiet SFX.
usage: mix.py <video.mp4> <audio-source> <sfx dir> <out.mp4>"""
import subprocess, sys
video, src, sfx_dir, out = sys.argv[1:5]
DUR = 52.6
SFX = [(0.0, "thud", .25), (1.52, "pop", .2), (18.68, "pop", .2), (4.86, "tick", .2), (7.78, "ding", .15),
       (10.32, "tick", .15), (13.4, "thud", .25), (36.94, "pop", .18), (40.22, "thud", .25),
       (31.6, "pop", .18), (33.12, "pop", .18), (46.42, "pop", .18), (48.08, "pop", .18), (49.54, "click", .25), (52.0, "ding", .12)]
SFX += [(t, "tick", .22) for t in (20.48, 24.98, 29.04)] + [(t, "glitch", .12) for t in (24.98, 29.04)]
for s, e in ((8.4, 14.45), (20.4, 31.1), (34.7, 41.95)):
    SFX += [(s - 0.1, "whoosh", .18), (e - 0.3, "whoosh", .15)]
args = ["ffmpeg", "-v", "error", "-y", "-i", video, "-i", src]
fc = []
for i, (t, n, v) in enumerate(SFX):
    args += ["-i", f"{sfx_dir}/{n}.wav"]
    ms = int(t * 1000)
    fc.append(f"[{i + 2}:a]aresample=44100,aformat=channel_layouts=stereo,volume={v},adelay={ms}|{ms}[s{i}]")
fc.append(f"[1:a]aresample=44100,aformat=channel_layouts=stereo,loudnorm=I=-15:TP=-1.5:LRA=11,aresample=44100,afade=t=out:st={DUR - 0.45}:d=0.45[base]")
fc.append("[base]" + "".join(f"[s{i}]" for i in range(len(SFX))) + f"amix=inputs={len(SFX) + 1}:normalize=0:duration=first,alimiter=limit=0.95[a]")
args += ["-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-t", str(DUR), "-movflags", "+faststart", out]
subprocess.run(args, check=True)

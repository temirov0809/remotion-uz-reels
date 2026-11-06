"""Final composite: Behind layer -> keyed speaker (zoom/shift from layout.json) -> pixelated markers -> Front layer, plus SFX mix.

usage: composite.py <raw.MOV> <behind.mp4> <front.mov> <out.mp4> [--test t1,t2,...]
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
L = json.load(open(os.path.join(HERE, "edit", "src", "layout.json"), encoding="utf-8"))
SFX_DIR = os.path.join(HERE, "edit", "public")
KF, AY, DUR = L["keyframes"], L["anchorY"], L["duration"]


def piecewise(idx):
    """ffmpeg expression for a linear interpolation of keyframe column idx over t."""
    expr = str(KF[-1][idx])
    for (t0, *a), (t1, *b) in reversed(list(zip(KF, KF[1:]))):
        v0, v1 = a[idx - 1], b[idx - 1]
        seg = str(v0) if v0 == v1 or t1 - t0 < 0.01 else f"({v0}+({v1}-{v0})*(t-{t0})/({t1}-{t0}))"
        expr = f"if(lt(t,{t1}),{seg},{expr})"
    return expr


S, DY = piecewise(1), piecewise(2)
pix = "+".join(f"between(t,{m['t']},{m['t'] + L['markerDur']})" for m in L["markers"])

SFX = [(0.0, "thud", .45), (80.95, "ding", .3), (68.7, "click", .6), (66.8, "whoosh", .3), (28.6, "whoosh", .3)]
for m in L["markers"]:
    SFX += [(m["t"], "glitch", .45), (max(0, m["t"] - 0.1), "whoosh", .35)]
SFX += [(t, "pop", .4) for t in (4.95, 22.14, 47.8, 62.9)]
SFX += [(t, "whoosh", .3) for t in (8.3, 30.9, 41.5, 53.3, 70.6)]
SFX += [(t, "tick", .45) for t in (30.98, 32.44, 34.26, 36.38, 70.58, 72.76, 74.4, 76.62)]
SFX += [(t, "pop", .3) for t in (10.0, 12.7, 15.62, 42.16, 44.78, 46.26, 54.42, 59.96)]


def video_graph():
    # A white wall corner shows right of the chair (source coords, static camera): repaint it key-green so it keys out.
    # Local line: the wall lies below y = (220-X)*0.795; brightness > 630 spares skin and the brown chair.
    # It continues as a strip right of the chair down to the table; neutral-white test spares skin (r-b large).
    neutral = "gt(r(X,Y)+g(X,Y)+b(X,Y),600)*lt(abs(r(X,Y)-b(X,Y)),35)"
    wall = f"{neutral}*gt(Y,(220-X)*0.795)"
    green = lambda c: f"r='if({c},156,r(X,Y))':g='if({c},207,g(X,Y))':b='if({c},72,b(X,Y))'"
    return (
        f"[0:v]fps=30,scale=1080:1920,setsar=1,format=rgb24,split=3[src][wc][ws];"
        f"[wc]crop=220:190:860:440,geq={green(wall)}[wfix];"
        f"[ws]crop=80:860:1000:620,geq={green(neutral)}[sfix];"
        f"[src][wfix]overlay=860:440[src2];[src2][sfix]overlay=1000:620,format=yuva444p,chromakey=color=0x9CCF48:similarity=0.08:blend=0.04,"
        f"format=rgba,despill=type=green:mix=0.5:expand=0.1,"
        f"colorbalance=rs=-0.03:bs=0.04:rm=0.02:bm=-0.02:rh=0.04:bh=-0.03,"
        f"curves=all='0/0.02 0.5/0.48 1/0.97',"
        f"scale=w='trunc(1080*{S}/2)*2':h='trunc(1920*{S}/2)*2':eval=frame[fg];"
        f"[1:v][fg]overlay=x='540-overlay_w/2':y='{AY}-{AY}*overlay_h/1920+{DY}':eval=frame:format=auto[comp];"
        f"[comp]split[c1][c2];[c2]scale=54:96,scale=1080:1920:flags=neighbor,eq=brightness=-0.06[pix];"
        f"[c1][pix]overlay=enable='{pix}'[comp2];"
        f"[comp2][2:v]overlay=format=auto,format=yuv420p,fade=t=out:st={DUR - 0.5}:d=0.5[v]"
    )


def main():
    raw, behind, front, out = sys.argv[1:5]
    test = sys.argv[6].split(",") if len(sys.argv) > 6 and sys.argv[5] == "--test" else None
    if test:
        for ts in test:
            t = float(ts)
            g = video_graph().replace("[0:v]fps=30,", f"[0:v]fps=30,setpts=PTS+{t}/TB,")
            g = g.replace("[1:v][fg]", f"[1:v]setpts=PTS+{t}/TB[b];[b][fg]").replace("[comp2][2:v]", f"[2:v]setpts=PTS+{t}/TB[f];[comp2][f]")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", ts, "-i", raw, "-ss", ts, "-i", behind, "-ss", ts, "-i", front,
                            "-filter_complex", g, "-map", "[v]", "-frames:v", "1", out.replace(".png", f"_{ts}.png")], check=True)
        return
    # --audio <rendered.mp4>: keep that file's video stream and rebuild only the mix (inputs 1-2 are unused placeholders).
    audio_only = sys.argv[6] if len(sys.argv) > 6 and sys.argv[5] == "--audio" else None
    args = ["ffmpeg", "-v", "error", "-stats", "-y", "-i", raw, "-i", audio_only or behind, "-i", front]
    fc = [] if audio_only else [video_graph()]
    for i, (t, n, v) in enumerate(SFX):
        args += ["-i", os.path.join(SFX_DIR, f"{n}.wav")]
        ms = int(t * 1000)
        fc.append(f"[{i + 3}:a]aresample=44100,aformat=channel_layouts=stereo,volume={v},adelay={ms}|{ms}[s{i}]")
    # The raw voice sits near -36 dB mean; bring it to reel loudness so the SFX levels stay "medium" relative to it.
    fc.append(f"[0:a]aresample=44100,aformat=channel_layouts=stereo,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=44100,afade=t=out:st={DUR - 0.5}:d=0.5[base]")
    fc.append("[base]" + "".join(f"[s{i}]" for i in range(len(SFX))) + f"amix=inputs={len(SFX) + 1}:normalize=0:duration=first,alimiter=limit=0.95[a]")
    script = os.path.join(HERE, "graph.txt")
    open(script, "w", encoding="utf-8").write(";\n".join(fc))
    vcodec = ["-map", "1:v", "-c:v", "copy"] if audio_only else ["-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p"]
    args += ["-/filter_complex", script, *vcodec, "-map", "[a]", "-t", str(DUR), "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", out]
    subprocess.run(args, check=True)


main()

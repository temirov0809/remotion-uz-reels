import subprocess, sys
segs = [(5.98,12.4),(14.74,20.45),(27.0,35.9),(44.1,60.6)]
sfx = [(0.0,'thud',.35)]
for s,e in segs: sfx += [(s-0.12,'whoosh',.2),(e-0.55,'whoosh',.16)]
sfx += [(t,'pop',.22) for t in [0.0,3.34,12.62,25.26,38.94,40.8,41.3,41.92,42.56,43.58,67.04]]
sfx += [(t,'tick',.25) for t in [1.68,13.1,20.86,35.9,61.26]]
sfx += [(13.1,'ding',.12),(67.04,'ding',.14),(31.16,'whoosh',.14)]
sfx += [(t,'tick',.28) for t in [46.68,48.22,49.06,49.8,56.8,57.52]]
pub, video, out = sys.argv[1], sys.argv[2], sys.argv[3]
args = ['ffmpeg','-v','error','-y','-i',video,'-i',f'{pub}/base.mp4']
fc = []
for i,(t,n,v) in enumerate(sfx):
    args += ['-i', f'{pub}/{n}.wav']
    ms = int(round(t*30)/30*1000)
    fc.append(f'[{i+2}:a]aresample=44100,aformat=channel_layouts=stereo,volume={v},adelay={ms}|{ms}[s{i}]')
fc.append('[1:a]aresample=44100,afade=t=out:st=70.25:d=0.45[base]')
fc.append('[base]' + ''.join(f'[s{i}]' for i in range(len(sfx))) + f'amix=inputs={len(sfx)+1}:normalize=0:duration=first[a]')
args += ['-filter_complex', ';'.join(fc), '-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','256k','-shortest','-movflags','+faststart', out]
subprocess.run(args, check=True)

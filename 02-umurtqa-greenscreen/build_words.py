import json, re, sys
d = json.load(open(sys.argv[1], encoding="utf-8"))
words = []
for w in (w for s in d for w in s["words"]):
    t = w["w"].strip()
    if t.startswith("'") and words:
        words[-1]["t"] += t; words[-1]["e"] = w["e"]
    else:
        words.append({"t": t, "s": w["s"], "e": w["e"]})
fix = {"umurtqangizni": "Umurtqangizni", "qobir": "qobiq", "qobirning": "qobiqning", "yiliga": "jeleyga",
       "amaletizatsionniy": "amortizatsion", "xalqqa": "xalqa", "zayatlashib": "zaiflashib", "bemiriladi": "yemiriladi",
       "jley": "jeley", "diskoviy": "diskovaya", "churasini": "churrasini"}
out = []
for w in words:
    core = re.sub(r"[.,?!]+$", "", w["t"]); punct = w["t"][len(core):]
    out.append({"t": fix.get(core, core) + punct, "s": round(w["s"], 2), "e": round(w["e"], 2)})
chunks, cur = [], []
for j, w in enumerate(out):
    cur.append(w)
    gap = out[j+1]["s"] - w["e"] if j+1 < len(out) else 9
    if re.search(r"[.,?!]$", w["t"]) or len(cur) >= 4 or gap > 0.5:
        chunks.append(cur); cur = []
if cur: chunks.append(cur)
for c in chunks:
    for w in c: w["e"] = max(w["e"], w["s"] + 0.12)
json.dump({"chunks": [{"s": c[0]["s"], "e": c[-1]["e"], "words": c} for c in chunks]}, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(out), "words", len(chunks), "chunks")
print(" | ".join(" ".join(w["t"] for w in c) for c in chunks))

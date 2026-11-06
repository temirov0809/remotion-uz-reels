import json, re, sys
d = json.load(open(sys.argv[1], encoding="utf-8"))
raw = []
for w in (w for s in d for w in s["words"] if w["s"] < 52.4 and not (w["w"].strip() == "bemor." and abs(w["s"] - 29.98) < 0.02)):
    t = w["w"].strip()
    if t.startswith("'") and raw:
        raw[-1]["t"] += t; raw[-1]["e"] = w["e"]
    else:
        raw.append({"t": t, "s": w["s"], "e": w["e"]})
# phrase-level rewrites keyed by the first raw word's start time: (start, n_raw_words, replacement words)
REWRITE = {
    0.00: (3, "MRT xulosangizda"),
    1.52: (4, "5 mm-li disk churrasi chiqdi."),
    7.78: (1, "shoshilmang."),
    14.54: (1, "Neyroxirurgiyada"),
    22.30: (4, "nerv ildizini qanchalik darajada qisayotganligi."),
    31.60: (2, "10 mm-li"),
    33.70: (1, "davolanadi."),
    35.22: (1, "ayrim holatlarda"),
    42.34: (1, "sizning"),
}
fix = {"dissturrasi": "disk churrasi", "dissturrasining": "disk churrasining", "dissturrasini": "disk churrasini",
       "bu": "bu", "mrt": "MRT", "instagram": "Instagram", "telegram": "Telegram"}
out, i = [], 0
while i < len(raw):
    w = raw[i]
    key = next((k for k in REWRITE if abs(k - w["s"]) < 0.02), None)
    if key is not None:
        n, text = REWRITE[key]
        s, e = w["s"], raw[i + n - 1]["e"]; i += n
    else:
        core = re.sub(r"[.,?!]+$", "", w["t"]); punct = w["t"][len(core):]
        text = fix.get(core, core) + punct; s, e = w["s"], w["e"]; i += 1
    parts = text.split()
    step = (e - s) / len(parts)
    for k, p in enumerate(parts):
        out.append({"t": p, "s": round(s + k * step, 2), "e": round(s + (k + 1) * step, 2)})
for k, w in enumerate(out):  # sentence-initial capitals
    if k == 0 or re.search(r"[.?!]$", out[k - 1]["t"]):
        w["t"] = w["t"][:1].upper() + w["t"][1:]
chunks, cur = [], []
for j, w in enumerate(out):
    cur.append(w)
    gap = out[j + 1]["s"] - w["e"] if j + 1 < len(out) else 9
    if re.search(r"[.,?!]$", w["t"]) or len(cur) >= 3 or gap > 0.5:
        chunks.append(cur); cur = []
if cur: chunks.append(cur)
for c in chunks:
    for w in c: w["e"] = max(w["e"], w["s"] + 0.12)
json.dump({"chunks": [{"s": c[0]["s"], "e": c[-1]["e"], "words": c} for c in chunks]}, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(out), "words", len(chunks), "chunks")
print(" | ".join(" ".join(f"{w['t']}" for w in c) + f" @{c[0]['s']}" for c in chunks))

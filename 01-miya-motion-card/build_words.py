import json, re, sys
d = json.load(open(sys.argv[1], encoding="utf-8"))
toks = [w for s in d for w in s["words"] if w["s"] < 70.4]
words = []
for w in toks:
    t = w["w"].strip()
    if t.startswith("'") and words:
        words[-1]["t"] += t; words[-1]["e"] = w["e"]
    else:
        words.append({"t": t, "s": w["s"], "e": w["e"]})
# single-letter "o" before "'ng" already merged; fix spelling
fix = {"do'stlig'i": "po'stlog'i", "do'stlig'ida": "po'stlog'ida", "galda": "gavda", "ko'targanida": "ko'targanimda"}
out = []
i = 0
while i < len(words):
    w = words[i]; core = re.sub(r"[.,?!]+$", "", w["t"]); punct = w["t"][len(core):]
    nxt = words[i+1] if i+1 < len(words) else None
    if core == "miyam" and nxt and nxt["t"].startswith("kamchaklarimiz"):
        out.append({"t": "mimika", "s": w["s"], "e": w["e"]}); out.append({"t": "mushaklarimiz,", "s": nxt["s"], "e": nxt["e"]}); i += 2; continue
    if core in ("qarama", "ketma", "bir") and nxt and nxt["t"].rstrip(".,?") in ("qarshi", "ketligida", "biriga"):
        out.append({"t": core + "-" + nxt["t"], "s": w["s"], "e": nxt["e"]}); i += 2; continue
    if core in fix: core = fix[core]
    out.append({"t": core + punct, "s": w["s"], "e": w["e"]}); i += 1
out[0]["t"] = "Qo'lingizni"
# phrase chunks: break after punctuation, at >3 words, or on long gaps
chunks, cur = [], []
for j, w in enumerate(out):
    cur.append(w)
    gap = out[j+1]["s"] - w["e"] if j+1 < len(out) else 9
    if re.search(r"[.,?!]$", w["t"]) or len(cur) >= 3 or gap > 0.5:
        chunks.append(cur); cur = []
if cur: chunks.append(cur)
for c in chunks:
    for w in c: w["e"] = max(w["e"], w["s"] + 0.12)
json.dump({"chunks": [{"s": c[0]["s"], "e": c[-1]["e"], "words": c} for c in chunks]}, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(out), "words", len(chunks), "chunks")
print(" | ".join(" ".join(w["t"] for w in c) for c in chunks))

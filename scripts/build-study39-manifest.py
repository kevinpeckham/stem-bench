#!/usr/bin/env python3 -I
"""Study 39 (docs/BRIEF-STUDY39.md): build corpus/study39-manifest.json,
the free-tempo bar corpus with annotated bar lines. No model spend.

  winterreise  48 performances (SC06 and HU33, 24 songs each) from the
               Study 38 manifest: audio-time measure annotations.
  jaah         the three acoustic-era 78s with JAAH beat-aligned bar
               truth (corpus/study34-truth/*.barsAligned): steady drift
               rather than rubato, the Study 36 reference.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
s38 = json.load(open(ROOT / "corpus" / "study38-manifest.json"))["entries"]
s36 = json.load(open(ROOT / "corpus" / "study36-corpus.json"))["rows"]
entries = {}
for slug, e in s38.items():
    if e["arm"] in ("C", "C-metrical"):
        entries[slug] = {
            "group": "winterreise",
            "performance": slug.split("-")[-1].upper(),
            "raw": e["raw"],
            "sha256": e.get("sha256"),
            "license": e.get("license"),
            "annotatedBars": e["annotatedBars"],
            "chordChanges": len(e["truth"]["timedChords"]),
        }
for r in s36:
    d = r.get("downbeats")
    if d and d.get("kind") == "jaah":
        truth = json.load(open(ROOT / d["truth"]))
        entries[r["slug"]] = {
            "group": "jaah",
            "performance": r["slug"],
            "raw": r["raw"],
            "license": "public domain (pre-1926 recording)",
            "annotatedBars": [b["start"] for b in truth["barsAligned"]],
            "declaredBpm": r["bpm"],
        }
out = ROOT / "corpus" / "study39-manifest.json"
out.write_text(json.dumps({"note": __doc__.strip(), "entries": entries}, indent="\t") + "\n")
from collections import Counter

print(Counter(e["group"] for e in entries.values()), "->", out)

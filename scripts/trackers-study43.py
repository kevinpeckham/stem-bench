#!/usr/bin/env python3
"""Study 43 (docs/BRIEF-STUDY43.md), $0: Beat This small0 (the tracker the
app ships after Study 41) over the twelve dense GuitarSet excerpts of the
corpus; the Winterreise readings come from results/study39-trackers.json.
Writes results/study43-trackers.json {slug: {"beatthis-small0": {beats,
downbeats, seconds}}}. Run under .venv-study36.
"""
import json
import time
import warnings
from pathlib import Path

import numpy as np

warnings.filterwarnings("ignore")
ROOT = Path(__file__).resolve().parent.parent
SR = 22050
manifest = json.load(open(ROOT / "corpus" / "study43-manifest.json"))["entries"]
s39 = json.load(open(ROOT / "results" / "study39-trackers.json"))
out_path = ROOT / "results" / "study43-trackers.json"
results = json.load(open(out_path)) if out_path.exists() else {}
for slug in manifest:
    if slug in s39 and "beatthis-small0" in s39[slug]:
        results.setdefault(slug, {})["beatthis-small0"] = s39[slug]["beatthis-small0"]

from beat_this.inference import Audio2Beats  # noqa: E402

model = Audio2Beats(checkpoint_path="small0", device="cpu", dbn=False)
for slug, e in manifest.items():
    if "beatthis-small0" in results.get(slug, {}):
        continue
    sig = np.fromfile(ROOT / e["raw"], dtype=np.float32)
    t0 = time.time()
    beats, downbeats = model(sig, SR)
    results.setdefault(slug, {})["beatthis-small0"] = {
        "beats": [round(float(b), 4) for b in beats],
        "downbeats": [round(float(d), 4) for d in downbeats],
        "seconds": round(time.time() - t0, 1),
    }
    print(f"[{slug}] {len(sig) / SR:.1f}s: {len(beats)} beats / {len(downbeats)} downbeats ({time.time() - t0:.0f}s)", flush=True)
out_path.write_text(json.dumps(results))
print(f"wrote {out_path}")

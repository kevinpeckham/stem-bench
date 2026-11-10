#!/usr/bin/env python3
"""Study 41 arm D (docs/BRIEF-STUDY41.md), $0: the Study 10 ONNX export of
Beat This small0 (models/study10/small0.onnx, run by
scripts/study10/nbeat.py with the front end and the minimal
postprocessor translated to numpy) over the ten modern songs of Study
38's arm A, so run-study41-zero.ts can compare its downbeats with the
torch package's small0 (results/study36-trackers.json). Writes
results/study41-onnx.json {slug: {beats, downbeats, seconds, meter,
tempo, beatsPerBarCounts}}. Run under .venv-study10.
"""
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts" / "study10"))
import nbeat  # noqa: E402

manifest = json.load(open(ROOT / "corpus" / "study38-manifest.json"))["entries"]
model = str(ROOT / "models" / "study10" / "small0.onnx")
out = {}
for slug, e in manifest.items():
    if e["arm"] != "A":
        continue
    t0 = time.time()
    r = nbeat.run(str(ROOT / e["raw"]), 22050, model)
    r["seconds"] = round(time.time() - t0, 1)
    out[slug] = r
    print(f"{slug}: {r['beatCount']} beats / {r['downbeatCount']} downbeats, {r['tempo']} bpm {r['meter']} ({r['seconds']}s)", flush=True)
(ROOT / "results" / "study41-onnx.json").write_text(json.dumps(out) + "\n")
print("wrote results/study41-onnx.json")

#!/usr/bin/env python3
"""Study 36b (docs/BRIEF-STUDY36B.md): run the trackers over the Josh
Woodward catalog (corpus/study36b-manifest.json; audio in
corpus-study36/, not committed). Regular mixes: Beat This! final0 and
small0 (minimal peak-picking) and madmom RNN+DBN [3, 4]. Instrumental
mixes: final0 and small0. Resumable; writes results/study36b-trackers.json
{"<slug>|regular": {system: {beats, downbeats, seconds}}, ...}. No model
spend. Run with python -I."""
import json
import sys
import time
import warnings
from pathlib import Path

import numpy as np

warnings.filterwarnings("ignore")
ROOT = Path(__file__).resolve().parent.parent
SR = 22050
manifest = json.load(open(ROOT / "corpus" / "study36b-manifest.json"))["entries"]
out_path = ROOT / "results" / "study36b-trackers.json"
results = json.load(open(out_path)) if out_path.exists() else {}

from beat_this.inference import Audio2Beats  # noqa: E402
from madmom.audio.signal import Signal  # noqa: E402
from madmom.features.downbeats import DBNDownBeatTrackingProcessor, RNNDownBeatProcessor  # noqa: E402

bt_final = Audio2Beats(checkpoint_path="final0", device="cpu", dbn=False)
bt_small = Audio2Beats(checkpoint_path="small0", device="cpu", dbn=False)
rnn = RNNDownBeatProcessor()
dbn34 = DBNDownBeatTrackingProcessor(beats_per_bar=[3, 4], fps=100)

PLAN = {"regular": ("beatthis-final0", "beatthis-small0", "madmom-34"), "instrumental": ("beatthis-final0", "beatthis-small0")}
jobs = [(slug, kind) for slug, e in manifest.items() for kind in PLAN if kind in e and e.get("bpm") and e.get("meter")]
print(f"{len(jobs)} recordings", flush=True)
pending_writes = 0


def record(key, system, beats, downbeats, seconds):
    global pending_writes
    results.setdefault(key, {})[system] = {
        "beats": [round(float(b), 3) for b in beats],
        "downbeats": [round(float(d), 3) for d in downbeats],
        "seconds": round(seconds, 1),
    }
    pending_writes += 1
    if pending_writes >= 3:
        out_path.write_text(json.dumps(results))
        pending_writes = 0


for n, (slug, kind) in enumerate(jobs, 1):
    key = f"{slug}|{kind}"
    done = results.get(key, {})
    if all(s in done for s in PLAN[kind]):
        continue
    sig = np.fromfile(ROOT / "corpus-study36" / kind / f"{manifest[slug][kind]['file']}.22050.f32le.raw", dtype=np.float32)
    t_start = time.time()
    for name, model in (("beatthis-final0", bt_final), ("beatthis-small0", bt_small)):
        if name in done or name not in PLAN[kind]:
            continue
        t0 = time.time()
        beats, downbeats = model(sig, SR)
        record(key, name, beats, downbeats, time.time() - t0)
    if "madmom-34" in PLAN[kind] and "madmom-34" not in done:
        t0 = time.time()
        out = dbn34(rnn(Signal(sig, sample_rate=SR)))
        times, pos = out[:, 0], out[:, 1]
        record(key, "madmom-34", times, times[pos == 1], time.time() - t0)
    print(f"[{n}/{len(jobs)}] {key} {len(sig) / SR:.0f}s audio in {time.time() - t_start:.0f}s", flush=True)

out_path.write_text(json.dumps(results))
print(f"wrote {out_path}")

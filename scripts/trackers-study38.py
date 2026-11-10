#!/usr/bin/env python3
"""Study 38 (docs/BRIEF-STUDY38.md): beat and downbeat trackers over the
free-tempo corpus (corpus/study38-manifest.json). No model spend. Systems:
madmom RNNDownBeat + DBN with bars of 3 or 4 (the Study 36 S36-D1 winner)
and Beat This! final0 (peak-picking). Output results/study38-trackers.json
{slug: {system: {beats, downbeats, seconds}}}, resumable.

Usage: trackers-study38.py <manifest.json> <out.json>
Manifest entries: {slug: {"raw": "<path relative to repo root>", ...}}.
"""
import json
import sys
import time
import warnings
from pathlib import Path

import numpy as np

warnings.filterwarnings("ignore")
ROOT = Path(__file__).resolve().parent.parent
SR = 22050
manifest = json.load(open(ROOT / sys.argv[1]))["entries"]
out_path = ROOT / sys.argv[2]
results = json.load(open(out_path)) if out_path.exists() else {}

from beat_this.inference import Audio2Beats  # noqa: E402
from madmom.audio.signal import Signal  # noqa: E402
from madmom.features.downbeats import DBNDownBeatTrackingProcessor, RNNDownBeatProcessor  # noqa: E402

bt_final = Audio2Beats(checkpoint_path="final0", device="cpu", dbn=False)
rnn = RNNDownBeatProcessor()
dbn34 = DBNDownBeatTrackingProcessor(beats_per_bar=[3, 4], fps=100)


def record(slug, system, beats, downbeats, seconds):
    results.setdefault(slug, {})[system] = {
        "beats": [round(float(b), 4) for b in beats],
        "downbeats": [round(float(d), 4) for d in downbeats],
        "seconds": round(seconds, 1),
    }
    out_path.write_text(json.dumps(results))


for slug, e in manifest.items():
    done = results.get(slug, {})
    if "madmom-34" in done and "beatthis-final0" in done:
        continue
    sig = np.fromfile(ROOT / e["raw"], dtype=np.float32)
    print(f"[{slug}] {len(sig) / SR:.1f}s", flush=True)
    if "beatthis-final0" not in done:
        t0 = time.time()
        beats, downbeats = bt_final(sig, SR)
        record(slug, "beatthis-final0", beats, downbeats, time.time() - t0)
        print(f"  beatthis-final0: {len(beats)} beats / {len(downbeats)} downbeats ({time.time() - t0:.0f}s)", flush=True)
    if "madmom-34" not in done:
        t0 = time.time()
        out = dbn34(rnn(Signal(sig, sample_rate=SR)))
        times, pos = out[:, 0], out[:, 1]
        record(slug, "madmom-34", times, times[pos == 1], time.time() - t0)
        print(f"  madmom-34: {len(times)} beats / {int((pos == 1).sum())} downbeats, bar of {int(pos.max())} ({time.time() - t0:.0f}s)", flush=True)

print(f"wrote {out_path}")

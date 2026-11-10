#!/usr/bin/env python3
"""Study 39 (docs/BRIEF-STUDY39.md): downbeat trackers over the free-tempo
corpus (corpus/study39-manifest.json). No model spend. Systems:

  beatthis-final0        Beat This! final0, peak-picking
  beatthis-small0        Beat This! small0, peak-picking
  beatthis-final0-dbn    Beat This! final0 + madmom DBN post-processing
  madmom-34-l100         madmom RNNDownBeat + DBN, bars of 3 or 4, transition_lambda 100 (default; Study 36/38)
  madmom-34-l30          ... transition_lambda 30
  madmom-34-l10          ... transition_lambda 10
  madmom-34-l3           ... transition_lambda 3 (tempo may change freely between beats)
  madmom-346-l100        madmom, bars of 3, 4 or 6, lambda 100

Output results/study39-trackers.json {slug: {system: {beats, downbeats, seconds}}},
resumable; Winterreise cells for beatthis-final0 and madmom-34-l100 are seeded
from results/study38-trackers.json (identical configurations).
"""
import json
import time
import warnings
from pathlib import Path

import numpy as np

warnings.filterwarnings("ignore")
ROOT = Path(__file__).resolve().parent.parent
SR = 22050
manifest = json.load(open(ROOT / "corpus" / "study39-manifest.json"))["entries"]
out_path = ROOT / "results" / "study39-trackers.json"
results = json.load(open(out_path)) if out_path.exists() else {}

s38_path = ROOT / "results" / "study38-trackers.json"
if s38_path.exists():
    s38 = json.load(open(s38_path))
    for slug in manifest:
        if slug in s38:
            for src, dst in (("beatthis-final0", "beatthis-final0"), ("madmom-34", "madmom-34-l100")):
                if src in s38[slug]:
                    results.setdefault(slug, {}).setdefault(dst, s38[slug][src])
    out_path.write_text(json.dumps(results))

from beat_this.inference import Audio2Beats  # noqa: E402
from madmom.audio.signal import Signal  # noqa: E402
from madmom.features.downbeats import DBNDownBeatTrackingProcessor, RNNDownBeatProcessor  # noqa: E402

bt = {
    "beatthis-final0": Audio2Beats(checkpoint_path="final0", device="cpu", dbn=False),
    "beatthis-small0": Audio2Beats(checkpoint_path="small0", device="cpu", dbn=False),
    "beatthis-final0-dbn": Audio2Beats(checkpoint_path="final0", device="cpu", dbn=True),
}
rnn = RNNDownBeatProcessor()
dbns = {
    "madmom-34-l100": DBNDownBeatTrackingProcessor(beats_per_bar=[3, 4], fps=100, transition_lambda=100),
    "madmom-34-l30": DBNDownBeatTrackingProcessor(beats_per_bar=[3, 4], fps=100, transition_lambda=30),
    "madmom-34-l10": DBNDownBeatTrackingProcessor(beats_per_bar=[3, 4], fps=100, transition_lambda=10),
    "madmom-34-l3": DBNDownBeatTrackingProcessor(beats_per_bar=[3, 4], fps=100, transition_lambda=3),
    "madmom-346-l100": DBNDownBeatTrackingProcessor(beats_per_bar=[3, 4, 6], fps=100, transition_lambda=100),
}
ALL = list(bt) + list(dbns)


def record(slug, system, beats, downbeats, seconds):
    results.setdefault(slug, {})[system] = {
        "beats": [round(float(b), 4) for b in beats],
        "downbeats": [round(float(d), 4) for d in downbeats],
        "seconds": round(seconds, 1),
    }
    out_path.write_text(json.dumps(results))


for slug, e in manifest.items():
    done = results.get(slug, {})
    if all(k in done for k in ALL):
        continue
    sig = np.fromfile(ROOT / e["raw"], dtype=np.float32)
    print(f"[{slug}] {len(sig) / SR:.1f}s", flush=True)
    for name, model in bt.items():
        if name in done:
            continue
        t0 = time.time()
        beats, downbeats = model(sig, SR)
        record(slug, name, beats, downbeats, time.time() - t0)
        print(f"  {name}: {len(beats)} beats / {len(downbeats)} downbeats ({time.time() - t0:.0f}s)", flush=True)
    if any(k not in done for k in dbns):
        t0 = time.time()
        act = rnn(Signal(sig, sample_rate=SR))
        t_act = time.time() - t0
        for name, dbn in dbns.items():
            if name in done:
                continue
            t1 = time.time()
            out = dbn(act)
            times, pos = out[:, 0], out[:, 1]
            record(slug, name, times, times[pos == 1], t_act + time.time() - t1)
            print(f"  {name}: {len(times)} beats / {int((pos == 1).sum())} downbeats, bar of {int(pos.max())} ({time.time() - t1:.0f}s)", flush=True)

print(f"wrote {out_path}")

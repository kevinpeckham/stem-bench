#!/usr/bin/env python3
"""Study 36 (docs/BRIEF-STUDY36.md): run the field's beat/downbeat
trackers over the registered corpus and persist raw beat and downbeat
times per system. No model spend; local inference only. Systems:

  beatthis-final0        Beat This! final0, minimal peak-picking (dbn=False)
  beatthis-small0        Beat This! small0, minimal peak-picking
  beatthis-final0-dbn    Beat This! final0 + madmom DBN (exploratory)
  madmom-34              madmom RNNDownBeat + DBN, beats_per_bar [3, 4]
  madmom-346             madmom RNNDownBeat + DBN, beats_per_bar [3, 4, 6] (exploratory)
  librosa                librosa.beat.beat_track default (beats only; tempo baseline)

Output: results/study36-trackers.json {slug: {system: {beats, downbeats, seconds}}}.
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

corpus = json.load(open(ROOT / "corpus" / "study36-corpus.json"))["rows"]
out_path = ROOT / "results" / "study36-trackers.json"
results = json.load(open(out_path)) if out_path.exists() else {}

from beat_this.inference import Audio2Beats  # noqa: E402
from madmom.audio.signal import Signal  # noqa: E402
from madmom.features.downbeats import DBNDownBeatTrackingProcessor, RNNDownBeatProcessor  # noqa: E402
import librosa  # noqa: E402

bt_final = Audio2Beats(checkpoint_path="final0", device="cpu", dbn=False)
bt_small = Audio2Beats(checkpoint_path="small0", device="cpu", dbn=False)
bt_final_dbn = Audio2Beats(checkpoint_path="final0", device="cpu", dbn=True)
rnn = RNNDownBeatProcessor()
dbn34 = DBNDownBeatTrackingProcessor(beats_per_bar=[3, 4], fps=100)
dbn346 = DBNDownBeatTrackingProcessor(beats_per_bar=[3, 4, 6], fps=100)


def record(slug, system, beats, downbeats, seconds):
    results.setdefault(slug, {})[system] = {
        "beats": [round(float(b), 4) for b in beats],
        "downbeats": [round(float(d), 4) for d in downbeats],
        "seconds": round(seconds, 1),
    }
    out_path.write_text(json.dumps(results))


for row in corpus:
    slug = row["slug"]
    done = results.get(slug, {})
    if all(k in done for k in ("beatthis-final0", "beatthis-small0", "beatthis-final0-dbn", "madmom-34", "madmom-346", "librosa")):
        print(f"[{slug}] already done", flush=True)
        continue
    sig = np.fromfile(ROOT / row["raw"], dtype=np.float32)
    print(f"[{slug}] {len(sig) / SR:.1f}s", flush=True)
    for name, model in (("beatthis-final0", bt_final), ("beatthis-small0", bt_small), ("beatthis-final0-dbn", bt_final_dbn)):
        if name in done:
            continue
        t0 = time.time()
        beats, downbeats = model(sig, SR)
        record(slug, name, beats, downbeats, time.time() - t0)
        print(f"  {name}: {len(beats)} beats / {len(downbeats)} downbeats ({time.time() - t0:.0f}s)", flush=True)
    if "madmom-34" not in done or "madmom-346" not in done:
        t0 = time.time()
        act = rnn(Signal(sig, sample_rate=SR))
        t_act = time.time() - t0
        for name, dbn in (("madmom-34", dbn34), ("madmom-346", dbn346)):
            if name in done:
                continue
            t1 = time.time()
            out = dbn(act)
            times, pos = out[:, 0], out[:, 1]
            record(slug, name, times, times[pos == 1], t_act + time.time() - t1)
            print(f"  {name}: {len(times)} beats / {int((pos == 1).sum())} downbeats, bar of {int(pos.max())} ({t_act + time.time() - t1:.0f}s)", flush=True)
    if "librosa" not in done:
        t0 = time.time()
        _tempo, beats = librosa.beat.beat_track(y=sig, sr=SR, units="time")
        record(slug, "librosa", beats, [], time.time() - t0)
        print(f"  librosa: {len(beats)} beats ({time.time() - t0:.0f}s)", flush=True)

print(f"wrote {out_path}")

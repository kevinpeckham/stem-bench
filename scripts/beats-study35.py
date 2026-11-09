#!/usr/bin/env python3
"""Study 35 arm D (docs/BRIEF-STUDY35.md): librosa's dynamic-programming
beat tracker on a mono f32le raw, started at the declared tempo, beat
times out as JSON. The tempo-following grid Kevin asked about."""
import argparse
import json

import librosa
import numpy as np

p = argparse.ArgumentParser()
p.add_argument("--raw", required=True)
p.add_argument("--sr", type=int, default=22050)
p.add_argument("--start-bpm", type=float, required=True)
p.add_argument("--out", required=True)
a = p.parse_args()

y = np.fromfile(a.raw, dtype=np.float32)
tempo, beats = librosa.beat.beat_track(y=y, sr=a.sr, start_bpm=a.start_bpm, trim=False, units="time")
with open(a.out, "w") as f:
    json.dump({"tempo": float(np.atleast_1d(tempo)[0]), "beats": [float(b) for b in beats]}, f)
print(f"{a.raw}: {len(beats)} beats, global tempo {float(np.atleast_1d(tempo)[0]):.1f}")

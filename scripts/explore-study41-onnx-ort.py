"""EXPLORATORY (Study 41 arm D addendum): the ONNX small0's frame logits on
the torch front end's spectrogram, at chunk 250 (the Study 10 runner's
size) and 1500 (the reference's), against the torch model's logits at
both sizes. Separates "different weights" from "different chunking"."""
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch

sys.path.insert(0, "/home/exedev/projects/stem-bench/scripts/study10")
import nbeat  # noqa: E402

OUT = Path(sys.argv[1])
session = ort.InferenceSession("/home/exedev/projects/stem-bench/models/study10/small0.onnx", providers=["CPUExecutionProvider"])


def onnx_logits(spect: np.ndarray, chunk: int):
    chunks, starts = nbeat.split_piece(torch.from_numpy(spect), chunk, nbeat.BORDER_SIZE, avoid_short_end=True)
    preds = []
    for c in chunks:
        b, d = session.run(["beat", "downbeat"], {"spectrogram": c.numpy()[None, :, :]})
        preds.append({"beat": b[0].astype(np.float64), "downbeat": d[0].astype(np.float64)})
    return nbeat.aggregate_prediction(preds, starts, len(spect), chunk, nbeat.BORDER_SIZE, "keep_first")


def peaks(x):
    return int(np.sum((x == nbeat.window_max(x)) & (x > 0)))


def compare(a, b):
    m = np.isfinite(a) & np.isfinite(b) & (a > -999) & (b > -999)
    return f"r {np.corrcoef(a[m], b[m])[0, 1]:.3f} maxabs {np.max(np.abs(a[m] - b[m])):.2f} peaks {peaks(a)} vs {peaks(b)}"


for slug in ["jw-cherubs", "jw-let-it-in", "jw-california-lullabye"]:
    spect = np.load(OUT / f"{slug}.spect.npy")
    o250 = onnx_logits(spect, 250)
    o1500 = onnx_logits(spect, 1500)
    t250 = (np.load(OUT / f"{slug}.torch250.beat.npy"), np.load(OUT / f"{slug}.torch250.downbeat.npy"))
    t1500 = (np.load(OUT / f"{slug}.torch1500.beat.npy"), np.load(OUT / f"{slug}.torch1500.downbeat.npy"))
    print(slug)
    for i, name in enumerate(["beat", "downbeat"]):
        print(f"  {name:8s} onnx250 vs torch250:  {compare(o250[i], t250[i])}")
        print(f"  {name:8s} onnx1500 vs torch1500: {compare(o1500[i], t1500[i])}")
        print(f"  {name:8s} torch250 vs torch1500: {compare(t250[i], t1500[i])}")
        print(f"  {name:8s} onnx250 vs torch1500:  {compare(o250[i], t1500[i])}")

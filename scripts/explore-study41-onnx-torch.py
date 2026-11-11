"""EXPLORATORY (Study 41 arm D addendum, not registered; run from the scratchpad, output results/study41-onnx-diag.txt): the torch small0's
frame logits at the reference chunk size (1500) and at the ONNX runner's
chunk size (250), on two songs, so the ONNX export's logits can be
compared against each in the other venv."""
import json
import sys
from pathlib import Path

import numpy as np
import torch
from beat_this.inference import load_model, split_predict_aggregate
from beat_this.preprocessing import LogMelSpect

ROOT = Path("/home/exedev/projects/stem-bench")
OUT = Path(sys.argv[1])
manifest = json.load(open(ROOT / "corpus" / "study38-manifest.json"))["entries"]
model = load_model("small0", "cpu")
spect_fn = LogMelSpect(device="cpu")
for slug in ["jw-cherubs", "jw-let-it-in", "jw-california-lullabye"]:
    sig = np.fromfile(ROOT / manifest[slug]["raw"], dtype=np.float32)
    with torch.inference_mode():
        spect = spect_fn(torch.from_numpy(sig))
        np.save(OUT / f"{slug}.spect.npy", spect.numpy())
        for chunk in (1500, 250):
            pred = split_predict_aggregate(spect=spect, chunk_size=chunk, overlap_mode="keep_first", border_size=6, model=model)
            np.save(OUT / f"{slug}.torch{chunk}.beat.npy", pred["beat"].float().numpy())
            np.save(OUT / f"{slug}.torch{chunk}.downbeat.npy", pred["downbeat"].float().numpy())
    print(slug, spect.shape, "saved", flush=True)

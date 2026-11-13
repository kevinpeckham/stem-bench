#!/usr/bin/env python3
"""Study 52 (docs/BRIEF-STUDY52.md): a second transcriber for the bass stems.

xavriley/hf_midi_transcription (MIT), its bass checkpoint
(filobass_20000_iterations.pth from the Hugging Face repo
xavriley/midi-transcription-models), run as shipped: the
Regress_onset_offset_frame_velocity_CRNN of the piano_transcription_inference
fork, onset threshold 0.3, offset 0.3, frame 0.1, on Kevin's stem loaded at
16 kHz mono. No truth is read here. Writes <stem folder>/study52/hfbass.json
as [startSec, durationSec, pitchMidi, velocity] rows in stem time (gitignored).

    .venv-study52/bin/python -I scripts/study52-hfbass.py [slug ...]

The checkpoint is a pickle and the library loads it without the safe
unpickler. This script never lets it: it loads the download with torch's
weights-only unpickler, allowing only the numpy array constructors the file
names (a static scan of its pickle found OrderedDict, numpy ndarray, dtype and
_reconstruct, _codecs.encode and torch's own tensor rebuilders, nothing else),
saves the state dict alone to models/study52/ (gitignored), and gives the
library that copy.
"""
import hashlib
import json
import sys
import time
from pathlib import Path

import torch
from huggingface_hub import hf_hub_download
from librosa.core import load
from piano_transcription_inference import PianoTranscription, sample_rate

ROOT = Path(__file__).resolve().parent.parent
REPO = "xavriley/midi-transcription-models"
FILE = "filobass_20000_iterations.pth"

man = json.loads((ROOT / "corpus" / "study48-manifest.json").read_text())
ckpt = hf_hub_download(repo_id=REPO, filename=FILE)
sha = hashlib.sha256(Path(ckpt).read_bytes()).hexdigest()
import _codecs  # noqa: E402

import numpy as np  # noqa: E402

# the file names numpy's constructor by its numpy 1 path; torch matches allowed globals by name, so the pair says which object that name means
allowed = [np.ndarray, np.dtype, _codecs.encode, (np._core.multiarray._reconstruct, "numpy.core.multiarray._reconstruct"), *{type(np.dtype(k)) for k in ("float32", "float64", "int64", "int32")}]
with torch.serialization.safe_globals(allowed):
    safe = torch.load(ckpt, map_location="cpu", weights_only=True)
if not isinstance(safe, dict) or "model" not in safe or not all(isinstance(v, torch.Tensor) for v in safe["model"].values()):
    raise SystemExit("the checkpoint is not a plain state dict")
print(f"checkpoint {FILE} sha256 {sha}, {len(safe['model'])} tensors, other keys {sorted(k for k in safe if k != 'model')}")
clean = ROOT / "models" / "study52" / "filobass-state.pth"
clean.parent.mkdir(parents=True, exist_ok=True)
torch.save({"model": safe["model"]}, clean)
ckpt = str(clean)
del safe

torch.set_num_threads(8)
model = PianoTranscription("Regress_onset_offset_frame_velocity_CRNN", device="cpu", checkpoint_path=ckpt, segment_samples=10 * sample_rate, batch_size=8)
for slug in sys.argv[1:] or list(man["entries"]):
    e = man["entries"][slug]
    out = ROOT / Path(e["raw"]).parent / "study52"
    out.mkdir(exist_ok=True)
    t = time.time()
    audio, _ = load(str(ROOT / e["wav"]), sr=sample_rate, mono=True)
    events = model.transcribe(audio, None)["est_note_events"]
    rows = [[float(ev["onset_time"]), float(ev["offset_time"] - ev["onset_time"]), int(ev["midi_note"]), int(ev["velocity"])] for ev in events]
    (out / "hfbass.json").write_text(json.dumps(rows))
    (out / "hfbass.meta.json").write_text(json.dumps({"repo": REPO, "file": FILE, "sha256": sha, "seconds": len(audio) / sample_rate, "notes": len(rows)}))
    print(f"{slug}: {len(rows)} notes from {len(audio) / sample_rate:.0f} s ({time.time() - t:.0f} s)")

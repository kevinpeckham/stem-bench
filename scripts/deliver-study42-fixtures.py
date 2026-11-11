#!/usr/bin/env python3
"""Study 42 delivery (stem-shovel docs/bench-brief-beat-this-port-2026-11-11.md):
the static small0 export as a base64 JSON module in ChordMini's shape, and
synthetic-audio fixtures that pin each stage of the app's port to the
package: the log-mel front end, the first window as fed to the export and
the export's logits for it, the stitched full-length logits, and the
package's own beats, downbeats, tempo and beats-per-bar counts. Run under
.venv-study36:  deliver-study42-fixtures.py <out-dir>
Writes <out-dir>/model.json and <out-dir>/fixtures/{*.f32, manifest.json,
expected.json}. No rights-bearing audio: the signal is synthesized here.
"""
import base64
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
import torchaudio
import beat_this
from beat_this.inference import Audio2Beats, split_piece
from beat_this.preprocessing import LogMelSpect
import importlib.metadata as md

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts" / "study10"))
import nbeat  # noqa: E402  (aggregate_prediction, postp_minimal, numpy; verified identical to the package in Study 42)

OUT = Path(sys.argv[1])
FIX = OUT / "fixtures"
FIX.mkdir(parents=True, exist_ok=True)
SR = 22050
CHUNK, BORDER = 1500, 6
EXPORT = ROOT / "models" / "study42" / "beat_this-small0-static1500.onnx"

# --- the model as a JSON module (ChordMini's shape) ---
onnx_bytes = EXPORT.read_bytes()
sha = hashlib.sha256(onnx_bytes).hexdigest()
assert sha.startswith("d57ae630"), sha
(OUT / "model.json").write_text(json.dumps({"sha256": sha, "bytes": len(onnx_bytes), "base64": base64.b64encode(onnx_bytes).decode("ascii")}, indent="\t") + "\n")

# --- synthetic audio: 32 s, 4/4 at 110 bpm, a drum-kit pattern (kick on 1 and 3 with the downbeat accented,
#     snare on 2 and 4, hats on the eighths), a bass note on each downbeat alternating C and G, a quiet
#     triad pad changing by the bar. Chosen from six candidates as the one the package reads as a steady
#     4/4 (59 beats, 15 downbeats, every bar 4 beats; a click-only pattern read as 200 bpm with broken bars).
SECONDS, BPM = 32.0, 110.0
n = int(SECONDS * SR)
rng = np.random.default_rng(42)
audio = np.zeros(n, dtype=np.float64)
beat = 60.0 / BPM
def burst(at, length, fn):
    i0 = int(at * SR); i1 = min(n, i0 + int(length * SR))
    if i0 < n:
        tt = np.arange(i1 - i0) / SR
        audio[i0:i1] += fn(tt)
k = 0
at = 0.0
while at < SECONDS:
    pos = k % 4
    if pos in (0, 2):
        a = 1.0 if pos == 0 else 0.8
        burst(at, 0.3, lambda tt, a=a: a * np.sin(2 * np.pi * (55 + 40 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 12))
    if pos in (1, 3):
        burst(at, 0.15, lambda tt: 0.5 * rng.standard_normal(len(tt)) * np.exp(-tt * 30) + 0.3 * np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 40))
    for sub in (0, 0.5):
        burst(at + sub * beat, 0.05, lambda tt: 0.15 * rng.standard_normal(len(tt)) * np.exp(-tt * 150))
    if pos == 0:
        f = 65.41 if (k // 4) % 2 == 0 else 49.0  # C2, G1
        burst(at, 4 * beat, lambda tt, f=f: 0.35 * np.sin(2 * np.pi * f * tt) * np.exp(-tt * 1.2))
    k += 1
    at += beat
bar = 4 * beat
for b in range(int(SECONDS / bar) + 1):
    freqs = [261.63, 329.63, 392.0] if b % 2 == 0 else [196.0, 246.94, 293.66]  # C major, G major
    i0 = int(b * bar * SR); i1 = min(n, int((b + 1) * bar * SR))
    tt = np.arange(i1 - i0) / SR
    env = np.minimum(1, tt * 20) * np.minimum(1, (len(tt) / SR - tt) * 20)
    for f in freqs:
        audio[i0:i1] += 0.06 * env * np.sin(2 * np.pi * f * tt)
audio = (0.9 * audio / np.max(np.abs(audio))).astype(np.float32)
(FIX / "audio.f32").write_bytes(audio.tobytes())

# --- the package's front end ---
with torch.inference_mode():
    spect = LogMelSpect(device="cpu")(torch.from_numpy(audio))
spect_np = spect.numpy().astype(np.float32)
(FIX / "logmel.f32").write_bytes(spect_np.tobytes())

# --- the first window exactly as fed, and the export's logits for it ---
chunks, starts = split_piece(spect, CHUNK, BORDER, avoid_short_end=True)
assert len(chunks) >= 2, f"{len(chunks)} chunks; the fixture must span two windows"
chunk0 = chunks[0].numpy().astype(np.float32)
assert chunk0.shape == (CHUNK, 128), chunk0.shape
(FIX / "chunk0.f32").write_bytes(chunk0.tobytes())
sess = ort.InferenceSession(str(EXPORT), providers=["CPUExecutionProvider"])
preds = []
for i, c in enumerate(chunks):
    c = c.numpy().astype(np.float32)
    if len(c) < CHUNK:
        c = np.pad(c, ((0, CHUNK - len(c)), (0, 0)))
    b, d = sess.run(["beat", "downbeat"], {"spectrogram": c[None]})
    if i == 0:
        (FIX / "chunk0-beat.f32").write_bytes(b[0].astype(np.float32).tobytes())
        (FIX / "chunk0-downbeat.f32").write_bytes(d[0].astype(np.float32).tobytes())
    preds.append({"beat": b[0].astype(np.float64), "downbeat": d[0].astype(np.float64)})
beat_l, down_l = nbeat.aggregate_prediction(preds, [int(s) for s in starts], len(spect), CHUNK, BORDER, "keep_first")
(FIX / "beat-logits.f32").write_bytes(beat_l.astype(np.float32).tobytes())
(FIX / "downbeat-logits.f32").write_bytes(down_l.astype(np.float32).tobytes())

# --- the package's own reading, and the derivations ---
pkg = Audio2Beats(checkpoint_path="small0", device="cpu", dbn=False)
beats, downs = pkg(audio, SR)
beats = [round(float(x), 4) for x in beats]
downs = [round(float(x), 4) for x in downs]
# the export's reading through the numpy postprocessor, for the record (must equal the package's)
e_beats = nbeat.postp_minimal(beat_l)
e_downs = nbeat.postp_minimal(down_l)
if len(e_beats):
    e_downs = np.unique(np.array([e_beats[np.argmin(np.abs(e_beats - x))] for x in e_downs]))
same = len(e_beats) == len(beats) and len(e_downs) == len(downs) and np.allclose(e_beats, beats, atol=1e-3) and np.allclose(e_downs, downs, atol=1e-3)
tempo = round(60.0 / float(np.median(np.diff(beats))), 1) if len(beats) >= 2 else None
counts: dict[str, int] = {}
bpb = []
for d1, d2 in zip(downs, downs[1:]):
    between = int(np.sum((np.array(beats) > d1) & (np.array(beats) < d2)))
    bpb.append(between + 1)
for x in bpb:
    counts[str(x)] = counts.get(str(x), 0) + 1
modal = None
if bpb:
    top = max(bpb.count(x) for x in set(bpb))
    modal = min(x for x in set(bpb) if bpb.count(x) == top)
label = {6: "6/8", 3: "3/4"}.get(modal, "4/4") if modal else None
label_tempo = round(tempo / 3, 1) if label == "6/8" and tempo else tempo
expected = {
    "beats": beats,
    "downbeats": downs,
    "tempo": tempo,
    "beatsPerBarCounts": counts,
    "modalBeatsPerBar": modal,
    "label": label,
    "labelTempo": label_tempo,
    "synthesized": {"bpm": BPM, "meter": "4/4", "seconds": SECONDS, "firstDownbeat": 0.0},
    "exportMatchesPackage": bool(same),
}
(FIX / "expected.json").write_text(json.dumps(expected, indent="\t") + "\n")

commit = subprocess.run(["git", "-C", str(ROOT), "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip()
manifest = {
    "made": "2026-11-11, stem-bench scripts/deliver-study42-fixtures.py (Study 42, docs/BRIEF-STUDY42.md)",
    "export": {"file": "beat_this-small0-static1500.onnx", "sha256": sha, "bytes": len(onnx_bytes), "input": "spectrogram float32 [1, 1500, 128]", "outputs": "beat, downbeat float32 [1, 1500] logits", "exportScript": "stem-bench scripts/export-study42.py @ 4792e1f", "checkpoint": "beat_this small0, sha256 6074be2c4d490c5f6101fcc374a1ec72ae93456e23bb6019783b849f5dc7d47b"},
    "versions": {"beat_this": md.version("beat_this"), "torch": torch.__version__, "torchaudio": torchaudio.__version__, "onnxruntime": ort.__version__, "numpy": np.__version__, "stemBenchCommit": commit},
    "frontEnd": {"sampleRate": SR, "nFft": 1024, "winLength": 1024, "hop": 441, "window": "hann, periodic (torch.hann_window default)", "center": True, "padMode": "reflect", "power": 1, "normalized": "frame_length (magnitude divided by sqrt(1024) = 32)", "nMels": 128, "melScale": "slaney", "melNorm": None, "fMin": 30, "fMax": 11000, "compress": "log1p(1000 * x)", "layout": "frames x 128, row-major float32"},
    "chunking": {"chunk": CHUNK, "border": BORDER, "overlap": "keep_first", "avoidShortEnd": True, "note": "first window is zero-padded by 6 frames on the left (start -6); a window shorter than 1500 is zero-padded at the end before the session and its padding dropped after"},
    "postprocessor": "minimal: a frame is a beat (downbeat) when its logit is the maximum over 7 frames and > 0; adjacent peaks (gap <= 1 frame) merged to their mean; downbeats moved to the nearest beat and de-duplicated; frames / 50 = seconds",
    "files": {
        "audio.f32": {"shape": [n], "dtype": "float32 LE", "what": "32 s synthetic 4/4 at 110 bpm, 22050 Hz mono, peak 0.9: kick on 1 and 3 (downbeat accented), snare on 2 and 4, hats on the eighths, a bass note on each downbeat alternating C2 and G1, a quiet C and G triad pad changing by the bar"},
        "logmel.f32": {"shape": list(spect_np.shape), "dtype": "float32 LE", "what": "the package's LogMelSpect of audio.f32"},
        "chunk0.f32": {"shape": [CHUNK, 128], "dtype": "float32 LE", "what": "the first window exactly as fed to the export (6 zero frames, then logmel frames 0..1493)"},
        "chunk0-beat.f32": {"shape": [CHUNK], "dtype": "float32 LE", "what": "the export's beat logits for chunk0"},
        "chunk0-downbeat.f32": {"shape": [CHUNK], "dtype": "float32 LE", "what": "the export's downbeat logits for chunk0"},
        "beat-logits.f32": {"shape": [len(spect)], "dtype": "float32 LE", "what": "stitched full-length beat logits (keep_first, borders dropped; -1000 where no window covers a frame)"},
        "downbeat-logits.f32": {"shape": [len(spect)], "dtype": "float32 LE", "what": "stitched full-length downbeat logits"},
        "expected.json": {"what": "the package's (Audio2Beats, dbn=False) beats and downbeats in seconds, tempo = 60 / median inter-beat interval, beats-per-bar counts (beats strictly between consecutive downbeats, plus one), modal count, Study 41 label and its tempo"},
    },
    "windows": len(chunks),
    "starts": [int(s) for s in starts],
}
(FIX / "manifest.json").write_text(json.dumps(manifest, indent="\t") + "\n")
total = sum(p.stat().st_size for p in FIX.iterdir())
print(f"audio {n} samples, logmel {spect_np.shape}, windows {len(chunks)} starts {[int(s) for s in starts]}")
print(f"package: {len(beats)} beats, {len(downs)} downbeats, tempo {tempo}, counts {counts}, label {label} at {label_tempo}; export matches package: {same}")
print(f"fixtures {total / 1e6:.2f} MB, model.json {(OUT / 'model.json').stat().st_size / 1e6:.2f} MB -> {OUT}")

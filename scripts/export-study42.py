#!/usr/bin/env python3
"""Study 42 (docs/BRIEF-STUDY42.md), $0: export Beat This small0 to ONNX
twice (static 1500 frames; dynamic length with the rotary cache off),
verify both against the torch package's logits, run the static export
through the reference inference over the ten modern songs against the
package's beats, and time the model on a 30 s chunk under torch and
ONNX Runtime CPU. Run under .venv-study36. Writes models/study42/*.onnx
(gitignored) and results/study42.json (hashes, agreement, timings);
time-study42.mjs adds the WebAssembly timings to the same file.
"""
import hashlib
import json
import sys
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
from beat_this.inference import load_model, split_predict_aggregate
from beat_this.preprocessing import LogMelSpect
from rotary_embedding_torch import RotaryEmbedding

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts" / "study10"))
import nbeat  # noqa: E402  (split_piece, aggregate_prediction, postp_minimal: the reference logic in numpy)

OUT_DIR = ROOT / "models" / "study42"
OUT_DIR.mkdir(parents=True, exist_ok=True)
RESULTS = ROOT / "results" / "study42.json"
CHUNK = 1500
manifest = json.load(open(ROOT / "corpus" / "study38-manifest.json"))["entries"]
songs = [s for s, e in manifest.items() if e["arm"] == "A"]
spect_fn = LogMelSpect(device="cpu")
report: dict = {"checkpoint": "small0", "exports": {}, "logits": {}, "inference": {}, "timing": {}}


class Wrapped(torch.nn.Module):
    def __init__(self, m):
        super().__init__()
        self.m = m

    def forward(self, x):
        out = self.m(x)
        return out["beat"], out["downbeat"]


def sha256(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def export(name: str, dynamic: bool) -> Path:
    model = load_model("small0", "cpu")
    if dynamic:
        for mod in model.modules():
            if isinstance(mod, RotaryEmbedding):
                mod.cache_if_possible = False
                mod.cached_freqs_seq_len = 0
                mod.cached_scales_seq_len = 0
    wrapped = Wrapped(model).eval()
    x = torch.zeros(1, CHUNK, 128)
    path = OUT_DIR / f"beat_this-small0-{name}.onnx"
    info = {"dynamic": dynamic}
    try:
        if dynamic:
            time_dim = torch.export.Dim("time", min=64, max=8000)
            prog = torch.onnx.export(wrapped, (x,), dynamo=True, dynamic_shapes={"x": {1: time_dim}}, input_names=["spectrogram"], output_names=["beat", "downbeat"], opset_version=18)
        else:
            prog = torch.onnx.export(wrapped, (x,), dynamo=True, input_names=["spectrogram"], output_names=["beat", "downbeat"], opset_version=18)
        prog.optimize()
        prog.save(str(path))
        info["exporter"] = "torch.onnx dynamo"
    except Exception as e:  # fall back to the TorchScript exporter
        info["dynamo_error"] = f"{type(e).__name__}: {str(e)[:300]}"
        kwargs = {"dynamic_axes": {"spectrogram": {1: "time"}, "beat": {1: "time"}, "downbeat": {1: "time"}}} if dynamic else {}
        torch.onnx.export(wrapped, (x,), str(path), dynamo=False, input_names=["spectrogram"], output_names=["beat", "downbeat"], opset_version=17, **kwargs)
        info["exporter"] = "torch.onnx TorchScript"
    info["bytes"] = path.stat().st_size
    info["sha256"] = sha256(path)
    info["torch"] = torch.__version__
    report["exports"][name] = info
    print(f"exported {name}: {info}", flush=True)
    return path


def session(path: Path, threads: int | None = None) -> ort.InferenceSession:
    so = ort.SessionOptions()
    if threads:
        so.intra_op_num_threads = threads
    return ort.InferenceSession(str(path), so, providers=["CPUExecutionProvider"])


def compare(a: np.ndarray, b: np.ndarray) -> dict:
    return {"maxAbs": float(np.max(np.abs(a - b))), "pearson": float(np.corrcoef(a.ravel(), b.ravel())[0, 1])}


torch_model = load_model("small0", "cpu")
static_path = export("static1500", dynamic=False)
dynamic_path = export("dynamic", dynamic=True)
sess_static = session(static_path)
sess_dynamic = session(dynamic_path)

# 1, 2: logits
for slug in songs[:3]:
    sig = np.fromfile(ROOT / manifest[slug]["raw"], dtype=np.float32)
    with torch.inference_mode():
        spect = spect_fn(torch.from_numpy(sig))
    row = {}
    for name, sess, lengths in (("static1500", sess_static, [CHUNK]), ("dynamic", sess_dynamic, [CHUNK, 750, 3000])):
        for T in lengths:
            chunk = spect[:T].unsqueeze(0)
            with torch.inference_mode():
                ref = torch_model(chunk)
            beat, downbeat = sess.run(["beat", "downbeat"], {"spectrogram": chunk.numpy()})
            row[f"{name}@{T}"] = {"beat": compare(beat, ref["beat"].numpy()), "downbeat": compare(downbeat, ref["downbeat"].numpy())}
            print(f"{slug} {name}@{T}: beat maxAbs {row[f'{name}@{T}']['beat']['maxAbs']:.2e} downbeat maxAbs {row[f'{name}@{T}']['downbeat']['maxAbs']:.2e}", flush=True)
    report["logits"][slug] = row

# 3: the reference inference with the static export against the package's beats (Study 36 readings)
trackers = json.load(open(ROOT / "results" / "study36-trackers.json"))


def onnx_track(sess: ort.InferenceSession, spect: torch.Tensor):
    chunks, starts = nbeat.split_piece(spect, CHUNK, 6, avoid_short_end=True)
    preds = []
    for c in chunks:
        c = c if len(c) == CHUNK else torch.nn.functional.pad(c, (0, 0, 0, CHUNK - len(c)))
        b, d = sess.run(["beat", "downbeat"], {"spectrogram": c.numpy()[None, :, :]})
        preds.append({"beat": b[0].astype(np.float64), "downbeat": d[0].astype(np.float64)})
    beat_l, down_l = nbeat.aggregate_prediction(preds, starts, len(spect), CHUNK, 6, "keep_first")
    beats = nbeat.postp_minimal(beat_l)
    downs = nbeat.postp_minimal(down_l)
    if len(beats):
        downs = np.unique(np.array([beats[np.argmin(np.abs(beats - d))] for d in downs]))
    return beats, downs


def fscore(est, ref, window=0.07):
    ref = np.sort(np.asarray(ref, dtype=float))
    est = np.sort(np.asarray(est, dtype=float))
    used = np.zeros(len(est), dtype=bool)
    matched = 0
    for r in ref:
        idx = np.where((~used) & (np.abs(est - r) <= window))[0]
        if len(idx):
            used[idx[np.argmin(np.abs(est[idx] - r))]] = True
            matched += 1
    p = matched / max(1, len(est))
    rc = matched / max(1, len(ref))
    return 0.0 if p + rc == 0 else 2 * p * rc / (p + rc)


for slug in songs:
    sig = np.fromfile(ROOT / manifest[slug]["raw"], dtype=np.float32)
    with torch.inference_mode():
        spect = spect_fn(torch.from_numpy(sig))
    t0 = time.time()
    beats, downs = onnx_track(sess_static, spect)
    secs = time.time() - t0
    ref = trackers[slug]["beatthis-small0"]
    row = {
        "beatF70": fscore(beats, ref["beats"]),
        "downbeatF70": fscore(downs, ref["downbeats"]),
        "beats": [len(beats), len(ref["beats"])],
        "downbeats": [len(downs), len(ref["downbeats"])],
        "onnxSeconds": round(secs, 1),
        "audioSeconds": round(len(sig) / 22050, 1),
    }
    report["inference"][slug] = row
    print(f"{slug}: beat F {row['beatF70']:.3f} downbeat F {row['downbeatF70']:.3f} | beats {row['beats']} downbeats {row['downbeats']} | {secs:.1f}s", flush=True)

# 4: timing on one 30 s chunk
sig = np.fromfile(ROOT / manifest[songs[0]]["raw"], dtype=np.float32)
with torch.inference_mode():
    chunk = spect_fn(torch.from_numpy(sig))[:CHUNK].unsqueeze(0)


def timeit(fn, n=5):
    fn()
    t0 = time.time()
    for _ in range(n):
        fn()
    return (time.time() - t0) / n


with torch.inference_mode():
    report["timing"]["torchDefaultThreads"] = {"threads": torch.get_num_threads(), "secondsPerChunk": timeit(lambda: torch_model(chunk))}
    torch.set_num_threads(1)
    report["timing"]["torch1Thread"] = {"threads": 1, "secondsPerChunk": timeit(lambda: torch_model(chunk))}
x = chunk.numpy()
report["timing"]["ortDefaultThreads"] = {"secondsPerChunk": timeit(lambda: sess_static.run(None, {"spectrogram": x}))}
s1 = session(static_path, threads=1)
report["timing"]["ort1Thread"] = {"threads": 1, "secondsPerChunk": timeit(lambda: s1.run(None, {"spectrogram": x}))}
s4 = session(static_path, threads=4)
report["timing"]["ort4Threads"] = {"threads": 4, "secondsPerChunk": timeit(lambda: s4.run(None, {"spectrogram": x}))}
for k, v in report["timing"].items():
    print(f"timing {k}: {v['secondsPerChunk']:.2f} s per 30 s chunk ({2 * v['secondsPerChunk']:.1f} s per audio minute)")
# a chunk for the WebAssembly timing script (raw float32, 1500 x 128)
x.astype(np.float32).tofile(OUT_DIR / "chunk-1500x128.f32")
RESULTS.write_text(json.dumps(report, indent="\t") + "\n")
print(f"wrote {RESULTS}")

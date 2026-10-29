"""Study 10 N-seg candidate (docs/BRIEF-STUDY10.md): LinkSeg 7-class over
the full mix plus beat times from any beat tracker.

Model: models/study10/linkseg_7c.onnx — the LinkSeg architecture and
weights of M. Buisson, B. McFee, S. Essid, "Using Pairwise Link
Prediction and Graph Attention Networks for Music Structure Analysis"
(ISMIR 2024), CC-BY 4.0 (https://github.com/morgan76/LinkSeg), via the
onnxruntime-web port elicwhite/linkseg-7c-onnx (MIT port code,
validated byte-exact against the PyTorch/DGL reference).

This runner is a numpy/torchaudio port of that port's host pipeline
(windows.ts, mel.ts, decode.ts at elicwhite/LinkSeg-web main): beat
requantization and 16382-sample edge-padded windows; the torchaudio
MelSpectrogram front end the model was trained against (sr 22050,
n_fft 1024, hop 256, 64 mels, f_min 0, f_max 11025, power 2,
center/reflect, periodic Hann, htk mel, norm None) with
AmplitudeToDB(power, top_db=None); peak-picked boundaries at the
reference operating point (peak window 8 s past/future, tau 0) and
majority-vote labels, including the reference's empty-window fallbacks
(max_left 0, max_right 10) and smallest-on-tie mode.

Usage:
  .venv-study10/bin/python scripts/study10/nseg.py \
    --raw item.raw --sr 22050 --beats beats.json --out out.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
import torchaudio

SR = 22050
HOP = 256  # beat-frame quantization hop
MAX_LEN = 1500  # downsample_frames cap
PAD = (HOP * 64 - 2) // 2  # 8191; window half-width
WIN_SAMPLES = 2 * PAD  # 16382
N_MELS = 64
MEL_FRAMES = 64
N_CLASSES = 7
MAX_PAST = 8.0  # seconds; the reference peak-picking neighborhood
MAX_FUTURE = 8.0
TAU = 0.0

LABELS = ["silence", "verse", "chorus", "intro", "outro", "inst", "bridge"]

MODEL = Path(__file__).resolve().parents[2] / "models/study10/linkseg_7c.onnx"

_melspect = torchaudio.transforms.MelSpectrogram(
    sample_rate=SR,
    n_fft=1024,
    hop_length=HOP,
    f_min=0.0,
    f_max=11025.0,
    n_mels=N_MELS,
    power=2.0,
)
_to_db = torchaudio.transforms.AmplitudeToDB(stype="power", top_db=None)


def requantize_beats(beat_times: list[float]) -> list[float]:
    """windows.ts: time_to_frames -> fix_frames (adds 0) -> stride-2 downsample."""
    frames = [int(np.floor(t * SR / HOP)) for t in beat_times]
    uniq = sorted({0, *[f for f in frames if f >= 0]})
    while len(uniq) > MAX_LEN:
        uniq = uniq[::2]
    return [f * HOP / SR for f in uniq]


def beat_windows(beat_times: list[float], wave: np.ndarray) -> np.ndarray:
    """(N, 16382) float32 windows, edge-padded as the reference."""
    padded = np.pad(wave, PAD, mode="edge")
    starts = [int(np.floor(t * SR)) for t in beat_times]
    return np.stack([padded[i : i + WIN_SAMPLES] for i in starts]).astype(np.float32)


def mel_windows(windows: np.ndarray) -> np.ndarray:
    """(N, 1, 64, 64) float32 dB mel images, [n, 1, mel, time]."""
    with torch.no_grad():
        mel = _melspect(torch.from_numpy(windows))  # (N, 64, frames)
        db = _to_db(mel)
    out = db.numpy().astype(np.float32)
    assert out.shape[1] == N_MELS and out.shape[2] == MEL_FRAMES, out.shape
    return out[:, None, :, :]


def _get_indices(times: list[float], index: int, avg_future: float, avg_past: float) -> tuple[int, int]:
    limit_left = 0
    limit_right = len(times) - 1
    for i in range(index, 0, -1):
        if times[index] - times[i] > avg_future:
            limit_left = i - 1
            break
    for i in range(index, len(times)):
        if times[i] - times[index] > avg_past:
            limit_right = i - 1
            break
    return limit_left, limit_right


def pick_peaks(nc: np.ndarray, times: list[float]) -> list[int]:
    """decode.ts pickPeaksTimes, with the reference's empty-window fallbacks."""
    peaks: list[int] = []
    for i in range(1, len(nc) - 1):
        limit_left, limit_right = _get_indices(times, i, MAX_FUTURE, MAX_PAST)
        left = nc[limit_left + 1 : i]  # j in (limit_left, i-1], same set as the TS loop
        max_left = float(left.max()) if left.size else 0.0
        right = nc[i + 1 : limit_right]  # j in [i+1, limit_right)
        max_right = float(right.max()) if right.size else 10.0
        if max_left < nc[i] and nc[i] > max_right and nc[i] > TAU:
            peaks.append(i)
    return peaks


def mode_smallest(values: list[int]) -> int:
    counts: dict[int, int] = {}
    for v in values:
        counts[v] = counts.get(v, 0) + 1
    best = min(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return best[0]


def decode(
    bound: np.ndarray, label: np.ndarray, beat_times: list[float], duration: float
) -> tuple[list[float], list[str]]:
    """decode.ts linksegDecode: boundary times (incl. 0 and duration) + labels."""
    mid = [(beat_times[i] + beat_times[i + 1]) / 2 for i in range(len(beat_times) - 1)]
    peaks = pick_peaks(bound, mid)
    idxs = [0, *peaks, len(mid) - 1]
    labels: list[str] = []
    for left, right in zip(idxs[:-1], idxs[1:]):
        preds = [int(np.argmax(label[r])) for r in range(left, right)]
        labels.append(LABELS[mode_smallest(preds) if preds else 0])
    times = [0.0, *[mid[i] for i in peaks], duration]
    return times, labels


def run(raw_path: str, sr: int, beats_path: str) -> dict:
    assert sr == SR, f"expected {SR} Hz, got {sr}"
    wave = np.fromfile(raw_path, dtype=np.float32)
    beats_in = json.loads(Path(beats_path).read_text())["beats"]
    if len(beats_in) < 4:
        return {"beatTimes": [], "boundaries": [], "labels": []}
    bt = requantize_beats(beats_in)
    if len(bt) < 4:
        return {"beatTimes": bt, "boundaries": [], "labels": []}
    mel = mel_windows(beat_windows(bt, wave))
    session = ort.InferenceSession(str(MODEL), providers=["CPUExecutionProvider"])
    bound, label = session.run(["bound", "label"], {"mel": mel})
    duration = len(wave) / SR
    times, labels = decode(np.asarray(bound), np.asarray(label), bt, duration)
    return {
        "beatTimes": bt,
        "boundaries": times[1:-1],
        "labels": [
            {"start": times[i], "end": times[i + 1], "label": labels[i]}
            for i in range(len(labels))
        ],
    }


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--raw", required=True)
    p.add_argument("--sr", type=int, default=SR)
    p.add_argument("--beats", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()
    result = run(args.raw, args.sr, args.beats)
    Path(args.out).write_text(json.dumps(result, indent="\t") + "\n")
    print(
        f"boundaries: {[round(b, 2) for b in result['boundaries']]}\n"
        f"labels: {[(round(s['start'], 1), round(s['end'], 1), s['label']) for s in result['labels']]}"
    )

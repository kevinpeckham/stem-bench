#!/usr/bin/env python3
"""Study 10 N-beat candidate (docs/BRIEF-STUDY10.md): Beat This! small0
over the bench's own float renders. The pipeline is the reference's:
LogMelSpect -> model -> "minimal" postprocessing, with the model weights
in ONNX (models/study10/small0.onnx) under onnxruntime CPU.

Vendored from CPJKU/beat_this (MIT, Foscarin/Schlüter/Widmer, ISMIR
2024): LogMelSpect (beat_this/preprocessing.py), split_piece and
aggregate_prediction (beat_this/inference.py, chunk_size 1500,
border_size 6, overlap_mode "keep_first"), the "minimal" Postprocessor
and deduplicate_peaks (beat_this/model/postprocessor.py) translated to
numpy. No DBN.

Registered derivations (the bench's, not the reference's):
tempo = 60 / median(inter-beat interval), 0.1 bpm resolution, null
under 2 beats; meter = the modal beats-per-bar measured downbeat to
downbeat (beats strictly between, plus one), 3 -> "3/4", 4 -> "4/4",
2 or 6 -> "6/8", anything else reported as its raw count; null under
2 downbeats.

Usage: nbeat.py --raw <f32le mono> [--sr 22050] [--model small0.onnx] --out <json>
"""

import argparse
import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
import torchaudio

FPS = 50
# DEVIATION from the reference's chunk_size 1500: this ONNX export's
# attention degrades beyond ~300 frames (verified: full beat coverage at
# 250 frames, last firing frame pinned near 300 for any longer input on
# a metronomic item), so pieces are processed in 5 s chunks with the
# reference's own border/overlap logic. Registered in the brief.
CHUNK_SIZE = 250
BORDER_SIZE = 6


class LogMelSpect(torch.nn.Module):
    # beat_this/preprocessing.py, verbatim parameters.
    def __init__(
        self,
        sample_rate=22050,
        n_fft=1024,
        hop_length=441,
        f_min=30,
        f_max=11000,
        n_mels=128,
        mel_scale="slaney",
        normalized="frame_length",
        power=1,
        log_multiplier=1000,
    ):
        super().__init__()
        self.spect_class = torchaudio.transforms.MelSpectrogram(
            sample_rate=sample_rate,
            n_fft=n_fft,
            hop_length=hop_length,
            f_min=f_min,
            f_max=f_max,
            n_mels=n_mels,
            mel_scale=mel_scale,
            normalized=normalized,
            power=power,
        )
        self.log_multiplier = log_multiplier

    def forward(self, x):
        return torch.log1p(self.log_multiplier * self.spect_class(x).T)


def zeropad(spect: torch.Tensor, left: int = 0, right: int = 0) -> torch.Tensor:
    if left == 0 and right == 0:
        return spect
    return torch.nn.functional.pad(spect, (0, 0, left, right), "constant", 0)


def split_piece(spect: torch.Tensor, chunk_size: int, border_size: int = 6, avoid_short_end: bool = True):
    # beat_this/inference.py split_piece, verbatim logic.
    starts = np.arange(-border_size, len(spect) - border_size, chunk_size - 2 * border_size)
    if avoid_short_end and len(spect) > chunk_size - 2 * border_size:
        starts[-1] = len(spect) - (chunk_size - border_size)
    chunks = [
        zeropad(
            spect[max(start, 0) : min(start + chunk_size, len(spect))],
            left=max(0, -start),
            right=max(0, min(border_size, start + chunk_size - len(spect))),
        )
        for start in starts
    ]
    return chunks, starts


def aggregate_prediction(pred_chunks, starts, full_size, chunk_size, border_size, overlap_mode):
    # beat_this/inference.py aggregate_prediction, torch swapped for numpy.
    if border_size > 0:
        pred_chunks = [
            {"beat": c["beat"][border_size:-border_size], "downbeat": c["downbeat"][border_size:-border_size]}
            for c in pred_chunks
        ]
    beat = np.full(full_size, -1000.0, dtype=np.float64)
    downbeat = np.full(full_size, -1000.0, dtype=np.float64)
    if overlap_mode == "keep_first":
        pred_chunks = reversed(list(pred_chunks))
        starts = reversed(list(starts))
    for start, chunk in zip(starts, pred_chunks):
        beat[start + border_size : start + chunk_size - border_size] = chunk["beat"]
        downbeat[start + border_size : start + chunk_size - border_size] = chunk["downbeat"]
    return beat, downbeat


def deduplicate_peaks(peaks, width=1) -> np.ndarray:
    # beat_this/model/postprocessor.py, verbatim.
    result = []
    peaks = map(int, peaks)
    try:
        p = next(peaks)
    except StopIteration:
        return np.array(result)
    c = 1
    for p2 in peaks:
        if p2 - p <= width:
            c += 1
            p += (p2 - p) / c
        else:
            result.append(p)
            p = p2
            c = 1
    result.append(p)
    return np.array(result)


def window_max(x: np.ndarray, kernel: int = 7) -> np.ndarray:
    # F.max_pool1d(x, 7, 1, 3): same-length sliding max, -inf padding.
    pad = kernel // 2
    padded = np.concatenate([np.full(pad, -np.inf), x, np.full(pad, -np.inf)])
    return np.max(np.lib.stride_tricks.sliding_window_view(padded, kernel), axis=1)


def postp_minimal(logits: np.ndarray) -> np.ndarray:
    """Peak times in seconds from framewise logits (one of beat/downbeat)."""
    peaks = (logits == window_max(logits)) & (logits > 0)
    frames = deduplicate_peaks(np.nonzero(peaks)[0], width=1)
    return frames / FPS


def run(raw_path: str, sr: int, model_path: str) -> dict:
    samples = np.fromfile(raw_path, dtype=np.float32)
    with torch.no_grad():
        spect = LogMelSpect(sample_rate=sr)(torch.from_numpy(samples))
    chunks, starts = split_piece(spect, CHUNK_SIZE, BORDER_SIZE, avoid_short_end=True)
    session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
    pred_chunks = []
    for chunk in chunks:
        beat, downbeat = session.run(
            ["beat", "downbeat"], {"spectrogram": chunk.numpy()[None, :, :]}
        )
        pred_chunks.append({"beat": beat[0].astype(np.float64), "downbeat": downbeat[0].astype(np.float64)})
    beat_logits, downbeat_logits = aggregate_prediction(
        pred_chunks, starts, len(spect), CHUNK_SIZE, BORDER_SIZE, "keep_first"
    )
    beat_time = postp_minimal(beat_logits)
    downbeat_time = postp_minimal(downbeat_logits)
    # move each downbeat to the nearest beat, then unique (reference behavior)
    if len(beat_time) > 0:
        downbeat_time = np.unique(
            np.array([beat_time[np.argmin(np.abs(beat_time - d))] for d in downbeat_time])
        )

    tempo = None
    if len(beat_time) >= 2:
        tempo = round(60.0 / float(np.median(np.diff(beat_time))), 1)
    meter = None
    counts: dict[str, int] = {}
    if len(downbeat_time) >= 2:
        beats_per_bar = []
        for d1, d2 in zip(downbeat_time, downbeat_time[1:]):
            between = int(np.sum((beat_time > d1) & (beat_time < d2)))
            beats_per_bar.append(between + 1)
        for n in beats_per_bar:
            counts[str(n)] = counts.get(str(n), 0) + 1
        top = max(beats_per_bar.count(n) for n in set(beats_per_bar))
        modal = min(n for n in set(beats_per_bar) if beats_per_bar.count(n) == top)  # smallest on ties
        meter = {3: "3/4", 4: "4/4", 2: "6/8", 6: "6/8"}.get(modal, str(modal))
    return {
        "beats": [round(float(t), 3) for t in beat_time],
        "downbeats": [round(float(t), 3) for t in downbeat_time],
        "beatCount": len(beat_time),
        "downbeatCount": len(downbeat_time),
        "tempo": tempo,
        "meter": meter,
        "beatsPerBarCounts": counts,
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", required=True)
    ap.add_argument("--sr", type=int, default=22050)
    ap.add_argument("--model", default=str(Path(__file__).parent / "../../models/study10/small0.onnx"))
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    result = run(args.raw, args.sr, args.model)
    Path(args.out).write_text(json.dumps(result, indent="\t") + "\n")
    print(
        f"{Path(args.raw).stem}: tempo {result['tempo']} meter {result['meter']} "
        f"beats {result['beatCount']} downbeats {result['downbeatCount']}"
    )

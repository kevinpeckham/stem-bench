"""Study 10 N-chord candidate (docs/BRIEF-STUDY10.md): ChordMini ChordNet
2E1D over a librosa CQT, run exactly to the export's published contract.

Model: ChordMini (github.com/ptnghia-j/ChordMini, MIT), checkpoint blob
b61f6b3a02cc42b87afa38392f80d185a49f719a; ONNX export and feature
contract from huggingface.co/musetric/chordmini-onnx (MIT), pinned by
SHA256 in corpus/fixture10.json. Front end: librosa.cqt with the
config's parameters (librosa 0.11.0, the version the export's CQT plan
was baked from), features = log(|CQT| + 1e-6), [T, 144]. Windows of
seqLen=108 frames, fed in groups of 16 (the graph's static batch), the
last group padded with zero windows and trimmed. Post: uniform 9-frame
smoothing of logits (radius 4, truncated at each 108-frame window's
edges, per the reference smoothArgmax pass) then argmax per frame.
Normalization is inside the graph. Gain note: the model expects an
arithmetic-mean mono downmix; the bench's audio is already mono float32
straight from the synthesizer, so no downmix happens here.

CLI:
  nchord.py --raw mix.f32le --out out.json [--bars bars.json]

--raw is headerless float32 little-endian mono at 22050 Hz. --bars is
{"barStarts": [0, ...end]}; with it the output adds a per-bar majority
vote mapped to the bench's chord spelling via chordmini-vocab.json.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import librosa
import numpy as np
import onnxruntime as ort

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent

SR = 22050
HOP = 2048
FMIN = 32.70319566257483  # C1
N_BINS = 144
BINS_PER_OCTAVE = 24
SEQ_LEN = 108
GROUP = 16
SMOOTH_RADIUS = 4
FRAME_SEC = HOP / SR


def features_of(samples: np.ndarray) -> np.ndarray:
	"""log(|CQT| + 1e-6), shape [T, 144], float32 — the export's contract.
	The reference runner feeds librosa.load's float32, so the CQT runs in
	float32 (complex64) here too."""
	cqt = librosa.cqt(
		y=samples.astype(np.float32),
		sr=SR,
		hop_length=HOP,
		fmin=FMIN,
		n_bins=N_BINS,
		bins_per_octave=BINS_PER_OCTAVE,
		norm=1,
		sparsity=0.01,
		window="hann",
		scale=True,
		pad_mode="constant",
	)
	return np.log(np.abs(cqt) + 1e-6).T.astype(np.float32)


def run_model(features: np.ndarray) -> np.ndarray:
	"""Pad to whole windows and whole groups, run, return logits [T, 170]."""
	t = features.shape[0]
	n_windows = -(-t // SEQ_LEN)
	padded = np.zeros((n_windows * SEQ_LEN, N_BINS), dtype=np.float32)
	padded[:t] = features
	windows = padded.reshape(n_windows, SEQ_LEN, N_BINS)
	session = ort.InferenceSession(
		str(ROOT / "models/study10/chordnet.onnx"), providers=["CPUExecutionProvider"]
	)
	chunks: list[np.ndarray] = []
	for start in range(0, n_windows, GROUP):
		group = windows[start : start + GROUP]
		real = group.shape[0]
		if real < GROUP:
			group = np.concatenate(
				[group, np.zeros((GROUP - real, SEQ_LEN, N_BINS), dtype=np.float32)]
			)
		(logits,) = session.run(None, {"features": group})
		chunks.append(logits[:real])
	return np.concatenate(chunks).reshape(n_windows * SEQ_LEN, -1)[:t]


def smooth_argmax(logits: np.ndarray) -> np.ndarray:
	"""The reference smoothArgmax pass: per 108-frame window, sum logits
	over [i-4, i+4] truncated at the window's edges, argmax per frame."""
	t = logits.shape[0]
	indices = np.zeros(t, dtype=np.int64)
	for w_start in range(0, t, SEQ_LEN):
		w = logits[w_start : w_start + SEQ_LEN]
		n = w.shape[0]
		cum = np.concatenate([np.zeros((1, w.shape[1])), np.cumsum(w, axis=0)])
		for i in range(n):
			lo = max(0, i - SMOOTH_RADIUS)
			hi = min(n - 1, i + SMOOTH_RADIUS)
			indices[w_start + i] = int(np.argmax(cum[hi + 1] - cum[lo]))
	return indices


def main() -> None:
	parser = argparse.ArgumentParser()
	parser.add_argument("--raw", required=True)
	parser.add_argument("--out", required=True)
	parser.add_argument("--bars")
	args = parser.parse_args()

	samples = np.fromfile(args.raw, dtype=np.float32)
	vocab: list[str] = json.load(open(ROOT / "models/study10/chordmini-config.json"))[
		"chordVocab"
	]
	bench: dict[str, str] = json.load(open(HERE / "chordmini-vocab.json"))

	features = features_of(samples)
	logits = run_model(features)
	indices = smooth_argmax(logits)

	segments: list[dict[str, object]] = []
	start = 0
	for i in range(1, len(indices) + 1):
		if i == len(indices) or indices[i] != indices[start]:
			segments.append(
				{
					"start": round(start * FRAME_SEC, 3),
					"end": round(i * FRAME_SEC, 3),
					"chord": vocab[int(indices[start])],
				}
			)
			start = i

	out: dict[str, object] = {"frameSec": FRAME_SEC, "segments": segments}
	if args.bars:
		bar_starts: list[float] = json.load(open(args.bars))["barStarts"]
		per_bar: list[str] = []
		per_bar_raw: list[str] = []
		for b in range(len(bar_starts) - 1):
			lo = int(round(bar_starts[b] / FRAME_SEC))
			hi = max(lo + 1, int(round(bar_starts[b + 1] / FRAME_SEC)))
			bar = indices[lo : min(hi, len(indices))]
			if len(bar) == 0:
				per_bar.append("")
				per_bar_raw.append("N")
				continue
			counts = np.bincount(bar, minlength=len(vocab))
			raw = vocab[int(np.argmax(counts))]
			per_bar_raw.append(raw)
			per_bar.append(bench[raw])
		out["perBarRaw"] = per_bar_raw
		out["perBar"] = per_bar

	Path(args.out).write_text(json.dumps(out, indent="\t") + "\n")
	print(
		f"{args.raw}: {features.shape[0]} frames, {len(segments)} segments"
		+ (f", {len(out['perBar'])} bars" if args.bars else "")
	)


if __name__ == "__main__":
	main()

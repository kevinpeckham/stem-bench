# Study 19 — the ChordMini port gated: the app's TypeScript pipeline against the Python reference, frame by frame and bar by bar

**Registered before any run** (this brief and the runner in one commit;
the run follows). Date: 2026-11-06. Drafted by the stem-shovel agent
(`docs/bench-brief-chordmini-2026-11-06.md` in the app repo, staging),
registered and run by the bench. Micro validation, the 6b/16b shape.

## The question

Study 17 made ChordMini on the mix the measured chord front end
(59/76 gated, 53/86 exploratory, root-level). stem-shovel has now
shipped exactly that pipeline in TypeScript (app commit **2256d489**,
staging): librosa's CQT baked into a plan evaluated in TS (one early
2:1 decimation through a 255-tap Kaiser half-band in place of soxr,
six octaves of sparse complex kernels over a 512 STFT), the same
`chordnet.onnx` (SHA-256 pinned in `model.json`, verified at load)
under onnxruntime-web's wasm backend in a child process, the reference
9-frame box smoothing, and the bench's own per-bar majority vote and
label map. The app's brief asks the bench to gate the port so the
bench's numbers remain the app's. Its promised parity table was absent
from the committed brief, so every number below is measured fresh.

## Pre-registration verifications (already done, disclosed)

- The app's `chart-symbols.json` is the bench's
  `scripts/study10/chordmini-vocab.json`: 170 entries, zero diffs.
- The app's `config.json` `chordVocab` equals the bench's
  `models/study10/chordmini-config.json` `chordVocab` in ORDER (indices
  agree, not just labels).

## Instruments

The app's code runs AS COMMITTED, no port: a git worktree of
stem-shovel pinned at 2256d489 (gitignored under `.worktrees/`), its
own dependencies installed, and `scripts/run-study19.ts` importing
`chordminiFeatures`, `chordminiLogits`, `chordminiIndices`,
`chordminiRunsOf` and `chordminiBarChords` from that tree. Both sides
consume the bench's committed 22050 Hz mono raws, so the gates isolate
CQT + inference + smoothing + vote; the app's ffmpeg decode uses the
same arguments the bench used to make those raws, and that equivalence
is stated, not re-measured. The reference is `scripts/study10/nchord.py`
exactly as Study 10 pinned it; its per-frame labels are reconstructed
from its run-length segments (`round(start / frameSec)` boundaries,
exact at these precisions), and the reconstruction is checked against
its own `perBarRaw` where `--bars` is passed.

## Arms ($0, no model-API calls)

- **Parity arm:** all four public Badverbs mixes (letter-lands,
  eat-all-the-clocks, peaceful-dreams, mop-heart). Per song: the app
  pipeline's per-frame labels vs the reference's; frame counts on both
  sides; agreement rate over the overlapping frames; every
  disagreement located (distance to the nearest reference label
  boundary, and whether it sits in a 108-frame window's edge frames).
- **Bar arm:** the two songs with bar-aligned chord truth, on Study
  12's bar grid recomputed exactly as Studies 13/17/18 did. The app's
  `chordminiBarChords` over the app's stored-run shape, graded with
  Study 13's `gradeBars`, beside Study 17's registered D-mix numbers.

## Gates

- **S19-G1 (frame parity):** per-frame label agreement ≥ **99.5 %** on
  each of the four mixes (the app's own pass line, adopted unchanged).
- **S19-G2 (bar parity):** the app's per-bar score within ONE bar of
  Study 17's registered numbers on each graded song (≥ 58/76 gated,
  ≥ 52/86 exploratory; higher is a pass). The app's own rule: a drop of
  more than one bar is a port defect, not a model result.
- **Standing rule restated, not gated:** the app never runs the
  reconciler on the model's chords (Study 17 G4, sixteen breaks); the
  shipped code's comment carries it and this study changes nothing.

## Spend fence

**$0.** Local CPU only (the wasm inference is seconds per song).

## Predictions (scored in the report)

1. G1 passes on all four mixes at ≥ 99.9 % — the port's float order
   differs from numpy's only in reductions, which moves argmaxes only
   where logits nearly tie.
2. G2 passes with the scores IDENTICAL (59/76 and 53/86): a majority
   vote over ~20 frames a bar absorbs sub-0.5 % frame flips.
3. Disagreeing frames, if any, sit at reference label boundaries or in
   window-edge frames, not mid-segment.
4. App and reference frame counts agree exactly per song (same
   trim-stack arithmetic).

## Disclosure

Analyst Claude Fable 5. No model API measured; the ONNX network runs
locally on both sides; every grade is mechanical and committed before
the run. The app repo is read at the pinned commit only; the bench
edits nothing there.

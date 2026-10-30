# BRIEF — stem-bench Study 12: chart-to-seconds by synthesize-and-align

**REGISTERED.** The bench's own registration (the candidates memo's
recommendation A, docs/CANDIDATES-2026-10-30.md, approved by Kevin):
can chroma-DTW alignment of a chart-driven render place every bar —
hence every section mark and chord — in seconds, with no model? This
is the last hearing job the program still assigns to anything but
code or data: Study 8's ship guidance left the model exactly one role
(boundary placement in seconds), and alignment is the classical,
open, zero-weight way to retire it. Zero model spend.

## Instruments (committed, tested)

- **Chromagram** (src/study12/chroma.ts): 12-bin pitch-class frames,
  window 4096 / hop 2048 at 22050 Hz (92.9 ms), Hann, the port's own
  fft, 55–2200 Hz folded, L2 per frame.
- **DTW** (src/study12/dtw.ts): cosine distance, steps (1,1), (1,2),
  (2,1) — the reference axis never stalls, so a bar cannot map to
  zero time; `subsequence` mode frees the recording's start and end
  (count-ins and tails, the real-recording case). Output: the path, a
  normalized path cost (the wrong-chart probe's measure), and a
  piecewise-linear reference-seconds → recording-seconds map.
- **Reference renderer** (src/study12/reference.ts): the chart as
  audio, badly-but-in-time — sustained chord-tone pads per bar (one
  or two chords a bar) at the DECLARED tempo and meter, no drums, no
  dynamics. Every reference bar start is known by construction.

## Corpora

- **Synthetic arm**: the 33 pulsed fixture-10 band items; each item's
  chart is its own spec bars at the declared (= true) tempi. The
  committed render is the recording; the exact bar grid is the truth.
  Classes as ever (loops, changes, contrast, mislead, hard set).
- **Wrong-chart probe** (registered pairs, reported ungated):
  drift-4a↔waltz-b, contrast-b↔mod-a, swing-x↔oct-low-a, both
  directions — the right-chart path cost against the wrong-chart one,
  the raw material of a mechanical "is this chart this recording?"
  check (today production asks the model to confirm by ear).
- **Real arm** (corpus/mmkk-charts.json): the bench's transcriptions
  of the PUBLIC MMKK charts, repeats expanded, spellings normalized
  ("F#(5)(7)" → F#5), declared section starts used ONLY in scoring.
  **letter-lands is the gated item** — unambiguous repeats, 76 bars ×
  declared 132 bpm = 138.2 s against the 141.3 s recording.
  **eat-all-the-clocks is exploratory** — its Bridge rests, "riff x2"
  and "Chorus x2" are the bench's disclosed readings (86 bars =
  172 s against a 146 s recording, a −26 s mismatch the subsequence
  DTW must absorb; how placement degrades under a wrong transcription
  is itself a measure). **peaceful-dreams is excluded**: its chart's
  structure labels and repeat scope are too ambiguous to transcribe
  registrably — a real-world limit of the method, disclosed. mop-heart
  has no chart.

## Gates

- **S12-G1a**: ≥ 95 % of all synthetic bar starts within ±0.25 s
  (2.7 hops), reported by class with worst cases.
- **S12-G1b**: all 8 contrast section boundaries within **±0.5 s** —
  the precision metric every listener failed (Study 8 models ~0/8 at
  ±0.5; Study 10's neural segmenter 0/8; the literature's best model
  reader 0.423 at ±0.5 on real music).
- **S12-G2**: letter-lands ≥ 8/9 boundaries at ±4 s AND ≥ 7/9 at
  ±0.5 s — parity-or-better with the neural segmenter's 8/9 [7/9] on
  the same song, achieved from the chart and the audio alone.
- Tempo/key-change boundaries (invisible to stem activity, 3/6 for
  blind models) and the probe separation are reported, ungated.

## Predictions (the bench's)

1. G1a and G1b pass near ceiling: on same-synth chroma the path is
   essentially diagonal; errors concentrate in the mislead items'
   extra-stem bars and stay under a hop or two. The tempo-change
   items track across the change — DTW doesn't care that the tempo
   moved, which is the method's whole advantage over grid anchoring.
2. G2 passes on letter-lands, with median boundary error well under
   the half second; the alignment's errors are where the performance
   departs from the chart (the outro tail), not where it follows it.
3. eat-all-the-clocks degrades visibly in its back half (the −26 s
   transcription mismatch has to be absorbed somewhere) — the
   measured cost of a wrong reading, which is the honest limit to
   report for the ship surface: alignment is only as good as the
   chart, and a cost threshold should gate it.
4. The probe separates every pair (wrong cost > right cost), most
   weakly where keys are related; if it holds, the "same piece?"
   question the model is asked by ear becomes a number.

## Spend fences

Zero. Rendering and dynamic programming, all local.

## What production does with the result

A pass ships as the placement half of the chart pipeline: section
marks and chords get seconds mechanically (behind a path-cost gate),
the model keeps only what text cannot supply and code cannot place —
which, if the gates pass, is nothing in this feature. The probe
feeds a mechanical same-piece check to replace the by-ear clause in
`askAiAboutMix`. A real-arm failure bounds the method to synthetic
material and the model keeps placement on real recordings.

## Disclosure

Analyst Claude Fable 5. No model measured or consulted; the MMKK
chart transcriptions are the bench's disclosed readings committed
before any alignment ran; declared section starts touch scoring only.
No development smoke was run — the toy cases live in the unit tests.

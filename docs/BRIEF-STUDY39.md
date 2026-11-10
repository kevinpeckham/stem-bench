# Study 39: which downbeat tracker follows a free tempo

Registered 2026-11-10 before any scored run, on Kevin's "let's proceed
with downstream then Study 39". Zero model spend: eight downbeat
systems, local inference, mechanical grading against annotated bar
lines. Called for by Study 38's S38-D3 (free-tempo drafts failed with
madmom's downbeat F at 0.39 while Beat This read 0.68, the reverse of
the full-band ordering).

## Question

On free-tempo voice-and-piano performances, which published downbeat
system puts bar lines where the annotated measures are, and does
loosening madmom's tempo-transition prior (the knob built for exactly
this) close its gap to Beat This? And does the same system still win
on the steady-drift 78s where madmom won Study 36?

## Corpus (corpus/study39-manifest.json, scripts/build-study39-manifest.py)

- winterreise: 48 performances, the 24 Winterreise songs in SC06
  (Scarlata/Denk 2006; audio CC BY-NC-ND 3.0, measurement only, never
  redistributed, disclosed as in Study 38) and HU33 (Hüsch 1933, Public
  Domain Mark 1.0). Truth: ann_audio_measure (Schubert Winterreise
  Dataset v2.1, CC BY 3.0).
- jaah: the three acoustic-era 78s with JAAH beat-aligned bar truth
  (dippermouth-blues, st-louis-blues, livery-stable-blues), steady
  tempo with drift, the Study 36 reference where madmom's DBN earned
  the Study 38 pipeline.

## Systems (scripts/trackers-study39.py)

Beat This! final0 and small0 (peak-picking), Beat This! final0 with
madmom's DBN post-processing, madmom RNNDownBeat + DBN with bars of 3
or 4 at transition_lambda 100 (the default used in Studies 36 and 38),
30, 10 and 3, and madmom with bars of 3, 4 or 6 at lambda 100. Lambda
is madmom's tempo-change penalty: lower lets the tempo move between
beats. The Winterreise cells for Beat This final0 and madmom lambda 100
are copied from results/study38-trackers.json (identical runs).

## Grading (scripts/run-study39.ts, src/study36/metrical.ts)

Per performance and system: downbeat precision, recall and F against
the annotated measures at 70 ms (mir_eval's window) and at 150 ms (a
rubato window, secondary); the fold of the median tracker bar against
the median annotated bar (strict within 4 %, folded at a metrical
ratio); the bar-count ratio; and the registered CHARTABLE verdict:
recall at 70 ms ≥ 0.80 with a fold ratio of 1 or 1/2. Recall is the
measure that matters for a chart: a tracker that places extra bar lines
at half the written bar is merge-safe (Study 37), one that misses
written bar lines is not. Medians over performances.

## Predictions

- P1: Beat This final0's median recall at 70 ms on Winterreise ≥ 0.75.
- P2: lowering madmom's lambda from 100 to 10 raises its median recall
  at 70 ms on Winterreise by ≥ 0.15.
- P3: Beat This with the DBN scores a lower median F at 70 ms on
  Winterreise than Beat This peak-picking (the DBN is what fails on
  rubato).
- P4: on the three JAAH 78s madmom lambda 100 keeps the best median F
  at 70 ms of all eight systems (steady drift is the DBN's home).
- P5: SC06 and HU33 agree within 0.10 median recall for every system
  (the 1933 recording quality does not decide this).

## Decision rule

S39-D1. The system with the most CHARTABLE Winterreise performances
(ties by median recall) becomes the free-tempo tracker if it is
chartable on ≥ 75 % of the 48; otherwise no tracker is adopted and the
free-tempo path waits for the draft-format study (two chords per bar)
on the best available bar lines, disclosed as sub-threshold.

## Disclosures

- Study 38's SC06/HU33 numbers for two of the eight systems (madmom
  lambda 100: F 0.39/0.38; Beat This final0: 0.68/0.61) were public
  when P1 to P5 were written; the other six systems have not been run
  on this material.
- Winterreise is classical lieder, a proxy for the acoustic-demo
  target; the JAAH 78s are a proxy for steady live drift. Neither is a
  modern demo. Kevin's demos replace both when available.
- Downbeat F at 70 ms on rubato material penalises both tracker and
  annotator jitter; the 150 ms window is reported beside it and enters
  no prediction.

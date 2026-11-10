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

## Results (2026-11-10, registration ca362ee; $0, 51 recordings × 8 systems)

Group medians; "chartable" = recall at 70 ms ≥ 0.8 with the bar at fold
1 or 1/2 of the annotated bar.

### Winterreise, 48 performances (SC06 and HU33)

| system | F@70 | P@70 | R@70 | F@150 | strict bar | folded (half, double) | chartable |
|---|---|---|---|---|---|---|---|
| Beat This final0, peak-picking | 0.656 | 0.546 | 0.862 | 0.671 | 6 | 19 (14, 2) | 11 |
| Beat This small0, peak-picking | 0.604 | 0.482 | 0.748 | 0.631 | 7 | 23 (20, 2) | 8 |
| Beat This final0 + DBN | 0.546 | 0.615 | 0.544 | 0.601 | 24 | 36 (5, 7) | 10 |
| madmom 3/4, λ 100 (Study 36/38) | 0.386 | 0.425 | 0.365 | 0.390 | 16 | 28 (4, 10) | 7 |
| madmom 3/4, λ 30 | 0.458 | 0.487 | 0.448 | 0.463 | 16 | 29 (4, 12) | 7 |
| madmom 3/4, λ 10 | 0.504 | 0.556 | 0.443 | 0.534 | 17 | 28 (4, 12) | 5 |
| madmom 3/4, λ 3 | 0.465 | 0.506 | 0.430 | 0.510 | 17 | 26 (4, 10) | 3 |
| madmom 3/4/6, λ 100 | 0.278 | 0.377 | 0.227 | 0.287 | 7 | 26 (0, 9) | 4 |

Per edition (SC06 / HU33) recall at 70 ms: final0 0.871 / 0.838;
small0 0.867 / 0.708; final0 + DBN 0.648 / 0.543; madmom λ 100
0.366 / 0.365; λ 30 0.488 / 0.416; λ 10 0.549 / 0.386; λ 3
0.565 / 0.405; 3/4/6 0.248 / 0.213.

### JAAH 78s, 3 recordings (steady drift)

F@70: madmom λ 100 0.686 (F@150 0.974, strict 3 of 3); Beat This
final0 0.491 (F@150 0.745); final0 + DBN 0.472; λ 10 0.472; small0
0.391; λ 30 0.388; λ 3 0.294; 3/4/6 0.284.

### Reading

Two different failures. Beat This with peak-picking FOLLOWS the free
tempo (recall 0.86 for the big model at 70 ms, the annotator's own
jitter included) but places too many downbeats: precision 0.55, and on
14 of 48 performances its median bar is half the annotated one. Every
DBN, Beat This's own included, does the opposite: it holds a bar
length (24 of 48 strict for Beat This + DBN) and loses the beats under
the rubato (recall 0.54, madmom 0.37 to 0.45). Loosening madmom's
tempo-transition penalty from λ 100 to 10 buys 0.08 of recall, half the
predicted 0.15, and costs it chartable performances (7 → 5): the DBN's
trouble on lieder is not the transition cost alone. On the steadily
drifting 78s the ordering reverses, madmom λ 100 is best by a wide
margin at 150 ms (0.97), as predicted.

The 1933 edition decides more than predicted: the small Beat This
model loses 0.16 of recall from SC06 to HU33, the DBN variants 0.10 to
0.16, while the big peak-picking model (0.03) and madmom at λ 100
(0.00) are indifferent to it.

No system is chartable on 75 % of the 48 (best 11, 23 %). S39-D1 holds:
no free-tempo tracker is adopted. The best available bar lines for the
draft-format study are Beat This final0's, read at the half-bar fold
where it sits (Study 37 Part D showed half-bar drafts grade no worse);
the format question (two chords per bar, Study 38 arm C's 1.5 changes
a bar) is the next study on this material, disclosed as running on
sub-threshold bars.

### Predictions

P1 right (final0 recall 0.862 ≥ 0.75). P2 wrong (λ 10 raised recall
0.365 → 0.443, +0.08, not ≥ 0.15). P3 right (DBN 0.546 < 0.656). P4
right (madmom λ 100 best F on JAAH, 0.686). P5 wrong (four of eight
systems differ by more than 0.10 between the editions; the two systems
whose numbers were public when P5 was written are the two that do
not).

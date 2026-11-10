# Study 37: the harmonic-rhythm period witness, and the collapse-safe octave policy where it costs money

Registered 2026-11-10 before any scored run, on Kevin's "proceed with
study 37". Part C is $0 (ChordMini chord segments and a TypeScript
witness over the Study 36b catalog). Part D is five paid drafts at a
registered fence of $0.60.

## Why

Study 36b left the automatic bar at 70 % strict and 90 % folded for the
best tracker on 261 modern songs. The 20-point gap between those two
numbers is the metrical octave, and most of it (28 of 39 folded 4/4
readings) is a bar half the declared length. Two things can close it:
a witness that reads which candidate bar carries the harmonic rhythm
(the pipeline already votes downbeat PHASE from chord changes, Study
31's w4; this extends the same evidence to PERIOD), and a policy that
makes the common fold harmless (draft at the finer grid, merge identical
neighbours). Part C measures the witness at catalog scale; part D buys
the five drafts that tell whether the policy costs chart quality.

## Part C: the witness (src/study37/harmonic.ts, tests/study37.test.ts)

Inputs per song: a base system's beat lattice and bar length in beats
(Beat This final0, small0, madmom-34 from results/study36b-trackers.json;
production from its detected bar and beats-per-bar as a uniform
lattice), and ChordMini's frame-level chord segments on the regular mix
(scripts/chords-study37.sh, extraction only, $0; running before this
registration as instrument preparation, like decoding audio; no score
was computed from them).

Chord changes are segment starts snapped to the nearest beat within
half a beat; transitions into or out of "no chord" are ignored.
Candidate bar lengths are the base length times {1/2, 2/3, 1, 3/2, 2},
integers only, at least 2 beats. Each candidate is scored at its best
phase by startRate × stability, where startRate is the fraction of bars
whose first beat carries a change and stability the fraction of bars
with no change inside them; only bars between the first and last change
count. The witness picks the highest score; ties break toward the
shorter bar; it abstains (keeps the base) with fewer than 8 changes or a
margin under 0.10. The witness's known blind spot is registered in its
tests: a two-bar harmonic rhythm reads as the double bar.

Grading (src/study36/metrical.ts): base bar and witness-corrected bar
against the declared bar (four quarters in 4/4, two dotted quarters in
6/8), strict within 4 % and folded. Per base system and meter class:
fixed (base not strict, witness strict), broke (base strict, witness
not), abstained, and the ceiling "strict bar among the candidates".

Predictions (Beat This final0 base unless stated):
- C1: the witness moves ≥ 50 % of final0's folded-but-not-strict 4/4
  readings (39) to strict.
- C2: it breaks ≤ 15 % of final0's strict 4/4 readings (170). The
  two-bars-per-chord songs are the risk.
- C3: final0's 4/4 strict rate after the witness is ≥ 78 % (from 76).
- C4: final0's 6/8 strict rate after the witness is ≥ 45 % (from 32);
  the 2/3 and 3/2 ratios are what the compound songs need.
- C5: the witness abstains on ≥ 15 % of songs.
- C6 (ceiling): the strict bar is among the candidates for ≥ 90 % of
  4/4 songs under final0.
- C7: on production's base the witness fixes more than it breaks on
  4/4 (production's folded-not-strict set is 57 songs).

## Part D: the policy where it costs money (scripts/run-study37d.ts)

Five re-drafts of Study 35 slots through run-study35's pipeline
verbatim (grid, vote, placement, holds, prompt, grading), the typed
tempo changed to what an automatic grid would hand the product:
- half-bar arm, 4/4 at twice the declared bpm (the tracker's common
  fold): jw-let-it-in 242, jw-same-boat 186, jw-im-letting-go 152.
  Baselines at the declared bar: 18/21, 15/18, 28/33 roots.
- adapter arm, 6/8 at three times the declared dotted-quarter bpm (the
  input adapter's reading; this is the two-draft re-run the bench
  offered the app after Study 35): jw-gravity 144, jw-my-favorite-regret
  195. Baselines at the misread bar: 16/26 and 26/42, both
  confidently-wrong.
Keys as in Study 35 (detected; a visitor who taps a tempo rarely names
a key). New measure: merged bar count (identical neighbours collapsed)
beside the draft's bar count and the baseline draft's.

Predictions:
- D1: each half-bar draft grades within 2 roots of its baseline and
  keeps its class (sequence grading already collapses repeats, so the
  policy is collapse-safe by construction; the risk is the model's
  behaviour on twice the bars with half the notes each).
- D2: each half-bar draft's merged bar count is ≤ 1.3 × its baseline
  draft bar count (the readability cost: bars that carry two chords
  stay split).
- D3: both adapter drafts reach ≥ 80 % roots and at least one grades
  good (≥ 90 % roots, ≥ 80 % qualities).
- D4: the grid-drift hold stays blind by construction: every landed
  grid is within 1.5 % of the typed value.

Fence $0.60 (five drafts at about $0.10). Hard stop before the next
draft if exceeded; results committed as spent. Temperature 0 is
requested and ignored by the gateway on this model family (standing
disclosure); draft sampling noise is on the order of one to three bars.

## Disclosures

- The Study 36b outcomes per song (which readings are half, double,
  strict) were known when the C predictions were written; the witness's
  score, thresholds and candidate set were fixed from the design in the
  proposal and from the unit tests, not from catalog scores, which did
  not exist.
- Part C's chord segments come from the same ChordMini reader whose
  per-bar labels feed the pipeline's downbeat vote; a one-chord vamp
  gives the witness nothing and it abstains there by the 8-change rule.
- Part D uses the Study 35 pipeline and prompt; its five drafts are not
  a re-run of Study 35's gates, and no gate is re-thresholded.

## Results (2026-11-10, registration 3dc106b)

### Part C: the witness is net negative on every base

Corrected run (results/study37c.json; the first run is disclosed
below). Regular mixes with chord segments, 261 songs; base bar = the
system's beats-per-bar × its median inter-beat interval, which reproduces
the Study 36b strict grade on 1,022 of 1,043 cells (the 21 differ because
Study 36b measured the bar from the downbeat lattice directly).

| base, class (n) | base strict | after witness | fixed | broke | abstained | strict bar among candidates |
|---|---|---|---|---|---|---|
| Beat This final0, 4/4 (223) | 165 (74 %) | 136 (61 %) | 1 | 30 | 146 | 199 (89 %) |
| Beat This final0, 6/8 (36) | 13 (36 %) | 13 (36 %) | 1 | 1 | 24 | 24 |
| Beat This small0, 4/4 (223) | 161 | 131 | 0 | 30 | 147 | 199 |
| madmom-34, 4/4 (223) | 164 (74 %) | 135 (61 %) | 4 | 33 | 119 | 203 |
| madmom-34, 6/8 (37) | 6 (16 %) | 12 (32 %) | 6 | 0 | 20 | 23 |
| production, 4/4 (223) | 92 (41 %) | 89 (40 %) | 13 | 16 | 156 | 152 |
| production, 6/8 (37) | 3 (8 %) | 9 (24 %) | 6 | 0 | 21 | 15 |

Anatomy. Of final0's 34 half-or-double folded 4/4 readings, the witness
abstained on 19 (thin margin), confirmed the wrong half bar on 5, and
fixed none of the 26 half-bar cases. Of its 30 breaks, 20 halved a
correct bar and 10 doubled one. The reason is in the score profiles:
ChordMini emits 60 to 124 chord changes per song (sus4, passing and
inversion flicker inside the bar), so the stability term punishes every
longer bar and the witness votes for the half bar whenever it acts
(26 of 77 actions were ratio 1/2, 11 ratio 2). The one place it helps
is the 6/8 base of madmom and production, where it moves 6 songs each
from a double bar (two dotted-quarter bars read as one) to the declared
bar and breaks none; that is the 2/3 and 3/2 ratios doing what C4 hoped,
on the systems whose 6/8 bars are wrong by exactly that ratio.

Exploratory, unregistered (scripts/explore-study37c-flicker.ts,
results/study37c-exploratory.json): removing chord segments shorter than
one beat before change detection leaves the witness net negative (final0
4/4: fixed 2, broke 23); shorter than two beats, fixed 3, broke 12. The
flicker is not the whole story: a real two-chords-per-bar or
two-bars-per-chord harmonic rhythm is read as the half or double bar by
construction, and the catalog has both.

Predictions: C1 wrong (1 of 34 fixed, not ≥ 17); C2 wrong (30 of 165
broken, 18 %, not ≤ 15 %); C3 wrong (61 %, down from 74, not ≥ 78); C4
wrong (36 %, unchanged, not ≥ 45); C5 right (66 % abstention); C6 wrong
by one point (89.2 %, not ≥ 90); C7 wrong (production 13 fixed, 16
broken). The decision is clear: the harmonic-rhythm period witness, as
designed, does not ship; the collapse-safe policy (part D) carries the
octave instead.

Disclosure, instrument correction. The first scored pass of
scripts/run-study37c.ts measured the base bar from the MEAN inter-beat
interval, which tracker gaps bias upward (final0 base strict read 128 of
223 against Study 36b's 170) and failed to reproduce the registered
Study 36 reading. That run is preserved as
results/study37c-defective-run1.json (same direction, all C predictions
but C5 failing). The runner was corrected to the registered median and
given a reproduction check against results/study36b.json, then re-run.
No threshold, prediction, score or candidate set changed; the correction
was committed with the results rather than before the re-run, which the
hard rule asks for, and is disclosed here for that reason.

### Part D: the collapse-safe policy costs nothing and the 6/8 fix pays

Five drafts, $0.452 of the $0.60 fence (results/study37d.json). Grid
drift within 1.4 % on every slot, every draft saved.

| slot | arm | typed | roots | quals | class | baseline roots (class) | draft bars | merged | baseline draft bars |
|---|---|---|---|---|---|---|---|---|---|
| jw-let-it-in | half bar | 242 4/4 | 20/21 | 21/25 | good | 18/21 (saved-below-threshold) | 240 | 98 | 120 |
| jw-same-boat | half bar | 186 4/4 | 16/18 | 11/11 | saved-below-threshold | 15/18 (saved-below-threshold) | 151 | 56 | 74 |
| jw-im-letting-go | half bar | 152 4/4 | 33/33 | 15/15 | good | 28/33 (saved-below-threshold) | 117 | 51 | 58 |
| jw-gravity | adapter ×3 | 144 6/8 | 23/26 | 12/12 | saved-below-threshold | 16/26 (confidently-wrong) | 90 | 58 | 30 |
| jw-my-favorite-regret | adapter ×3 | 195 6/8 | 40/42 | 17/17 | good | 26/42 (confidently-wrong) | 142 | 65 | 47 |

Drafting at half the declared bar did not cost a root on any of the
three songs; it gained two, one and five, and two drafts crossed into
the good class. The model given twice the bars with half the notes each
reads the harmony at least as well, and the sequence grader, which
collapses repeats, cannot tell the two grids apart except through the
roots it finds. The merged bar counts (98, 56, 51) are BELOW the
declared-grid draft lengths (120, 74, 58), because merging identical
neighbours also collapses the song's genuine repeats; a merged chart is
a progression, not a bar chart, and that is the readability question for
the product, not the bench.

The two 6/8 slots at the adapter's true bar move from 16/26 and 26/42
(both confidently-wrong in Study 35, at the misread bar) to 23/26 and
40/42, one of them good. This is the Study 35 units-bug fix measured
where it costs money: the compound-meter chart was a units error, not a
drafting one.

Predictions: D1 wrong under its words (two drafts improved by more than
two roots and changed class upward; the band was meant to catch a loss,
and there was none); D2 right (every merged count under 1.3× the
baseline draft length, in fact under 1×); D3 right (88 and 95 percent
roots, my-favorite-regret good); D4 right (largest drift 1.4 %, gravity).

### What Study 37 settles

The metrical octave is not a problem the harmony can solve from chord
changes, and it does not need solving: a bar half the declared length,
the trackers' common error, drafts at least as well as the declared bar
and merges back. The automatic pipeline for Study 38 is therefore the
tracker's bar as read, with the shorter bar preferred when two
candidates fold into each other, no harmonic-rhythm correction, and the
6/8 adapter fix in place.

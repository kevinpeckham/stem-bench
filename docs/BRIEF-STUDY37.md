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

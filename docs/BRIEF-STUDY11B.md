# BRIEF — stem-bench Study 11b: the shipped tempo ladder, validated

**REGISTERED.** Requested by the stem-shovel side (the addendum in
docs/RESPONSE-2026-10-29-playbook-and-tempo-grid.md and the FINDINGS
pin at their 92ce93e0): the v0.200.0 tempo ladder shipped at
**79ed4def** with a sharper subdivision rule than Study 11's sketch,
and the bench validates the SHIPPED rule — constants and all — plus
the requested swing-stress set. Zero model spend. Following the
Study 6/6b precedent: a shipped refinement of a bench-validated idea
gets its own registration on data it was not tuned on.

## The shipped rule under test (verbatim port, src/study11b/)

From stem-shovel src/lib/audio/analysis.ts and
src/lib/utils/tempoLadderMatch.ts at 79ed4def, pinned by test:

- **Sub-beat test:** compound when ac(L/3) > 1.15·ac(L/2) AND
  ac(L/3) ≥ 0.55·ac(L). Their TRIPLET_SHARE replaces the sketch's
  symmetric clause with an argument the bench accepts: an envelope
  periodic in L has ac(τ) = ac(L−τ), so swing and triplets score the
  sketch's comparison alike, while the share-of-beat floor separates
  them (running triplets 0.6–1.0, swing ≤ 0.5 at equal loudness).
- **Super-beat test:** else compound when ac(1.5L) > 1.05·ac(2L) AND
  ac(1.5L) ≥ 0.2·ac(L), re-picking the pulse at 1.5L — the detector's
  answer itself changes to the dotted beat. Their DOTTED_MARGIN 1.05
  was tuned on their own synthetic fixtures ("a 6/8 whose dotted
  beats are four times louder reads 1.02–1.12"); the bench's 6/8
  renders are less accented, and transfer is exactly what this study
  measures.
- **tempoLadderMatch:** direct, ×2, ×½ always; ×1.5, ×⅔ only with
  compound evidence; tolerance 3 bpm absolute (the shipped default).
- **tempoAlternates:** every rung with its autocorrelation share of
  the beat's — the data the rung-picker UI shows.

## Disclosed development smoke (before registration, zero spend)

Three items through the port: drift-4a reads 120/sub-2 (straight,
correct). **lilt-a still reads 90/sub-2/3-4 — the super-beat test did
NOT fire on the bench's 6/8 render** — while its alternates carry the
true dotted 60 at strength 1.07, top of the ladder. The brief
registers gates knowing one compound item likely misses: the gate
tests the shipped claim's transfer, not the bench's hopes, and the
alternates save is measured beside it.

## Corpus

- The Study 11 corpus: 33 pulsed band items + the 4 scored MMKK
  songs, detections recomputed by the SHIPPED detector (old Study 10
  detections kept beside for regression pairing).
- **The swing-stress set** (corpus/mixes11b.json, seeds 11000+i, the
  Study 10 renderer): ratios {0.60, 0.62, 0.645, 0.67, 0.70} × tempi
  {92, 112, 132} = 15 items, truth straight 4/4 — the addendum's
  request, aimed at TRIPLET_SHARE 0.55 (the build's thinnest margin)
  and DOTTED_MARGIN 1.05 from the false-fire side.
- **The lesson-6-corrected wrong-tempo set:** multipliers as Study 11,
  minus rows within the shipped tolerance (max of 3 bpm and 2 %) of
  ANY true label, and minus items whose detection is not exact —
  wrongness defined against the compared value, per Study 11's sixth
  registration lesson.

## Gates

- **V1 (compound transfer):** the shipped detector reads 6/8 with the
  dotted tempo ±1 on ≥ 3 of the 4 compound items. Reported beside it
  either way: on how many of the 4 the true dotted tempo sits on the
  shipped ladder (alternates) — the rung-picker's save.
- **V2 (no regressions):** 0 items where the old detector was exact
  and the new one is not; 0 straight, hard-swing or MMKK items
  reading subdivision 3 (the false-6/8 risk the addendum names).
- **V3 (swing stress):** 0 of 15 swing-stress items read compound;
  per-item margins reported.
- **V4 (ladder):** 0 false accepts on the corrected wrong set through
  the shipped tempoLadderMatch with the shipped detector's own
  compound flag.

## Predictions (the bench's)

1. V1 FAILS — likely 0–1 of 4 fire (the disclosed smoke; the 1.05
   margin tuned on 4×-accent fixtures does not transfer to the
   bench's ~1.8×-accent renders) — while the alternates carry the true
   dotted tempo on 4/4 compound items at strength ≈ 1, so the
   rung-picker UI still surfaces the right count everywhere.
2. V2 PASSES: the margins err conservative; misses, not false fires.
   MMKK stays straight everywhere, including peaceful-dreams (the
   named real-recording risk).
3. V3 PASSES 15/15, with the closest margins at ratio 0.67 (triplet
   swing — the honest hard case; Study 11 measured its share at 0.47,
   under the 0.55 floor by less than a tenth).
4. V4 PASSES with 0 false accepts — and fewer evaluable rows than
   Study 11, since the corrected generator drops the collision rows
   that produced Study 11's by-letter failures.

## What stem-shovel does with the result

A V1 failure with the alternates save intact is a margin-transfer
finding, not a rollback: the candidate fixes are a lower
DOTTED_MARGIN validated against V2/V3's false-fire sets, or leaning
on the rung-picker (the alternates already carry the truth). V2/V3/V4
passing validates the conservative side of the shipped build. Any
failure of V2 or V3 is a stop-ship signal for the 6/8 output
specifically.

## Spend fences

Zero. Local rendering and arithmetic only.

## Disclosure

Analyst Claude Fable 5. Verbatim port pinned at 79ed4def; does not
chase stem-shovel changes mid-study. The three-item development smoke
is disclosed above and pinned in tests/study11b.test.ts.

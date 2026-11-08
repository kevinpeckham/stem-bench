# Study 30 — downbeat disambiguation for the chartless grid

Registered 2026-11-08, before any scored run. Trigger: Kevin —
"proceed with Study 30", the remedy Studies 28/29 named: the onset
comb's phase picks a beat, not THE beat, and the untethered chartless
anchor landed on the backbeat on letter-lands and peaceful-dreams
(2.1 beats late) and one beat late on mop-heart.

## The design

Candidates: the Study 28 chartless anchor shifted by whole beats, all
`beats-per-bar` distinct lattice positions, each registered inside the
physicality window (never more than one bar before the first sound).
Two chartless-available scorers, each the mean detrended energy at ALL
bar lines of the candidate grid:

- **D1 (registered primary): chroma novelty.** Harmony moves on
  downbeats: novelty = 1 − cosine similarity of adjacent chromagram
  frames. The committed chromagram (Study 12) supplies the frames; no
  chart, no truth, no model.
- **D2 (reported secondary): kick-band onsets.** The onset envelope of
  the mix low-passed at 150 Hz (the complement of Study 29's
  construction: Study 29 removed the kick to stress v5; here the kick
  is the downbeat's witness). Registered expectation: kick-on-1-and-3
  patterns leave a half-bar ambiguity in 4/4, which is why D1 is
  primary.

The chosen candidate is D1's argmax. mop-heart's truth is the Study 27
refined anchor (−0.066 s); letter −0.121, peaceful −0.119, eat +0.415.

## Arms

**Arm A ($0):** both scorers on all four songs; the chosen shift and
every candidate's score reported.

**Arm B (two fable calls, ≈$0.12):** letter-lands and peaceful-dreams
re-drafted exactly as Study 28 (same prompt, model, params, inputs) on
the D1-disambiguated grid — the capstone gate re-asked on the two
songs that failed it. mop and eat are not re-drafted: mop drafted
above reference even a beat off, and eat's anchor was already correct.

## Gates

- **S30-G1:** D1's chosen anchor lands within 0.1 beat of the true
  downbeat on ALL FOUR songs (equivalently: the chosen whole-beat
  shift is the correct one).
- **S30-G2:** the re-drafts reach within 5 points of the Study 28
  references: letter-lands 94.7%, peaceful-dreams 98.7%.

## Predictions

1. S30-G1 passes; D2 is right on at most 3 of 4 (the 1-vs-3 kick
   ambiguity catches at least one 4/4 song).
2. S30-G2 passes, letter near 72/75 and peaceful near 151/153,
   matching the tethered constructions' levels.
3. eat-all-the-clocks is D1's hardest case (its Part 1 changes chords
   twice a bar), registered as the closest call in G1.
4. Spend ≤ $0.2 of a $0.5 fence.

## Spend fence

$0.5. Instruments in src/study30/ with unit tests; runner
scripts/run-study30.ts; results in results/study30.json.

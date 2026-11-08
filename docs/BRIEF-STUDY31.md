# Study 31 — the downbeat from witnesses the song already carries

Registered 2026-11-08, before any scored run. Source: the app's ASK
(stem-shovel docs/bench-brief-study31-downbeat-witnesses-2026-11-08.md),
amended per the bench's review, accepted by Kevin ("yes proceed"):
categorical G1, corrected G3 reference numbers, the eat pickup/pre-roll
adjudication promoted to a named arm, and the harmonic-rhythm witness
run on the bench's own ChordMini-family reader (nchord, per-beat) in
place of production's song.chords_json — a disclosed substitution that
keeps the study self-contained; same model family, not the literal
production rows.

## The frame

All candidates are whole-beat shifts of the Study 28 chartless anchor,
so every quantity reduces to a BEAT CLASS: lattice beat index modulo
beats-per-bar. The truth class per song is the lattice beat nearest the
registered truth anchor (letter −0.121 s, peaceful −0.119 s, mop
−0.066 s from Study 27, eat +0.415 s), taken mod beats. The truths
carry the onset envelope's documented lead (app FINDINGS 2026-11-08,
~50–70 ms), which is well under half a beat on every song, so the
class is unambiguous even where the absolute offset is biased; any
witness that lands a steady 0.05–0.07 s from the truth is evidence
against the ruler, not the witness, and will be reported as such.

## The witnesses (all $0, each votes for one class or abstains)

1. **Time zero (weight 2).** The candidate whose bar line falls within
   0.25 beat of the file's first sample; abstain if none. The phase of
   time zero on the lattice is reported per song in beats.
2. **Last strong onset (weight 1).** The last onset-envelope peak above
   the song's median onset energy. Abstains on a fade (no such peak in
   the last four bars of the audible span) or a ritardando (implied
   local beat from the last eight beats' peak spacing differs from the
   comb beat by more than 3%). Otherwise votes the class of the snapped
   peak.
3. **Both ends (weight 1).** The beat count between the first and last
   strong onsets, mod beats-per-bar. Zero: votes their shared class.
   Nonzero: abstains and reports the remainder (a pickup or a tag).
4. **Harmonic rhythm (weight 2).** Per-beat chord labels from nchord on
   the lattice; every label change is a chord change at a known beat
   class. Histogram mod beats; argmax wins with the margin over the
   runner-up reported. Abstains with fewer changes than beats-per-bar.
5. **Crashes (weight 1).** Mix high-passed at 5 kHz; envelope peaks
   whose decay to a quarter of peak takes longer than a beat. Histogram
   mod beats, argmax. Abstains with fewer than three crashes.
6. **The stems (weight 2).** On the drum stem: snare band (150 Hz to
   2 kHz) peak histogram mod beats — in 4/4 the top two bins must be an
   opposite pair (the backbeats), leaving two downbeat candidates, and
   the kick band (below 150 Hz, on the stem) picks between them; if the
   top two snare bins are not an opposite pair, the kick argmax decides
   alone, disclosed. In 3/4 (mop) the kick argmax decides. The bass
   stem's onset histogram argmax then confirms: if it names a different
   class, the witness abstains.
7. **Section scale (weight 1).** Beat-synchronous chroma, checkerboard
   novelty at 8 and 16 beats; boundary peaks' classes histogrammed,
   argmax. Abstains with fewer than two peaks.

## The vote

Weighted sum over witnesses that did not abstain AND survived S31-G2.
The humility rule: the anchor moves off the base class only when the
winning class leads the base class by at least 2 points and the
runner-up by at least 1; otherwise the song is undecided and the base
stays. Weights and margins are fixed here, before the run, and will
not be tuned to these four songs.

## Named arms

- **A1: time zero alone** and **A2: harmonic rhythm alone** — each
  witness's solo right-count out of 4; a 4-of-4 is what the app ships
  first.
- **A3: eat adjudication.** The mix's first audible sample, the drum
  stem's first strong hit, and the non-drum stems' first sound,
  reported against the truth anchor (+0.415 s): sound inside the beat
  before bar one means a PICKUP (time zero is not a bar line and the
  time-zero witness votes wrong by construction); silence until bar
  one means a PRE-ROLL (time zero is a bar line). This decides how the
  app should define its time-zero witness.
- **A4: re-drafts.** letter and peaceful drafted exactly as Study 28
  (same prompt, model, params, inputs) on the voted grid.

## Gates

- **S31-G1 (hard):** the vote selects the TRUE CLASS on all four
  songs, with none undecided. Absolute offsets are reported, not gated.
- **S31-G2:** no witness that does not abstain, run alone, moves a
  correct base off the downbeat on any song (the base class equals the
  truth class only on eat, so this is eat's test). A witness that fails
  is reported and dropped from the vote, not re-weighted — the app's
  registered procedure, applied as written and disclosed as
  within-sample selection.
- **S31-G3:** the A4 re-drafts reach within 5 points of the Study 28
  references: letter 94.7%, peaceful 98.7%. (The chartless baselines
  were 81.3% and 89.5% in Study 28; the ASK's "61.4%" was Study 30's
  novelty-moved grid, corrected here.)
- Every witness's per-song class, margin and abstention is reported
  whether or not the gates pass.

## Predictions

1. A1 time zero alone: 3 of 4 — right on letter, peaceful, mop; wrong
   on eat via the pickup.
2. A3: PICKUP (eat's +0.415 s is one beat in once the envelope lead is
   added back; a pre-roll would leave silence that the mix's early
   audible span contradicts).
3. S31-G2: the time-zero witness fails on eat and is dropped; no other
   witness fails it.
4. S31-G1: PASS — the surviving vote finds all four, with mop (3/4
   snare logic untested) the registered closest call.
5. A2 harmonic rhythm alone: 3 or 4 of 4; eat's two-chords-a-bar Part 1
   is the risk, as in Study 30's prediction 3.
6. S31-G3: PASS, letter near 72/75 and peaceful near 151/153.
7. Spend ≤ $0.2 of a $0.5 fence (two fable calls; all else DSP).

A pass on four songs is evidence for the vote, not validation of it;
the app's fifth and sixth songs are where these pre-registered weights
earn or lose their keep.

## Mechanics

Instruments in src/study31/ with unit tests; runner
scripts/run-study31.ts; results in results/study31.json.

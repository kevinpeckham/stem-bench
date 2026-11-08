# Study 32 — the downbeat vote against songs built to fool it

Registered 2026-11-08, before any run. Source: the app's ASK
(stem-shovel docs/bench-brief-study32-downbeat-adversarial-2026-11-08.md),
adopted with the reconciliations below. Purpose: the 31 family's
humility gate was vacuous on the real corpus (no correct base existed
once Correction 4 landed), Kevin has no fifth and sixth recordings
ready, and the app wants the gate's teeth from constructed songs now,
with the real songs as confirmation when they arrive.

## Reconciliations (bench amendments to the ASK, registered here)

1. **G1's scope.** As the ASK words it, any voting witness naming
   another class on a correct-base item fails G1 — but arm 2's start
   variants are DESIGNED to deceive time zero while the base stays
   correct. G1 therefore covers arm 1 and arm 5's arm-1 items (the
   ASK's own primary list); arm 2's requirement ("time zero must
   abstain or be outvoted") is governed by G2's never-confidently-wrong
   clause.
2. **Both time-zero variants run and are reported.** The 0.07 s lead is
   the real recordings' envelope, measured in 31d; synthetic pads with
   20 ms attacks may not carry it. The ship vote uses the
   lead-corrected variant per the ASK; the registered prediction is
   that the UNCORRECTED variant sits closer to the lattice on renders.
3. **w6 (the stems) is skipped in arm 6** — the re-cuts are mixes, and
   w6 self-vetoed on all four originals in 31b/31d, so its absence
   changes no verdict; disclosed rather than silently padded stems.
4. **One bench item added: a ritardando ending** (last three bars
   stretched ~8%) beside arm 1's steady endings, so w2 (last strong
   onset) gets its first live vote/abstain pair; reported, not gated.
5. **6/8 renders use beats = 2** (two dotted-quarter beats a bar,
   synth4's own barSeconds), answering the ASK's parenthetical.
6. **The synthetic renderer is the study's own mini-synth** (sine-stack
   chord pads, a 65 Hz kick, band-shaped snare noise, 1.5 kHz count-in
   clicks), committed in src/study32/ with unit tests; the fixture
   synth renders at bar granularity and cannot place an anticipation an
   eighth early.

## The vote (as the ASK registers it)

Ship vote: lead-corrected time zero (2), chord changes (2, deciding
only when the top histogram bin leads the runner-up by a 1.2 ratio,
else abstaining), sections (1); the 31b humility rule (move needs
base + 2 and runner-up + 1). The full seven-witness 31b vote is also
computed and reported for continuity. All features uncapped
(the 31d lesson).

## Arms (items carry their true bar one by construction)

1. Correct bases: 4/4 renders at 100, 132, 180 bpm, 48 bars, kick and
   bass on one, snare at 0.6 on two and four, sections every 8 bars;
   changes every bar (100, 132) and every two bars (180). Plus the
   bench's ritardando variant of the 132 render.
2. Starts that are not a bar line, on the 132 render: (a) opened on the
   downbeat, (b) a one-beat pickup (chord sounds one beat early),
   (c) half a bar of silence, (d) 2.0 s of silence, (e) a four-click
   count-in at tempo. Registered prediction: (e) is SELF-DEFEATING in
   4/4 — four clicks put time zero exactly one bar before bar one, on
   the lattice, so time zero votes correctly.
3. Chord-witness foolers (downbeat-heavy mixes, base correct):
   (i) changes on one and three equally; (ii) one chord every two
   bars; (iii) a one-chord vamp (w4 must abstain at zero changes);
   (iv) anticipations, the chord entering an eighth before the bar.
   Registered prediction for (iv): the per-beat chord witness alone
   votes the "and of four" class (wrong, with a confident margin) and
   the vote survives it through time zero and sections — the finding
   the ASK is asking for.
4. Backbeat-heavy mix (snare 1.0, kick 0.3): the base is the backbeat
   and the vote must move it (predicted 5-vs-0 move).
5. Meters: 3/4 at 140 and 6/8 at 72, each as a correct-base item and a
   one-beat-pickup item.
6. The four real songs re-cut: each mix padded by 0.3, 1.0 and 2.5
   beats of silence and trimmed by 1.0 beat, witnesses and vote against
   the 31d truths shifted by the cut; plus the four originals (G3).
   Predictions: 0.3 and 2.5 pads put time zero off-lattice (abstain);
   the 1.0 pad and trim make it vote one beat wrong; the vote decides
   the truth on every cut via chords + sections (3 points vs 2).

## Gates

- **S32-G1 (the humility gate, with teeth):** on arm 1 and arm 5's
  correct-base items, no witness that votes names another class, and
  the ship vote keeps class 0. One violation fails the gate and names
  the witness.
- **S32-G2 (no false moves):** across arms 2, 3, 4 and 6, the ship
  vote never decides a class other than the truth. Undecided is
  allowed, reported as a rate per arm.
- **S32-G3:** the four originals keep their 31d verdicts under this
  runner (the ship vote decides each song's true class).
- **Arm 7 (the ASK's optional re-draft, run):** letter and peaceful
  re-drafted (Study 31c placement) on their 1.0-beat-pad cuts; the
  draft follows the moved bar one to within 5 points of the 94.7% and
  98.7% references. Fence $0.3 for the study (two fable calls,
  ≈ $0.13 expected; all else $0).

## What a failure means (the ASK's own reading, adopted)

G1 and G2 passing is the app's production condition in place of the
fifth and sixth songs, which become confirmation. A G2 failure names a
witness to down-weight or a case for the app's do-not-place list. A G1
failure on arm 1 raises the humility margin before shipping.

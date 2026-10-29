# BRIEF — stem-bench Study 11: the tempo ladder rule

**REGISTERED.** Specified by the stem-shovel side in
docs/RESPONSE-2026-10-29-playbook-and-tempo-grid.md §3 (2026-10-29,
c970245), finished and registered by the bench the same day with three
⟨bench⟩ restatements, each disclosed to the other side in this brief.
Zero model spend: both instruments are pure functions; the only audio
work is re-rendering committed fixtures for onset envelopes. This
study gates the tempo-grid build list (stem-shovel
docs/tempo-grid-plan.md): all four gates pass → items 1–4 ship; G2
fails even for L-gated → the ladder ships without the 3:2 rungs.

## Why

Study 10 (both arms) showed the detector's octave-family misses are
the program's largest tempo error class, and the tempo-grid plan
proposes a ladder-aware comparison to retire the count-choice half of
it. The stem-shovel review drew the line the bench's plan missed:
half/double are COUNT CHOICES, but a 3:2 reading against a declared
straight meter is a HEARING error (peaceful-dreams: 96.7 against a
declared 4/4 145), so the 3:2 rungs must be licensed by compound
evidence or the ladder excuses real mistakes. That license — the
subdivision test — and its false-accept cost are what this study
measures before anything is built.

## Instruments (src/study11/ladder.ts, unit-tested)

- **L-match** — `tempoLadderMatch(declared, detected, subdivision,
  variant)`: rungs 1, 2, ½ always; rungs 1.5 and ⅔ only when
  subdivision = 3 (**L-gated**) or always (**L-open**). ⟨bench⟩
  Tolerance is a RATIO: |declared/(rung·detected) − 1| ≤ 0.02 —
  production's shipped 2 % rule — instead of the response draft's
  absolute ±3, which tightens incorrectly at high rungs (±3 at rung
  224 is 1.3 %, at 112 it is 2.7 %).
- **S-sub** — `subdivisionOf(envelope, fps, bpm)`: on the detrended
  summed onset envelope (detrend and autocorrelation mirror the
  production port at a99fb18 line for line, pinned by test), r̂ at
  one-third of the beat lag against r̂ at one-half, each averaged over
  lag ±1 and normalized by r̂(0). Subdivision 3 iff r̂(L/3) > r̂(L/2)
  AND r̂(L/3) ≥ 0.4·r̂(L) (SUB3_FLOOR — without the floor, a straight
  item with no subdivision energy at all flips on noise). The test is
  evaluated AT A NAMED TEMPO HYPOTHESIS: for G3 the item's true
  tempo; inside the ladder, the SLOWER tempo of the declared/detected
  pair (the dotted-pulse level is where triplet subdivision lives —
  at the faster member of a 3:2 pair the triplet energy sits at L/2,
  not L/3).
- **Wrong-tempo set** — declared = truth × m for m ∈ {1.07, 0.93,
  1.12, 0.88, 1.5, 1.33, 0.8}, the ×1.5 rows only on straight-meter
  items (on a compound item 1.5× can be a legitimate count). Detected
  is the STORED Study 10 / MMKK detection, so false accepts are
  measured against real detector output, noise included.

Disclosed development smokes (zero spend, before registration): the
r2/r3 values on ten committed items that set SUB3_FLOOR (compound
items ≈ 0.9 of the beat peak, straight ≈ 0, triplet swing 0.12–0.47 —
the honest hard case the gates report apart), and the unit-test runs
on drift-4a, lilt-a, waltz-a.

## Corpus

The 33 pulsed Study 10 band items and the 4 MMKK songs with declared
tempi (37 items; the Study 9 items are the mislead subset of the 33 —
the response's listing double-counted them). Detections come from the
committed results files (study10-instruments.json, study10-mmkk.json);
envelopes are re-rendered from the committed specs and seeds, and for
MMKK recomputed from the hash-verified audio exactly as the amendment
ran (per-stem features combined).

## Registered measures and gates

- **G1 (octave-class recovery).** Of D-prod's six octave-family
  misses — lilt-a, lilt-b, contrast-c, **verb-y** ⟨bench: the
  response listed the dense half-time item, but that was N-beat's
  miss; D-prod was exact there — verb-y (126 vs 84) is the sixth⟩,
  mop-heart, peaceful-dreams — L-gated turns **≥ 4 of the five
  count-class misses** into matches at a non-unit rung, AND does
  **not** accept peaceful-dreams ⟨bench: sharpened from "≥ 4 of 6 at
  the correct rung" — by the review's own argument the correct
  outcome for a straight-meter ⅔ reading is NO match, so accepting it
  would be a failure, not a success⟩.
- **G2 (false accepts).** L-gated accepts **0** of the ×1.5
  straight-meter rows; L-open's accepts are reported (predicted:
  nearly all — detected ≈ truth on most items, so a ×1.5 declaration
  sits exactly on the ungated rung; that, not a small count, is the
  argument for gating). All multipliers reported by class.
- **G3 (subdivision accuracy).** At the true tempo: subdivision 3 on
  ≥ 3 of the 4 compound items (lilt-a, lilt-b, contrast-c, verb-y);
  subdivision 2 on every straight item OUTSIDE the swing pair; the
  swing pair reported apart (a 3-read there is a genuine triplet
  feel, and per the response it means swing needs its own flag before
  any 6/8 output ships).
- **Derived meter** (reported): 6/8 named on the compound items
  (today's vote cannot express it), any straight item mislabeled 6/8
  counted as the cost.
- **G4 (no true disagreement silenced).** ⟨bench: redefined — the
  response's dry-run over Study 7's cells fails by construction,
  because Study 7's registered wrong settings are ×2/÷2 EXACTLY (the
  wrongCandidates transform), i.e. they sit on the always-accepted
  rungs; a half-wrong value and a half-time count are musically the
  same claim, which is the deep tradeoff, not a bug.⟩ Registered
  form: on the wrong-tempo set's non-3:2 rows that production's
  shipped 2 % rule flags, the ladder silences **0**. The Study 7
  ×2/÷2 rows are counted and REPORTED as silenced-by-design, with the
  rung-picker UI named as the surface that absorbs that ambiguity.

## Predictions (the bench's)

1. G1 passes 5/5 on the count-class misses (all four compound items
   carry r̂(L/3) ≈ 0.9·r̂(L) at the slower pulse; mop-heart is a
   plain rung 2), and peaceful-dreams is rejected — S-sub at ~96.7 on
   that real mix reads 2.
2. G2 passes for L-gated; L-open accepts ≥ 80 % of the ×1.5 straight
   rows — the measured justification for gating.
3. G3 passes 4/4 compound; swing-x reads 3 (its r3/rBeat = 0.47 sits
   above the floor — honest triplet swing), swing-y reads 2; no other
   straight item reads 3.
4. G4 passes with 0 silenced; all 12 Study 7 wrong-tempo rows sit on
   the rungs (they were built as ×2/÷2) and are reported as the
   tradeoff.

## Spend fences

Zero. No model calls, no downloads; compute is local rendering plus
pure arithmetic.

## What ships on a full pass

stem-shovel's tempo-grid-plan build items 1–4: the subdivision test in
detectMeter (6/8 expressible), `Detection.tempo.alternates` with rung
evidence, one `tempoLadderMatch` util behind settingsChartDisagreement
/ the Scan replace offer / the upload notice (3:2 rungs gated on
compound evidence), and the rung display with the declared value
selecting the rung. Not shipped regardless: beat timestamps, Beat
This!, settings-model changes. If G2 fails even gated, the ladder
ships with rungs {1, 2, ½} only.

## Disclosure

Analyst Claude Fable 5. No model is measured or consulted; every
number is a pure function of committed fixtures, stored detections and
re-rendered envelopes. The SUB3_FLOOR constant was set from disclosed
development smokes before registration, like Study 9's ACTIVE_FRACTION.

## Amendment 1 (2026-10-29, before any result is accepted)

The first full run — disclosed, its output superseded — caught two
instrument defects, fixed here and re-registered before re-running:

1. **The slower-of-pair subdivision hypothesis is confounded.** A
   straight song misread at ⅔ maps its true duple eighths exactly onto
   the slower pulse's thirds (peaceful-dreams: the 145-grid eighth at
   0.207 s IS 96.7-beat/3), so the license test read "compound" on the
   one item it exists to reject. The registered hypothesis becomes the
   DECLARED tempo — the declaration is the claim under test: lilt-a's
   declared 60 is genuinely compound there (r̂(L/3) ≈ 0.72) while
   peaceful-dreams' declared 145 is straight there (0.03). The
   slower-of-pair read stays in the results record so the confound
   remains visible.
2. **Tempo-change items must match against any declared row** (rung 1
   first): shift-b's detection equals its second section's declared
   108 and was scored a mismatch against the first section's 72.

Gates, predictions and all other definitions are unchanged.

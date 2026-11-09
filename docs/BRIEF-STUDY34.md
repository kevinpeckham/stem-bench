# Study 34: the chartless draft outside MMKK (breadth)

Registered 2026-11-09, before any scored run. Answers the app's brief
(stem-shovel docs/bench-brief-study34-breadth-2026-11-09.md): can the
chartless draft pipeline face recordings it has never seen — other
artists, other eras, other capture quality? The app will expose a
public signed-out upload tool only if S34-G1 and S34-G2 pass.

## Pipeline under test

The committed port, identical to Study 33's shared pipeline on the
MONO DOWNMIX (Study 33's production answer): Basic Pitch transcription
(src/fixture model, UNCAPPED 600 s), chartlessGrid with the declared
bar duration as prior, the Study 32 vote (w1lead x2 at LEAD 0.07,
w4ratio x2 with the 1.2 ratio rule, w7 x1), 31c placement, nchord
per-bar hints (the disclosed ChordMini substitution), the Study 23
prompt to claude-fable-5-1 through the gateway (temperature ignored by
the gateway; sampling noise disclosed since Study 32).

**Declared inputs for wild recordings** (registered design decision):
a public upload has no user declarations, so "declared" tempo, meter
AND key come from the production DSP port — study9 `analyse()`
(detectTempo, detectMeter, detectKey) on the production-capped mono
features, exactly as run-study10/22 call it. The production meter
detector only knows 4/4 and 3/4, so the 6/8 jig necessarily gets a
wrong prior; that is production reality and part of the breadth
measurement. The two Badverbs slots keep their page declarations (the
app's real chartless flow has them); every non-Badverbs slot uses
`analyse()`. Each slot's record
notes which path it took.

## Corpus (pinned d3e7f8c, audio gitignored, hashes committed)

corpus/study34-sources.json, corpus/fixture-study34.json: 12
recordings, all rights-clear (Kevin confirmed 2026-11-09). Truth in
corpus/study34-truth/, built and committed before this registration
(commits 014058f, 8b42dd8, d27d3c6, bd6a846).

Truth tiers (docs/VALIDATION-STUDY34-INSTRUMENTS.md decided these on
known-truth validation BEFORE registration; chroma timeline fitting is
rejected and never constructs truth):

| Slot | Tier | Truth | Declared |
|---|---|---|---|
| eat-control | 1 (control) | band chart, grid 120 bpm anchored -0.085 (Correction 4) | page |
| interbellum | 1 | band chart, grid 115 bpm anchored 0 (diag-interbellum-anchor) | page |
| dippermouth-blues | 1 | JAAH annotation, aligned (contrast 1.78) | analyse() |
| st-louis-blues | 1 | JAAH annotation, aligned (contrast 1.34) | analyse() |
| livery-stable-blues | 1 | JAAH annotation, aligned (contrast 1.19) | analyse() |
| roll-called-up-yonder | 2 | Cyber Hymnal MIDI extraction, 16 bars Ab 4/4 | analyse() |
| three-oclock-waltz | 2 | sheetmusicsinger MIDI extraction, 118 bars 3/4 | analyse() |
| jw-let-it-in | 3 | artist's section progressions, transposition 0 (gate ACCEPT margin .053) | analyse() |
| jw-same-boat | 3 | artist's section progressions, roots interval-invariant (gate REFUSE margin .006) | analyse() |
| kitten-on-the-keys | class-only | expected F 4/4 (1921 sheet reviewed; eye transcription refused as unverifiable) | analyse() |
| sp-today-live | class-only | expected Eb 4/4 (published key; public progressions too inconsistent to register) | analyse() |
| irish-jigs-medley | class-only | expected 6/8; no published harmony for this performance | analyse() |

## Grading (all mechanical, committed, tested: src/study34/grade34.ts, 18 tests)

- **Tier 1** (time truth): draft bars paired to truth bars by midpoint
  (`pairBarsByTime`), then Study 23 `rootScore` for roots,
  `qualityScore` for the five quality families (maj/min/dom/dim/sus,
  extensions ignored), `slashScore` where truth writes a bass.
  Structure: bar count vs truth, `sectionScore` (within 1 bar),
  bar-one placement within 0.25 beat of truth anchor.
- **Tier 2** (bar truth): index-aligned per bar over
  min(draft, truth) bars — the Study 33 precedent; roots + quality
  families; bar count; no time checks.
- **Tier 3** (sequence truth): `sequenceScore` (LCS over collapsed
  roots, and over quality families) against the published
  progressions; jw-same-boat's roots use `sequenceScoreIntervals`
  (transposition-invariant) per its refused calibration gate.
- **Class-only**: refusal/save class, meter plausibility vs expected,
  and the gated global key calibration vs expected key (margin >=
  0.02, else "inconclusive"). Observational; counts toward no gate.
- **Class** per slot (the app's wording): good / refused /
  confidently wrong. "Confidently wrong" = a SAVED chart with roots
  < 80% (per-bar for Tiers 1-2, sequence LCS for Tier 3) or, for
  Tiers 1-2 only, bar count off by more than 1 against truth
  (Tier 3 publishes no bar counts).
- Thresholds per the app's brief: roots >= 90%, qualities >= 80%
  (sequence-family LCS >= 80% for Tier 3), structure right =
  bar count within 1 and sections within 1 bar (Tier 1).

## Gates (the app's, restated mechanically; never re-thresholded)

- **S34-G1**: no accuracy-graded slot (the 8 non-control Tier 1-3
  slots) is confidently wrong.
- **S34-G2**: at least 6 of the 8 accuracy-graded slots meet their
  tier's thresholds (roots >= 90% AND qualities >= 80%). The app
  wrote ">= 8 of 12, clean MMKK excluded" when it assumed 12 graded
  slots; with 8 accuracy-graded (3 slots became class-only for lack
  of registrable truth, 1 is the control), 6/8 = 75% is slightly
  stricter than the app's 8/11 = 73%. The mapping is registered here
  before any data exists.
- **S34-G3** (phone captures): DEFERRED — Kevin dropped rehearsal
  captures from the corpus 2026-11-09; a future study takes this.

## Spend

One run, 12 drafts, claude-fable-5-1. Estimate: Study 33 mono drafts
ran $0.06-0.14; 78-era transfers may transcribe noisier (more notes,
bigger prompts), so estimate ~$1.50 total, fence **$5.00 (Kevin
approved 2026-11-09, "rights are cleared, proceed")**. Registered kill
rule: if the first two drafts together exceed $0.80, stop, commit
partial results, and disclose before continuing. $0 reruns of grading
are unlimited (results are committed raw).

## Disclosures

- Gateway ignores temperature on fable-5-1; single-sample drafts carry
  sampling noise (Study 33: five arms spanned three bars on letter).
- nchord stands in for production ChordMini (since Study 10).
- The analyst model family (Fable) measures claude-fable-5-1; tolerable
  only because every grader is mechanical and registered here.
- MIDI-derived Tier 2 truth labels carry melody-tone bleed (a passing
  seventh can color a bar "maj7"); quality grading at FAMILY level
  absorbs this, root grading is unaffected.
- Tier 2 index alignment degrades if the recorded performance departs
  from the published form (verse counts, repeats); that degradation
  lands on the measurement and is discussed, not patched, in the
  report.
- The seqalign free/grid/rigid aligners were built, validated on known
  truth, REJECTED, and stay in the repo as evidence
  (docs/VALIDATION-STUDY34-INSTRUMENTS.md).
- Chart truth authorship: no bench-authored harmony exists in this
  corpus — every accuracy truth is a publication (JAAH, band pages,
  artist pages, source-matching MIDIs of PD sheets). Kitten's slot was
  downgraded rather than hand-transcribed.

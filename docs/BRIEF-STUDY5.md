# BRIEF — stem-bench Study 5: the composed pipeline (when the reader feeds the listener)

**Pre-registration, committed before any scored run.**

Studies 3 and 4 measured the two halves of a shipped path separately:
chart-read (a model reads an engraved score into a per-measure summary;
98.8% chord recall from a PNG, 76.0% from a PDF) and the song-check (a
model "listens" to a mix — and Study 4 showed it reads whatever text
rides along, achieving perfection only in the chart arm, which was fed
the TRUE summary). Production composes them: the chart beside the mix
is chart-read's imperfect output, not truth. Study 5 measures the
composed chain — engraved page → chart-read → chart-anchored
song-check — and classifies every error's path through it. Since the
listener reads rather than hears, the registered question is whether
reader errors pass through 1:1, get amplified into confident wrong
placements, or get damped by what little the model hears.

## The fixture (committed before registration)

For each of Study 4's 12 metered mixes, the matching lead sheet — the
same MeasureSpec mapping the chart arm's truth summaries were built
from — engraves through Study 3's exact pipeline (Verovio, white PNG
at 1600 px, vector PDF) into corpus/scores5/ (fixture5.json). The page
the reader reads is the score OF the mix the listener hears; the truth
summary of the same XML grades the reader. Three committed instruments
compose; the new code is glue plus the propagation classifier.

## Arms (3; the ceiling is frozen, not re-run)

- **C5-truth (ceiling)** — Study 4's frozen gemini-3-flash L-chart
  cells (true summary beside the mix; 12/12 on every field, 6/6
  changes placed). Reused as the registered baseline, not re-run.
- **C5-png** — fable-5-1 reads the PNG (Study 3 protocol, verbatim);
  its output text replaces the chart in Study 4's L-chart call.
- **C5-pdf** — the same through the PDF, the degraded production path.

Reader cells: 24 (12 × 2 formats, fable). Listener cells: 24
(gemini-3-flash, production's listener, true candidates as in L-chart).
A reader cell that fails outright skips its listener cell (recorded).

## Grading (mechanical, committed, tested)

The reader grades against the truth summary with Study 3's grader. The
listener grades against the mix truth with Study 4's grader. The
propagation classifier (src/grading/propagation.ts, tested) extracts
the reader's asserted facts (first key/meter/tempo; post-m1 key and
tempo assertions as changes) and classifies each of five fields —
tempo, meter, key, tempoChange, keyChange — per item and arm:

- **pass** (reader right → listener right)
- **listener-added** (reader right → listener wrong)
- **propagated** (reader wrong → listener repeats the reader's wrong
  value)
- **rescued** (reader wrong → listener right anyway)
- **mutated** (reader wrong → listener wrong differently)

## Hypotheses

- **S5-G1 (the gate — comparative per the AR lesson, scoped to the
  production chain):** listener-added errors ≤ 2 per composed arm. The
  frozen ceiling's own error count on the same fields is the
  comparison anchor (it was 0); the +2 margin absorbs sampling noise.
  The gate asks exactly one thing: composing does not break the part
  that worked.
- **S5-H2 (the headline — registered read):** the propagation split
  among reader-wrong facts. Prediction: ≥ 80% propagated 1:1,
  rescues rare (< 20% — the audio contributes almost nothing, per
  Study 4), mutations rare.
- **S5-H3 (registered read):** C5-pdf trails C5-png by roughly the
  reader gap Study 3 measured — the rasterize-your-PDFs guidance
  surviving composition.
- **S5-H4 (descriptive):** change placement in seconds when the reader
  carried the change; confidence on propagated errors (prediction:
  1.0 — confidently wrong, inherited); per-item anatomy table.

## Spend

Single phase (the study is small and its ceiling is frozen): reader
~$2.5 (fable over 24 engraved pages), listener ~$0.3. Fence **$6**.
Authorized by Kevin's "Proceed" (2026-10-24).

## Interpretation table (pre-registered)

| Outcome | Reading |
|---|---|
| Gate passes, propagation ≈ 1:1 | The chain is exactly as good as its reader: chart-read's accuracy IS the song-check's accuracy, the PDF gap survives composition, and the ship guidance consolidates to one sentence — rasterize the PDF, and show the user the summary before it anchors anything |
| Rescues common | The listener hears more than Study 4 credited when text and audio disagree — worth its own follow-up, because it changes the blind-arm interpretation |
| Mutations or listener-added common | Composition adds its own error class; the two-model chain is less reliable than its parts and the product should surface intermediate output for correction |
| Reader fails outright on these simple sheets | Study 3's corpus was harder than these one-page loops; a reader floor this low would revise Study 3's per-class read downward |

## Amendment 1 (2026-10-24, after the first run): the C5-pdf arm inherited a fixture artifact — and found it

The composed chain worked as designed and its anatomy caught a bug
upstream of both studies: the C5-pdf reader reported flat-less chords,
tracing to pdfkit dropping Verovio's SMuFL text accidentals from every
PDF (see BRIEF-STUDY3.md "Correction"). The PDFs are re-rendered with
ASCII accidentals; the C5-pdf reader and listener cells are discarded
(results/archive/study5-pdf-accidentals/) and re-run; C5-png cells and
the frozen ceiling are untouched. Also disclosed from the first run's
classification: the value-level fact extraction attributes a reader's
POSITIONAL error (a modulation read at the wrong measure) to the
listener, because the listener faithfully converts the wrong measure
to seconds — two of the first run's three "listener-added" errors were
this. The classifier is unchanged (registered before the run); the
analysis reports position-propagation explicitly in the anatomy, and
the gate verdict is read with that attribution noted.

## Disclosure

Analyst Claude Fable 5; the reader is claude-fable-5-1 (same family)
and every grade is mechanical, committed and tested before any scored
run. The ceiling cells are reused frozen records, disclosed; nothing
about them is recomputed. The five-field fact extraction is committed
code over the same parser both Studies 3 and 5 grade with.

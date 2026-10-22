# BRIEF — stem-bench Study 3: can a model read sheet music? (the chart-read round trip)

**Pre-registration, committed before any scored run.**

stem-shovel's `chart-read` (readChartWithAi, src/lib/server/aiDetect.ts)
has a model read a PDF or image of an engraved score into a per-measure
text summary — the summary that then feeds the song check and the chart
draft. Its model choice and its modality claim ("Gemini listening to the
mix did not read key signatures off a six-page engraved score; read as
text, the keys are plain") rest on one informal test. Study 3 measures
the feature as a round trip: scores authored as MusicXML with every fact
known, engraved by Verovio exactly as a user's PDF would be, read by the
model under production's prompt, and graded against the deterministic
summary production itself makes of the source XML (`musicXmlSummary`,
ported verbatim and pinned). There is no public LLM notation-reading
benchmark we know of; this registers one.

## The fixture (committed before registration)

11 scores (corpus/scores.json → corpus/fixture3.json and
corpus/scores/): 10 readable lead sheets — 268 measures across keys from
4 sharps to 3 flats, major and minor, with mid-piece key changes,
meter changes (4/4, 3/4, 6/8), tempo marks and a mid-piece tempo change,
rehearsal marks, section words, repeat barlines with first/second
endings, segno/coda/fine, slash-bass chords, sus/power/sixth/ninth/
half-diminished qualities, and one N.C. measure; two scores paginate to
2 pages — plus **the honesty probe**: a normal score rendered at a
destructively low 150 px, where the registered correct behavior is
production's own instruction ("if a page is unreadable, say so on a
final line beginning 'Note:'"). Tempo renders as plain words ("120 bpm")
beside a machine-readable `<sound tempo>`: the metronome glyph does not
survive rasterization (disclosed; the grader accepts either reading).
All artifacts committed; fictional titles throughout.

Study 2's registration lesson applied up front: the failure class where
a model confidently summarizes what it cannot read is pre-registered
here as the probe, not discovered later.

## Arms (2): the input format

- **D-pdf** — the multi-page PDF, production's file path. All 11 items.
- **D-image** — the PNG page, production's image path. Single-page
  items (9 readable + the probe).

## Protocol

Production's call, ported verbatim and pinned (tests/study3.test.ts):
the system prompt byte-for-byte, the file or image plus "Summarize this
chart as instructed.", no retry (production's chart-read has none at the
ported version). Registered deviations: temperature 0 and maxOutputTokens
8000 (production sets neither). Fable carries production's adaptive/low
thinking; haiku runs provider defaults (Study 1 Amendment 1, registered
up front this time).

## Grading (mechanical, committed, tested)

Ground truth and model output parse through the same committed line
reader. Per element class — keys, time signatures, tempos, rehearsal
marks, words, repeats, endings, segno/coda/fine — **recall at the exact
measure** (primary) and **within ±1 measure** (secondary: a counting
slip is not a reading failure). Chords score recall (exact and ±1) and
precision, under the extended registered equivalence (root pitch class +
canonical quality; enharmonics and Verovio's "GMaj7" capitalization
equal; slash bass ignored). Header lines (Title/Part) are not graded.
The probe grades by the registered Note-line regex
(`unreadable|cannot read|illegible|too small/blurry/low`) and the count
of fabricated chord- or key-bearing measure lines.

## Models and cells

20 cells per model (11 D-pdf + 9 D-image... the probe rides both arms:
10 + 10).

- **Pilot:** `google/gemini-3.5-flash` — fence **$4**. Authorized by
  Kevin's "Sounds good; proceed" (2026-10-22).
- **Matrix:** `anthropic/claude-fable-5-1` (production's chart-read
  model), `anthropic/claude-haiku-4.5`, `anthropic/claude-opus-4.8`.
  Estimated $8–18 (score pages are large image inputs); fence **$30**.
  Runs only on Kevin's explicit go-ahead after the pilot's results are
  committed. (gpt-oss-120b and kimi-k2.6 are text-only on the gateway
  and sit this study out.)

## Hypotheses

- **S3-H1 (the production claim — the gate):** the production model
  (fable-5-1) reads key signatures at ≥ 90% recall within ±1 measure on
  readable items, arms pooled. An absolute bar, registered because the
  bound IS the claim under test (the AR rule's stated exception): the
  product's chart-beside-the-mix design assumes keys read reliably from
  the rendered score.
- **S3-H2 (honesty — the gate):** zero fabricated chord- or key-bearing
  measure lines on the unreadable probe, every model, both arms — the
  disqualifying class, as in aeo-bench's zero-invention gates. The
  Note-line declaration is the registered correct behavior; a model
  that declines without the exact Note form is a format miss, not a
  fabrication.
- **S3-H3 (modality — registered read):** PDF vs PNG, paired per
  single-page readable item, per model.
- **S3-H4 (descriptive):** the per-class table (prediction: repeats and
  endings are the weakest class), chord recall/precision, measure-count
  drift, multi-page vs single-page, cost per score.
- **The study gate: S3-H1 AND S3-H2.**

## Predictions (registered before any scored run)

1. Fable passes S3-H1 (keys ≥ 90% ±1); the anecdote holds under
   measurement.
2. Chord recall: fable 65–85% exact, higher ±1; the gap between exact
   and ±1 is mostly measure-counting drift, concentrated in the
   48-measure items.
3. Repeats, endings and segno/coda/fine are the weakest classes for
   every model (< 50% exact somewhere in the matrix).
4. The probe: fable and opus decline honestly; at least one model
   fabricates a plausible G-major chart from the 150 px smear (if any
   does, S3-H2 fails loudly and that is the headline).
5. PDF ≈ image for anthropic models; gemini reads the PDF worse than
   the PNG (its PDF path rasterizes internally at unknown resolution).

## Interpretation table (pre-registered)

| Outcome | Reading |
|---|---|
| Both gates pass | chart-read's design is measured sound: keys reliable, honesty holds; publish the per-class map as the first LLM notation-reading benchmark and the per-model cost table as the swap guide |
| S3-H1 fails | The product's score-beside-mix design over-trusts the reader; ship guidance is to surface the summary for user correction before it feeds the song check |
| S3-H2 fails | A model invents a chart from an unreadable page — the sharpest anti-recommendation for that model on this surface, and the accept-and-disobey lesson (Study 2) generalized to vision: publish loudest |
| Chords strong but placement weak (exact ≪ ±1) | The failure is counting, not reading; ship guidance: number the systems in rendered scores, or chunk long scores per system before reading |
| Multi-page collapses vs single-page | Page-boundary measure counting is the defect; the six-page anecdote score deserves a registered follow-up with per-page reads |

## Amendment 1 (2026-10-22, after the first pilot, before any matrix cell)

The first pilot's anatomy exposed two fixture defects, both input
artifacts, neither a model result:

- **The PNGs were transparent.** Resvg preserves the SVG's alpha, and a
  transparent page composites to black-on-black at the model ("the
  provided image is completely black and unreadable" — the pilot
  model's own words). Every D-image cell measured the void, including
  the probe's apparently honest declaration. Fixed: white background.
- **The probe's PDF was vector.** SVG-embedded PDFs stay crisp at any
  zoom, so the 150 px destruction only ever applied to the PNG arm —
  the pilot read the probe PDF 8/8, which under the registered honesty
  grading would have counted as fabrication when it was accurate
  reading. Fixed: the probe's PDF embeds the destroyed raster.

The fixture is rebuilt, the first pilot run is discarded in full
(results/archive/study3-pilot1-black-images.json) and re-run under the
fixed fixture. Gates, grading and fences unchanged. The salvage read
from the discarded run, for the record: on readable VECTOR PDFs the
pilot model scored 76.8% exact chord recall with +9.6 mean
measure-count drift — numbers the clean re-run should roughly
reproduce in its D-pdf arm.

## Disclosure

The analyst model is Claude Fable 5; the matrix includes
claude-fable-5-1. Every grade is mechanical, committed and tested before
any scored run; the ground-truth instrument is production's own summary
code, ported verbatim. The corpus was authored by the analyst as
MusicXML specs; all facts graded are mechanical properties of those
committed specs, so no taste judgment enters any score. Fixture
iterations before registration (bass-harmonic masking does not apply
here; the title clip, the volta barline order, the N.C. root and the
parser's colon split were found by pinned tests and visual review) are
in the git history; nothing changes after this commit.

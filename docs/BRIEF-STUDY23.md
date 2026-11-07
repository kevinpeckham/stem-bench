# Study 23 — recording to chart: can the production draft layer auto-write the barmark chart, grid-given?

**Registered before any scored run.** Date: 2026-11-07. Kevin's go-ahead
("proceed with both") covers registration and the pilot fence below.

## The question

Kevin's research question: can barmark charts be auto-written in
stem-shovel from analyzing the recording? Study 22 settled the grid leg
(grid-given is the only certifiable design today), Study 21 measured the
chord leg (roots 90.3 % across the catalog, colors half-heard), and
Studies 20/20b proved code cannot write the colors from notes. What
remains is the composition the user would actually get: production's
draft layer reading the recording's artifacts and emitting a chart. This
study runs that composition end to end on all four charted songs.

## Inputs per song — what the app would have

- **Notes per bar:** the production transcription path exactly as
  Studies 1/13/20b — harmonic stem sum, Basic Pitch via the committed
  child, `describeBars` over the Study 12 bar grid (grid-given, per
  Study 22's registered decision).
- **Hint per bar:** the SHIPPED chord reader's per-bar labels, read from
  the committed results/study21.json (the same pipeline Study 19 gated),
  joined into segments and bracketed exactly as production brackets its
  matcher hints. The production hint sentence ("A simple template
  matcher's guess…") is kept VERBATIM although the source is now
  ChordMini — the registered fidelity choice; whether the app would
  reword it is the app's call, not the bench's.
- **Tempo, meter, key:** from the chart headers (declared values the app
  holds for every song); letter-lands' and eat-all-the-clocks' keys from
  the committed study13 results' declared metadata.

One registered template adaptation: the Study 1 question hard-coded
"4/4" because its fixture was all 4/4; this study interpolates the
declared meter (mop-heart is 3/4). A pin test proves the question
byte-identical to the Study 1 builder whenever the meter is 4/4.

## The arm ($, fenced)

One call per song to production's draft model (claude-fable-5-1,
production call shape from the Study 1 harness verbatim: adaptive
thinking, effort low, max 8000 output tokens; temperature 0 is the
program's standing registered deviation). Four calls total.

## Grading — all mechanical, committed before the run

The PRIMARY channel is the draft's `chart` markdown, read through the
production adapter (src/study16/barmarkChartBars.ts, barmark pinned at
0.5.0, the version the app consumes): the chart the user would see, read
the way the app reads it. The JSON `chords` string (production's per-bar
channel) is graded beside it as a consistency read. Per-bar answers take
each bar's first chord. Grades: root-level over chord-bearing bars
(barmark-0.17 pitch classes), strict (Study 20's gradeStrict), and the
Study 13/21 allowance grades, per song. The hint baseline for G3 is
computed IN-RUN from the same hint arrays by the same root function —
the Study 20b lesson (anchor constants derived from the same accounting
as the thing they anchor), applied.

## Gates

- **S23-G1 (validity):** on all four songs, the draft's chart parses
  through the production adapter (non-null, at least one bar).
- **S23-G2 (structure):** the adapter's expanded bar count equals the
  song's bar count on at least three of four songs (the draft is told
  every bar; the chart must not lose or invent bars).
- **S23-G3 (content):** on every song, the chart channel's root-level
  accuracy over chord-bearing bars is at least the HINT's own root-level
  accuracy minus five points — the draft layer must not destroy the
  reader's roots.
- **S23-G4 (the color question):** on peaceful-dreams' 62 dialect bars
  (truth quality 5(7) or 7sus4 — the bars Study 21 showed are half-heard
  and worth zero to the reader alone), the chart channel's strict-right
  count is at least 10. The reader alone scores 0 there by vocabulary,
  so any pass means the draft layer recovers colors code could not.

## Spend fence

**Pilot: the four calls above, fenced at $2.** No matrix is registered;
prompt variants or other models need a new registration and Kevin's
go-ahead.

## Predictions (scored in the report)

1. G1 passes 4 of 4 — the draft model has emitted parseable charts since
   Study 1.
2. G2 passes on exactly three of four: one long song (153 or 140 bars)
   drifts by at least a bar in the chart's compressed repeats.
3. G3 passes on all four — Study 1 measured this model at zero flips
   against hints, so the roots ride through.
4. G4 passes with 15–35 of 62: D7sus4 is literally one of the production
   prompt's notation examples, so the 7sus4 bars carry most of the
   recovery; the 5(7) spelling appears in no example and recovers less.
5. mop-heart's chart channel reads at least 100 of 140 strict — on an
   all-triad song the draft mostly needs to not break the hint.

## Disclosure

Analyst Claude Fable 5; the measured model is claude-fable-5-1 (same
family) — tolerable under the program's standing rule because every
grade is mechanical and committed before the run. Transcription,
alignment, prompts and adapter are pinned ports; the one template
adaptation (meter interpolation) is registered above and pinned by test.

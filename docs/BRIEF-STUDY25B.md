# Study 25b — eat-all-the-clocks on the corrected chart

Registered 2026-11-07, before the one scored run. Trigger: Kevin —
"according to the barmark parser there are 71 bars which matches the
hand-added sections precisely and matches the song precisely — so we
may still have a gap somewhere". The gap was the bench's: the live
chart (stemshovel.com, chartVersion 131) has 71 bars — each Chorus is
8 bars (the 4-bar line x2) where the fixture carried 12, and the Outro
is 1 bar + fade where the fixture carried 4. 15 phantom bars: the
entire "arrangement mismatch" of Studies 25/26 was the bench's chart
fixture, not the band's arrangement.

## Design input (disclosed): the $0 adjudication

scripts/diag-eat71-2026-11-07.ts, run before this registration:

- Reader hints on the true grid (anchor 0.415 s, period 2.0 s, 71
  bars) score 65/71 against the live chart, UNIFORM across the song
  (15/16, 14/16, 14/16, 16/16, 6/7 per window) vs 56/84 with decay
  against the fixture. The recording matches the live chart
  bar-for-bar.
- The DTW itself was never broken on eat: against a reference rendered
  from the 71-bar chart, interior mean error is 0.45 s.
- The Study 26c recipe on that alignment repairs eat like the other
  songs: ends 0.01–0.02 s / 0.45–0.03 s (all within a quarter bar),
  bar 1 accepted, median exactly 2.000 s. The refusal it produced in
  Study 26 was the interior-trust check correctly detecting a WRONG
  CHART — which is now its documented purpose.

## Claim corrections this registers (published with the results)

1. "eat's chart is ~13 bars longer than its recording plays" →
   withdrawn; the FIXTURE was 15 bars long; the band's chart matches.
2. "the arrangement mismatch extends into the played span" (Study 25's
   S25-G2 reading) → an artifact of grading against the wrong chart.
3. "the compression is forced, not seduced" (Study 26's ablation
   reading) → downgraded to OPEN: the trim-to-drums ablation was
   ill-posed as constructed (it removes audio the chart's first bars
   need), and with correct anchors the other three charts FIT their
   audio, so the "charts overrun the audio on every song" support is
   withdrawn. The recipe's measured results are unaffected.

## Construction

One arm, one fable call: Study 25's B4 construction on eat with the
corrected chart (corpus/mmkk-charts-eat-v131.json): declared period
2.0 s, anchor 0.415 s (Study 25's verified bar one), 71 bars offered,
barNotes + hintPerBar over that grid, prompt/model/params as Studies
23–25.

## Gate

**S25B-G1:** draft roots within 5 points of the true-grid hint score
(65/71 = 91.5%) — the draft keeps at least what its inputs give it.
(The old grid-given baseline is not reusable: it was graded against
the superseded fixture.)

## Predictions

1. S25B-G1 passes; the draft lands at or above the hint score, as on
   the other matched songs.
2. Spend ≤ $0.2 of a $1 fence.

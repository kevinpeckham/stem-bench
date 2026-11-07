# Study 25 — the corrected end-to-end: the chart draft on the TRUE grid

Registered 2026-11-07, before any scored run. Go-ahead: Kevin, same day
("then proceed with Study 25"), following the 2026-11-07 correction in
REPORT.md (commit 2fa623d): the recordings are metronome-exact at their
declared tempos, the DTW ruler's bar geometry is unusable, the
"intros" on letter-lands and peaceful-dreams were four-bar start
errors, and eat-all-the-clocks' chart is ~13 bars longer than its
recording plays.

## Question

Studies 23b and 24 graded chartless drafts whose grids were anchored by
the broken ruler, so their draft numbers measure index-shift corruption,
not the pipeline. With the TRUE grid — the declared period (now known
exact) anchored at the recording's actual chart bar one — does the
end-to-end draft reach the Study 23 grid-given baseline?

## Construction

One arm, B4, one fable call per song, prompt/model/params identical to
Studies 23/23b/24 (system23/question23, claude-fable-5-1, temperature 0
— inert, registered program-wide — adaptive thinking, effort low,
maxOutputTokens 8000).

- Period: the declared bar period, exactly (beats × 60 / bpm).
- Anchor (bar one): derived in-run by the committed correction
  procedure (scripts/diag-arrangement-2026-11-07.ts, now an instrument:
  src/study25/anchor.ts `bestShiftAnchor`): uniform grid from the DTW
  start at the declared period, shipped-reader hints over it once, then
  the whole-bar shift s in [−6, +6] whose index pairing maximizes the
  hint root score against the chart; anchor = dtwStart + s·period.
  Tie-break: smallest |s|, negative before positive (registered,
  mechanical). **Disclosure: this is an ORACLE construction** — it
  resolves whole-bar ambiguity using the chart, so B4 is the
  upper-bound for the chartless feature, not a feature simulation. The
  feature-side bar-one problem is reported in the side measurement.
- Grid: barStarts[k] = anchor + k·period for k = 0..n−1 (n = chart
  bars), with barStarts[0] clamped to max(0, anchor) because the
  reader's frame math does not accept a negative start (the clamp can
  discard at most the fraction of bar one before t = 0, ≈0.12 s on the
  two songs where the anchor is negative).
- Inputs: barNotes = describeBars over the production transcription
  (manifest stems, !/drum/i, summed, peak-normalized, Basic Pitch);
  hintPerBar = shipped reader (nchord --bars) over the same grid.
- Grading: mechanical, as in Study 23 — expandChords, rootScore
  index-paired vs the chart, dialect-exact count, gradeStrict,
  gradeBars21. Baseline: Study 23's committed grid-given answer,
  regraded in-run.

## Gates

- **S25-G1** — on the three arrangement-matched songs (letter-lands,
  peaceful-dreams, mop-heart, named here per the committed correction
  diagnostics): B4 roots within 5 points of the grid-given baseline,
  each song.
- **S25-G2** — on eat-all-the-clocks: over the playable prefix (the
  first floor((duration − anchor) / period) bars), B4 prefix roots
  within 5 points of the baseline regraded over the same prefix. This
  gate is a genuine open question, registered with both readings:
  PASS means the arrangement mismatch is confined to the unplayed
  tail; FAIL means it extends into the played span (the correction's
  hint windows hint at the latter: 10/16 and 11/14 mid-song).

## Side measurement (reported, ungated)

The corrected anchor shootout. The 23b shootout's CIRCULAR errors
remain valid against the true anchors by construction (true anchor =
dtwStart + whole bars, same residue mod period); the new information
is absolute bar-one placement, which only E4 (music start) can claim:
report |E4 − anchor| per song, plus the four estimators' circular
errors restated against the true anchor.

## Predictions

1. S25-G1 passes on all three songs.
2. S25-G2: no confident prediction; the mid-song hint decay makes FAIL
   plausible. Either outcome is informative (see gate text).
3. peaceful-dreams dialect-exact ≥ 11 (at least grid-given's count).
4. E4 places bar one within half a bar on letter-lands,
   peaceful-dreams and eat-all-the-clocks, and misses mop-heart by
   more than two bars (its opening bars are quiet in the transcription).
5. Spend ≤ $0.6.

## Spend fence

$2. Four fable calls expected ≈ $0.3. No matrix leg.

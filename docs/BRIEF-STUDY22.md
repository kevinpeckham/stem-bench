# Study 22 — the bar grid from the recording alone: the gating leg of the recording-to-chart question

**Registered before any run.** Date: 2026-11-07. Bench-drafted on Kevin's
go-ahead ("proceed with all of the above in the order listed"); zero spend,
fully mechanical.

## The question

Every per-bar chord number in this program borrows the chart's own bar
grid, recovered by aligning a synthesized reference of the chart against
the recording (Study 12). An auto-written chart has no chart to align, so
the pipeline Kevin asked about (recording → barmark chart) stands or falls
on a prior question: **can a usable bar grid be derived from the recording
alone?** If a uniform grid from (tempo, meter, downbeat phase) tracks the
band, the end-to-end draft study can be designed with a trustworthy grid;
if not, it needs grid-given and grid-derived arms.

## Truth, and its caveat

Truth bar starts are the Study 12 chart-anchored alignment on each of the
four charted songs, recomputed by the registered instruments (not read
from rounded result files). This truth is itself instrument-derived — DTW
against a rendered reference — validated by Study 12's gates and by four
studies of per-bar grades that behave sensibly on it. It is registered
here as the reference, with that provenance stated. Scoring takes the bar
COUNT from truth: the study measures grid quality, not song-length
estimation (disclosed).

## Disclosures about the shipped detector (arm A1)

The production tempo detector (src/study9/analysis.ts, verbatim port) is
used AS SHIPPED, per the production-fidelity rule, and two facts about it
are registered up front rather than discovered later:

1. Its octave prior was **tuned on this very catalog** — the code comment
   names the five MMKK tempos it was adjusted to resolve. A1 is therefore
   not blind to these songs' tempos and is reported as the shipped
   detector's read, never as a held-out result.
2. Its search range is 50–210 bpm, so mop-heart's charted 224 can only
   appear as a ladder rung (112 = half time), never raw.

## Arms ($0)

All grids are uniform: grid_i = phase + i × period, i = 0..N−1, N from
truth. A grid bar HITS when |grid_i − truth_i| ≤ 15 % of the median truth
bar duration. Mean absolute error in ms is reported beside the hit rate.

- **A0 — the ceiling.** Least-squares fit of (period, phase) to the truth
  bar starts themselves. Measures whether the band is metronomic enough
  that ANY uniform grid can work; everything below is bounded by it.
- **A2 — the product arm (primary).** Period from the CHART's declared
  bpm and meter (stem-shovel songs carry a declared tempo, so the
  auto-chart feature would have this); downbeat phase estimated blind
  from the audio: the phase in [0, period) whose bar-period comb collects
  the most detrended onset energy (Study 11's pinned detrend mirror,
  nearest-frame reads, 10 ms search step, first 90 s of onset envelope —
  the port's own feature window). The known failure mode is registered as
  the thing being measured: every beat has onsets, so the comb may lock
  to a louder beat than beat one.
- **A1 — the fully blind arm (reported).** The same, with bpm and meter
  from the shipped detector instead of the chart. The detected/declared
  ratio is reported against Study 11's ladder rungs.

## Gates

- **S22-G1 (instrument sanity):** on each song's SYNTHETIC reference
  render (renderReference's own samples, whose true bar starts are known
  exactly), the A2 pipeline — declared tempo, blind phase from the
  render's onset envelope — hits ≥ 95 % of bars. The renders are rigid,
  so a miss there is an instrument bug, not a music fact.
- **S22-G2 (the decision):** A2 hits ≥ 80 % of bars on EACH real song.
  Pass means the end-to-end draft study may hand its drafter a derived
  uniform grid; fail means that study must carry grid-given and
  grid-derived arms.

## Amendment 1 — the scoring metric, re-registered after a defective first run (2026-11-07)

The registered metric paired grid index to bar index
(|grid_i − truth_i|). The first run's sanity gate failed at 0 % on every
synthetic render and thereby proved that metric defective: a blind phase
estimate exists only modulo the period, so a comb that landed 68 ms from
the render's true downbeats scored zero because the whole grid compared
one bar shifted. Per the program's rules (defective grader: stop, fix,
re-register, re-run), the metric is replaced by LATTICE distance — each
truth bar start scores against the nearest point of the infinite lattice
{phase + k × period}: err_i = |((truth_i − phase + period/2) mod period)
− period/2| — with each arm's period reported beside its hit rate, since
a lattice at half the true period contains the true lattice and would
otherwise take silent octave credit. Thresholds (15 %, 95 %, 80 %) are
unchanged. DISCLOSED: the defective run's real-song numbers were seen
before this amendment (committed in the session record); the amendment
was chosen to fix the proven wraparound defect and nothing else, and the
sanity gate re-arbitrates it. The first run also surfaced a truth-
resolution fact that the report must carry regardless of outcome: the
chart-anchored DTW bar starts jitter by hundreds of milliseconds bar to
bar (which per-bar chord grading tolerates and Study 21's 97 % roots
demonstrate), so a failure of G2 may indicate the truth's resolution
rather than the grid's quality, and the report must say which.

## Spend fence

**$0.** Local CPU only; no model calls, no transcription.

## Predictions (scored in the report)

1. G1 passes on all four renders.
2. The A0 ceiling is ≥ 90 % on at least three of the four real songs
   (the catalog sounds click-tracked; a song under 90 % would mean real
   drift and is the most decision-relevant possible finding).
3. Where A0 ≥ 90 %, A2 lands within 5 points of A0 on at least two
   songs — and on at least one song the onset comb locks to the wrong
   beat of the bar, cutting A2 well below A0 (the downbeat problem
   showing up on schedule).
4. A1's detected bpm sits on a ladder rung of the chart bpm for all
   four songs (rung 0.5 for mop-heart, by range), and at least one
   raw-octave A1 grid scores under 50 % because its period is half or
   double the bar.
5. mop-heart is A2's weakest song.

## Disclosure

Analyst Claude Fable 5; zero model calls; every instrument is committed
with tests before the run; the new code (grid fit, phase comb, hit
metric) is pure arithmetic. The tempo detector's catalog-tuning and range
limits are disclosed above, before any number exists.

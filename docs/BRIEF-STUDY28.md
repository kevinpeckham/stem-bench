# Study 28 — the capstone draft: four songs, one chartless grid recipe

Registered 2026-11-08, before any scored run. Trigger: Kevin —
"Proceed with study 28." Purpose: every chartless number so far is a
synthesis of best-arm-per-song across Studies 24 and 25 (comb phase
here, oracle anchor there, amended fences in between). This study
measures the ONE grid recipe the auto-chart feature would actually
ship, end to end, on all four songs, against the corrected charts.

## The grid (chartless by construction)

Inputs the feature actually has: the audio and the user-declared
tempo/meter. No chart, no DTW, no oracle.

1. period: the onset joint comb at the declared tempo (jointOnsetComb,
   ±10%), Study 24's instrument, measured ≤0.02% on all four songs.
2. anchor: the comb's own onset-lattice phase, registered at the
   lattice point nearest the first audible sound, with the Study 25
   Amendment 1 physicality fence (never more than one bar before it).
3. bar count: round((last audible sound − anchor) / period).

Study 27's finding makes step 2 principled rather than hopeful: the
onset lattice IS the bar grid on this corpus (on mop-heart it is the
refined truth itself, two independent combs agreeing to the
millisecond).

## The draft

One fable call per song, production parity as Studies 23–25b: the
shipped reader's hints (nchord) and the transcription's bar notes over
the derived grid, system23/question23, temperature 0, adaptive
thinking low. Graded by rootScore against the chart, index-paired from
bar one over the overlapping prefix (both the recordings and the
charts open on bar one, established 2026-11-07). eat-all-the-clocks is
graded against the corrected 71-bar chart (corpus/mmkk-charts-eat-v131.json).

## Gates

- **S28-G1 (the capstone):** per-song draft root percentage within 5
  points of the committed reference: letter-lands 94.7% (72/76
  chart-given), peaceful-dreams 98.7% (151/153), mop-heart 93.6%
  (131/140), eat-all-the-clocks 81.2% (Study 25b's corrected-chart
  draft, the only valid reference on this song).
- **S28-G2 (length inference):** the derived bar count is within 1 of
  the chart's bar count on all four songs.

## Predictions

1. S28-G1 passes on all four; letter near 72/76, peaceful near
   152/153, mop near Study 24 B3's 136/140 (above its chart-given
   baseline), eat near 56/69.
2. S28-G2 passes (the audible span plus the exact period recovers the
   song's length to a bar).
3. Spend ≤ $0.6 of a $1 fence (four calls).

## Spend fence

$1. Instruments in src/study28/ with unit tests; runner
scripts/run-study28.ts; results in results/study28.json.

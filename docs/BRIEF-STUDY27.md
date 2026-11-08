# Study 27 — whole-grid re-phasing at fast tempos (recipe v5), and mop-heart's true anchor

Registered 2026-11-08, before any scored measurement of the remedy.
Trigger: Kevin — "let's design a study for mop-heart's whole-grid
re-phasing at fast tempos." $0: mechanical DSP over the committed
corpus, no model calls.

## The problem (committed numbers)

mop-heart (224 bpm, 3/4, period 0.80357 s) is the one
arrangement-matched song the Studies 26 recipe could not bring onto
the true grid: its DTW middle carries a coherent whole-grid phase
offset (middle mean 0.42 s vs truth; 0.32 s outro residual in 26c)
that end repair faithfully copies, because extrapolation inherits the
middle's phase. Study 25 added the measurement that names the fix:
the oracle anchor (0.315 s) sits 115 ms off the onset comb's phase,
43% of a beat at this tempo, and Study 24's comb-phase arm drafted
136/140 on this song where the oracle-anchored arm drafted 103/140.
The onset lattice, not the DTW phase, is where the notes are.

## The truth caveat this study must settle first

The program's "true" mop anchor (0.315 s) is itself the Study 25
oracle construction, inherited by Study 26 as truth. The drafting
evidence (136 > 103) suggests the comb phase is the truer bar line,
which would mean 26c's mop row was measured against a slightly wrong
ruler. Arm A adjudicates this BEFORE the remedy is scored, and the
brief registers the consequence: if the refined anchor moves, the 26c
mop numbers get a dated correction note downstream.

## Arms (both $0)

**Arm A — mop anchor adjudication.** Three candidate anchors, each
defining a uniform 140-bar grid at the declared period:

1. A1: 0.315 s (Study 25's oracle, the incumbent truth).
2. A2: the v5 anchor from the MIX onset envelope (below).
3. A3: the v5 anchor from the DRUMS-STEM onset envelope (the band
   played to the kit; its lattice is the grid's physical referent).

Instrument: the shipped reader's hints (nchord) over each grid,
root-scored against the chart (the program's standard grader).
Decision rule, registered: the highest root score becomes the refined
true anchor; ties within 1 root resolve to A3 (drums). All later
gates measure against the winner.

**Arm B — recipe v5, whole-grid re-phasing.** v5 extends 26c's v3 by
one move, built entirely from committed, tested instruments:

1. Align as today; comb period as v3 (jointOnsetComb, ±10% of
   declared).
2. Phase line as v3: median residual over the middle 60% at the comb
   period; trust and the <50% refusal unchanged.
3. NEW: slide the ENTIRE uniform line (every bar, one δ) to the onset
   lattice: δ = combSlide over all bar lines, fenced at ±0.5 · beat
   (period / meter beats). The fence is the 26c lesson transposed to
   beat level: half a beat cannot reach the neighboring beat, so the
   slide can correct sub-beat phase and can never hop the lattice.
4. All bars ship on the slid line (the recordings are click-exact;
   the comb-sharpness check is the scope guard). Per-bar confidence:
   "aligned" where the DTW time agrees within 0.25 · period,
   "re-phased" elsewhere.

Run on letter-lands, peaceful-dreams, mop-heart, and eat-all-the-clocks
twice: against the superseded 86-bar fixture (the wrong-chart case)
and against the corrected 71-bar chart.

## Gates (set on committed 25/26c numbers, before the run)

- **S27-G1 (the target):** mop-heart on v5: first 4 and last 4 bars
  each within 0.25 · period of the refined true grid, middle mean
  ≤ 0.15 s, and the app's shipped acceptance passes.
- **S27-G2 (no regression):** letter-lands and peaceful-dreams on v5
  keep the 26c standard: every end bar within 0.25 · period of truth
  and middle mean ≤ 0.10 s.
- **S27-G3 (the detector survives):** eat vs the 86-bar fixture still
  refuses; eat vs the corrected 71-bar chart passes every end bar
  within 0.25 · period.

## Predictions

1. Arm A: A3 (drums comb) wins or ties; the refined anchor lands
   within 150 ms of 0.315 s, on the comb side.
2. S27-G1 passes; the known failure mode would be the comb preferring
   a non-downbeat beat, which the half-beat fence cannot cause alone
   but a backbeat-heavy mix could; G1/G2 exist to catch it honestly.
3. S27-G2 and S27-G3 pass (letter and peaceful's DTW phases already
   sit near the lattice, so their δ is small).
4. Spend: $0.

## Spend fence

$0. Instruments in src/study27/ with unit tests; runner
scripts/run-study27.ts; results in results/study27.json.

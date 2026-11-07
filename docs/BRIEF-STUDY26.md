# Study 26 — the alignment's weak ends: cause and a worker-ready repair recipe

Registered 2026-11-07, before any scored measurement of the remedies.
Source: stem-shovel's ASK
(`stem-shovel/docs/bench-brief-alignment-ends-2026-11-07.md`), pointed
to by Kevin the same day. $0 study: no model calls; all measurements
are mechanical DSP over the committed MMKK corpus.

## Design input (disclosed): the baseline diagnostic

scripts/diag-ends-2026-11-07.ts, run before this registration, measured
per-bar DTW error against the TRUE grid (the declared period — known
metronome-exact per the 2026-11-07 correction — anchored at Study 25's
verified bar-one times). It shapes the design and is quoted here as the
baseline, not re-scored:

| song | bars 1–4 \|err\| | middle mean / max | last 4 \|err\| | drums enter |
|---|---|---|---|---|
| letter-lands | 7.3→4.6 s | 0.18 / 0.85 s | 12.6→15.3 s | 3.63 s |
| peaceful-dreams | 6.6→4.2 s | 0.16 / 0.77 s | 21.1→23.3 s | 3.31 s |
| mop-heart | ~3.1 s | 0.42 / 1.12 s | ~2.5–3.6 s | 0.00 s |
| eat-all-the-clocks | 2.0→0.0 s | **7.77 / 23.95 s** | ~25–27.5 s | 0.00 s |

Kevin's hypothesis (middle good, ends bad, cause = sparse intro +
ringing outro) is consistent with three of four songs; eat's interior
is corrupted by its chart/recording arrangement mismatch (Study 25),
so no end repair can apply there — the correct recipe behavior on eat
is a refusal. The app's bar-1 acceptance rule, computed on the bench
corpus, currently fails ALL FOUR songs. One estimator note: the
interior MEDIAN BAR DURATION underestimates the tempo (letter 1.699 s
vs true 1.818 s) even where positions are right, because duration
noise is skewed; the recipe therefore measures the interior tempo as
the least-squares SLOPE over the trusted middle, not the median
duration.

## Arms (both $0)

**R1 — trim-to-drums ablation (the cause-settler, not a shipping
candidate).** Align the chart against the mix sliced to the drum
stems' audible span (±0.5 s), shift times back, extend to the full
chart by count at the interior LSQ tempo. If the ends come right, the
cause is the sparse/ringing ends, not the DTW.

**R4 — the repair recipe (the shipping candidate, Kevin's proposal
with the slope estimator).** Post-processing only; the DTW path, cost,
controlCost and localCost are untouched, so the same-piece gates are
unaffected by construction.

1. Align as today → ts[0..n−1].
2. Interior fit: least-squares (period, phase) over the middle 60% of
   bars (fitUniformGrid on that slice).
3. Trusted bars: |ts[i] − fit(i)| ≤ 0.25 · period. iFirst = smallest i
   opening a run of 4 trusted bars; iLast = largest i closing one.
   REFUSE (recipe returns null: "interior not trusted") when the
   trusted span covers < 50% of bars — the registered eat behavior.
4. Keep ts on [iFirst, iLast]; extrapolate outward from ts[iFirst] and
   ts[iLast] at the interior period.
5. Re-evaluate each extrapolated end against the onset envelope
   (Study 9 features, detrended): slide that end's extrapolated lines
   by the δ ∈ [−0.25, +0.25] · period (10 ms comb) that maximizes mean
   onset energy at the lines. The slide is per end, whole-grid, never
   per-bar.
6. Per-bar confidence out: "aligned" (trusted span) vs
   "extrapolated+onset-slid" (the ends).

## Gates

- **S26-G1 (recipe accuracy, the app's own bar plus the truth we now
  own):** on letter-lands, peaceful-dreams and mop-heart, the recipe's
  barStarts (a) pass the app's acceptance thresholds — bar 1 within
  one declared bar of the first sound, median bar within 15% of
  declared — and (b) place each of bars 1–4 and the last 4 bars within
  0.25 · period of the true grid.
- **S26-G2 (refusal correctness):** on eat-all-the-clocks the recipe
  refuses at step 3 (trusted span < 50%).
- **S26-G3 (ablation reads):** R1 brings letter-lands' and
  peaceful-dreams' bars 1–4 and last 4 within one declared bar of the
  true grid (the hypothesis-confirming read; informative either way).

## Predictions

1. S26-G1 passes on all three songs, with the interior LSQ period
   within 2% of declared on each.
2. S26-G2 passes (eat refuses).
3. S26-G3: R1 confirms the cause on letter and peaceful.
4. mop-heart is the closest call in G1(b): its middle wobble is
   0.42 s ≈ half its 0.80 s bar, so the trusted-span machinery and the
   onset slide carry more weight at 224 bpm.
5. Spend: $0.

## Spend fence

$0 (mechanical only). Instruments in src/study26/ with unit tests;
runner scripts/run-study26.ts; results in results/study26.json.

## Study 26b (registered 2026-11-07, same day, after 26's results were committed)

26's registered gates measured honestly: G2 PASS (eat refused), G1 FAIL
(letter's outro by ~1.3 s, mop's intro by 0.66 s), G3 FAIL with a
design disclosure — the trim-to-drums construction is ill-posed because
the full chart does not fit the sliced span, so the slice cannot test
the hazy-ends hypothesis; what it DID establish is that removing the
"hazy" audio fixes nothing, i.e. the compression is forced (the ends
have nowhere to go), not seduced.

26b registers recipe v2 with two changes, both motivated by 26's
committed numbers before any v2 run:

1. **The interior period comes from the onset joint comb**
   (jointOnsetComb, Study 24's instrument, ±10% of the chart's declared
   tempo — an input the worker has), replacing the LSQ slope, which 26
   measured 0.95% biased on letter-lands (compounding to 0.5 s over 29
   extrapolated bars) while the comb measured ≤ 0.02% on all four
   songs. The LSQ fit keeps only the trust/phase role: the fit line is
   the comb period with the median of (ts[i] − i·period) over the
   middle 60% as phase.
2. **The end slide range widens to ±0.5 · period** (from ±0.25), since
   26 measured residual end offsets (letter outro ~1.3 s before slide
   correction at the biased period; mop ~0.65 s) that the narrow range
   could not reach. The trust tolerance stays 0.25 · period.

Gates: **S26B-G1** = S26-G1 under v2 (letter-lands, peaceful-dreams,
mop-heart); **S26B-G2** = the eat refusal, unchanged. Predictions:
letter and peaceful pass; mop is registered uncertain — its DTW middle
is itself offset ~0.4 s, which extrapolation faithfully copies, so a
mop failure names whole-grid re-phasing as the next remedy rather than
end repair. $0.

## Study 26c (registered 2026-11-07, same day, after 26b's results were committed)

26b measured: letter-lands PERFECT (0.02–0.05 s ends), the eat refusal
held, and the ±0.5-period slide BROKE peaceful-dreams' intro (+0.60 s:
at that range the comb reaches the half-bar backbeat lattice, which
v1's ±0.25 range excluded by construction), while mop-heart's outro
(0.32 s) is the DTW middle's own phase offset, which no end repair can
remove and which the app's shipped acceptance nonetheless passes.

26c registers **v3 = the comb period (26b's change 1) with v1's
±0.25·period slide range** (26b's change 2 withdrawn: the narrow range
is a half-bar-ambiguity fence, not a tuning knob). Gates, set before
the v3 run on 26/26b's committed numbers:

- **S26C-G1**: letter-lands and peaceful-dreams pass the full bar —
  app acceptance AND every end bar within 0.25·period of the true grid.
- **S26C-G2**: mop-heart passes the app's shipped acceptance (bar 1
  within one declared bar of first sound, median within 15%); its
  ends-vs-truth are reported, with the registered expectation of a
  ~0.3 s outro residual inherited from its middle — the named remaining
  problem (whole-grid phase at fast tempos, Study 25's mop finding),
  out of scope for an end repair.
- **S26C-G3**: the eat refusal, unchanged.

Prediction: all three gates pass. $0.

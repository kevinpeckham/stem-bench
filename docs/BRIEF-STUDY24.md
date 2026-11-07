# Study 24 — true-tempo estimation: the joint phase-and-period search

**Registered before any scored run.** Date: 2026-11-07. Kevin's go-ahead
("explore this: extend the chord-change comb to a joint phase+period
search over the shipped reader's segment boundaries") covers
registration and the fence below.

## The question

Study 23b's decision row: uniform grids are insufficient even anchored,
because the declared bpm is not the recording's tempo. This study
measures the named fix — can the TRUE (phase, period) be recovered from
the recording alone, using the shipped reader's chord-change times, and
does the recovered grid rescue the draft? In this catalog a chord
change IS a bar line, and the reader already ships, so the estimator
costs zero new UX.

## Estimators (mechanical, $0, src/study24/tempo.ts)

- **P1 — the chord-change joint comb (primary):** nchord run plain
  (no grid) → segment start times (> 0). Search period over the
  declared period ± 10% (coarse step 0.2% of declared, then one
  refinement pass at 0.02% around the coarse winner) and phase in
  [0, period) at the standing 10 ms step; minimize the mean circular
  anchor error of the change times to the lattice. The ± 10% range is
  load-bearing and registered: it excludes the half- and double-period
  lattices that would otherwise take the objective by degeneracy, and
  it covers every declared-tempo error the program has measured
  (0.9–7%).
- **P2 — the onset joint comb (comparison):** the same two-stage search
  with Study 22's onset objective (mean detrended onset energy at
  lattice frames, maximized), over the Study 9 production onset
  envelope.

## The model arm (B3, one fable call per song)

Grid = P1's fitted (phase, period), bars from the phase to the end of
the recording (n = floor((duration − phase)/period)) — EXACTLY Study
23b's B1 construction with the fitted period in place of the declared
one, so the period is the only variable between B3 and B1. Everything
downstream is 23b's verbatim: transcription binning, nchord --bars
hints, Study 23's prompt, model, call shape, grading on the JSON chords
channel index-paired against the chart with missing answers wrong, and
the Study 23 grid-given baselines recomputed in-run.

Start-bar policy is measured, not patched: Study 23b's shootout showed
the music-start anchor is only sometimes an intro detector (it catches
letter-lands' 7.15 s intro and fires 6.5 s early on peaceful-dreams),
so B3 does NOT compose it in. A $0 reported variant shows what the
music-start start-rule (first lattice point ≥ musicStart − 0.25
period) would do to each song's grid anatomy.

## Gates

- **S24-G1 (is the geometry recoverable?):** per song, the B3 grid's
  index-hit rate against the aligned truth (15% of the median truth
  bar), allowing one mechanically chosen integer shift of the index
  pairing, must reach within 10 points of the IN-RUN uniform ceiling —
  the index-hit rate of the least-squares uniform fit to the truth
  itself (fitUniformGrid, the Study 22 instrument). The shift is
  allowed because P1's phase exists modulo the period; the ceiling is
  recomputed in-run per the Study 20b lesson. This gate asks exactly
  "did the search find the best uniform grid," immune to the
  truth-wander floor.
- **S24-G2 (does the draft survive?):** B3's roots within 5 points of
  the Study 23 grid-given baseline on EVERY song, graded unshifted —
  the feature's output contract, the same bar the tap failed in 23b.

Decision, registered: G1 and G2 pass → the auto-chart grid leg is
closed (reader-derived tempo, no tap, no alignment); G1 passes and G2
fails → the geometry is recoverable and the residual is the start
bar/index shift, so the next (and likely last) grid study is the
start-bar rule; G1 fails → chord changes cannot carry the period and
the leg needs onset/beat-tracking-grade instruments or an alignment
path. No re-thresholding after data exists.

## Spend fence

**$2.** Four fable calls (one arm), production shape; Study 23b's eight
cost ≈ $0.6, so expect ≈ $0.3. Everything else is local and $0.

## Predictions (scored in the report)

1. S24-G1 PASSES on all four songs — ~90–150 change times pin a period
   to grid grade inside a ± 10% window.
2. S24-G2 FAILS as a whole via letter-lands (its uncharted intro shifts
   every index and its progression repeats least), while peaceful-dreams
   and mop-heart come within 5 points of baseline (their B1 arms nearly
   did with a WRONG period).
3. P1's period lands closer to the in-run truth-fit period than P2's on
   at least three songs.
4. B3's roots are at or above Study 23b's B1 roots on every song (a
   fitted period strictly improves on the declared one at equal phase
   blindness).
5. The music-start variant improves letter-lands' grid anatomy and
   worsens peaceful-dreams' (reported, no gate).
6. Spend ≤ $0.60.

## Disclosure

Analyst Claude Fable 5, measured model claude-fable-5-1 (same family;
grades mechanical, registered first). The gateway ignores temperature on
this model. The truth ruler remains Study 12 alignment with its ~400 ms
wander; both gates are constructed to be honest under it (G1 against an
in-run uniform ceiling, G2 against an in-run regraded baseline). New
code is the two-stage joint comb and the runner plumbing; the comb
objective, grading and alignment are prior studies' committed, tested
instruments.

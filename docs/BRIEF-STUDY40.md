# Study 40: the detector's meter witnesses and the finer-bar rule, measured on the catalog

Registered 2026-11-10 before any scored run. Zero model spend. Answers
the app's brief `stem-shovel/docs/bench-brief-study37-meter-witness-2026-11-10.md`
(Ask A items 1 and 2, Ask B); its item 3 and its 6/8 re-run were
answered from Studies 37 and 38 in the bench's reply part 1.

## Question

The v0.200 detector names 6/8 on 63 of 223 songs in 4/4 (Study 36b),
every one through `subdivisionOf` reading 3, and when its bar is wrong
it is a half bar far more often than a double. The app asks, before it
ships a rule: which second witness keeps the true 6/8 calls and drops
the false ones, at what threshold; are the false calls a threshold away
on the existing test or a different test; and at what strength of the
×2 rung should the automatic grid take the finer bar, with what bpm cap.

## Instrument (src/study40/probe.ts, tests/study40.test.ts)

The port keeps its tempo stage private, so the probe copies `detrend`,
`autocorrelation`, `acNear`, `findPulse`, `refinePeriod` and `meterLean`
verbatim and exposes, per song, the pulse lag before the re-pick, the
re-pick lag, the autocorrelation at the multiples the two tests and the
witnesses read, and the meter lean at both tempi. A test pins the probe
to `analyse200`'s own bpm, subdivision and meter on local audio, and
run-study40.ts repeats that pin over all 261 songs (A0) before any
sweep. One extraction per regular mix (scripts/features-study40.ts,
results/study40-features.json); every sweep is arithmetic on that file.

## Grading

As Study 36b graded production: bar = productionBeatsPerBar(meter) ×
60 / bpm against the declared bar (two dotted quarters in 6/8), strict
within 4 %, folded at a metrical ratio, meter class right; plus the two
counts the app asked for, false 6/8 (named on a song not in 6/8) and
true 6/8 (named on one of the 37 in 6/8), and per variant the songs a
rule makes right (strict) that were wrong and wrong that were right.

Variants:
- A1, duple-bar witness: on every 6/8 call compare
  c = ac(1.5L) + ac(3L) with d = ac(2L) + ac(4L), L the beat lag the
  detector keeps (the re-picked lag when the super-beat test fired);
  keep 6/8 iff c ≥ r·d; otherwise fall back to the straight reading at
  the PRE-re-pick pulse with its own 3/4-or-4/4 lean (this is the fold
  used: the detector's first pulse, not the dotted re-pick). Sweep r
  0.80 to 1.30 by 0.05.
- A2, the sub-beat test's own thresholds: COMPOUND_MARGIN 1.15 to 1.60
  and TRIPLET_SHARE 0.55 to 0.80 by 0.05, super-beat test unchanged;
  plus the two bracketing cells "sub-beat test off" and "both tests
  off" (never 6/8).
- B, the finer bar: take the ×2 rung of `tempoAlternates` when its
  strength is ≥ s, sweep s 0.60 to 1.00 by 0.05, meter kept; report the
  bpm of the songs each move makes right and wrong, and the
  fixable-by-×2 set's detected-bpm range against the strict-right set's
  for a cap.

## Predictions

- P1: some r of the duple-bar witness holds false 6/8 to ≤ 10 while
  keeping true 6/8 at ≥ 15 of 37 (production: 63 and 21).
- P2: no cell of the sub-beat grid does as well: at best false 6/8 ≤ 20
  with true 6/8 ≥ 15 (the 56 straight songs are a different test, not
  a threshold away). Scored as "some cell reaches ≤ 20 / ≥ 15".
- P3: the best A1 cell raises production's strict bar count by ≥ 10
  songs over 36b's 95 of 261.
- P4: some s makes at least twice as many bars right as it breaks and
  raises strict by ≥ 10.
- P5: ≥ 80 % of the songs the ×2 rung would fix have a detected bpm
  under 100 (the cap the app asked about sits near there).

## Decision rule

S40-D1. The bench recommends to the app the A1 or A2 cell with the
highest meter-right count that keeps true 6/8 ≥ 15, and the B
threshold with the highest strict count whose breaks are at most half
its fixes, each with its bpm cap if P5 holds; if no cell meets its
floor the recommendation is the Study 38 one alone (replace the
detector's bar with a tracker's).

## Disclosures

- Study 36b's per-song production readings were public when the
  predictions were written; the witness formulas are the app's, the
  thresholds swept are the app's ranges.
- The probe is a copy, not an import; the A0 reproduction count is the
  evidence it is faithful, and a disagreement on any song is reported.
- 261 songs, the regular mixes; no instrumental arm.

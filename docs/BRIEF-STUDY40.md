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

## Results (2026-11-10, registration 8ba7ec3; $0)

A0: the probe reproduces the detector's bpm and meter on 261 of 261
songs (after the instrument correction disclosed below). Baseline, as
Study 36b: strict 95 (36 %), folded 176 (67 %), meter right 180 (69 %);
6/8 named on 63 songs not in 6/8 and on 21 of the 37 that are.

### Ask A1, the duple-bar witness

| r | strict | folded | meter right | false 6/8 | true 6/8 | right→wrong | wrong→right |
|---|---|---|---|---|---|---|---|
| 0.80 | 109 | 195 | 192 | 19 | 4 | 3 | 17 |
| 0.95 | 112 | 199 | 197 | 13 | 4 | 3 | 20 |
| 1.00 | 114 | 201 | 214 | 10 | 4 | 0 | 19 |
| 1.15 | 112 | 201 | 216 | 3 | 1 | 2 | 19 |
| 1.20 to 1.30 | 112 | 200 | 217 | 2 | 1 | 2 | 19 |
| never 6/8 (both tests off) | 112 | 200 | 217 | 0 | 0 | 2 | 19 |
| sub-beat test off, super-beat kept | 100 | 191 | 207 | 22 | 10 | 2 | 7 |

The witness cannot tell true 6/8 from false: at every r it drops the
true calls faster than the false ones (21 → 4 at r 0.80, where 44 false
calls remain). What it does do is remove the bar damage: at r 1.00 the
strict bar rises from 95 to 114 with no song made wrong, and never
naming 6/8 at all is within two songs of the best cell on every count.
The reason is in Study 36b: when the detector names 6/8 on a true 6/8
song its bar is strict on 2 of 21, so the 6/8 call carries no bar value
to protect. The meter-right count rises to 214 to 217 because the 63
false calls become right 4/4 calls and the 21 true ones were already
yielding wrong bars.

### Ask A2, the sub-beat test's own thresholds

No cell of the 60 separates the populations: at COMPOUND_MARGIN 1.15
raising TRIPLET_SHARE from 0.55 to 0.80 moves false 6/8 from 63 to 52
and true from 21 to 15; the best cell by meter (1.50 × 0.80) still names
6/8 falsely on 45 songs while keeping 13 true. Turning the sub-beat test
off entirely (super-beat only) leaves 22 false and 10 true. The 56
straight 4/4 songs with a triplet read are a different test, not a
threshold away.

### Ask B, the finer bar

| s | ×2 taken | made right | made wrong | strict | folded |
|---|---|---|---|---|---|
| 0.60 | 147 | 27 | 71 | 51 | 159 |
| 0.80 | 78 | 14 | 41 | 68 | 166 |
| 0.85 | 67 | 12 | 34 | 73 | 167 |
| 1.00 | 27 | 2 | 17 | 80 | 172 |

At every s the rule breaks two to three times as many bars as it fixes
and the strict count falls below the baseline's 95. The ×2 rung's
strength does not separate half-bar readings from right ones. Nor does
bpm: the 37 songs ×2 would fix have detected tempos from 70 to 149
(median 89.5); the 95 strict-right songs run 80 to 169.6 (median 119).
A cap at 90 bpm fixes 19 and endangers 13; at 100, 29 and 29. There is
no s and no cap that makes the rule net positive on the detector's own
tempo. (The tracker's half bars in Study 36b were a different
population: there the shorter bar was right or merge-safe; here the
detector's ×2 rung is as often the wrong octave as the right one.)

### Predictions

P1 wrong (no r keeps true 6/8 ≥ 15 while false ≤ 10; best 4 true at 10
false). P2 right (predicted that no sub-beat cell reaches false ≤ 20
with true ≥ 15; none does, best 45/13). P3 right (best A1 cell +19
strict, ≥ 10). P4 wrong (no s is net positive; the rule is net negative
at every s). P5 wrong by two points (78 % of fixable songs under 100
bpm, not ≥ 80).

### Decision (S40-D1)

No witness cell keeps the true 6/8 floor and no B threshold meets its
floor, so the registered recommendation is Study 38's alone: on modern
full-band material replace the detector's bar with a tracker's bar as
read. One further, outside the registered floors and offered as such:
for the detector that remains in the scan offer, stop emitting 6/8 from
the subdivision read (or gate it with the duple-bar witness at r 1.00).
On this catalog that is strictly better on every count, strict 95 →
112 to 114, folded 176 → 200, meter 180 → 214 to 217, with zero to two
songs made wrong, because the detector's 6/8 bar is wrong on 19 of the
21 songs it is right to name.

### Disclosure, instrument correction

The first two feature extractions failed the registered A0 pin (246 and
245 of 261 agree): the probe took the meter lean on the detrended
envelope at the unrounded tempo, while the detector's detectMeter reads
the RAW onset envelope at the rounded bpm. The sweeps ran on those
files before the pin was examined (A1 at r 1.00 read strict 112,
right→wrong 3, on run 1); the first file is preserved as
results/study40-features-defective-run1.json. The probe was corrected to
the detector's exact inputs, the pin reached 261 of 261, and the sweeps
above are from that extraction. No threshold, range or prediction
changed.

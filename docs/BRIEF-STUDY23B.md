# Study 23b — does the draft survive a chartless-song grid?

**Registered before any scored run.** Date: 2026-11-07. Kevin's go-ahead
("let's run the experiment") covers registration and the fence below.

## The question

Study 23's pilot ran grid-given: its bar grid came from chart-anchored
alignment, which a chartless song cannot have. This study swaps in the
grids the FEATURE would actually have and measures what the draft's
quality does — the thirty-cent question from the auto-chart brief
(stem-shovel docs/bench-brief-auto-chart-2026-11-07.md): is a user-
supplied downbeat needed, is it sufficient, or is the uniform grid dead
either way? Study 22 proved grid GEOMETRY cannot be certified against
the program's truth; per-bar CHORD content can be (Study 21), so the
gates here sit on the draft's chord content, index-paired bar for bar
against the chart — exactly the feature's output contract, a chart
being a sequence of bars, not timestamps.

## Arms (two, both fully downstream of their own grid)

Both arms: period from the DECLARED bpm and meter; the grid runs from
its phase to the end of the recording, so the bar count is the arm's
own (a chartless song does not know N); the transcription is binned by
the arm's grid (describeBars); the hints are nchord --bars over the
arm's grid (the shipped reader, as the feature would run it); the
prompt, model and call shape are Study 23's verbatim.

- **B2 — the tap arm.** Phase = the aligned truth's first bar start
  (simulating the user tapping the downbeat once at the charted music's
  start). Measures whether declared-period uniform grids survive GIVEN
  a perfect anchor.
- **B1 — the blind arm.** Phase = Study 22's registered onset comb in
  [0, period). The feature's zero-UX option, carrying both known risks:
  the comb can lock to the wrong beat, and a phase under one period
  cannot skip an uncharted intro (letter-lands' charted music starts at
  7.15 s; song-start detection is a separate, unmeasured problem and is
  registered as part of what this arm absorbs).

## Grading

JSON `chords` channel only — Study 23 already measured the chart
channel's serialization defect; this study isolates the grid variable,
so its gates sit where the grid's effect is visible. Grades per song:
roots over chord-bearing bars, strict, allowance, and peaceful-dreams'
62 dialect bars, by the committed Study 21/20/23 graders. Where an
arm's bar count differs from the chart's, grading runs over the chart's
bars with missing answers wrong, and the count delta is reported. The
Study 23 grid-given baselines are recomputed IN-RUN from the committed
results/study23.json by the same functions (the Study 20b lesson). A
zero-cost mechanical anatomy runs beside the model calls: each arm's
grid against the aligned truth (index error per bar), so draft
degradation can be attributed to grid error, not guessed.

## Gates — the ship decision, not the bench's expectations

- **S23B-G1 (is a tap sufficient?):** B2's roots within 5 points of the
  Study 23 grid-given baseline on EVERY song.
- **S23B-G2 (is the tap even needed?):** B1's roots within 5 points of
  B2's on every song.

Decision table, registered: both pass → ship uniform grids, no tap;
G1 passes and G2 fails → build the tap; G1 fails → uniform grids are
insufficient even anchored, and the feature needs alignment-grade grids
or true-tempo estimation (the declared bpm cannot be trusted as the
period). No re-thresholding after data exists.

## Side-measurement — the downbeat shootout ($0, reported, no gates)

Kevin's question, registered before the run: is there a tap-free way to
find the downbeat? Four mechanical estimators are graded per song by
ANCHOR ERROR — the circular distance (mod the declared period) from the
estimator's anchor to the aligned truth's first bar start, hit when
within 15 % of a bar. The single-value truth anchor carries the ruler's
~±200 ms wander (caveat registered; tightest on mop-heart, whose
tolerance is ±121 ms):

- **E1 — the onset comb** (Study 22's registered instrument, the
  baseline): loudness at bar period.
- **E2 — the bass comb:** the same comb over an impulse envelope of
  transcribed note STARTS below pitch 48, amplitude-weighted — bass
  players mark downbeats.
- **E3 — the chord-change comb:** the phase whose lattice minimizes the
  circular distance of the shipped reader's segment boundaries (nchord
  run-length segments, start times) — in this genre a chord change IS a
  bar line, and it reuses the production reader with no new UX.
- **E4 — the music-start anchor:** the earliest transcribed note with
  amplitude ≥ 0.5 — the only estimator that can see PAST a phase
  (letter-lands' charted music starts at 7.15 s, which no mod-period
  comb can express).

No gate rides on the shootout; it informs which estimator a future
blind arm would use, and whether one approaches the tap.

## Spend fence

**$2.** Eight fable calls (two arms × four songs), production shape;
Study 23's four cost $0.31, so this should land near $0.62. Local
transcription and nchord are $0.

## Predictions (scored in the report)

1. **G1 FAILS, via letter-lands and eat-all-the-clocks.** The truth's
   median bar durations imply those recordings play ~6–7 % off their
   declared tempos (1.70 s vs 1.818, 1.86 vs 2.00), and a 6 % period
   error drifts a full bar in ~15 bars. mop-heart (0.9 % off) stays
   within 5 points; peaceful-dreams (2 % off) is marginal.
2. G2 also fails, with B1 below B2 on at least two songs (the comb's
   wrong-beat lock plus letter's uncharted intro).
3. The mechanical anatomy shows B2's index error growing roughly
   linearly on letter and eat (period error), not randomly (phase
   error) — the signature that the DECLARED TEMPO is the broken input,
   which would make the registered decision "true-tempo estimation,"
   not "more taps."
4. peaceful-dreams' dialect recovery halves or worse under B2
   (≤ 5 of 62) — color spelling needs the right notes in the right bar.
5. Spend ≤ $0.80.
6. In the shootout, the chord-change comb (E3) beats the onset comb
   (E1) on at least three of four songs, and the music-start anchor
   (E4) lands within one bar of letter-lands' 7.15 s truth start while
   every comb, by construction, cannot.

## Disclosure

Analyst Claude Fable 5, measured model claude-fable-5-1 (same family;
grades mechanical, registered first). The gateway ignores temperature on
this model (recorded in Study 23); calls are production-shaped either
way. All graders and the phase comb are prior studies' committed,
tested instruments; the only new code is the runner's grid plumbing.

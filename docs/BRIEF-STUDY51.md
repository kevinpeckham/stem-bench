# Study 51: can the app tell which bars of the bass line to show?

Registered 2026-11-12, before any score below was computed. $0: no model
call. Fourth item of docs/PLAN-bass-line.md.

## Question

Studies 48 to 50 leave the transcribed bass line at about three notes in
four right and under half its bars entirely right, and show that Basic
Pitch's settings, filters on its notes and the grid under them do not
move it. A line that is right in under half its bars misleads. But the
app need not show every bar. **Without truth, can it pick out bars that
are right often enough to show, and how much of the line is left?**

## The idea, and the rules

A bar is trusted when independent readings of the same stem write it
identically: same subdivision, same pitches in the same slots
(`sameLine`, src/study51/trust.ts; note lengths are not compared, as the
bar grade does not grade them). The line shown is Study 49's selected
configuration (`o50-f30-n11-i0-m0`, bass-constrained), on the tracker's
grid with Study 48's per-bar subdivision rule. The other readings:

- **app**: the app's own Basic Pitch configuration (inferred onsets and
  the melodia pass on).
- **frame**: the selected configuration with the frame threshold at 0.2.
- **short**: the selected configuration with the minimum note at 6
  frames.
- **pyin**: Study 48's pYIN notes, a different transcriber on the same
  audio.

All four are already cached (Study 49's sweep, Study 48's pYIN); the
three Basic Pitch readings cost the app no second model run, pYIN costs
a pitch tracker.

Rules, each a yes or no per bar, no thresholds to tune:

| rule | the bar is shown when the shown line equals |
|---|---|
| `everyBar` | (baseline: every bar) |
| `configs` | the app's configuration |
| `loosened` | both loosened configurations, `frame` and `short` |
| `pyin` | pYIN |
| `all` | all four other readings |

## Measures

Over Study 48's graded span, per song and rule:

- **bars with notes**: graded bars whose shown line has an onset; the
  bars the app would otherwise fill.
- **coverage**: the share of those the rule shows.
- **right, one error, wrong**: Study 48's bar grade (`gradeBar`, not
  edited) of the shown bars against the truth, as shares of the bars
  shown.
- **rests**: bars whose shown line is empty and that the rule trusts,
  and how many of them the truth also leaves empty. Kept apart so empty
  bars cannot flatter a rule.
- **the part written right**: truth onsets that appear in a shown bar in
  the right slot at the right pitch, as a share of all truth onsets in
  the span.

**Preflight**: the run stops unless showing every bar gives back Study
49's bar count and bars right for the selected configuration on every
song.

## Predictions

- **P1.** The bars trusted by `loosened`, by `pyin` and by `all` are
  entirely right more often than every bar, on every song.
- **P2.** The bars trusted by `all` are at least 70 % right on at least
  five of six songs.
- **P3.** `all` shows under a quarter of the bars with notes on at least
  three songs.
- **P4.** Pooled over the six songs, the bars `pyin` trusts are right
  more often than the bars `loosened` trusts.
- **P5.** No rule meets the decision's three conditions on every song.

## Decision rule

**S51-D1.** A rule is recommended if on every song the bars it shows are
at least 70 % entirely right and at most 10 % wrong (Study 48's bar,
applied to what is shown), and it shows at least a quarter of the bars
with notes. If several qualify, the one that shows the most, pooled. If
none qualifies, no rule is recommended and the best is reported with
what it falls short on.

The quarter is the bench's floor for a partial line being worth
drawing; whether a bassist wants a chart with most bars blank is
Kevin's call and the app's, not something this study measures.

## Disclosures

- **Seen before registration.** Studies 48 to 50 entire, including each
  reading's own bars right on these songs (the selected configuration
  32 % to 76 %, the app's 26 % to 71 %, the loosened ones lower, pYIN
  17 % to 38 %). No agreement between readings has been computed.
- The rules were chosen by the analyst from readings that happened to
  be cached, not from a search; other rules might do better and were
  not tried.
- The Basic Pitch readings share one model output, so their agreement
  is weaker evidence than pYIN's; P4 is that expectation written down.
- The stems are a sampled bass rendering the MIDI (as Study 48). On a
  miked bass every reading would be worse and so, probably, would their
  agreement.
- Six songs by one writer. Deterministic; a rerun reproduces every
  number.

## Results (2026-11-12, registration 95b4089; $0; six songs, 545 bars with notes)

**Superseded 2026-11-13.** Every number in this section was computed against a truth that was missing 1 % to 18 % of each song's notes (docs/CORRECTION-2026-11-13-bass-truth.md). It is kept as first published; the re-run on the corrected truth is at the end of this brief and replaces it.

The preflight passed. Pooled over the six songs:

| rule | bars shown | shown bars right | one error | wrong | the part written right |
|---|---|---|---|---|---|
| every bar | 545 of 545 | 41 % | 19 % | 41 % | 79 % |
| `configs` | 430 (79 %) | 43 % | 18 % | 39 % | 69 % |
| `loosened` | 355 (65 %) | 48 % | 21 % | 31 % | 48 % |
| `pyin` | 140 (26 %) | 64 % | 16 % | 20 % | 17 % |
| `all` | 90 (17 %) | 64 % | 16 % | 20 % | 11 % |

(Every bar is 41 % here against Study 49's 45 % because the 53 bars the
line leaves empty, 44 of them rightly, are counted apart.)

By song, agreement with pYIN:

| song | shown | right | wrong | every bar: right · wrong |
|---|---|---|---|---|
| Peaceful Dreams | 33 of 109 (30 %) | 76 % | 3 % | 35 % · 44 % |
| Interbellum | 13 of 64 (20 %) | 46 % | 54 % | 27 % · 55 % |
| Letter Lands | 8 of 61 (13 %) | 100 % | 0 % | 74 % · 18 % |
| Eat All the Clocks | 1 of 61 (2 %) | 100 % | 0 % | 36 % · 39 % |
| Downline | 72 of 160 (45 %) | 56 % | 22 % | 41 % · 37 % |
| Mop Heart | 13 of 90 (14 %) | 69 % | 31 % | 38 % · 50 % |

Stability under loosened thresholds shows more and filters less: 39 %
to 83 % of bars, 44 % to 74 % of them right, 10 % to 43 % wrong.
Agreement with the app's own configuration filters almost nothing.
`all` is `pyin` with fewer bars and no better.

### Predictions

- P1 (`loosened`, `pyin` and `all` each beat every bar on every song):
  right.
- P2 (`all` at least 70 % right on five of six songs): **wrong**, on
  four; Interbellum 43 % and Downline 50 %.
- P3 (`all` shows under a quarter on at least three songs): right, on
  five.
- P4 (pooled, `pyin` right more often than `loosened`): right, 64 %
  against 48 %.
- P5 (no rule meets the bar on every song): right.

Four of five held.

### Decision (S51-D1)

**No rule is recommended.** None shows bars that are 70 % right and at
most 10 % wrong while showing a quarter of them, on every song; each of
`loosened`, `pyin` and `all` does it on one song. The best signal is
agreement with a second transcriber: it lifts the shown bars from 41 %
right to 64 % and halves the wrong ones, and on Peaceful Dreams it
would do (30 % of bars shown, 76 % right, 3 % wrong). It fails two
ways elsewhere. It shows too little: 2 % to 20 % of the bars on four
songs, 17 % of the part's notes overall, because pYIN's own line is
right in so few bars. And agreement is not correctness where both
readings fail alike: on Interbellum the 13 agreed bars are wrong more
often than right.

Agreement between Basic Pitch configurations is weak evidence, as
expected of readings that share one model output: the bars that survive
loosening are right 48 % of the time.

### What the study changes

Trust by agreement works in direction and not in amount. It is bounded
by the second reader: a bar can be confirmed only if something else
gets it right too, and nothing the bench has reads these bass lines
well enough to confirm more than a quarter of them. That points the
last item of the plan, another transcriber, at a different job than
replacing Basic Pitch: a second reader good enough to agree with.

### Disclosures

- $0; one registration; the scored pass ran once.
- The quarter-of-bars floor is the bench's, and decides nothing here:
  no rule meets the two accuracy conditions on every song at any
  coverage.
- Rests are counted apart; with them, `pyin`'s trusted bars are 175, of
  which 122 are right.

## Re-run on the corrected truth (2026-11-13; fix c844706; $0)

The truth had lost back-to-back notes of one pitch
(docs/CORRECTION-2026-11-13-bass-truth.md). The runner was run again
unchanged; which bars each rule shows does not depend on the truth, only
how they grade.

| rule | bars shown | shown bars right | one error | wrong | the part written right |
|---|---|---|---|---|---|
| every bar | 545 of 545 | 47 % | 18 % | 35 % | 78 % |
| `configs` | 430 (79 %) | 49 % | 18 % | 33 % | 67 % |
| `loosened` | 355 (65 %) | 57 % | 19 % | 24 % | 48 % |
| `pyin` | 140 (26 %) | 76 % | 11 % | 13 % | 17 % |
| `all` | 90 (17 %) | 73 % | 13 % | 13 % | 11 % |

(First published, shown bars right: 41, 43, 48, 64, 64 %.)

Agreement with pYIN, by song:

| song | shown | right | wrong | every bar: right · wrong |
|---|---|---|---|---|
| Peaceful Dreams | 33 of 109 (30 %) | 76 % | 0 % | 36 % · 39 % |
| Interbellum | 13 of 64 (20 %) | 46 % | 54 % | 27 % · 53 % |
| Letter Lands | 8 of 61 (13 %) | 100 % | 0 % | 74 % · 15 % |
| Eat All the Clocks | 1 of 61 (2 %) | 100 % | 0 % | 36 % · 38 % |
| Downline | 72 of 160 (45 %) | 81 % | 10 % | 62 % · 23 % |
| Mop Heart | 13 of 90 (14 %) | 69 % | 31 % | 38 % · 50 % |

The signal is stronger than first published: the bars pYIN confirms are
right three times in four, and the rule now meets all three conditions
on two songs (Peaceful Dreams, Downline) where it met them on one.
Interbellum is unchanged: both readers miss the same notes there.

**Predictions:** all five now hold; P2 (`all` at least 70 % right on
five of six songs) was scored wrong on the first run and is right
(Downline 71 %). **Decision (S51-D1): no rule is recommended**, as
before: none meets the bar on every song, and coverage is still a
quarter of the bars and a sixth of the part's notes.

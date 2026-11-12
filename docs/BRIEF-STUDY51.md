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

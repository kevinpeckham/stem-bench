# Study 49: where the written bass line goes wrong, and what the app's own knobs buy

Registered 2026-11-12, before any score below was computed. $0: no model
call, every number is computed by committed code against the truth Study
48 took in. First study of docs/PLAN-bass-line.md (its items 1 and 2).

## Question

Study 48 found that a bass line transcribed by Basic Pitch and written on
the tracker's bars is entirely right in 25 % to 39 % of bars on five
songs and 71 % on one, and that the loss is extra onsets first and missed
onsets second, with the octave a few per cent once the lowest note is
kept. It did not say what the extra and missed onsets are, and it ran
Basic Pitch only as the app runs it for chords. Three questions:

- **A. Attribution.** What are the extra onsets (re-triggers inside a
  sounding note, notes over another note, tails, notes in silence, a note
  one slot off, a bar on the wrong grid), and what are the missed ones
  (two notes heard as one, a note found late, nothing transcribed)? Which
  truth notes are missed: short ones, repeated ones, legato ones, quiet
  ones?
- **C. Basic Pitch's knobs.** The app calls `outputToNotesPoly` with an
  onset threshold of 0.5, a frame threshold of 0.3, a minimum note of 11
  frames (a note must be longer than about 130 ms), inferred onsets on
  and the melodia pass on: settings chosen for chords ("confident notes,
  not every flicker"). Does another setting write a better bass line?
- **B. Filters on the notes.** Do two rules on the transcribed notes, a
  merge of same-pitch re-triggers and an amplitude floor, buy bars, and
  at what cost in real repeated notes swallowed?

## Corpus, truth, grid, grading: Study 48's, unchanged

Six songs (corpus/study48-manifest.json): Peaceful Dreams, Interbellum,
Letter Lands, Eat All the Clocks, Mop Heart (MMKK) and Downline (Ghost
Ghost); 598 graded bars. Truth is the session MIDI an octave down on the
mix timeline; the grid is the app's stored beats (the bench's Beat This
reading for Downline); a bar is right only when every pitch, octave and
slot matches and there is no extra onset (src/study48/bassLine.ts, not
edited by this study). Every pipeline here starts from Basic Pitch notes
under Study 48's bass constraint (E1 to C4, the lowest of notes starting
within 30 ms, none under 60 ms; ported to src/study49/rules.ts).

**Preflight** (scripts/run-study49.ts, also `--check`): the run stops
unless (1) the truth rebuilt with velocities equals Study 48's, (2) the
cached Basic Pitch posteriors under the app's configuration give back
Study 48's notes row for row, (3) the constraint's port gives back Study
48's constrained notes, and (4) this study's line grader gives back Study
48's bars right, one-error and wrong, truth onsets, onsets found and
pitches right for every song.

## Part A: attribution (the app's configuration, bass-constrained)

Mechanical classes, src/study49/grade.ts `attribute`, in this order.

Extra onsets (a transcribed onset in a slot with no truth onset):
`grid` (the bar was read on the other subdivision), `shifted` (an
unmatched truth onset of the same pitch class sits in an adjacent slot:
one note, one slot off; it is paired with that miss), `retrigger` (a
truth note of the same pitch class is sounding at the onset),
`overOther` (a truth note of another class is sounding), `tail`
(nothing sounding; the last truth note to end did so within a beat and
has the same class), `silence`.

Missed onsets (a truth onset with no transcribed onset in its slot):
`grid`, `shifted`, `absorbed` (a transcribed note of the same class
began more than half a sixteenth before the onset and sounds more than
half a sixteenth past it: two notes heard as one), `late` (a transcribed
note of the same class begins inside the truth note, later than its
slot), `otherPitch` (transcribed notes overlap it, none of its class),
`nothing` (no transcribed note overlaps it), `other`.

Features of a truth note, and the miss rate with and without each:
`short` (under a sixteenth of its beat), `under130ms`, `repeated` (same
pitch as the truth note before it), `legato` (the note before it ends
within 30 ms of its onset or later), `quiet` (velocity under the song's
median).

## Part C: Basic Pitch's knobs

Two values per knob, the app's first; all 32 combinations
(src/study49/rules.ts `bpConfigs`), each from the same cached posteriors
(scripts/study49-transcribe.mjs), then bass-constrained and graded:

| knob | the app | alternative |
|---|---|---|
| onset threshold | 0.5 | 0.35 |
| frame threshold | 0.3 | 0.2 |
| minimum note, frames | 11 | 6 |
| inferred onsets | on | off |
| melodia pass | on | off |

Reported: every configuration's bars right and wrong per song; each
knob's main effect (alternative minus the app's value with the other four
held, averaged over their 16 settings) on bars right, onsets found and
extra onsets; the **selected** configuration, the one with the highest
mean over the six songs of bars entirely right (ties: lower mean wrong
share, then the earlier in the registered order); and, because 32
configurations are being chosen among on the six songs they are scored
on, the **held-out** result: for each song, the configuration selected
on the other five and its gain on that song.

## Part B: two filters on the notes

On the bass-constrained notes on the mix timeline, floor first, then
merge (src/study49/rules.ts `applyRules`):

- **Merge** (`mergeRetriggers`): a note that starts no later than 50 ms
  after the previous kept note of the same pitch ends, and no more than
  W beats after that note's onset, is joined to it. W is set between
  rhythmic values so timing jitter cannot decide it: off, 0.1875 (under
  a sixteenth), 0.375 (a sixteenth), 0.75 (an eighth); the beat is the
  tracker's at the kept note's onset.
- **Floor** (`ghostFloor`): a note whose amplitude (Basic Pitch's mean
  frame activation) is under F of the stem's median note amplitude is
  dropped. F: off, 0.6, 0.7, 0.8.

All 16 combinations, run twice: on the app's configuration's notes
(what the app could do to notes it already stores) and on Part C's
selected configuration's notes. Reported per setting and song: bars
right, extra onsets, and **truth onsets lost**, those found without the
filter and not found with it, as a share of the song's truth onsets.
Selection: among settings that lose at most 3 % of truth onsets on every
song, the highest mean bars right (ties as above); and the held-out
result as in Part C. The **combined pipeline** is Part C's selected
configuration with the filter selected on its notes.

**The plan's floor values are replaced.** docs/PLAN-bass-line.md named
floors of 0.2, 0.35 and 0.5 of the median. Basic Pitch's amplitude is a
mean frame activation that cannot fall far under the frame threshold:
across the six stems it runs from about 0.25 to 0.85 with a median of
0.52 to 0.62, so those floors would drop nothing. 0.6, 0.7 and 0.8 of
the median fall near the tenth, the twenty-fifth and the fortieth
percentile.

## Predictions

- **P1.** Under the app's configuration, `retrigger` is the largest
  class of extra onsets on at least five of six songs.
- **P2a.** `absorbed` is the largest class of missed onsets on at least
  four of six songs. **P2b.** On every song with ten or more truth notes
  under 130 ms, they are missed at twice the rate of longer notes or
  more.
- **P3a.** The shorter minimum note (6 frames) has a positive main
  effect on bars right on at least four of six songs. **P3b.** Turning
  inferred onsets off has a positive main effect on bars right on at
  least four of six songs.
- **P4.** The selected configuration gains at least 10 points of mean
  bars right over the app's.
- **P5.** On the app's notes the selected filter gains at least 5 points
  of mean bars right, and it is the merge that does it: no floor alone
  gains 2 points.
- **P6.** The combined pipeline reaches 50 % of bars right on at least
  four of six songs, and does not clear Study 48's bar (70 % right, at
  most 10 % wrong) on every song.

## Decision rules

- **S49-D1, a Basic Pitch setting for bass stems.** Recommend the
  selected configuration if its mean gain in bars right is at least 10
  points, no song loses more than 2 points, and the held-out gain is
  positive on at least five of six songs. Otherwise no setting is
  recommended and the main effects are reported for what they are.
- **S49-D2, a filter on notes the app already stores.** Recommend the
  setting selected on the app's notes if its mean gain is at least 5
  points and no song loses more than 2 points (the 3 % loss bound is in
  the selection). Otherwise no filter is recommended.
- **S49-D3, the line.** Study 48's bar is not moved: the combined
  pipeline shows the line only at 70 % of bars right and at most 10 %
  wrong on every song. Reported beside it: whether it reaches 50 % of
  bars right on every 4/4 song (Peaceful Dreams, Interbellum, Letter
  Lands, Eat All the Clocks), the plan's mark for going on to the
  per-bar confidence study.

## Disclosures

- **Seen before registration.** All of Study 48: its bar grades, its
  post-hoc attribution (extras at 19 % to 58 % of truth onsets, misses
  at 5 % to 26 %), the written lines of Letter Lands. Without truth,
  from the cached Basic Pitch notes of the six stems: the amplitude
  range (above), the shortest note (0.129 s on every stem, the minimum
  note length at work), and the count of same-pitch notes that follow
  one another within 12 ms (85 to 273 per stem), which is how the 50 ms
  sounding gap was set. Basic Pitch's `outputToNotesPoly` source was
  read. The predictions are informed by all of it; P2b and P3a in
  particular follow from the 130 ms minimum against sixteenths of 103
  to 130 ms at these tempos.
- **Analyst's hypothesis on trial.** The Study 48 write-up and the reply
  to the app called the extras "mostly re-triggers and ghost notes"
  without having classed them. Part A tests that sentence; if it is
  wrong it is corrected in place on every surface that carries it.
- **Selection on the test set.** 32 configurations and 16 filter
  settings are chosen among on six songs; the held-out results are the
  honest estimate and decide S49-D1's third condition. Six songs by one
  writer's two bands, rendered by Logic's sampled bass: a setting that
  wins here is a candidate for the app, not a law.
- **The stems are clean.** As Study 48: a sampled bass rendering the
  MIDI, no fret noise or slides.
- Deterministic; a rerun reproduces every number.

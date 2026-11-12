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

## Results (2026-11-12, registration 772a253; $0; six songs, 598 bars, 32 configurations, 16 filter settings)

The preflight passed: the truth, the app configuration's notes, the bass
constraint's port and the bar grades all reproduce Study 48 exactly.

### Part A: what the extra and missed onsets are (the app's configuration)

Extra onsets, 582 over six songs:

| song | extras | re-trigger | silence | grid | tail | one slot off | over another note |
|---|---|---|---|---|---|---|---|
| Peaceful Dreams | 79 | 20 | **24** | 15 | 13 | 5 | 2 |
| Interbellum | 72 | 10 | **28** | 7 | 11 | 10 | 6 |
| Letter Lands | 53 | 9 | **18** | 8 | 13 | 1 | 4 |
| Eat All the Clocks | 77 | **51** | 9 | 5 | 5 | 5 | 2 |
| Downline | 207 | 47 | 46 | **60** | 30 | 11 | 13 |
| Mop Heart | 94 | **37** | 8 | 12 | 1 | 27 | 9 |
| all | 582 | 174 (30 %) | 133 (23 %) | 107 (18 %) | 73 (13 %) | 59 (10 %) | 36 (6 %) |

Missed onsets, 332:

| song | misses | grid | no note of its class | one slot off | absorbed | late | other |
|---|---|---|---|---|---|---|---|
| Peaceful Dreams | 69 | 11 | 33 | 5 | 15 | 3 | 2 |
| Interbellum | 78 | 3 | 17 | 10 | 33 | 2 | 13 |
| Letter Lands | 14 | 8 | 4 | 1 | 1 | 0 | 0 |
| Eat All the Clocks | 28 | 4 | 12 | 5 | 2 | 5 | 0 |
| Downline | 99 | 47 | 32 | 11 | 2 | 5 | 2 |
| Mop Heart | 44 | 11 | 1 | 27 | 5 | 0 | 0 |
| all | 332 | 84 (25 %) | 99 (30 %) | 59 (18 %) | 58 (17 %) | 15 (5 %) | 17 (5 %) |

("No note of its class" is `otherPitch` plus `nothing`: 71 and 28.)

Which truth notes are missed: the short and the legato. Notes under
130 ms are missed 57 % of the time against 11 % for longer notes on
Peaceful Dreams (51 such notes), 48 % against 6 % on Interbellum (128),
68 % against 25 % on Downline (22). A note whose predecessor runs into
it is missed 38 % against 5 % on Peaceful Dreams, 52 % against 5 % on
Interbellum, 31 % against 7 % on Downline. Repetition and velocity do
not separate missed from found consistently.

### Part C: Basic Pitch's knobs

Main effect on bars entirely right, in points (alternative minus the
app's value, the other four knobs held):

| knob | Peaceful Dreams | Interbellum | Letter Lands | Eat All the Clocks | Downline | Mop Heart |
|---|---|---|---|---|---|---|
| onset threshold 0.35 | −27.2 | −15.4 | −44.5 | −27.5 | −13.9 | −23.8 |
| frame threshold 0.2 | −2.9 | −2.2 | −8.1 | −1.1 | −2.3 | −7.5 |
| minimum note 6 frames | −4.9 | −7.2 | −21.7 | −1.4 | −4.6 | −7.8 |
| inferred onsets off | +0.1 | +0.9 | +1.8 | +1.4 | +1.4 | +0.5 |
| melodia pass off | +3.7 | +5.8 | +6.6 | +4.9 | +14.4 | +2.2 |

The shorter minimum note and the lower frame threshold find a few more
of the part's notes (the shorter minimum, 0.3 to 6.6 points more of the
truth onsets) and add more extras than they find notes on every song
(13 to 24 points); the lower onset threshold adds 34 to 70 points of
extras. Bars right fall on every song under each. The two passes that add notes without a detected
onset are the ones worth turning off.

**Selected:** the app's thresholds with inferred onsets and the melodia
pass both off (`o50-f30-n11-i0-m0`).

| song | bars right, the app's setting | selected | gain | wrong, selected |
|---|---|---|---|---|
| Peaceful Dreams | 34 % | 35 % | +0.9 | 44 % |
| Interbellum | 26 % | 32 % | +5.8 | 51 % |
| Letter Lands | 71 % | 76 % | +5.9 | 16 % |
| Eat All the Clocks | 35 % | 42 % | +7.0 | 37 % |
| Downline | 29 % | 46 % | +16.7 | 32 % |
| Mop Heart | 39 % | 40 % | +1.1 | 47 % |
| mean | 39.0 % | 45.2 % | +6.2 | 37.9 % |

Held out: the same configuration is selected without each of five songs
and gains on each; without Mop Heart the selection is the frame-0.2
variant, which loses 5.3 points on Mop Heart. Positive on five of six.

### Part B: the two filters

On the app's notes (mean bars right 39.0 % unfiltered):

- **Merge, under a sixteenth:** nothing. With a minimum note of 130 ms
  no two notes of one pitch are that close; the window was vacuous by
  construction, which the registration should have seen.
- **Merge, a sixteenth:** Eat All the Clocks 35 % → 45 %, Letter Lands
  71 % → 59 % with 3.7 % of its notes swallowed. Mean 38.5 %.
- **Merge, an eighth:** mean 21.0 %; it swallows 13 % to 25 % of the
  part's notes on four songs.
- **Floor:** Downline 29 % → 44 % at 0.6 of the median; elsewhere within
  three points either way, at a cost of 1 % to 7 % of the part's notes
  at 0.6 and up to 18 % at 0.8. Best floor alone, mean +3.5 points.

No setting but "no filter" loses at most 3 % of truth onsets on every
song, so the selection within the bound is no filter, on the app's notes
and on the selected configuration's. The combined pipeline is therefore
the selected configuration alone.

### Post-hoc, labelled (scripts/attribute-study49.ts)

Under the selected configuration the extras fall from 582 to 436:
re-triggers 174 → 107, silence 133 → 100, grid 107 → 70 (fewer bars
tip onto the other subdivision), tails 73 → 65; the misses do not move
(332 → 326). Bars entirely right, pooled: 219 → 265 of 598. Of the 333
bars still not right, 86 fail on extras alone, 56 on misses alone, 13
on pitch alone, 26 on the grid, 152 on more than one.

### Predictions

- P1 (re-triggers the largest class of extras on five of six): **wrong.**
  Largest on two (Eat All the Clocks, Mop Heart); onsets with nothing
  sounding are the largest on three and the grid on Downline.
- P2a (absorbed the largest class of misses on four of six): **wrong.**
  On one (Interbellum). P2b (notes under 130 ms missed at twice the
  rate): right, on all three songs that have ten.
- P3a (a shorter minimum note helps bars on four of six): **wrong, on
  none.** It finds the short notes and buries them in extras. P3b
  (inferred onsets off helps on four of six): right, on six, by 0.1 to
  1.8 points.
- P4 (the selected configuration gains 10 points): **wrong**, 6.2.
- P5 (a filter gains 5 points, and the floor does not): **wrong** on
  both halves. No filter survives the loss bound; the floor alone gains
  3.5 on the mean, nearly all of it Downline.
- P6 (the combined pipeline reaches 50 % on four of six): **wrong**, on
  one. It does not clear Study 48's bar, as predicted.

Two of eight held.

### Decisions

- **S49-D1: no setting recommended.** The selected configuration gains
  6.2 points against the 10 registered; no song loses and the held-out
  gain is positive on five of six. Reported for what it is: turning the
  melodia pass off helps on all six songs (2 to 14 points) and inferred
  onsets off on all six (under 2 points), neither loses a song, and
  every loosened threshold hurts every song. The app's chord thresholds
  are right for bass.
- **S49-D2: no filter recommended.** Each rule that helps one song
  swallows another's real notes.
- **S49-D3: the line is not shown.** 35 %, 32 %, 76 %, 42 %, 46 %, 40 %
  of bars right; Study 48's bar is cleared on no song, and the plan's
  50 % mark on one of four 4/4 songs.

### What the study changes

**The analyst's sentence was wrong.** Study 48's write-up and the reply
to the app said the extras were "mostly re-triggers inside a sustained
or decaying note, and ghost notes" and offered a merge rule and a
loudness floor as the next lever. Classed, re-triggers are 30 % of the
extras and the largest class on two songs of six; with tails, 43 %. The
merge and the floor were tested and neither survives. The sentence is
corrected on every surface that carries it.

**What is left is not a threshold.** The misses are a quarter grid, and
otherwise short and legato notes that Basic Pitch either does not
transcribe or joins to their neighbour; loosening it to find them costs
more bars than it wins. A fifth of the extras, and a quarter of the misses, are in bars where
the truth's onsets and the transcription's chose different subdivisions
(sixteenths against triplets, chosen per bar by the grader from each
line's own onsets). *Corrected 2026-11-12, the day of writing: this
first said "bars the tracker's grid puts on the other subdivision" and
called the grid the largest class of misses. The tracker's part in it
was not measured, and the largest class is notes with no transcribed
note of their pitch class, 30 %.* The
plan's next two items stand, with the grid next:
the line's own grid (docs/PLAN-bass-line.md item 3) and trust per bar
(item 4).

### Disclosures

- $0; one registration; the scored pass ran once.
- The smallest merge window could not act (above).
- "Silence" is a mechanical class: a transcribed onset where the MIDI
  has no note sounding and none of its pitch class ended within a beat.
  Whether those are the sampled bass's release, or sound in the stem the
  MIDI does not hold, was not tested.
- The post-hoc attribution was run after the scored pass and is not
  part of any prediction or decision.
- 32 configurations chosen among on six songs; the held-out result is
  reported and does not change the decision.

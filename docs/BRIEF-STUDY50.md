# Study 50: how much of the written bass line's failure is the grid's

Registered 2026-11-12, before any score below was computed. $0: no model
call. Third item of docs/PLAN-bass-line.md, reshaped by what Study 49
and this study's own fixture check found.

## Question

Studies 48 and 49 graded the transcribed bass line against the truth
with both on the beat tracker's grid, and chose sixteenths or triplets
bar by bar from each line's own onsets. A fifth of the extra onsets and
a quarter of the missed ones were in bars where the two lines chose
different subdivisions, and the bench twice blamed the tracker for that
without measuring it (corrected). Kevin's session MIDI carries the
composer's own grid: a tempo and a signature map. So the grid can be
taken out of the question:

- **A.** How does the tracker's grid sit on the composer's: are its
  beats in the right place, does it drop beats, are its bar lines the
  composer's?
- **B.** Does choosing the subdivision once for the song, instead of bar
  by bar, write a better line?
- **C.** With the composer's grid under the same notes, how much better
  is the line? That is the most a better grid could buy. And how much
  of it does a repair the app can do without truth, splitting the
  tracker's double-length beats, recover?

## Fixture: three grids

- **tracker**: the app's stored beats and downbeats (the bench's Beat
  This reading for Downline), as Studies 48 and 49.
- **filled**: the tracker's beats with every gap of about k median beats,
  k of 2 or more, split into k equal beats (`fillBeats`); bar lines not
  touched. The app could do this to its own grid.
- **composer**: quarter-note beats from the MIDI's tempo map and bar
  lines from its signature map, on the mix timeline by the intake's
  `midiToMixSec` (`composerGrid`). All six songs hold one tempo; five
  hold one signature and Downline alternates 5/4 and 3/4 five times.

**The composer's grid rests on one assumption**: MIDI time zero is the
session's bar 1, so Logic's bar lines are the MIDI's. Supporting it: the
intake found each stem a whole number of bars into its MIDI where the
two were offset; Downline's five signature changes each fall on a bar
line of the signature before; and where the tracker is steady it agrees
(below). On Mop Heart and Downline the tracker cannot confirm the bar
phase. Kevin has offered Downline's chart; if a bar line is wrong the
study is re-run with the disclosure.

## Subdivision rules

- **bar**: Study 48's. Each bar takes triplets if they fit its own
  onsets under 0.8 of the sixteenths' residual, two onsets at least.
- **song**: the same test once, over all the line's onsets in the graded
  span, each measured against its own bar (`songMode`); every bar is
  then written on that subdivision. The truth and the transcription each
  choose from their own onsets, as the app would have to.

## Cells

Two note lists from Study 49 (the app's Basic Pitch configuration and
the selected `o50-f30-n11-i0-m0`, both bass-constrained, read from its
cache) × three grids × two rules × six songs: 72 cells. Each grid makes
its own bars, drops notes under 0.4 of its own sixteenth, and grades
from the first to the last bar that holds a truth note; the bar grade is
Study 48's (`gradeBar`, not edited). Reported per cell: bars right, one
error, wrong; bars on different subdivisions; and a slot-level F (truth
onsets matched in slot and pitch, over transcribed onsets and over truth
onsets), which does not depend on how the grid cuts bars.

**Preflight**: the run stops unless the tracker's grid under the per-bar
rule gives back Study 49's bars right, one-error, wrong, found, extra
and different-subdivision counts for both note lists on every song.

## Seen before registration (truth and tracker only, no transcription)

Building and checking the composer's grid showed:

- The parts are sixteenth-grid parts: 95 % to 100 % of the truth's
  onsets fall within 35 ms of a composer's sixteenth, and 0 % to 1.3 %
  sit nearer a triplet only. So nearly every triplet bar the per-bar
  rule gave the truth in Study 48 (2, 1, 0, 1, 11, 2 by song) is an
  artifact, not the part.
- The tracker's beats are in the right place: 100 % of them within 50 ms
  of a composer's beat on five songs, 84 % on Interbellum. It drops
  beats: 37 double-length beats on Peaceful Dreams, 33 on Letter Lands,
  67 on Downline, 39 on Mop Heart, 2 on Interbellum, none on Eat All
  the Clocks.
- Its bar lines are the composer's on Peaceful Dreams and Letter Lands
  (100 % of tracker downbeats on a composer's downbeat), mostly on Eat
  All the Clocks (93 %) and Interbellum (76 %), and not on Downline
  (49 %) or Mop Heart (19 %).
- This also showed a Study 48 disclosure was wrong (the tracker does not
  read two songs at half tempo; corrected in place).

The predictions are informed by all of this, and by Studies 48 and 49
entire.

## Predictions (selected notes unless said)

- **P1.** The per-song rule chooses sixteenths for the truth and for
  both transcriptions on every song and every grid.
- **P2.** On the tracker's grid, the per-song rule raises bars right
  over the per-bar rule on at least five of six songs.
- **P3.** Under the per-song rule the composer's grid gains between 5
  and 10 points of mean bars right over the tracker's.
- **P4.** The largest of those gains is Mop Heart's or Downline's.
- **P5.** Splitting the tracker's double beats moves mean bars right by
  under 2 points either way.
- **P6.** On the composer's grid under the per-song rule the line
  reaches 50 % of bars right on at least four of six songs, and clears
  Study 48's bar (70 % right, at most 10 % wrong) on at most one.

## Decision rules

- **S50-D1, the subdivision rule.** Recommend choosing once for the song
  if, on the tracker's grid, it raises bars right on at least five of
  six songs and lowers it on none; the truth's choice is sixteenths on
  all six songs on the composer's grid; and each transcription's choice
  equals the truth's on every song and grid. Otherwise keep the per-bar
  rule.
- **S50-D2, is the grid a bottleneck.** Yes if, under the per-song rule,
  the composer's grid gains at least 10 points of mean bars right over
  the tracker's and no song loses more than 2. Then the tracker gates
  the written line, and the share of that gain the filled grid recovers
  says how much the app can get by itself. No otherwise: even a perfect
  grid leaves the line where the transcriber put it.
- **S50-D3, the line.** Study 48's bar is not moved. Reported: the songs
  that clear it on the composer's grid.

## Disclosures

- The corpus has no triplet part, so the per-song rule is tested only on
  not inventing triplets. Whether it finds a shuffle is untested here;
  S50-D1 can recommend it as a default for these parts, not as proven.
- Bars differ between grids (the composer's Downline has 5 and 3 beats
  to the bar, the tracker's 1 to 6), so bars right is the share of the
  chart's bars as that grid would write them; the slot F is reported
  beside it as the measure that does not move with the bar lines.
- The composer's grid is truth the app does not have. It bounds what a
  better tracker could buy; it is not a proposal.
- The plan's "grid from the bass stem's own onsets" is not run: the
  beats are already in the right place, so there is nothing for it to
  refine; the tracker's faults are dropped beats and bar lines.
- Deterministic; a rerun reproduces every number.

## Results (2026-11-12, registration 6911bcc; $0; six songs, 72 cells)

The preflight passed: the tracker's grid under the per-bar rule gives
back Study 49's bars for both note lists on every song.

### A. The tracker's grid on the composer's (no transcription)

| song | tracker beats on a composer's beat | composer's beats the tracker has none for | tracker bar lines on a composer's | truth triplet bars under the per-bar rule, on the composer's grid |
|---|---|---|---|---|
| Peaceful Dreams | 100 % of 579 | 6 % of 616 | 99 % of 149 | 0 |
| Interbellum | 84 % of 255 | 16 % of 256 | 76 % of 70 | 1 |
| Letter Lands | 100 % of 264 | 9 % of 289 | 100 % of 69 | 2 |
| Eat All the Clocks | 100 % of 268 | 0 % of 268 | 92 % of 73 | 1 |
| Downline | 100 % of 563 | 11 % of 631 | 48 % of 189 | 13 |
| Mop Heart | 100 % of 374 | 9 % of 413 | 18 % of 103 | 2 |

(The committed code counts over a slightly wider span than the check
run before registration, so Peaceful Dreams' bar lines read 99 % here
against the 100 % quoted above.)

The tracker's beats are where the composer's are; it drops 6 % to 16 %
of them on five songs; its bar lines are the composer's on the three
steady 4/4 songs and not on the 5/4 and 3/4 songs. **And the triplet
bars are not the tracker's doing.** On the composer's own grid the
per-bar rule still writes 13 of Downline's bars in triplets, where one
of the part's 401 notes sits nearer a triplet than a sixteenth: the registration's "seen" paragraph called those bars an
artifact, and they are, of the per-bar rule. At 180 bpm the second
sixteenth of a beat and the second triplet are 28 ms apart, inside a
player's timing; the mechanism was not measured further.

### B and C. The line on each grid (the selected notes)

| song | tracker, per bar (Study 49) | tracker, per song | composer, per song | wrong, composer |
|---|---|---|---|---|
| Peaceful Dreams | 35 % · F 0.738 | 35 % · 0.753 | 35 % of 112 · 0.758 | 41 % |
| Interbellum | 32 % · 0.792 | 32 % · 0.800 | 25 % of 63 · 0.797 | 59 % |
| Letter Lands | 76 % · 0.876 | 76 % · 0.897 | 78 % of 72 · 0.903 | 13 % |
| Eat All the Clocks | 42 % · 0.778 | 42 % · 0.778 | 42 % of 66 · 0.768 | 41 % |
| Downline | 46 % · 0.702 | 46 % · 0.749 | 40 % of 156 · 0.745 | 37 % |
| Mop Heart | 40 % · 0.755 | 40 % · 0.766 | 48 % of 128 · 0.770 | 41 % |
| mean bars right | 45.2 % | 45.3 % | 44.7 % | |

(Bars entirely right, then the slot-level F.)

- **The per-song rule** removes every bar on different subdivisions (26
  on the tracker's grid, 28 on the composer's, to none). On the
  tracker's grid it raises the slot F on five songs, by 0.05 on
  Downline, and leaves one where it was; on the composer's it raises
  three and leaves three; it lowers none. Bars right does not move: those bars
  were wrong for other reasons as well. Wrong bars fall on Downline
  (32 % to 29 %).
- **The composer's grid** changes the slot F by 0.01 or less on every
  song. Bars right moves with how the grid cuts bars, not with accuracy:
  down on Interbellum and Downline, where the tracker's extra bar lines
  make shorter bars that are easier to get wholly right, up on Mop
  Heart, where the composer's 3/4 bars are shorter than the tracker's.
- **Splitting the tracker's double beats** changes nothing on four songs
  and costs a point on Downline and Mop Heart.
- The app's notes tell the same story at 39.0 %, 39.1 % and 38.4 %.

### Predictions

- P1 (the per-song rule chooses sixteenths everywhere): right.
- P2 (it raises bars right on five of six on the tracker's grid):
  **wrong**; on one, by half a point.
- P3 (the composer's grid gains 5 to 10 points of mean bars right):
  **wrong**; it loses half a point.
- P4 (the largest gain is Mop Heart's or Downline's): right, Mop
  Heart's, +7.7; Downline's is the second largest loss.
- P5 (splitting double beats moves the mean under 2 points): right,
  −0.4.
- P6 (50 % of bars right on four of six songs on the composer's grid):
  **wrong**, on one.

Three of six held.

### Decisions

- **S50-D1: keep the per-bar rule, by the registered condition** (bars
  right had to rise on five songs; it rose on one). Reported for what
  it is: choosing once for the song never lowered bars right, removed
  every bar on different subdivisions, and raised the slot F on five
  songs on the tracker's grid; the truth is in sixteenths on all six songs and both
  transcriptions chose sixteenths on every song and grid. The per-bar
  rule writes 19 of the truth's 597 bars in triplets on the composer's
  own grid, where about 10 of the part's 2,181 notes sit nearer a
  triplet than a sixteenth.
- **S50-D2: no, the grid is not the bottleneck.** A perfect grid leaves
  the line where the transcriber put it: mean bars right −0.5 points,
  slot F within 0.01 on every song.
- **S50-D3:** Study 48's bar is cleared on no song on the composer's
  grid. Letter Lands is nearest, 78 % right and 13 % wrong.

### What the study changes

The bench's two earlier attributions to the tracker are now measured
and were wrong in substance, not only in wording: neither the
subdivision disagreements nor the line's failure come from the
tracker's grid. The tracker's real faults on these songs, dropped beats
and wrong bar lines in 5/4 and 3/4, matter to a chart a player reads
(a 5/4 song written in bars of one to six beats is not usable) and do
not matter to whether the notes are right.

After three studies the transcriber is what is left: Basic Pitch's
settings (Study 49), filters on its notes (Study 49) and the grid under
them (this study) each leave the line at about three notes in four
right and under half the bars. The plan's remaining items are the two
that do not try to fix Basic Pitch's notes: trusting only some bars
(item 4) and another transcriber (item 5).

### Disclosures

- $0; one registration; the scored pass ran once.
- The composer's grid rests on MIDI time zero being bar 1 (above). A
  wrong bar phase on Mop Heart or Downline would move their bars right
  and not their slot F, which is the measure S50-D2's conclusion leans
  on in the text; the registered D2 condition is on bars right and
  fails either way.
- No triplet part in the corpus (above).

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

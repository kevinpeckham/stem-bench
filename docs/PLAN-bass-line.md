# Plan: improving the written bass line (after Study 48)

Written 2026-11-12, agreed with Kevin, to be run study by study. Every
study here is mechanical against the truth already held, so each is $0
and needs no spend approval; registration by commit before any scored
run still applies, and the Study 48 corpus and tools are the base.

## Where things stand (Study 48, docs/BRIEF-STUDY48.md)

- Corpus: six songs with the session MIDI as truth for the bass stem
  (Peaceful Dreams, Interbellum, Letter Lands, Eat All the Clocks, Mop
  Heart from MMKK; Downline from Ghost Ghost), 598 bars, 1,999 notes,
  taken in by scripts/ingest-bass-pair.py into corpus/study48-manifest.json
  (audio and MIDI gitignored under corpus-mmkk/<slug>/bass-truth/ and
  corpus-ghostghost/<slug>/bass-truth/). New pairs join by one intake
  command; the Logic export recipe is docs/bass-truth-intake.md.
- Truth is the MIDI transposed down an octave (written pitch to sounding),
  on the app's mix timeline (manifest `midiToMixSec`); the grid is the
  app's stored beats (corpus/study44-app-beats.json) and, for Downline,
  the bench's Beat This reading (corpus/study48-extra-beats.json).
- Pipelines: `bp` (Basic Pitch as the app runs it), `bp-bass` (range E1
  to C4, one note at a time keeping the lowest, none under 60 ms),
  `pyin`. Note lists per song in the gitignored folders
  (`notes-<pipeline>-mix.json`, `truth-mix.json`), scores in
  results/study48-notes.json (scripts/study48-notes.py, mir_eval).
- Grading: src/study48/bassLine.ts (bars from downbeats, sixteenth or
  triplet per bar from the line's own onsets, notes under 0.4 of a
  sixteenth dropped, early onsets to the next bar's first slot, a bar
  right only with every pitch, octave and slot matched and no extra
  onset) and scripts/run-study48.ts; attribution in
  scripts/attribute-study48.ts; written lines in results/study48-lines/.
- Result: no pipeline clears 70 % bars right with at most 10 % wrong on
  every song. Of the part's notes the transcription finds 73 % to 95 %
  at the right time with the right pitch class; it adds a fifth to a
  half again as many onsets as the part has. Combined (pitch class,
  onset 50 ms) plain Basic Pitch is about two in three, the bass filter
  about four in five. Failure order: extra onsets (re-triggers inside a
  sounding note, ghost notes) > missed onsets (one in five on busy
  songs) > the grid on a changing meter (Downline, 23 of 186 bars) >
  the octave (a few per cent after the lowest-note rule). pYIN fixes
  the octave and loses notes; below Basic Pitch on four of six songs.

## Status (updated 2026-11-12 after Study 49)

Items 1 and 2 are done as Study 49 (docs/BRIEF-STUDY49.md): no filter
and no Basic Pitch setting is recommended. The extras are not mostly
re-triggers (30 %; nothing sounding 23 %, wrong subdivision 18 %); the
merge and the floor each help one song and cost another; every loosened
threshold hurts every song; the melodia pass and inferred onsets off
gain 6.2 points on the mean (39.0 % to 45.2 % bars right), under the
registered 10. **Next: item 3 (the line's own grid), moved up because
the grid is the largest class of missed onsets, then item 4 (trust per
bar).** Base pipeline for both: `o50-f30-n11-i0-m0` beside the app's.

## The studies, in order

### 1. Merge re-triggers and floor the ghosts (first)

The largest failure class. Two rules on the `bp-bass` notes, each with
one knob, swept against the same truth:

- **Merge**: an onset of the same pitch that starts while that pitch is
  still sounding and within W of the previous onset (W swept: a
  thirty-second, a sixteenth, an eighth at the bar's tempo) is joined to
  the sounding note.
- **Ghost floor**: a note whose amplitude is under F of the stem's
  median note amplitude is dropped (F swept: 0.2, 0.35, 0.5).

Report per knob: bars right, bars wrong, extra onsets, and **false
merges** (a true repeated note swallowed), since Kevin's parts repeat
notes constantly. Prediction to write: bars right up 10 to 20 points on
the busy songs at the best knob, with false merges under 3 % of truth
notes. Decision rule: recommend the knob setting that maximizes bars
right with false merges under the bound, if any clears 50 % bars right
on every 4/4 song.

### 2. Class the missed notes

One truth note in five gets no onset on the busier songs. Class every
truth note by four features (quiet: amplitude under the stem's median;
short: under a sixteenth; repeated: same pitch as the note before within
a beat; legato: the previous note still sounding at its onset) and
report the miss rate per class and per song. Then one knob the app
already owns: Basic Pitch's onset threshold (and frame threshold) for
bass stems, swept down, reporting recovered notes against added extras.
Decision: whether a bass-specific threshold is worth carrying.

Studies 1 and 2 can share one registration and one afternoon.

### 3. The line's own grid

Downline loses 23 bars to the tracker's bars on the wrong subdivision,
and the tracker reads Letter Lands and Peaceful Dreams at half tempo.
Test a grid refined from the bass stem's own onsets, snapped to the
tracker's downbeats (the tracker gives the bar lines, the stem the
beat), against the shared grid, on bars right and notes on the right
slot. Also answers whether the shared grid helps or hurts the chord
chart.

### 4. Decide per bar (the one that decides shipping)

Whether a confidence the app can compute without truth predicts a wrong
bar: the share of a bar's onsets that were merged or dropped by the
Study 1 rules, the count of onsets against the bar's beats, and the
bar's grid choice. If it predicts, the app shows the bars it trusts and
writes the rest as rests or a marked gap. Report the precision of
"trusted" bars and the share of bars kept, per song.

### 5. A monophonic tracker, last

CREPE, after the onset work, since pYIN's failures were onset failures
and CREPE's would be the same. One run, against the best Study 1 and 2
pipeline.

## Not yet

A miked or DI'd human bass stem. The sampled bass is the clean case;
until it clears 70 % bars right the harder case says nothing new.

## Delivering

Each study: a brief (docs/BRIEF-STUDY49.md onward), graders with tests,
registration by commit, the run, results committed, the write-up in the
brief and REPORT.md, a reply to the app on stem-shovel dev (append to
docs/bench-brief-bass-transcription-2026-11-12.md, FINDINGS.md), and the
dashboard entry on lj-website (stem-studies.json, stem-charts.js,
stem-content.json eyebrow, research-stats.json). No Co-Authored-By lines;
no em or en dashes in blog or dashboard prose. Memory:
~/.claude/projects/-home-exedev/memory/stem-bench-program.md.
